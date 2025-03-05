use std::collections::BTreeMap;
use std::path::Path;
use std::{
    collections::HashMap,
    fs::{create_dir_all, read_to_string, write},
    path::PathBuf,
    str,
    sync::Arc,
};

use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use ts_rs::TS;

struct PathHierarchy<T> {
    map: BTreeMap<PathBuf, T>,
}

impl<T: Clone> PathHierarchy<T> {
    fn new() -> Self {
        Self {
            map: BTreeMap::new(),
        }
    }

    fn insert(&mut self, path: PathBuf, value: T) {
        self.map.insert(path, value);
    }

    fn get(&self, path: &Path) -> Option<T> {
        // Check exact match first
        if let Some(value) = self.map.get(path) {
            return Some(value.clone());
        }

        // Walk up the directory hierarchy
        let mut current = path;
        while let Some(parent) = current.parent() {
            if let Some(value) = self.map.get(parent) {
                return Some(value.clone());
            }
            current = parent;
        }

        None
    }

    fn iter(&self) -> impl Iterator<Item = (&PathBuf, &T)> {
        self.map.iter()
    }
}

use crate::utils::errorhandling::ErrorFromRust;

use super::types::{Schema, SCHEMA_VERSION};

type GlobalSchema = Arc<Mutex<PathHierarchy<Schema>>>;

// Static variable to hold our global state
static GLOBAL_STATE: OnceCell<GlobalSchema> = OnceCell::new();

fn get_gs() -> &'static GlobalSchema {
    GLOBAL_STATE.get_or_init(|| Arc::new(Mutex::new(PathHierarchy::new())))
}

pub async fn get_schema_cached_safe(path: &str) -> Result<Schema, ErrorFromRust> {
    let s = get_schema_cached(path).await;
    match s {
        Some(s) => Ok(s),
        None => Err(ErrorFromRust::new("Unable to retrieve schema")
            .info(
                "Unless you changed files manually this should not happen. Try restarting the app",
            )
            .raw(path)),
    }
}

pub async fn get_schema_path(path: &str) -> Option<String> {
    get_schema_cached(path).await.map(|v| v.internal_path)
}

pub async fn get_schema_cached(path: &str) -> Option<Schema> {
    let gs = get_gs().lock().await;

    let res = gs.get(Path::new(path));

    println!("Getting schema for: {}", path);
    println!("Schema found: {:?}", res);

    return match res {
        Some(v) => Some(v.clone()),
        None => None,
    };
}

pub async fn get_all_schemas_cached() -> Vec<Schema> {
    let gs = get_gs().lock().await;

    gs.iter()
        .filter_map(|(_, v)| match v.items.is_empty() {
            true => None,
            false => Some(v.clone()),
        })
        .collect()
}

pub async fn cache_schema(path: PathBuf) -> Result<Schema, ErrorFromRust> {
    let mut schemas = get_gs().lock().await;

    let schema_path = path.join("schema.yaml");

    if !schema_path.exists() {
        return Err(ErrorFromRust::new("Schema file does not exist")
            .info(&schema_path.clone().to_string_lossy()));
    }

    let file_content = read_to_string(schema_path.clone()).map_err(|e| {
        ErrorFromRust::new("Error when reading schema file")
            .info(&schema_path.clone().to_string_lossy())
            .raw(e)
    })?;

    let mut sch: Schema = serde_yml::from_str(&file_content).map_err(|e| {
        ErrorFromRust::new("Error parsing schema")
            .info(&schema_path.clone().to_string_lossy())
            .raw(e)
    })?;

    let folder_name = match path.file_name() {
        Some(v) => v,
        None => {
            return Err(
                ErrorFromRust::new("Unable to get basename from schema path")
                    .info(&format!(
                        "This is super unexpected, maybe you are using symlinks? Please report bug.\n{}",
                        &schema_path.clone().to_string_lossy()
                    )),
            );
        }
    };
    sch.internal_name = folder_name.to_string_lossy().to_string();
    sch.internal_path = path.to_string_lossy().to_string();

    schemas.insert(path, sch.clone());

    Ok(sch)
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SchemaLoadList {
    pub schemas: HashMap<String, Schema>,
    pub error: Option<ErrorFromRust>,
}

pub async fn save_schema(
    folder_path: &PathBuf,
    mut schema: Schema,
) -> Result<Schema, ErrorFromRust> {
    schema.version = SCHEMA_VERSION.to_string();
    let serialized = serde_yml::to_string(&schema)
        .map_err(|e| ErrorFromRust::new("Error serializing schema").raw(e))?;

    create_dir_all(folder_path).map_err(|e| {
        ErrorFromRust::new("Error creating directory")
            .info("Could not create schema folder")
            .raw(e)
    })?;

    let schema_path = folder_path.join("schema.yaml");

    write(schema_path.clone(), serialized).map_err(|e| {
        ErrorFromRust::new("Error writing to disk")
            .info("File was not saved")
            .raw(e)
    })?;

    let mut schemas = get_gs().lock().await;

    schemas.insert(schema_path.clone(), schema.clone());

    Ok(schema)
}
