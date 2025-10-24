use std::{env, path::Path};

use log::error;
use once_cell::sync::Lazy;
use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;
use tokio::sync::RwLock;

use crate::utils::errorhandling::ErrFR;

pub static ROOT_IN_MEMORY: Lazy<RwLock<Option<String>>> = Lazy::new(|| RwLock::new(None));
pub const ROOT_PATH_KEY: &str = "ROOT_PATH";

#[cfg(debug_assertions)]
pub const ROOT_PATH_FILE_NAME: &str = "root_path_debug.txt";
#[cfg(not(debug_assertions))]
pub const ROOT_PATH_FILE_NAME: &str = "root_path.txt";

pub async fn get_root_path_from_storage<T: tauri::Runtime>(
    app: &AppHandle<T>,
) -> Result<Option<String>, Box<ErrFR>> {
    /* --- For e2e testing only --- */
    let is_e2e = env::var("TAURI_E2E_TESTING");
    if is_e2e.is_ok() {
        let root_in_memory = ROOT_IN_MEMORY.read().await.clone();
        return Ok(root_in_memory);
    }
    /*---------------------------------*/

    let store = match app.store(ROOT_PATH_FILE_NAME) {
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
                error!("root_storage: path does not exist: {:?}", path);
                return Ok(None);
            }

            Ok(Some(path))
        }
        _ => Ok(None),
    }
}

pub async fn set_root_path_to_storage<T: tauri::Runtime>(
    app: &AppHandle<T>,
    path: String,
) -> Result<String, Box<ErrFR>> {
    /* --- For e2e testing only --- */
    let is_e2e = env::var("TAURI_E2E_TESTING");
    if is_e2e.is_ok() {
        let mut root_in_memory = ROOT_IN_MEMORY.write().await;
        *root_in_memory = Some(path.clone());
        return Ok(path.clone());
    }
    /*---------------------------------*/

    let store = match app.store(ROOT_PATH_FILE_NAME) {
        Ok(store) => store,
        Err(e) => {
            return Err(Box::new(
                ErrFR::new("Error getting store").raw(e.to_string()),
            ));
        }
    };

    store.set(ROOT_PATH_KEY, path.clone());
    store
        .save()
        .map_err(|e| Box::new(ErrFR::new("Error saving store").raw(e.to_string())))?;

    Ok(path.clone())
}
