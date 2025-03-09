use std::collections::HashMap;
use std::fs;

use ts_rs::TS;

use crate::cache::query::BookFromDb;
use crate::schema::operations::SchemasInMemoryCache;
use crate::schema::types::{AttrValue, AttrValueOnDisk, Schema};
use crate::utils::errorhandling::{ErrorActionCode, ErrorFromRust};

use super::metadata::parse_metadata;
use super::utils::{get_file_content, get_file_modified_time};

pub enum FileReadMode {
    OnlyMeta,
    FullFile,
}

#[derive(serde::Serialize, serde::Deserialize, TS)]
#[ts(export)]
pub struct BookReadResult {
    pub book: BookFromDb,
    pub parsing_error: Option<ErrorFromRust>,
    pub schema: Schema,
}

pub async fn read_file_by_path(
    schemas_cache: &mut SchemasInMemoryCache,
    path_str: &str,
    read_mode: FileReadMode,
) -> Result<BookReadResult, ErrorFromRust> {
    let file_modified = match get_file_modified_time(path_str) {
        Ok(v) => v,
        Err(e) => {
            return Err(ErrorFromRust::new("Error reading file")
                .raw(e)
                .action_c(ErrorActionCode::FileReadRetry, "Retry"))
        }
    };

    let files_schema = schemas_cache.get_schema_cached_safe(path_str).await?;
    let p = path_str.to_string();
    let content = get_file_content(&path_str, &read_mode);

    match content {
        Ok(c) => {
            let parsed_meta = parse_metadata(&c.front_matter, &files_schema);

            return Ok(BookReadResult {
                book: BookFromDb {
                    path: Some(p),
                    markdown: match read_mode {
                        FileReadMode::OnlyMeta => None,
                        FileReadMode::FullFile => Some(c.content),
                    },
                    modified: Some(file_modified),
                    attrs: parsed_meta.clone().unwrap_or_default(),
                    ..Default::default()
                },
                parsing_error: parsed_meta.err(),
                schema: files_schema.clone(),
            });
        }
        Err(e) => {
            return Err(ErrorFromRust::new("Error reading file")
                .raw(e)
                .action_c(ErrorActionCode::FileReadRetry, "Retry"))
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, TS)]
#[ts(export)]
pub struct BookSaveResult {
    pub path: String,
    pub modified: String,
}

pub fn save_file(book: BookFromDb, forced: bool) -> Result<BookSaveResult, ErrorFromRust> {
    let path = match book.path {
        Some(v) => v,
        None => {
            return Err(ErrorFromRust::new("No path in book")
                .info("This is likely a frontend bug. Copy unsaved content and restart the app"))
        }
    };

    if !forced {
        match book.modified {
            Some(v) => {
                let modified_before =
                    match get_file_modified_time(&path.clone().as_str()) {
                        Ok(v) => v,
                        Err(e) => return Err(ErrorFromRust::new(
                            "Unable to get modified date from file on disk",
                        )
                        .info(
                            "Retry only if you are sure there is no important data in file on disk",
                        )
                        .action_c(ErrorActionCode::FileSaveRetryForced, "Save anyway")
                        .raw(e)),
                    };

                if v != modified_before {
                    return Err(ErrorFromRust::new("File was modified by something else")
                        .action_c(ErrorActionCode::FileSaveRetryForced, "Overwrite"));
                }
            }
            None => (),
        }
    }

    let markdown = book.markdown.unwrap_or("".to_string());

    let yaml =
        serde_yml::to_string(&transform_attr_values_to_on_disk(book.attrs)).map_err(|e| {
            ErrorFromRust::new("Error serializing book metadata")
                .info("File was not saved")
                .raw(e)
        })?;

    let file = format!("---\n{yaml}---\n{markdown}");

    fs::write(path.clone(), file).map_err(|e| {
        ErrorFromRust::new("Error writing to disk")
            .info("File was not saved")
            .raw(e)
            .action_c(ErrorActionCode::FileSaveRetry, "Retry")
    })?;

    match get_file_modified_time(&path.clone().as_str()) {
        Ok(v) => Ok(BookSaveResult {
            path: path,
            modified: v,
        }),
        Err(e) => return Err(
            ErrorFromRust::new("Error getting update file modification date")
                .info("File should be saved. Expect to get a warning next time you save this file")
                .raw(e),
        ),
    }
}

pub fn transform_attr_values_to_on_disk(
    attrs: HashMap<String, AttrValue>,
) -> HashMap<String, AttrValueOnDisk> {
    attrs.into_iter().map(|(k, v)| (k, v.into())).collect()
}
