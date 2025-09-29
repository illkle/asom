use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::path::Path;

use ts_rs::TS;

use crate::cache::query::RecordFromDb;
use crate::core::core_state::AppContext;
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
    ctx: &AppContext,
    path_relative: &Path,
    read_mode: FileReadMode,
) -> Result<RecordReadResult, Box<ErrFR>> {
    let absolute_path = ctx.relative_path_to_absolute(path_relative).await?;

    let file_modified = get_file_modified_time(&absolute_path).map_err(|e| {
        ErrFR::new("Error reading get file modified time")
            .info(absolute_path.to_string_lossy().as_ref())
            .raw(e)
            .action_c(ErrFRActionCode::FileReadRetry, "Retry")
    })?;

    let files_schema = match ctx.schemas_cache.get_schema(path_relative).await {
        Some(v) => v,
        None => {
            return Err(Box::new(
                ErrFR::new("Schema not found").raw(path_relative.to_string_lossy()),
            ))
        }
    };

    let content = get_file_content(&absolute_path, &read_mode);

    match content {
        Ok(c) => {
            let parsed_meta = parse_metadata(&c.front_matter, &files_schema.schema);

            Ok(RecordReadResult {
                record: RecordFromDb {
                    path: Some(path_relative.to_string_lossy().to_string()),
                    markdown: match read_mode {
                        FileReadMode::OnlyMeta => None,
                        FileReadMode::FullFile => Some(c.content),
                    },
                    modified: Some(file_modified),
                    attrs: parsed_meta.metadata,
                },
                parsing_error: parsed_meta.parsing_error,
                schema: files_schema,
            })
        }
        Err(e) => Err(Box::new(
            ErrFR::new("Error reading get file modified time")
                .raw(e)
                .action_c(ErrFRActionCode::FileReadRetry, "Retry"),
        )),
    }
}

#[derive(serde::Serialize, serde::Deserialize, TS)]
#[ts(export)]
pub struct RecordSaveResult {
    pub path: String,
    pub modified: String,
}

pub async fn save_file(
    ctx: &AppContext,
    record: RecordFromDb,
    forced: bool,
) -> Result<RecordSaveResult, Box<ErrFR>> {
    let path = match record.path {
        Some(v) => v,
        None => {
            return Err(Box::new(ErrFR::new("No path in record").info(
                "This is likely a frontend bug. Copy unsaved content and restart the app",
            )));
        }
    };

    let path_absolute = ctx.relative_path_to_absolute(Path::new(&path)).await?;

    if !forced {
        if let Some(v) = record.modified {
            let modified_before = match get_file_modified_time(&path_absolute) {
                Ok(v) => v,
                Err(e) => return Err(Box::new(
                    ErrFR::new("Unable to get modified date from file on disk")
                        .info(
                            "Retry only if you are sure there is no important data in file on disk",
                        )
                        .action_c(ErrFRActionCode::FileSaveRetryForced, "Save anyway")
                        .raw(e),
                )),
            };

            if v != modified_before {
                return Err(Box::new(
                    ErrFR::new("File was modified by something else")
                        .action_c(ErrFRActionCode::FileSaveRetryForced, "Overwrite"),
                ));
            }
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

    fs::write(&path_absolute, file).map_err(|e| {
        ErrFR::new("Error writing to disk")
            .info("File was not saved")
            .raw(e)
            .action_c(ErrFRActionCode::FileSaveRetry, "Retry")
    })?;

    match get_file_modified_time(&path_absolute) {
        Ok(v) => Ok(RecordSaveResult { path, modified: v }),
        Err(e) => Err(Box::new(
            ErrFR::new("Error getting update file modification date")
                .info("File should be saved. Expect to get a warning next time you save this file")
                .raw(e),
        )),
    }
}

pub fn transform_attr_values_to_on_disk(
    attrs: HashMap<String, AttrValue>,
) -> BTreeMap<String, AttrValueOnDisk> {
    attrs.into_iter().map(|(k, v)| (k, v.into())).collect()
}
