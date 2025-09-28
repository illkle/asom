use governor::{
    clock::{QuantaClock, QuantaInstant},
    middleware::NoOpMiddleware,
    state::{InMemoryState, NotKeyed},
    Quota, RateLimiter,
};
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

use tokio::sync::{Mutex, RwLock};

use std::{
    num::NonZeroU32,
    path::Path,
    sync::Arc,
    time::{Duration, SystemTime},
};

pub const ROOT_PATH_KEY: &str = "ROOT_PATH";

#[derive(Debug)]
pub struct CoreStateManager {
    init_done: Mutex<bool>,
    root_path: RwLock<Option<String>>,
    cached_root_path: RwLock<Option<String>>,
    watcher: Mutex<GlobalWatcher>,

    /*
    This is a rate limiter for emitting file\folder events to frontend. Rust has no issue with 1k+ events in but, but IPC is a bottleneck and can completely lock frontend.
    Threfore if we get ratelimited, we just send a single "revalidate everything" event.
     */
    pub emit_rate_limit:
        Arc<RateLimiter<NotKeyed, InMemoryState, QuantaClock, NoOpMiddleware<QuantaInstant>>>,
    pub last_rate_overflow: Mutex<SystemTime>,
    pub schemas_cache: SchemasInMemoryCache,

    pub database_conn: DatabaseConnection,
}

impl CoreStateManager {
    pub fn new() -> Self {
        Self {
            init_done: Mutex::new(false),
            root_path: RwLock::new(None),
            cached_root_path: RwLock::new(None),
            watcher: Mutex::new(GlobalWatcher::new().unwrap()),
            schemas_cache: SchemasInMemoryCache::new(),
            database_conn: DatabaseConnection::new(),
            emit_rate_limit: Arc::new(RateLimiter::direct(Quota::per_second(
                NonZeroU32::new(30).unwrap(),
            ))),
            last_rate_overflow: Mutex::new(SystemTime::now()),
        }
    }

    #[cfg(test)]
    pub async fn test_only_set_root_path(&self, path: String) {
        let mut root_path = self.root_path.write().await;
        *root_path = Some(path);
    }

    pub async fn load_root_path_from_store<T: tauri::Runtime>(
        &self,
        app: &AppHandle<T>,
    ) -> Result<Option<String>, Box<ErrFR>> {
        let store = match app.store("root_path.txt") {
            Ok(store) => store,
            Err(e) => {
                return Err(Box::new(
                    ErrFR::new("Error getting store").raw(e.to_string()),
                ));
            }
        };

        match store.get(ROOT_PATH_KEY) {
            Some(Value::String(path)) => {
                if !Path::new(&path).exists() {
                    return Ok(None);
                }
                let _ = self.root_path.write().await.insert(path.clone());

                Ok(Some(path))
            }
            _ => Ok(None),
        }
    }

    pub async fn root_path_safe(&self) -> Result<String, Box<ErrFR>> {
        self.root_path
            .read()
            .await
            .clone()
            .ok_or(Box::new(ErrFR::new("Root path is not set")))
    }

    pub async fn cached_root_path(&self) -> Option<String> {
        self.cached_root_path
            .read()
            .await
            .as_ref()
            .map(|path| path.clone())
    }

    pub async fn init<T: tauri::Runtime>(&self, app: &AppHandle<T>) -> Result<(), Box<ErrFR>> {
        let mut init_done = self.init_done.lock().await;
        if *init_done {
            return Ok(());
        }

        let app_handle = app.clone();

        let watcher = self.watcher.lock().await;
        let event_rx = watcher.subscribe_to_events().await;

        // TODO: Find a way to actually await run_monitor, because right now it's not started when init returns. This only seem to matter in tests tho.
        tokio::spawn(async move {
            run_monitor(
                event_rx,
                MonitorConfig {
                    app: app_handle,
                    command_buffer_size: 5000,
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

    pub async fn init_cache_on_root<T: tauri::Runtime>(
        &self,
        app: &AppHandle<T>,
    ) -> Result<(), Box<ErrFR>> {
        let rp = self.load_root_path_from_store(app).await?;

        if rp.is_none() {
            return Ok(());
        }

        let mut cur_cached_root_path = self.cached_root_path.write().await;

        if let Some(rp_path) = &rp {
            if let Some(cached_root_path) = &*cur_cached_root_path {
                if cached_root_path == rp_path {
                    return Ok(());
                }
            }
        }

        self.prepare_cache(app).await?;
        self.watch_path().await?;

        *cur_cached_root_path = rp;

        Ok(())
    }

    pub async fn prepare_cache<T: tauri::Runtime>(
        &self,
        app: &AppHandle<T>,
    ) -> Result<(), Box<ErrFR>> {
        let rp = self.root_path_safe().await?;

        self.schemas_cache.clear_cache().await;
        create_db_tables(&self.database_conn).await.map_err(|e| {
            ErrFR::new("Error when creating tables in cache db")
                .info("This should not happen. Try restarting the app, else report as bug.")
                .raw(e)
        })?;

        if let Err(e) =
            cache_files_folders_schemas(&self.schemas_cache, &self.database_conn, Path::new(&rp))
                .await
        {
            // We don't return error here because user can have a few problematic files, which is ok
            send_err_to_frontend(app, &Box::new(e));
        }

        Ok(())
    }

    pub async fn watch_path(&self) -> Result<(), Box<ErrFR>> {
        let rp = self.root_path_safe().await?;

        println!("Watching path: {}", rp);

        let mut watcher = self.watcher.lock().await;
        watcher.watch_path(&rp).await.map_err(|e| {
            Box::new(
                ErrFR::new("Error starting watcher")
                    .info("Try restarting app")
                    .raw(e),
            )
        })
    }
}
