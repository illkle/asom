mod cache;
mod emitter;
mod files;
mod schema;
mod utils;
mod watcher;

mod core;

use core::core::CoreStateManager;
use std::{collections::HashMap, path::PathBuf};
use tokio::sync::Mutex;

use cache::query::{
    get_all_folders, get_all_folders_by_schema, get_all_tags, get_files_by_path, BookFromDb,
    BookListGetResult, FolderListGetResult,
};
use files::io::{read_file_by_path, save_file, BookReadResult, BookSaveResult, FileReadMode};
use schema::defaults::get_default_schemas;
use schema::{defaults::DefaultSchema, types::Schema};
use tauri::{AppHandle, Manager};
use ts_rs::TS;
use utils::errorhandling::ErrorFromRust;

/*
  Define types and pack them into IPCResponces, which gets exported to TS types
*/
type IPCInitOnce = Result<bool, ErrorFromRust>;
type IPCPrepareCache = Result<bool, ErrorFromRust>;
type IPCWatchPath = Result<bool, ErrorFromRust>;
type IPCGetFilesPath = Result<BookListGetResult, ErrorFromRust>;
type IPCGetAllTags = Result<Vec<String>, ErrorFromRust>;
type IPCGetAllFolders = Result<FolderListGetResult, ErrorFromRust>;
type IPCGetAllFoldersBySchema = Result<FolderListGetResult, ErrorFromRust>;
type IPCReadFileByPath = Result<BookReadResult, ErrorFromRust>;
type IPCGetSchemas = Result<HashMap<String, Schema>, ErrorFromRust>;
type IPCLoadSchema = Result<Schema, ErrorFromRust>;
type IPCSaveSchema = Result<Schema, ErrorFromRust>;
type IPCSaveFile = Result<BookSaveResult, ErrorFromRust>;
type IPCGetDefaultSchemas = Result<Vec<DefaultSchema>, ErrorFromRust>;

#[derive(TS)]
#[ts(export)]
#[allow(dead_code)]
struct IPCResponces {
    c_init_once: IPCInitOnce,
    c_prepare_cache: IPCPrepareCache,
    c_watch_path: IPCWatchPath,
    c_get_files_path: IPCGetFilesPath,
    c_get_all_tags: IPCGetAllTags,
    c_get_all_folders: IPCGetAllFolders,
    c_get_all_folders_by_schema: IPCGetAllFoldersBySchema,
    c_read_file_by_path: IPCReadFileByPath,
    c_get_schemas: IPCGetSchemas,
    c_load_schema: IPCLoadSchema,
    c_save_schema: IPCSaveSchema,
    c_save_file: IPCSaveFile,
    c_get_default_schemas: IPCGetDefaultSchemas,
}

#[tauri::command]
async fn c_init_once(app: AppHandle) -> IPCInitOnce {
    let state = app.state::<Mutex<CoreStateManager>>(); // state() called before manage() for given type
    let mut core = state.lock().await;

    core.init(&app).await
}

#[tauri::command]
async fn c_prepare_cache(app: AppHandle) -> IPCPrepareCache {
    let state = app.state::<Mutex<CoreStateManager>>();
    let mut core = state.lock().await;

    core.prepare_cache(&app).await
}

#[tauri::command]
async fn c_watch_path(app: AppHandle) -> IPCWatchPath {
    let state = app.state::<Mutex<CoreStateManager>>();
    let core = state.lock().await;

    core.watch_path().await
}

#[tauri::command]
async fn c_get_files_path(app: AppHandle, path: String, search_query: String) -> IPCGetFilesPath {
    let state = app.state::<Mutex<CoreStateManager>>();
    let core = state.lock().await;

    get_files_by_path(&core, path, search_query).await
}

#[tauri::command]
async fn c_get_all_tags(app: AppHandle) -> IPCGetAllTags {
    let state = app.state::<Mutex<CoreStateManager>>();
    let core = state.lock().await;
    get_all_tags(&core)
        .await
        .map_err(|e| ErrorFromRust::new("Error when getting all tags").raw(e))
}

#[tauri::command]
async fn c_get_all_folders(app: AppHandle) -> IPCGetAllFolders {
    let state = app.state::<Mutex<CoreStateManager>>();
    let core = state.lock().await;
    get_all_folders(&core).await
}

#[tauri::command]
async fn c_get_all_folders_by_schema(
    app: AppHandle,
    schema_path: String,
) -> IPCGetAllFoldersBySchema {
    let state = app.state::<Mutex<CoreStateManager>>();
    let core = state.lock().await;

    get_all_folders_by_schema(&core, schema_path).await
}

#[tauri::command]
async fn c_read_file_by_path(app: AppHandle, path: String) -> IPCReadFileByPath {
    let state = app.state::<Mutex<CoreStateManager>>();
    let core = state.lock().await;

    read_file_by_path(&core, &path, FileReadMode::FullFile).await
}

// This one returns only schemas with items
#[tauri::command]
async fn c_get_schemas(app: AppHandle) -> IPCGetSchemas {
    let state = app.state::<Mutex<CoreStateManager>>();
    let core = state.lock().await;

    let cache = core.schemas_cache.lock().await;
    let schemas = cache.get_all_schemas_cached().await;

    Ok(schemas)
}

#[tauri::command]
async fn c_load_schema(app: AppHandle, path: String) -> IPCLoadSchema {
    let state = app.state::<Mutex<CoreStateManager>>();
    let core = state.lock().await;

    let mut cache = core.schemas_cache.lock().await;
    cache.cache_schema(PathBuf::from(path)).await
}

#[tauri::command]
async fn c_save_schema(app: AppHandle, path: String, schema: Schema) -> IPCSaveSchema {
    let state = app.state::<Mutex<CoreStateManager>>();
    let core = state.lock().await;

    let mut cache = core.schemas_cache.lock().await;
    cache.save_schema(&PathBuf::from(path), schema).await
}

#[tauri::command]
async fn c_get_default_schemas(_: AppHandle) -> IPCGetDefaultSchemas {
    Ok(get_default_schemas())
}

#[tauri::command]
fn c_save_file(_: AppHandle, book: BookFromDb, forced: bool) -> IPCSaveFile {
    save_file(book, forced)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            c_init_once,
            c_load_schema,
            c_save_schema,
            c_get_default_schemas,
            c_prepare_cache,
            c_watch_path,
            c_get_files_path,
            c_get_all_tags,
            c_get_all_folders,
            c_get_all_folders_by_schema,
            c_read_file_by_path,
            c_save_file,
            c_get_schemas
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            println!("manage");

            let core_state: Mutex<CoreStateManager> = Mutex::new(CoreStateManager::new());

            app.manage(core_state);
            println!("manage 2");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
