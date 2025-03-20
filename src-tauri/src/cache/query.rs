use serde::{Deserialize, Serialize};
use sqlx::{Row, SqliteConnection};
use std::collections::HashMap;
use std::path::Path;
use ts_rs::TS;

use crate::core::core::{DatabaseConnectionMutex, SchemasCacheMutex};
use crate::schema::schema_cache::SchemasInMemoryCache;
use crate::schema::types::{AttrValue, Schema};
use crate::utils::errorhandling::ErrFR;

#[derive(Serialize, Deserialize, Clone, Debug, TS)]
#[ts(export)]
#[serde_with::skip_serializing_none]
pub struct RecordFromDb {
    pub path: Option<String>,
    pub modified: Option<String>,
    pub markdown: Option<String>,

    pub attrs: HashMap<String, AttrValue>,
}

impl Default for RecordFromDb {
    fn default() -> RecordFromDb {
        RecordFromDb {
            attrs: HashMap::new(),
            modified: None,
            path: None,
            markdown: None,
        }
    }
}

pub async fn get_files_abstact(
    db: &mut SqliteConnection,
    where_clause: String,
) -> Result<Vec<RecordFromDb>, ErrFR> {
    let q = format!(
        "SELECT path, modified, attributes FROM files {}",
        where_clause
    );

    let res = sqlx::query(&q).fetch_all(&mut *db).await.map_err(|e| {
        ErrFR::new("Error when getting files").raw(format!("{}\n\n{}", e.to_string(), q))
    })?;

    let result_iter = res.iter().map(|r| {
        let attrs_raw = r.get("attributes");

        let attrs = serde_json::from_str::<HashMap<String, AttrValue>>(attrs_raw)
            .map_err(|e| ErrFR::new("Error when parsing attributes").raw(e));

        return RecordFromDb {
            path: r.get("path"),
            modified: r.get("modified"),
            attrs: attrs.unwrap(),
            markdown: None,
        };
    });

    Ok(result_iter.collect())
}

#[derive(Serialize, Deserialize, Clone, Debug, TS)]
#[ts(export)]
pub struct RecordListGetResult {
    pub schema: Schema,
    pub records: Vec<RecordFromDb>,
}

pub async fn get_files_by_path(
    conn: &mut SqliteConnection,
    schemas_cache: &mut SchemasInMemoryCache,
    path: String,
    search_query: String,
) -> Result<RecordListGetResult, ErrFR> {
    let schema = schemas_cache.get_schema_safe(&Path::new(&path))?;

    let files = get_files_abstact(conn, format!(
        "WHERE files.path LIKE concat('%', '{}', '%') AND files.attributes LIKE concat('%', '{}', '%') GROUP BY files.path",
        path, search_query,
    ))
    .await?;

    return Ok(RecordListGetResult {
        schema: schema.schema,
        records: files,
    });
}

pub async fn get_all_tags(conn: &mut SqliteConnection) -> Result<Vec<String>, sqlx::Error> {
    let res = sqlx::query("SELECT DISTINCT value FROM tags")
        .fetch_all(conn)
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
    pub path: String,
    pub path_relative: String,
    pub name: String,
    pub has_schema: bool,
    pub own_schema: bool,
    pub schema_file_path: String,
}

pub async fn get_all_folders(
    root_path: String,
    dcm: &DatabaseConnectionMutex,
    scm: &SchemasCacheMutex,
) -> Result<FolderListGetResult, ErrFR> {
    let mut db = dcm.lock().await;
    let conn = db.get_conn().await;

    let res = sqlx::query(&format!("SELECT * FROM folders",))
        .fetch_all(conn)
        .await
        .map_err(|e| ErrFR::new("Error getting folder list").raw(e))?;

    drop(db);

    let scm = scm.lock().await;
    let result: Vec<FolderOnDisk> = res
        .iter()
        .map(|r| {
            let pstring: String = r.get("path");
            let sch = scm.get_schema(&Path::new(&pstring));
            FolderOnDisk {
                path: pstring.clone(),
                path_relative: pstring.clone().replace(&root_path, ""),
                name: r.get("name"),
                has_schema: sch.is_some(),
                own_schema: sch
                    .as_ref()
                    .map_or(false, |s| s.owner_folder == Path::new(&pstring)),
                schema_file_path: sch.map_or("".to_string(), |s| {
                    s.file_path.to_string_lossy().to_string()
                }),
            }
        })
        .collect();

    Ok(FolderListGetResult { folders: result })
}

pub async fn get_all_folders_by_schema(
    root_path: String,
    dcm: &DatabaseConnectionMutex,
    scm: &SchemasCacheMutex,
    schema_path: String,
) -> Result<FolderListGetResult, ErrFR> {
    let schema_p = Path::new(&schema_path);

    let schema_folder = match schema_p.is_file() {
        true => schema_p.parent().unwrap(),
        false => schema_p,
    };

    let mut db = dcm.lock().await;
    let conn = db.get_conn().await;

    let res = sqlx::query(&format!(
        "SELECT * FROM folders WHERE path LIKE concat('{}', '%')",
        schema_folder.to_string_lossy().to_string()
    ))
    .fetch_all(conn)
    .await
    .map_err(|e| ErrFR::new("Error getting folder list").raw(e))?;

    let schemas_cache = scm.lock().await;
    let result: Vec<FolderOnDisk> = res
        .iter()
        .filter_map(|r| {
            let pstring: String = r.get("path");
            let sch = schemas_cache.get_schema(&Path::new(&pstring));

            if sch.is_none() {
                return None;
            }

            if sch.as_ref().unwrap().owner_folder != schema_folder {
                return None;
            }

            Some(FolderOnDisk {
                path: pstring.clone(),
                path_relative: pstring.clone().replace(&root_path, ""),
                name: r.get("name"),
                has_schema: sch.is_some(),
                own_schema: sch
                    .as_ref()
                    .map_or(false, |s| s.owner_folder == Path::new(&pstring)),
                schema_file_path: sch.map_or("".to_string(), |s| {
                    s.file_path.to_string_lossy().to_string()
                }),
            })
        })
        .collect();

    Ok(FolderListGetResult { folders: result })
}
