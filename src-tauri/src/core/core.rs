use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::{
    cache::{
        dbconn::DatabaseConnection, tables::create_db_tables, write::cache_files_folders_schemas,
    },
    schema::operations::SchemasInMemoryCache,
    utils::errorhandling::{send_err_to_frontend, ErrorFromRust},
    watcher::{
        events_process::{run_monitor, MonitorConfig},
        watcher_process::GlobalWatcher,
    },
    IPCInitOnce, IPCPrepareCache, IPCWatchPath,
};

use tokio::sync::Mutex;

use std::time::Duration;

use tokio::task;

pub const ROOT_PATH_KEY: &str = "ROOT_PATH";

#[derive(Debug)]
pub struct CoreStateManager {
    root_path: Option<String>,
    watcher: Mutex<GlobalWatcher>,
    pub schemas_cache: Mutex<SchemasInMemoryCache>,

    pub database_conn: Mutex<DatabaseConnection>,
}

impl CoreStateManager {
    pub fn new() -> Self {
        Self {
            root_path: None,
            watcher: Mutex::new(GlobalWatcher::new().unwrap()),
            schemas_cache: Mutex::new(SchemasInMemoryCache::new()),
            database_conn: Mutex::new(DatabaseConnection::new()),
        }
    }

    pub fn load_root_path_from_store(&mut self, app: &AppHandle) {
        let root_path = app.get_store("appData.bin").unwrap().get(ROOT_PATH_KEY);

        match root_path {
            Some(Value::String(s)) => self.root_path = Some(s),
            _ => (),
        };
    }

    pub fn root_path_safe(&self) -> Result<String, ErrorFromRust> {
        self.root_path
            .clone()
            .ok_or(ErrorFromRust::new("Root path is not set"))
    }

    pub async fn init(&mut self, app: &AppHandle) -> IPCInitOnce {
        self.load_root_path_from_store(app);

        let app_handle = app.clone();

        let watcher = self.watcher.lock().await;
        let event_rx = watcher.subscribe_to_events().await;

        task::spawn(async move {
            run_monitor(
                event_rx,
                MonitorConfig {
                    app: app_handle,
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

    pub async fn prepare_cache(&mut self, app: &AppHandle) -> IPCPrepareCache {
        println!("prepare_cache");

        let rp = self.root_path_safe()?;

        println!("prepare_cache 2");

        create_db_tables(self).await.map_err(|e| {
            ErrorFromRust::new("Error when creating tables in cache db")
                .info("This should not happen. Try restarting the app, else report as bug.")
                .raw(e)
        })?;

        println!("prepare_cache 3");

        match cache_files_folders_schemas(&self, &rp).await {
            Err(e) => {
                // We don't return error here because user can have a few problematic files, which is ok
                send_err_to_frontend(&app, &e);
            }
            Ok(_) => (),
        }

        println!("prepare_cache 4");

        return Ok(true);
    }

    pub async fn watch_path(&self) -> IPCWatchPath {
        let rp = self.root_path_safe()?;

        let mut watcher = self.watcher.lock().await;
        watcher
            .watch_path(&rp)
            .await
            .map_err(|e| {
                ErrorFromRust::new("Error starting watcher")
                    .info("Try restarting app")
                    .raw(e)
            })
            .map(|_| true)
    }
}
