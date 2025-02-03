use std::sync::Mutex;

use once_cell::sync::OnceCell;

use serde_json::Value;
use tauri::{AppHandle, Wry};
use tauri_plugin_store::{Store, StoreExt};

use super::errorhandling::{ErrorActionCode, ErrorFromRust};

pub const ROOT_PATH_KEY: &str = "ROOT_PATH";

pub static A: OnceCell<Mutex<AppHandle>> = OnceCell::new();

pub fn get_global_app() -> &'static Mutex<AppHandle> {
    A.get().expect("Global app not initialized")
}

pub fn init_global_app(app: AppHandle) {
    if A.get().is_some() {
        return;
    }

    A.set(Mutex::new(app))
        .expect("Global app already initialized");
}

pub fn get_root_path() -> Result<String, ErrorFromRust> {
    let val = get_global_app()
        .lock()
        .unwrap()
        .store("appData.bin")
        .unwrap()
        .get(ROOT_PATH_KEY);

    return match val {
        Some(Value::String(s)) => Ok(s),
        _ => {
            Err(ErrorFromRust::new("Root path is not set")
                .action_c(ErrorActionCode::NoRootPath, ""))
        }
    };
}
