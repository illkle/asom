use std::{env, path::Path};

use once_cell::sync::Lazy;
use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;
use tokio::sync::RwLock;

use crate::utils::errorhandling::ErrFR;

pub static ROOT_IN_MEMORY: Lazy<RwLock<Option<String>>> = Lazy::new(|| RwLock::new(None));
pub const ROOT_PATH_KEY: &str = "ROOT_PATH";

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

    println!("Getting root path from storage");

    let store = match app.store("root_path.txt") {
        Ok(store) => store,
        Err(e) => {
            return Err(Box::new(
                ErrFR::new("Error getting store").raw(e.to_string()),
            ));
        }
    };

    println!("RECEIVED STORE");

    match store.get(ROOT_PATH_KEY) {
        Some(Value::String(path)) => {
            if !Path::new(&path).exists() {
                println!("PATH DOES NOT EXIST");
                return Ok(None);
            }

            println!("RECEIVED PATH");

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

    let store = match app.store("root_path.txt") {
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
