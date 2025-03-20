use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::{
    cache::{
        cache_thing::cache_files_folders_schemas, create_tables::create_db_tables,
        dbconn::DatabaseConnection,
    },
    schema::schema_cache::SchemasInMemoryCache,
    utils::errorhandling::{send_err_to_frontend, ErrFR},
    watcher::{
        global_watcher::GlobalWatcher,
        monitor_process::{run_monitor, MonitorConfig},
    },
};

use tokio::sync::Mutex;

use std::{path::Path, time::Duration};

use tokio::task;

pub const ROOT_PATH_KEY: &str = "ROOT_PATH";

pub type DatabaseConnectionMutex = Mutex<DatabaseConnection>;
pub type SchemasCacheMutex = Mutex<SchemasInMemoryCache>;

#[derive(Debug)]
pub struct CoreStateManager {
    init_done: Mutex<bool>,
    root_path: Mutex<Option<String>>,
    watcher: Mutex<GlobalWatcher>,
    pub schemas_cache: SchemasCacheMutex,

    pub database_conn: DatabaseConnectionMutex,
}

impl CoreStateManager {
    pub fn new() -> Self {
        Self {
            init_done: Mutex::new(false),
            root_path: Mutex::new(None),
            watcher: Mutex::new(GlobalWatcher::new().unwrap()),
            schemas_cache: Mutex::new(SchemasInMemoryCache::new()),
            database_conn: Mutex::new(DatabaseConnection::new()),
        }
    }

    #[cfg(test)]
    pub async fn test_only_set_root_path(&self, path: String) {
        let mut root_path = self.root_path.lock().await;
        *root_path = Some(path);
    }

    pub async fn load_root_path_from_store<T: tauri::Runtime>(
        &self,
        app: &AppHandle<T>,
    ) -> Result<Option<String>, ErrFR> {
        let store = match app.store("appData.bin") {
            Ok(store) => store,
            Err(e) => {
                return Err(ErrFR::new("Error getting store").raw(e.to_string()));
            }
        };

        match store.get(ROOT_PATH_KEY) {
            Some(Value::String(path)) => {
                if !Path::new(&path).exists() {
                    return Ok(None);
                }
                let _ = self.root_path.lock().await.insert(path.clone());

                Ok(Some(path))
            }
            _ => Ok(None),
        }
    }

    pub async fn root_path_safe(&self) -> Result<String, ErrFR> {
        self.root_path
            .lock()
            .await
            .clone()
            .ok_or(ErrFR::new("Root path is not set"))
    }

    pub async fn init<T: tauri::Runtime>(&self, app: &AppHandle<T>) -> Result<(), ErrFR> {
        let mut init_done = self.init_done.lock().await;
        if *init_done {
            return Ok(());
        }

        let app_handle = app.clone();

        let watcher = self.watcher.lock().await;
        let event_rx = watcher.subscribe_to_events().await;

        // TODO: Find a way to actually await run_monitor, because right now it's not started when init returns. This only seem to matter in tests tho.
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

        *init_done = true;

        Ok(())
    }

    pub async fn prepare_cache<T: tauri::Runtime>(&self, app: &AppHandle<T>) -> Result<(), ErrFR> {
        let rp = self.root_path_safe().await?;

        self.schemas_cache.lock().await.clear_cache();
        create_db_tables(&self.database_conn).await.map_err(|e| {
            ErrFR::new("Error when creating tables in cache db")
                .info("This should not happen. Try restarting the app, else report as bug.")
                .raw(e)
        })?;

        match cache_files_folders_schemas(&self.schemas_cache, &self.database_conn, &Path::new(&rp))
            .await
        {
            Err(e) => {
                // We don't return error here because user can have a few problematic files, which is ok
                send_err_to_frontend(&app, &e);
            }
            Ok(_) => (),
        }

        Ok(())
    }

    pub async fn watch_path(&self) -> Result<(), ErrFR> {
        let rp = self.root_path_safe().await?;

        println!("Watching path: {}", rp);

        let mut watcher = self.watcher.lock().await;
        watcher.watch_path(&rp).await.map_err(|e| {
            ErrFR::new("Error starting watcher")
                .info("Try restarting app")
                .raw(e)
        })
    }
}
