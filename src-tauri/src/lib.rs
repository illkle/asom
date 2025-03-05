mod cache;
mod emitter;
mod files;
mod schema;
mod utils;
mod watcher;

use std::{path::PathBuf, time::Duration};

use cache::{
    dbconn::db_setup,
    query::{
        get_all_folders, get_all_tags, get_files_by_path, BookFromDb, BookListGetResult,
        FolderListGetResult,
    },
    tables::create_db_tables,
    write::cache_files_folders_schemas,
};
use files::io::{read_file_by_path, save_file, BookReadResult, BookSaveResult, FileReadMode};
use schema::{
    defaults::get_default_schemas,
    operations::{cache_schema, get_all_schemas_cached, save_schema, SchemaLoadList},
};
use schema::{defaults::DefaultSchema, types::Schema};
use tauri::AppHandle;
use tokio::task;
use ts_rs::TS;
use utils::{
    errorhandling::{send_err_to_frontend, ErrorFromRust},
    global_app::{get_root_path, init_global_app},
};
use watcher::{
    events_process::{run_monitor, MonitorConfig},
    watcher_process::{init_watcher, subscribe_to_events, watch_path},
};

/*
  Define types and pack them into IPCResponces, which gets exported to TS types
*/
type IPCInitOnce = Result<bool, ErrorFromRust>;
type IPCPrepareCache = Result<bool, ErrorFromRust>;
type IPCWatchPath = Result<bool, ErrorFromRust>;
type IPCGetFilesPath = Result<BookListGetResult, ErrorFromRust>;
type IPCGetAllTags = Result<Vec<String>, ErrorFromRust>;
type IPCGetAllFolders = Result<FolderListGetResult, ErrorFromRust>;
type IPCReadFileByPath = Result<BookReadResult, ErrorFromRust>;
type IPCLoadSchemas = Result<SchemaLoadList, ErrorFromRust>;
type IPCGetSchemas = Result<Vec<Schema>, ErrorFromRust>;
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
    c_read_file_by_path: IPCReadFileByPath,
    c_load_schemas: IPCLoadSchemas,
    c_get_schemas: IPCGetSchemas,
    c_load_schema: IPCLoadSchema,
    c_save_schema: IPCSaveSchema,
    c_save_file: IPCSaveFile,
    c_get_default_schemas: IPCGetDefaultSchemas,
}

#[tauri::command]
async fn c_init_once(app: AppHandle) -> IPCInitOnce {
    db_setup().await.map_err(|e| {
        ErrorFromRust::new("Error on db setup")
            .info("This is a critical error. Report bug")
            .raw(e)
    })?;

    init_watcher().await.map_err(|e| {
        ErrorFromRust::new("Error on watcher init.")
            .info("This is a critical error. Report bug")
            .raw(e)
    })?;

    task::spawn(async move {
        let event_rx = subscribe_to_events().await;

        run_monitor(
            event_rx,
            MonitorConfig {
                app: app.clone(),
                command_buffer_size: 32,
                log_to_stdout: true,
            },
        )
        .await;

        loop {
            tokio::time::sleep(Duration::from_secs(60 * 60)).await;
        }
    });

    Ok(true)
}

#[tauri::command]
async fn c_prepare_cache(app: AppHandle) -> IPCPrepareCache {
    let rp = get_root_path()?;

    create_db_tables().await.map_err(|e| {
        ErrorFromRust::new("Error when creating tables in cache db")
            .info("This should not happen. Try restarting the app, else report as bug.")
            .raw(e)
    })?;

    match cache_files_folders_schemas(&rp).await {
        Err(e) => {
            // We don't return error here because user can have a few problematic files, which is ok
            send_err_to_frontend(&app, &e);
        }
        Ok(_) => (),
    }

    return Ok(true);
}

#[tauri::command]
async fn c_watch_path(_: AppHandle) -> IPCWatchPath {
    let rp = get_root_path()?;
    watch_path(&rp)
        .await
        .map_err(|e| {
            ErrorFromRust::new("Error starting watcher")
                .info("Try restarting app")
                .raw(e)
        })
        .map(|_| true)
}

#[tauri::command]
async fn c_get_files_path(_: AppHandle, path: String, search_query: String) -> IPCGetFilesPath {
    println!("c_get_files_path: q {}", search_query);
    get_files_by_path(path, search_query).await
}

#[tauri::command]
async fn c_get_all_tags(_: AppHandle) -> IPCGetAllTags {
    get_all_tags()
        .await
        .map_err(|e| ErrorFromRust::new("Error when getting all tags").raw(e))
}

#[tauri::command]
async fn c_get_all_folders(_: AppHandle) -> IPCGetAllFolders {
    get_all_folders().await
}

#[tauri::command]
async fn c_read_file_by_path(_: AppHandle, path: String) -> IPCReadFileByPath {
    read_file_by_path(&path, FileReadMode::FullFile).await
}

// This one returns only schemas with items
#[tauri::command]
async fn c_get_schemas(_: AppHandle) -> IPCGetSchemas {
    Ok(get_all_schemas_cached().await)
}

#[tauri::command]
async fn c_load_schema(_: AppHandle, path: String) -> IPCLoadSchema {
    cache_schema(PathBuf::from(path)).await
}

#[tauri::command]
async fn c_save_schema(_: AppHandle, folder_name: String, schema: Schema) -> IPCSaveSchema {
    let path = PathBuf::from(get_root_path()?).join(folder_name);
    save_schema(&path, schema).await
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
                init_global_app(app.handle().clone());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
