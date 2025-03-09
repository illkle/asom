use std::collections::BTreeMap;
use std::path::Path;
use std::{
    collections::HashMap,
    fs::{create_dir_all, read_to_string, write},
    path::PathBuf,
    str,
};

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::types::{Schema, SCHEMA_VERSION};
use crate::utils::errorhandling::ErrorFromRust;

#[derive(Debug)]
pub struct SchemasInMemoryCache {
    map: BTreeMap<PathBuf, Schema>,
}

impl SchemasInMemoryCache {
    pub fn new() -> Self {
        Self {
            map: BTreeMap::new(),
        }
    }

    fn insert(&mut self, path: PathBuf, value: Schema) {
        self.map.insert(path, value);
    }

    fn remove(&mut self, path: PathBuf) {
        self.map.remove(&path);
    }

    fn get_schema(&self, path: &Path) -> Option<Schema> {
        if let Some(value) = self.map.get(path) {
            return Some(value.clone());
        }

        let mut current = path;
        while let Some(parent) = current.parent() {
            if let Some(value) = self.map.get(parent) {
                return Some(value.clone());
            }
            current = parent;
        }

        None
    }

    fn get_schema_owner(&self, path: &Path) -> Option<PathBuf> {
        if let Some(_) = self.map.get(path) {
            return Some(path.to_path_buf());
        }

        let mut current = path;
        while let Some(parent) = current.parent() {
            if let Some(_) = self.map.get(parent) {
                return Some(parent.to_path_buf());
            }
            current = parent;
        }

        None
    }

    fn iter(&self) -> impl Iterator<Item = (&PathBuf, &Schema)> {
        self.map.iter()
    }

    pub async fn get_schema_cached_safe(&self, path: &str) -> Result<Schema, ErrorFromRust> {
        let s = self.get_schema_cached(path).await;
        match s {
            Some(s) => Ok(s),
            None => Err(ErrorFromRust::new("Unable to retrieve schema")
                .info(
                    "Unless you changed files manually this should not happen. Try restarting the app",
                )
                .raw(path)),
        }
    }

    pub async fn get_schema_owner_folder(&self, path: &str) -> Option<String> {
        let res = self.get_schema_owner(Path::new(path));
        match res {
            Some(v) => Some(v.to_string_lossy().to_string()),
            None => None,
        }
    }

    pub async fn get_schema_cached(&self, path: &str) -> Option<Schema> {
        let res = self.get_schema(Path::new(path));
        match res {
            Some(v) => Some(v.clone()),
            None => None,
        }
    }

    pub async fn get_all_schemas_cached(&self) -> HashMap<String, Schema> {
        self.iter()
            .filter_map(|(path, v)| match v.items.is_empty() {
                true => None,
                false => Some((path.to_string_lossy().to_string(), v.clone())),
            })
            .collect()
    }

    pub async fn cache_schema(&mut self, path: PathBuf) -> Result<Schema, ErrorFromRust> {
        let schema_path = match path.is_dir() {
            true => path.join("schema.yaml"),
            false => match path.file_name() {
                Some(v) => {
                    if v == "schema.yaml" {
                        path
                    } else {
                        return Err(ErrorFromRust::new("Schema file must be named schema.yaml"));
                    }
                }
                None => {
                    return Err(ErrorFromRust::new("Unable to get basename from schema path")
                        .info(&format!(
                            "This is super unexpected, maybe you are using symlinks? Please report bug.\n{}",
                            &path.clone().to_string_lossy()
                        )));
                }
            },
        };

        if !schema_path.exists() {
            return Err(ErrorFromRust::new("Schema file does not exist")
                .info(&schema_path.clone().to_string_lossy()));
        }

        let file_content = read_to_string(schema_path.clone()).map_err(|e| {
            ErrorFromRust::new("Error when reading schema file")
                .info(&schema_path.clone().to_string_lossy())
                .raw(e)
        })?;

        let sch: Schema = serde_yml::from_str(&file_content).map_err(|e| {
            ErrorFromRust::new("Error parsing schema")
                .info(&schema_path.clone().to_string_lossy())
                .raw(e)
        })?;

        let folder_path = match schema_path.parent() {
            Some(v) => v,
            None => {
                return Err(ErrorFromRust::new(
                    "Unable to get parent from schema path. This is unexpected, please report bug.",
                )
                .info(&schema_path.clone().to_string_lossy()));
            }
        };

        self.insert(folder_path.into(), sch.clone());

        Ok(sch)
    }

    pub async fn remove_schema(&mut self, path: PathBuf) -> Result<(), ErrorFromRust> {
        self.remove(path);
        Ok(())
    }

    pub async fn save_schema(
        &mut self,
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

        self.insert(schema_path.clone(), schema.clone());

        Ok(schema)
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SchemaLoadList {
    pub schemas: HashMap<String, Schema>,
    pub error: Option<ErrorFromRust>,
}
