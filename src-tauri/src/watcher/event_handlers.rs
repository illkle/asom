use notify::event::{CreateKind, ModifyKind, RemoveKind, RenameMode};
use notify::Event;
use notify::EventKind;
use serde::{Deserialize, Serialize};
use std::ffi::OsStr;
use std::path::Path;
use tauri::{AppHandle, Manager};

use crate::cache::cache_thing::{
    cache_file, cache_files_folders_schemas, remove_file_from_cache,
    remove_files_in_folder_rom_cache, remove_folder_from_cache,
};
use crate::core::core::CoreStateManager;
use crate::emitter::{emit_event, IPCEmitEvent};

use crate::utils::errorhandling::{send_err_to_frontend, ErrorFromRust};
use ts_rs::TS;

async fn handle_file_remove(
    core: &CoreStateManager,
    path: &Path,
    ext: &OsStr,
) -> Result<Option<IPCEmitEvent>, ErrorFromRust> {
    let mut db = core.database_conn.lock().await;
    let conn = db.get_conn().await;

    match ext.to_str() {
        Some("md") => match remove_file_from_cache(conn, path).await {
            Ok(_) => Ok(Some(IPCEmitEvent::FileRemove(
                path.to_string_lossy().to_string(),
            ))),
            Err(e) => Err(e),
        },
        Some("yaml") => {
            let mut schemas_cache = core.schemas_cache.lock().await;

            let path_parent = match path.parent() {
                Some(v) => v,
                None => return Err(ErrorFromRust::new("Failed to get parent of schema.yaml")),
            };

            match schemas_cache.remove_schema(path_parent.to_path_buf()).await {
                Ok(_) => (),
                Err(e) => return Err(e),
            }

            schemas_cache
                .rebuild_schema_index_in_db(conn, path_parent)
                .await?;

            Ok(Some(IPCEmitEvent::SchemasUpdated(
                schemas_cache.get_schemas_list().await,
            )))
        }
        _ => Ok(None),
    }
}

async fn handle_file_add(
    core: &CoreStateManager,
    path: &Path,
    ext: &OsStr,
) -> Result<Option<IPCEmitEvent>, ErrorFromRust> {
    let mut schemas_cache = core.schemas_cache.lock().await;
    let mut db = core.database_conn.lock().await;
    let conn = db.get_conn().await;

    match ext.to_str() {
        Some("md") => match cache_file(&mut schemas_cache, conn, path).await {
            Ok(v) => Ok(Some(IPCEmitEvent::FileAdd(v))),
            Err(e) => Err(e),
        },
        Some("yaml") => {
            match schemas_cache.cache_schema(path.to_path_buf()).await {
                Ok(_) => (),
                Err(e) => return Err(e),
            }

            let path_parent = match path.parent() {
                Some(v) => v,
                None => return Err(ErrorFromRust::new("Failed to get parent of schema.yaml")),
            };

            schemas_cache
                .rebuild_schema_index_in_db(conn, path_parent)
                .await?;

            Ok(Some(IPCEmitEvent::SchemasUpdated(
                schemas_cache.get_schemas_list().await,
            )))
        }
        _ => Ok(None),
    }
}

async fn handle_file_update(
    core: &CoreStateManager,
    path: &Path,
    ext: &OsStr,
) -> Result<Option<IPCEmitEvent>, ErrorFromRust> {
    let mut schemas_cache = core.schemas_cache.lock().await;
    let mut db = core.database_conn.lock().await;
    let conn = db.get_conn().await;

    match ext.to_str() {
        Some("md") => match cache_file(&mut schemas_cache, conn, path).await {
            Ok(v) => Ok(Some(IPCEmitEvent::FileUpdate(v))),
            Err(e) => Err(e),
        },

        Some("yaml") => match schemas_cache.cache_schema(path.to_path_buf()).await {
            Ok(v) => Ok(Some(IPCEmitEvent::SchemaUpdated(v))),
            Err(e) => return Err(e),
        },
        _ => Ok(None),
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, TS)]
#[ts(export)]
pub struct FolderEventEmit {
    pub path: String,
    #[serde(rename = "schemaPath")]
    pub schema_path: Option<String>,
}

// Folder remove and folder add are called only for exact folder that was modified.
// This means that renaming folder -> folder_renamed will cause events for sub folders and sub files
// Therefore we need to remove\add all files in that directory
async fn handle_folder_remove(
    core: &CoreStateManager,
    path: &Path,
) -> Result<Option<IPCEmitEvent>, ErrorFromRust> {
    let mut db = core.database_conn.lock().await;
    let conn = db.get_conn().await;

    match remove_folder_from_cache(conn, path).await {
        Err(e) => Err(e),
        Ok(_) => {
            remove_files_in_folder_rom_cache(conn, path).await?;

            let mut schemas_cache = core.schemas_cache.lock().await;
            schemas_cache
                .remove_schemas_with_children(path.to_path_buf())
                .await?;

            return Ok(Some(IPCEmitEvent::FolderRemove(FolderEventEmit {
                path: path.to_string_lossy().to_string(),
                schema_path: None,
            })));
        }
    }
}

async fn handle_folder_add(
    core: &CoreStateManager,
    path: &Path,
) -> Result<Option<IPCEmitEvent>, ErrorFromRust> {
    let mut schemas_cache = core.schemas_cache.lock().await;
    let mut db = core.database_conn.lock().await;
    let conn = db.get_conn().await;

    match cache_files_folders_schemas(&mut schemas_cache, conn, path).await {
        Err(e) => Err(e),
        Ok(_) => Ok(Some(IPCEmitEvent::FolderAdd(FolderEventEmit {
            path: path.to_string_lossy().to_string(),
            schema_path: schemas_cache
                .get_schema(path)
                .map(|v| v.file_path.to_string_lossy().to_string()),
        }))),
    }
}

pub async fn handle_event<T: tauri::Runtime>(event: Event, app: &AppHandle<T>) {
    let core = app.state::<CoreStateManager>();

    for (index, path) in event.paths.iter().enumerate() {
        println!("{:?}", event);
        let res = match event.kind {
            EventKind::Create(kind) => match (kind, path.extension()) {
                (CreateKind::File, Some(ext)) => handle_file_add(&core, &path, ext).await,
                (CreateKind::Folder, _) => handle_folder_add(&core, &path).await,
                k => {
                    println!("unknown create event {:?}", k);
                    Ok(None)
                }
            },
            EventKind::Modify(kind) => match kind {
                ModifyKind::Name(rename_mode) => match (
                    rename_mode,
                    path.try_exists(),
                    path.extension(),
                    path.is_file(),
                    path.is_dir(),
                    index,
                ) {
                    (RenameMode::From, _, Some(ext), _, _, _) => {
                        handle_file_remove(&core, path, ext).await
                    }
                    (RenameMode::From, _, _, _, _, _) => handle_folder_remove(&core, path).await,
                    (RenameMode::To, _, Some(ext), true, _, _) => {
                        handle_file_add(&core, &path, ext).await
                    }
                    (RenameMode::To, _, _, _, true, _) => handle_folder_add(&core, &path).await,
                    (RenameMode::Both, _, Some(ext), _, _, 0) => {
                        handle_file_remove(&core, &path, ext).await
                    }
                    (RenameMode::Both, _, _, _, _, 0) => handle_folder_remove(&core, &path).await,
                    (RenameMode::Both, _, Some(ext), true, _, 1) => {
                        handle_file_add(&core, &path, ext).await
                    }
                    (RenameMode::Both, _, _, _, true, 1) => handle_folder_add(&core, &path).await,
                    // finder on mac calls with RenameMode::Any
                    (_, Ok(false), None, _, _, _) => handle_folder_remove(&core, &path).await,
                    (_, Ok(false), Some(ext), _, _, _) => {
                        handle_file_remove(&core, &path, ext).await
                    }
                    (_, Ok(true), None, _, true, _) => handle_folder_add(&core, &path).await,
                    (_, Ok(true), Some(ext), true, _, _) => {
                        handle_file_add(&core, &path, ext).await
                    }
                    (a, b, c, d, e, f) => {
                        println!(
                            "unknown rename event {:?} {:?} {:?} {} {} {}",
                            a, b, c, d, e, f
                        );
                        Ok(None)
                    }
                },
                // Data is always file
                ModifyKind::Data(_) => match path.extension() {
                    Some(ext) => handle_file_update(&core, &path, ext).await,
                    _ => Ok(None),
                },
                _ => Ok(None),
            },
            EventKind::Remove(kind) => match (kind, path.extension()) {
                (RemoveKind::File, Some(ext)) => handle_file_remove(&core, &path, ext).await,
                (RemoveKind::Folder, _) => handle_folder_remove(&core, &path).await,
                _ => Ok(None),
            },
            _ => Ok(None),
        };

        match res {
            Ok(Some(event)) => {
                emit_event(app, event);
            }
            Err(e) => {
                send_err_to_frontend(app, &e);
            }
            Ok(None) => (),
        }
    }
}
