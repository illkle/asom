mod cache;
mod core;
mod emitter;
mod files;
mod schema;
#[cfg(test)]
mod tests;
mod utils;
mod watcher;

use core::core::CoreStateManager;
use std::{collections::HashMap, path::PathBuf};

use cache::query::{
    get_all_folders, get_all_folders_by_schema, get_all_tags, get_files_by_path,
    FolderListGetResult, RecordFromDb, RecordListGetResult,
};
use files::read_save::{
    read_file_by_path, save_file, FileReadMode, RecordReadResult, RecordSaveResult,
};
use schema::defaults::get_default_schemas;
use schema::{defaults::DefaultSchema, types::Schema};
use tauri::test::{mock_builder, MockRuntime};
use tauri::{AppHandle, Manager};
use ts_rs::TS;
use utils::errorhandling::ErrFR;

/*
  Define types and pack them into IPCResponces, which gets exported to TS types
*/
type IPCInitOnce = Result<bool, ErrFR>;
type IPCPrepareCache = Result<bool, ErrFR>;
type IPCWatchPath = Result<bool, ErrFR>;
type IPCGetFilesPath = Result<RecordListGetResult, ErrFR>;
type IPCGetAllTags = Result<Vec<String>, ErrFR>;
type IPCGetAllFolders = Result<FolderListGetResult, ErrFR>;
type IPCGetAllFoldersBySchema = Result<FolderListGetResult, ErrFR>;
type IPCReadFileByPath = Result<RecordReadResult, ErrFR>;
type IPCGetSchemas = Result<HashMap<String, Schema>, ErrFR>;
type IPCLoadSchema = Result<Schema, ErrFR>;
type IPCSaveSchema = Result<Schema, ErrFR>;
type IPCSaveFile = Result<RecordSaveResult, ErrFR>;
type IPCGetDefaultSchemas = Result<Vec<DefaultSchema>, ErrFR>;

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
async fn c_init_once<T: tauri::Runtime>(app: AppHandle<T>) -> IPCInitOnce {
    let core = app.state::<CoreStateManager>();
    core.load_root_path_from_store(&app).await;
    core.init(&app).await
}

#[tauri::command]
async fn c_prepare_cache<T: tauri::Runtime>(app: AppHandle<T>) -> IPCPrepareCache {
    let core = app.state::<CoreStateManager>();
    core.prepare_cache(&app).await
}

#[tauri::command]
async fn c_watch_path<T: tauri::Runtime>(app: AppHandle<T>) -> IPCWatchPath {
    let core = app.state::<CoreStateManager>();
    core.watch_path().await
}

#[tauri::command]
async fn c_get_files_path<T: tauri::Runtime>(
    app: AppHandle<T>,
    path: String,
    search_query: String,
) -> IPCGetFilesPath {
    let core = app.state::<CoreStateManager>();
    let mut db = core.database_conn.lock().await;
    let conn = db.get_conn().await;
    let mut schemas_cache = core.schemas_cache.lock().await;
    get_files_by_path(conn, &mut schemas_cache, path, search_query).await
}

#[tauri::command]
async fn c_get_all_tags<T: tauri::Runtime>(app: AppHandle<T>) -> IPCGetAllTags {
    let core = app.state::<CoreStateManager>();
    let mut db = core.database_conn.lock().await;
    let conn = db.get_conn().await;
    get_all_tags(conn)
        .await
        .map_err(|e| ErrFR::new("Error when getting all tags").raw(e))
}

#[tauri::command]
async fn c_get_all_folders<T: tauri::Runtime>(app: AppHandle<T>) -> IPCGetAllFolders {
    let core = app.state::<CoreStateManager>();
    get_all_folders(&core.database_conn, &core.schemas_cache).await
}

#[tauri::command]
async fn c_get_all_folders_by_schema<T: tauri::Runtime>(
    app: AppHandle<T>,
    schema_path: String,
) -> IPCGetAllFoldersBySchema {
    let core = app.state::<CoreStateManager>();
    get_all_folders_by_schema(&core.database_conn, &core.schemas_cache, schema_path).await
}

#[tauri::command]
async fn c_read_file_by_path<T: tauri::Runtime>(
    app: AppHandle<T>,
    path: String,
) -> IPCReadFileByPath {
    let core = app.state::<CoreStateManager>();
    read_file_by_path(&core.schemas_cache, &path, FileReadMode::FullFile).await
}

// This one returns only schemas with items
#[tauri::command]
async fn c_get_schemas<T: tauri::Runtime>(app: AppHandle<T>) -> IPCGetSchemas {
    let core = app.state::<CoreStateManager>();
    let cache = core.schemas_cache.lock().await;
    let schemas = cache.get_schemas_list().await;
    Ok(schemas)
}

#[tauri::command]
async fn c_load_schema<T: tauri::Runtime>(app: AppHandle<T>, path: String) -> IPCLoadSchema {
    let core = app.state::<CoreStateManager>();
    let mut cache = core.schemas_cache.lock().await;
    cache.cache_schema(PathBuf::from(path)).await
}

#[tauri::command]
async fn c_save_schema<T: tauri::Runtime>(
    app: AppHandle<T>,
    path: String,
    schema: Schema,
) -> IPCSaveSchema {
    let core = app.state::<CoreStateManager>();
    let mut cache = core.schemas_cache.lock().await;
    cache.save_schema(&PathBuf::from(path), schema).await
}

#[tauri::command]
async fn c_get_default_schemas<T: tauri::Runtime>(_: AppHandle<T>) -> IPCGetDefaultSchemas {
    Ok(get_default_schemas())
}

#[tauri::command]
fn c_save_file<T: tauri::Runtime>(
    _: AppHandle<T>,
    record: RecordFromDb,
    forced: bool,
) -> IPCSaveFile {
    save_file(record, forced)
}

pub fn create_app<T: tauri::Runtime>(builder: tauri::Builder<T>) -> tauri::App<T> {
    builder
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

            app.manage(CoreStateManager::new());
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
}

pub fn run() {
    create_app(tauri::Builder::default()).run(|_, _| {});
}

pub fn create_mock_app() -> tauri::App<MockRuntime> {
    create_app(mock_builder())
}
