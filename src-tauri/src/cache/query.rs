use serde::{Deserialize, Serialize};
use sqlx::{Row, SqliteConnection};
use std::collections::HashMap;
use ts_rs::TS;

use crate::schema::operations::SchemasInMemoryCache;
use crate::schema::types::{AttrValue, Schema};
use crate::utils::errorhandling::ErrorFromRust;

#[derive(Serialize, Deserialize, Clone, Debug, TS)]
#[ts(export)]
#[serde_with::skip_serializing_none]
pub struct BookFromDb {
    pub path: Option<String>,
    pub modified: Option<String>,
    pub markdown: Option<String>,

    pub attrs: HashMap<String, AttrValue>,
}

impl Default for BookFromDb {
    fn default() -> BookFromDb {
        BookFromDb {
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
) -> Result<Vec<BookFromDb>, ErrorFromRust> {
    let q = format!(
        "SELECT path, modified, attributes FROM files {}",
        where_clause
    );

    let res = sqlx::query(&q).fetch_all(&mut *db).await.map_err(|e| {
        ErrorFromRust::new("Error when getting files").raw(format!("{}\n\n{}", e.to_string(), q))
    })?;

    let result_iter = res.iter().map(|r| {
        let attrs_raw = r.get("attributes");

        let attrs = serde_json::from_str::<HashMap<String, AttrValue>>(attrs_raw)
            .map_err(|e| ErrorFromRust::new("Error when parsing attributes").raw(e));

        return BookFromDb {
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
pub struct BookListGetResult {
    pub schema: Schema,
    pub books: Vec<BookFromDb>,
}

pub async fn get_files_by_path(
    conn: &mut SqliteConnection,
    schemas_cache: &mut SchemasInMemoryCache,
    path: String,
    search_query: String,
) -> Result<BookListGetResult, ErrorFromRust> {
    let schema = schemas_cache.get_schema_cached_safe(&path).await?;

    let files = get_files_abstact(conn, format!(
        "WHERE files.path LIKE concat('%', '{}', '%') AND files.attributes LIKE concat('%', '{}', '%') GROUP BY files.path",
        path, search_query,
    ))
    .await?;

    return Ok(BookListGetResult {
        schema: schema,
        books: files,
    });
}

pub async fn get_all_tags(conn: &mut SqliteConnection) -> Result<Vec<String>, sqlx::Error> {
    let res = sqlx::query("SELECT DISTINCT value FROM tags")
        .fetch_all(conn)
        .await?;

    let result: Vec<String> = res.iter().map(|r| r.get("value")).collect();

    Ok(result)
}

#[derive(Serialize, Deserialize, Clone, Debug, TS)]
#[ts(export)]
pub struct FolderListGetResult {
    pub folders: Vec<FolderOnDisk>,
}

#[derive(Serialize, Deserialize, Clone, Debug, TS)]
#[ts(export)]
pub struct FolderOnDisk {
    pub path: String,
    pub name: String,
    pub has_schema: bool,
    pub own_schema: bool,
    pub schema_file_path: String,
}

pub async fn get_all_folders(
    conn: &mut SqliteConnection,
) -> Result<FolderListGetResult, ErrorFromRust> {
    let res = sqlx::query(&format!("SELECT * FROM folders",))
        .fetch_all(conn)
        .await
        .map_err(|e| ErrorFromRust::new("Error getting folder list").raw(e))?;

    let result: Vec<FolderOnDisk> = res
        .iter()
        .map(|r| FolderOnDisk {
            path: r.get("path"),
            name: r.get("name"),
            has_schema: r.get("has_schema"),
            own_schema: r.get("own_schema"),
            schema_file_path: r.get("schema_file_path"),
        })
        .collect();

    Ok(FolderListGetResult { folders: result })
}

pub async fn get_all_folders_by_schema(
    conn: &mut SqliteConnection,
    schema_path: String,
) -> Result<FolderListGetResult, ErrorFromRust> {
    let res = sqlx::query(&format!(
        "SELECT * FROM folders WHERE schema_file_path = '{}'",
        schema_path
    ))
    .fetch_all(conn)
    .await
    .map_err(|e| ErrorFromRust::new("Error getting folder list").raw(e))?;

    let result: Vec<FolderOnDisk> = res
        .iter()
        .map(|r| FolderOnDisk {
            path: r.get("path"),
            name: r.get("name"),
            has_schema: r.get("has_schema"),
            own_schema: r.get("own_schema"),
            schema_file_path: r.get("schema_file_path"),
        })
        .collect();

    Ok(FolderListGetResult { folders: result })
}
