use notify::event::{CreateKind, ModifyKind, RemoveKind, RenameMode};
use notify::Event;
use notify::EventKind;
use serde::{Deserialize, Serialize};
use std::ffi::OsStr;
use std::path::Path;
use tauri::AppHandle;

use crate::cache::write::{
    cache_file, cache_files_folders_schemas, cache_folder, cache_folder_deep,
    remove_file_from_cache, remove_files_in_folder_rom_cache, remove_folder_from_cache,
};
use crate::emitter::{emit_event, IPCEmitEvent};
use crate::schema::operations::{
    cache_schema, get_all_schemas_cached, get_schema_owner_folder, remove_schema,
};
use crate::utils::errorhandling::send_err_to_frontend;
use ts_rs::TS;
async fn handle_file_remove(app: &AppHandle, path: &Path, ext: &OsStr) {
    if ext == "md" {
        match remove_file_from_cache(path).await {
            Ok(_) => emit_event(IPCEmitEvent::FileRemove(path.to_string_lossy().to_string())),
            Err(e) => send_err_to_frontend(app, &e),
        };
    }

    if ext == "yaml" {
        match remove_schema(path.to_path_buf()).await {
            Ok(_) => emit_event(IPCEmitEvent::SchemasUpdated(get_all_schemas_cached().await)),
            Err(e) => send_err_to_frontend(app, &e),
        }

        match cache_folder_deep(path).await {
            Ok(_) => return,
            Err(e) => send_err_to_frontend(app, &e),
        }
    }
}

async fn handle_file_add(app: &AppHandle, path: &Path, ext: &OsStr) {
    if ext == "md" {
        match cache_file(path).await {
            Ok(v) => emit_event(IPCEmitEvent::FileAdd(v)),
            Err(e) => send_err_to_frontend(app, &e),
        }
    }

    if ext == "yaml" {
        match cache_folder_deep(path).await {
            Ok(_) => emit_event(IPCEmitEvent::SchemasUpdated(get_all_schemas_cached().await)),
            Err(e) => send_err_to_frontend(app, &e),
        }
    }
}

async fn handle_file_update(app: &AppHandle, path: &Path, ext: &OsStr) {
    println!("file update {:?}", path);
    if ext == "md" {
        match cache_file(path).await {
            Ok(v) => emit_event(IPCEmitEvent::FileUpdate(v)),
            Err(e) => send_err_to_frontend(app, &e),
        }
    }

    if ext == "yaml" {
        match cache_schema(path.to_path_buf()).await {
            Ok(_) => emit_event(IPCEmitEvent::SchemasUpdated(get_all_schemas_cached().await)),
            Err(e) => send_err_to_frontend(app, &e),
        }

        match cache_folder_deep(path).await {
            Ok(_) => emit_event(IPCEmitEvent::SchemasUpdated(get_all_schemas_cached().await)),
            Err(e) => send_err_to_frontend(app, &e),
        }
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
async fn handle_folder_remove(app: &AppHandle, path: &Path) {
    match remove_folder_from_cache(path).await {
        Err(e) => send_err_to_frontend(app, &e),
        Ok(_) => match remove_files_in_folder_rom_cache(path).await {
            Err(e) => send_err_to_frontend(app, &e),
            Ok(_) => emit_event(IPCEmitEvent::FolderRemove(FolderEventEmit {
                path: path.to_string_lossy().to_string(),
                schema_path: get_schema_owner_folder(&path.to_string_lossy()).await,
            })),
        },
    };
}

async fn handle_folder_add(app: &AppHandle, path: &Path) {
    match cache_folder(path).await {
        Err(e) => send_err_to_frontend(app, &e),
        Ok(_) => match cache_files_folders_schemas(path).await {
            Err(e) => send_err_to_frontend(app, &e),
            Ok(_) => emit_event(IPCEmitEvent::FolderAdd(FolderEventEmit {
                path: path.to_string_lossy().to_string(),
                schema_path: get_schema_owner_folder(&path.to_string_lossy()).await,
            })),
        },
    };
}

pub async fn handle_event(event: Event, app: &AppHandle) {
    for (index, path) in event.paths.iter().enumerate() {
        println!("{:?}", event);
        match event.kind {
            EventKind::Create(kind) => match (kind, path.extension()) {
                (CreateKind::File, Some(ext)) => handle_file_add(app, &path, ext).await,
                (CreateKind::Folder, _) => handle_folder_add(app, &path).await,
                k => {
                    println!("unknown create event {:?}", k)
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
                        handle_file_remove(app, path, ext).await
                    }
                    (RenameMode::From, _, _, _, _, _) => handle_folder_remove(app, path).await,
                    (RenameMode::To, _, Some(ext), true, _, _) => {
                        handle_file_add(app, &path, ext).await
                    }
                    (RenameMode::To, _, _, _, true, _) => handle_folder_add(app, &path).await,
                    (RenameMode::Both, _, Some(ext), _, _, 0) => {
                        handle_file_remove(app, &path, ext).await
                    }
                    (RenameMode::Both, _, _, _, _, 0) => handle_folder_remove(app, &path).await,
                    (RenameMode::Both, _, Some(ext), true, _, 1) => {
                        handle_file_add(app, &path, ext).await
                    }
                    (RenameMode::Both, _, _, _, true, 1) => handle_folder_add(app, &path).await,
                    // finder on mac calls with RenameMode::Any
                    (_, Ok(false), None, _, _, _) => handle_folder_remove(app, &path).await,
                    (_, Ok(false), Some(ext), _, _, _) => handle_file_remove(app, &path, ext).await,
                    (_, Ok(true), None, _, true, _) => handle_folder_add(app, &path).await,
                    (_, Ok(true), Some(ext), true, _, _) => handle_file_add(app, &path, ext).await,
                    (a, b, c, d, e, f) => {
                        println!(
                            "unknown rename event {:?} {:?} {:?} {} {} {}",
                            a, b, c, d, e, f
                        )
                    }
                },
                // Data is always file
                ModifyKind::Data(_) => match path.extension() {
                    Some(ext) => handle_file_update(app, &path, ext).await,
                    _ => (),
                },
                _ => (),
            },
            EventKind::Remove(kind) => match (kind, path.extension()) {
                (RemoveKind::File, Some(ext)) => handle_file_remove(app, &path, ext).await,
                (RemoveKind::Folder, _) => handle_folder_remove(app, &path).await,
                _ => (),
            },
            _ => (),
        };
    }
}
