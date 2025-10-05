use serde::{Deserialize, Serialize};
use sqlx::Row;
use std::collections::HashMap;
use std::path::Path;
use ts_rs::TS;

use crate::core::core_state::AppContext;
use crate::schema::schema_cache::SchemaResult;
use crate::schema::types::AttrValue;
use crate::utils::errorhandling::ErrFR;

#[derive(Serialize, Deserialize, Clone, Debug, TS, Default)]
#[ts(export)]
pub struct RecordFromDb {
    /* Relative path to root path */
    pub path: Option<String>,
    #[ts(type = "number")]
    pub modified: Option<i64>, // UNIX milliseconds
    pub markdown: Option<String>,

    pub attrs: HashMap<String, AttrValue>,
}

pub async fn get_files_abstract(
    ctx: &AppContext,
    where_clause: String,
) -> Result<Vec<RecordFromDb>, Box<ErrFR>> {
    let q = format!(
        "SELECT path, modified, attributes FROM files {}",
        where_clause
    );

    let res = sqlx::query(&q)
        .fetch_all(&ctx.database_conn.get_conn().await)
        .await
        .map_err(|e| ErrFR::new("Error when getting files").raw(format!("{}\n\n{}", e, q)))?;

    let result_iter = res.iter().filter_map(|r| {
        let attrs_raw = r.get("attributes");

        let attrs = serde_json::from_str::<HashMap<String, AttrValue>>(attrs_raw)
            .map_err(|e| ErrFR::new("Error when parsing attributes").raw(e));

        let path: Option<String> = r.get("path");

        path.as_ref()?;

        Some(RecordFromDb {
            path,
            modified: r.get("modified"),
            attrs: attrs.unwrap(),
            markdown: None,
        })
    });

    Ok(result_iter.collect())
}

#[derive(Serialize, Deserialize, Clone, Debug, TS)]
#[ts(export)]
pub struct RecordListGetResult {
    pub schema: SchemaResult,
    pub records: Vec<RecordFromDb>,
}

pub async fn get_files_by_path(
    ctx: &AppContext,
    path: &Path,
) -> Result<RecordListGetResult, Box<ErrFR>> {
    let schema = ctx.schemas_cache.get_schema_safe(path).await?;
    let records = get_files_abstract(
        ctx,
        format!(
            "WHERE files.path LIKE concat('{}', '%') ORDER BY path",
            path.to_string_lossy()
        ),
    )
    .await?;
    Ok(RecordListGetResult { schema, records })
}

pub async fn get_all_tags(ctx: &AppContext) -> Result<Vec<String>, sqlx::Error> {
    let res = sqlx::query("SELECT DISTINCT value FROM tags")
        .fetch_all(&ctx.database_conn.get_conn().await)
        .await?;

    let result: Vec<String> = res.iter().map(|r| r.get("value")).collect();

    Ok(result)
}

#[derive(Serialize, Deserialize, Clone, Debug, TS, PartialEq)]
#[ts(export)]
pub struct FolderListGetResult {
    pub folders: Vec<FolderOnDisk>,
}

#[derive(Serialize, Deserialize, Clone, Debug, TS, PartialEq)]
#[ts(export)]
pub struct FolderOnDisk {
    /* Relative path to root path */
    pub path: String,
    pub name: String,
    pub has_schema: bool,
    pub own_schema: bool,
    pub schema_file_path: String,
}

pub async fn get_all_folders(ctx: &AppContext) -> Result<FolderListGetResult, Box<ErrFR>> {
    let res = sqlx::query("SELECT * FROM folders")
        .fetch_all(&ctx.database_conn.get_conn().await)
        .await
        .map_err(|e| ErrFR::new("Error getting folder list").raw(e))?;

    let lock = ctx.schemas_cache.get_read_lock().await;

    let result: Vec<FolderOnDisk> = res
        .iter()
        .map(|r| {
            let pstring: String = r.get("path");
            let sch = ctx
                .schemas_cache
                .get_schema_by_lock(&lock, Path::new(&pstring));

            FolderOnDisk {
                path: pstring.clone(),
                name: r.get("name"),
                has_schema: sch.is_some(),
                own_schema: sch
                    .as_ref()
                    .is_some_and(|s| s.location.schema_owner_folder == Path::new(&pstring)),
                schema_file_path: sch.map_or("".to_string(), |s| {
                    s.location.schema_path.to_string_lossy().to_string()
                }),
            }
        })
        .collect();

    Ok(FolderListGetResult { folders: result })
}

pub async fn get_all_folders_by_schema(
    ctx: &AppContext,
    schema_path_relative: &Path,
) -> Result<FolderListGetResult, Box<ErrFR>> {
    let schema_folder = match schema_path_relative.is_file() {
        true => schema_path_relative.parent().unwrap(),
        false => schema_path_relative,
    };

    let res = sqlx::query(&format!(
        "SELECT * FROM folders WHERE path LIKE concat('{}', '%')",
        schema_folder.to_string_lossy()
    ))
    .fetch_all(&ctx.database_conn.get_conn().await)
    .await
    .map_err(|e| ErrFR::new("Error getting folder list").raw(e))?;

    let lock = ctx.schemas_cache.get_read_lock().await;

    let result: Vec<FolderOnDisk> = res
        .iter()
        .filter_map(|r| {
            let pstring: String = r.get("path");
            let sch = ctx
                .schemas_cache
                .get_schema_by_lock(&lock, Path::new(&pstring));

            sch.as_ref()?;

            if sch.as_ref().unwrap().location.schema_owner_folder != schema_folder {
                return None;
            }

            Some(FolderOnDisk {
                path: pstring.clone(),
                name: r.get("name"),
                has_schema: sch.is_some(),
                own_schema: sch
                    .as_ref()
                    .is_some_and(|s| s.location.schema_owner_folder == Path::new(&pstring)),
                schema_file_path: sch.map_or("".to_string(), |s| {
                    s.location.schema_path.to_string_lossy().to_string()
                }),
            })
        })
        .collect();

    Ok(FolderListGetResult { folders: result })
}
