use notify::event::{CreateKind, ModifyKind, RemoveKind, RenameMode};
use notify::Event;
use notify::EventKind;
use std::ffi::OsStr;
use std::path::Path;

use crate::cache::cache_thing::{
    cache_file, cache_files_folders_schemas, remove_file_from_cache,
    remove_files_in_folder_from_cache, remove_folder_from_cache,
};
use crate::core::core_state::AppContext;
use crate::emitter::{FileEventDataExisting, FileEventDataRemoved, FolderEventData, IPCEmitEvent};

use crate::utils::errorhandling::ErrFR;

async fn handle_file_remove(
    ctx: &AppContext,
    path_absolute: &Path,
    ext: &OsStr,
) -> Result<Vec<IPCEmitEvent>, Box<ErrFR>> {
    match ext.to_str() {
        Some("md") => {
            let path_relative = ctx.absolute_path_to_relative(path_absolute).await?;

            let schema = ctx
                .schemas_cache
                .get_schema(&path_relative)
                .await
                .ok_or(Box::new(ErrFR::new("Schema not found for file remove")))?;

            match remove_file_from_cache(ctx, path_absolute).await {
                Ok(_) => Ok(vec![IPCEmitEvent::FileRemove(FileEventDataRemoved {
                    path: path_relative.to_string_lossy().to_string(),
                    schema: schema.location,
                })]),
                Err(e) => Err(e),
            }
        }
        Some("yaml") => {
            let path_parent = match path_absolute.parent() {
                Some(v) => v,
                None => return Err(Box::new(ErrFR::new("Failed to get parent of schema.yaml"))),
            };

            match ctx
                .schemas_cache
                .remove_schema(ctx, path_parent.to_path_buf())
                .await
            {
                Ok(_) => (),
                Err(e) => return Err(e),
            }

            Ok(vec![IPCEmitEvent::SchemasUpdated(
                ctx.schemas_cache.get_schemas_list().await,
            )])
        }
        _ => Ok(vec![]),
    }
}

async fn handle_file_add(
    ctx: &AppContext,
    path_absolute: &Path,
    ext: &OsStr,
) -> Result<Vec<IPCEmitEvent>, Box<ErrFR>> {
    match ext.to_str() {
        Some("md") => {
            let path_relative = ctx.absolute_path_to_relative(path_absolute).await?;

            let schema = match ctx.schemas_cache.get_schema(&path_relative).await {
                Some(v) => v,
                None => return Ok(vec![]),
            };

            match cache_file(ctx, path_absolute).await {
                Ok(record) => Ok(vec![IPCEmitEvent::FileAdd(FileEventDataExisting {
                    path: path_relative.to_string_lossy().to_string(),
                    record,
                    schema: schema.location,
                })]),
                Err(e) => Err(e),
            }
        }
        Some("yaml") => {
            match ctx
                .schemas_cache
                .cache_schema_absolute_path(ctx, path_absolute.to_path_buf())
                .await
            {
                Ok(_) => (),
                Err(e) => return Err(e),
            }

            Ok(vec![IPCEmitEvent::SchemasUpdated(
                ctx.schemas_cache.get_schemas_list().await,
            )])
        }
        _ => Ok(vec![]),
    }
}

async fn handle_file_update(
    ctx: &AppContext,
    path_absolute: &Path,
    ext: &OsStr,
) -> Result<Vec<IPCEmitEvent>, Box<ErrFR>> {
    if !path_absolute.exists() {
        return Ok(vec![]);
    }

    match ext.to_str() {
        Some("md") => {
            let path_relative = ctx.absolute_path_to_relative(path_absolute).await?;

            let schema = match ctx.schemas_cache.get_schema(&path_relative).await {
                Some(v) => v,
                None => return Ok(vec![]),
            };
            match cache_file(ctx, path_absolute).await {
                Ok(record) => Ok(vec![IPCEmitEvent::FileUpdate(FileEventDataExisting {
                    record,
                    path: path_relative.to_string_lossy().to_string(),
                    schema: schema.location,
                })]),
                Err(e) => Err(e),
            }
        }
        Some("yaml") => {
            match ctx
                .schemas_cache
                .cache_schema_absolute_path(ctx, path_absolute.to_path_buf())
                .await
            {
                Ok(Some(_)) => Ok(vec![IPCEmitEvent::SchemasUpdated(
                    ctx.schemas_cache.get_schemas_list().await,
                )]),
                Ok(None) => Ok(vec![]),
                Err(e) => Err(e),
            }
        }
        _ => Ok(vec![]),
    }
}

// Folder remove and folder add are called only for exact folder that was modified.
// This means that renaming folder -> folder_renamed will cause events for sub folders and sub files
// Therefore we need to remove\add all files in that directory
async fn handle_folder_remove(
    ctx: &AppContext,
    path_absolute: &Path,
) -> Result<Vec<IPCEmitEvent>, Box<ErrFR>> {
    match remove_folder_from_cache(ctx, path_absolute).await {
        Err(e) => Err(e),
        Ok(_) => {
            let path_relative = ctx.absolute_path_to_relative(path_absolute).await?;
            let schema = ctx.schemas_cache.get_schema(&path_relative).await;

            match schema {
                Some(schema) => {
                    remove_files_in_folder_from_cache(ctx, &path_relative).await?;
                    ctx.schemas_cache
                        .remove_schemas_with_children(&path_relative)
                        .await?;

                    Ok(vec![
                        IPCEmitEvent::FolderRemove(FolderEventData {
                            path: path_relative.to_string_lossy().to_string(),
                            schema: Some(schema.location),
                        }),
                        IPCEmitEvent::SchemasUpdated(ctx.schemas_cache.get_schemas_list().await),
                    ])
                }

                None => Ok(vec![IPCEmitEvent::FolderRemove(FolderEventData {
                    path: path_relative.to_string_lossy().to_string(),
                    schema: None,
                })]),
            }
        }
    }
}

async fn handle_folder_add(
    ctx: &AppContext,
    path_absolute: &Path,
) -> Result<Vec<IPCEmitEvent>, Box<ErrFR>> {
    match cache_files_folders_schemas(ctx, path_absolute).await {
        Err(e) => Err(e),
        Ok(_) => {
            let path_relative = ctx.absolute_path_to_relative(path_absolute).await?;
            let schema = ctx.schemas_cache.get_schema(&path_relative).await;

            match schema {
                Some(schema) => {
                    return Ok(vec![
                        IPCEmitEvent::FolderAdd(FolderEventData {
                            path: path_relative.to_string_lossy().to_string(),
                            schema: Some(schema.location),
                        }),
                        IPCEmitEvent::SchemasUpdated(ctx.schemas_cache.get_schemas_list().await),
                    ]);
                }
                None => Ok(vec![
                    IPCEmitEvent::FolderAdd(FolderEventData {
                        path: path_relative.to_string_lossy().to_string(),
                        schema: None,
                    }),
                    IPCEmitEvent::SchemasUpdated(ctx.schemas_cache.get_schemas_list().await),
                ]),
            }
        }
    }
}

pub struct HandleEventResult {
    pub events: Vec<IPCEmitEvent>,
    pub errors: Vec<ErrFR>,
}

/**
 * Platform specific notes:
 * - Windows sends CreateKind::Any, RemoveKind::Any
 * - Windows send ModifyKind::Any for file changes, but ModifyKind::Name with correct From and To for renames
 * - Mac sends RenameMode::Any for both files on rename
 */
pub async fn handle_event(ctx: &AppContext, event: Event) -> HandleEventResult {
    let mut events: Vec<IPCEmitEvent> = vec![];
    let mut errors: Vec<ErrFR> = vec![];

    for (index, path_absolute) in event.paths.iter().enumerate() {
        let res = match event.kind {
            EventKind::Create(kind) => {
                match (kind, path_absolute.extension(), path_absolute.is_dir()) {
                    (CreateKind::File, Some(ext), _) => {
                        handle_file_add(ctx, path_absolute, ext).await
                    }
                    (CreateKind::Folder, _, _) => handle_folder_add(ctx, path_absolute).await,
                    (CreateKind::Any, _, true) => handle_folder_add(ctx, path_absolute).await,
                    (CreateKind::Any, Some(ext), false) => {
                        handle_file_add(ctx, path_absolute, ext).await
                    }
                    k => {
                        println!("unknown create event {:?}", k);
                        Ok(vec![])
                    }
                }
            }
            EventKind::Modify(kind) => match kind {
                ModifyKind::Name(rename_mode) => match (
                    rename_mode,
                    path_absolute.try_exists(),
                    path_absolute.extension(),
                    path_absolute.is_file(),
                    path_absolute.is_dir(),
                    index,
                ) {
                    // rename from file with extension
                    (RenameMode::From, _, Some(ext), _, _, _) => {
                        handle_file_remove(ctx, path_absolute, ext).await
                    }
                    // rename from folder
                    (RenameMode::From, _, _, _, _, _) => {
                        handle_folder_remove(ctx, path_absolute).await
                    }
                    // rename to file with extension
                    (RenameMode::To, _, Some(ext), true, _, _) => {
                        handle_file_add(ctx, path_absolute, ext).await
                    }
                    // rename to folder
                    (RenameMode::To, _, _, _, true, _) => {
                        handle_folder_add(ctx, path_absolute).await
                    }
                    (RenameMode::Both, _, Some(ext), _, _, 0) => {
                        handle_file_remove(ctx, path_absolute, ext).await
                    }
                    (RenameMode::Both, _, _, _, _, 0) => {
                        handle_folder_remove(ctx, path_absolute).await
                    }
                    (RenameMode::Both, _, Some(ext), true, _, 1) => {
                        handle_file_add(ctx, path_absolute, ext).await
                    }
                    (RenameMode::Both, _, _, _, true, 1) => {
                        handle_folder_add(ctx, path_absolute).await
                    }
                    (_, Ok(false), None, _, _, _) => handle_folder_remove(ctx, path_absolute).await,
                    (_, Ok(false), Some(ext), _, _, _) => {
                        handle_file_remove(ctx, path_absolute, ext).await
                    }
                    (_, Ok(true), None, _, true, _) => handle_folder_add(ctx, path_absolute).await,
                    (_, Ok(true), Some(ext), true, _, _) => {
                        handle_file_add(ctx, path_absolute, ext).await
                    }
                    (a, b, c, d, e, f) => {
                        println!(
                            "unknown rename event {:?} {:?} {:?} {} {} {}",
                            a, b, c, d, e, f
                        );
                        Ok(vec![])
                    }
                },
                // Data is always file
                ModifyKind::Data(_) => match (path_absolute.extension(), path_absolute.exists()) {
                    (Some(ext), true) => handle_file_update(ctx, path_absolute, ext).await,
                    // We ignore for non existing files to prevent trying to update renamed file by it's old path
                    _ => Ok(vec![]),
                },
                // Windows sends "Any" for folder where a file was created\removed.
                ModifyKind::Any => match (path_absolute.extension(), path_absolute.is_dir()) {
                    (Some(ext), false) => handle_file_update(ctx, path_absolute, ext).await,
                    // EXPERIMENTAL: I am 95% sure we don't care about this event for folders, though it's worth more tests
                    //(None, true) => handle_folder_add(ctx, path_absolute).await,
                    _ => Ok(vec![]),
                },
                _ => Ok(vec![]),
            },
            EventKind::Remove(kind) => match (kind, path_absolute.extension()) {
                (RemoveKind::File, Some(ext)) => handle_file_remove(ctx, path_absolute, ext).await,
                (RemoveKind::Folder, _) => handle_folder_remove(ctx, path_absolute).await,
                (RemoveKind::Any, Some(ext)) => handle_file_remove(ctx, path_absolute, ext).await,
                (RemoveKind::Any, None) => handle_folder_remove(ctx, path_absolute).await,
                _ => Ok(vec![]),
            },
            _ => Ok(vec![]),
        };

        if let Ok(e) = res {
            events.extend(e);
        } else if let Err(e) = res {
            errors.push(*e);
        }
    }

    if !events.is_empty() {
        println!("processed event: {:?} {:?}", event.kind, event.paths);
    }

    HandleEventResult { events, errors }
}
