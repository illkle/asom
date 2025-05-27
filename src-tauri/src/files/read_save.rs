use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::path::Path;

use ts_rs::TS;

use crate::cache::query::RecordFromDb;
use crate::core::core::SchemasCacheMutex;
use crate::schema::schema_cache::SchemaResult;
use crate::schema::types::{AttrValue, AttrValueOnDisk};
use crate::utils::errorhandling::{ErrFR, ErrFRActionCode};

use super::metadata::parse_metadata;
use super::utils::{get_file_content, get_file_modified_time};

pub enum FileReadMode {
    OnlyMeta,
    FullFile,
}

#[derive(serde::Serialize, serde::Deserialize, TS)]
#[ts(export)]
pub struct RecordReadResult {
    pub record: RecordFromDb,
    pub parsing_error: Option<ErrFR>,
    pub schema: SchemaResult,
}

pub async fn read_file_by_path(
    scm: &SchemasCacheMutex,
    path_str: &str,
    read_mode: FileReadMode,
) -> Result<RecordReadResult, ErrFR> {
    let file_modified = get_file_modified_time(path_str).map_err(|e| {
        ErrFR::new("Error reading file")
            .raw(e)
            .action_c(ErrFRActionCode::FileReadRetry, "Retry")
    })?;

    let schemas_cache = scm.lock().await;
    let files_schema = match schemas_cache.get_schema(&Path::new(path_str)) {
        Some(v) => v,
        None => return Err(ErrFR::new("Schema not found").raw(path_str)),
    };
    drop(schemas_cache);

    let p = path_str.to_string();
    let content = get_file_content(&path_str, &read_mode);

    match content {
        Ok(c) => {
            let parsed_meta = parse_metadata(&c.front_matter, &files_schema.schema);

            return Ok(RecordReadResult {
                record: RecordFromDb {
                    path: Some(p),
                    markdown: match read_mode {
                        FileReadMode::OnlyMeta => None,
                        FileReadMode::FullFile => Some(c.content),
                    },
                    modified: Some(file_modified),
                    attrs: parsed_meta.metadata,
                    ..Default::default()
                },
                parsing_error: parsed_meta.parsing_error,
                schema: files_schema,
            });
        }
        Err(e) => {
            return Err(ErrFR::new("Error reading file")
                .raw(e)
                .action_c(ErrFRActionCode::FileReadRetry, "Retry"))
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, TS)]
#[ts(export)]
pub struct RecordSaveResult {
    pub path: String,
    pub modified: String,
}

pub fn save_file(record: RecordFromDb, forced: bool) -> Result<RecordSaveResult, ErrFR> {
    let path = match record.path {
        Some(v) => v,
        None => {
            return Err(ErrFR::new("No path in record")
                .info("This is likely a frontend bug. Copy unsaved content and restart the app"))
        }
    };

    if !forced {
        match record.modified {
            Some(v) => {
                let modified_before = match get_file_modified_time(&path.clone().as_str()) {
                    Ok(v) => v,
                    Err(e) => return Err(ErrFR::new(
                        "Unable to get modified date from file on disk",
                    )
                    .info("Retry only if you are sure there is no important data in file on disk")
                    .action_c(ErrFRActionCode::FileSaveRetryForced, "Save anyway")
                    .raw(e)),
                };

                if v != modified_before {
                    return Err(ErrFR::new("File was modified by something else")
                        .action_c(ErrFRActionCode::FileSaveRetryForced, "Overwrite"));
                }
            }
            None => (),
        }
    }

    let markdown = record.markdown.unwrap_or("".to_string());

    let yaml =
        serde_yml::to_string(&transform_attr_values_to_on_disk(record.attrs)).map_err(|e| {
            ErrFR::new("Error serializing record metadata")
                .info("File was not saved")
                .raw(e)
        })?;

    let file = format!("---\n{yaml}---\n{markdown}");

    fs::write(path.clone(), file).map_err(|e| {
        ErrFR::new("Error writing to disk")
            .info("File was not saved")
            .raw(e)
            .action_c(ErrFRActionCode::FileSaveRetry, "Retry")
    })?;

    match get_file_modified_time(&path.clone().as_str()) {
        Ok(v) => Ok(RecordSaveResult {
            path: path,
            modified: v,
        }),
        Err(e) => {
            return Err(ErrFR::new("Error getting update file modification date")
                .info("File should be saved. Expect to get a warning next time you save this file")
                .raw(e))
        }
    }
}

pub fn transform_attr_values_to_on_disk(
    attrs: HashMap<String, AttrValue>,
) -> BTreeMap<String, AttrValueOnDisk> {
    attrs.into_iter().map(|(k, v)| (k, v.into())).collect()
}
