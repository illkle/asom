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
use crate::utils::errorhandling::ErrFR;

#[derive(Debug)]
pub struct SchemasInMemoryCache {
    // Path is the owner folder path. So file is key + schema.yaml
    map: BTreeMap<PathBuf, Schema>,
}

#[derive(Debug)]
pub struct SchemaResult {
    pub file_path: PathBuf,
    pub owner_folder: PathBuf,
    pub schema: Schema,
}

impl SchemasInMemoryCache {
    pub fn new() -> Self {
        Self {
            map: BTreeMap::new(),
        }
    }

    pub fn clear_cache(&mut self) {
        self.map.clear();
    }

    fn insert(&mut self, path: PathBuf, value: Schema) {
        self.map.insert(path, value);
    }

    pub fn get_schema(&self, path: &Path) -> Option<SchemaResult> {
        if let Some(value) = self.map.get(path) {
            return Some(SchemaResult {
                file_path: path.to_path_buf().join("schema.yaml"),
                owner_folder: path.to_path_buf(),
                schema: value.clone(),
            });
        }

        let mut current = path;
        while let Some(parent) = current.parent() {
            if let Some(value) = self.map.get(parent) {
                return Some(SchemaResult {
                    file_path: parent.to_path_buf().join("schema.yaml"),
                    owner_folder: parent.to_path_buf(),
                    schema: value.clone(),
                });
            }
            current = parent;
        }

        None
    }

    fn iter(&self) -> impl Iterator<Item = (&PathBuf, &Schema)> {
        self.map.iter()
    }

    pub fn get_schema_safe(&self, path: &Path) -> Result<SchemaResult, ErrFR> {
        let s = self.get_schema(path);
        match s {
            Some(s) => Ok(s),
            None => Err(ErrFR::new("Unable to retrieve schema")
                .info(
                    "Unless you changed files manually this should not happen. Try restarting the app",
                )
                .raw(path.to_string_lossy().to_string())),
        }
    }

    pub async fn get_schemas_list(&self) -> HashMap<String, Schema> {
        self.iter()
            .filter_map(|(path, v)| match v.items.is_empty() {
                true => None,
                false => Some((path.to_string_lossy().to_string(), v.clone())),
            })
            .collect()
    }

    pub async fn cache_schema(&mut self, path: PathBuf) -> Result<Option<Schema>, ErrFR> {
        let schema_file_path = match path.is_dir() {
            true => path.join("schema.yaml"),
            false => match path.file_name() {
                Some(v) => {
                    if v == "schema.yaml" {
                        path
                    } else {
                        return Err(ErrFR::new("Schema file must be named schema.yaml"));
                    }
                }
                None => {
                    return Err(ErrFR::new("Unable to get basename from schema path")
                        .info(&format!(
                            "This is super unexpected, maybe you are using symlinks? Please report bug.\n{}",
                            &path.clone().to_string_lossy()
                        )));
                }
            },
        };

        if !schema_file_path.exists() {
            return Ok(None);
        }

        let file_content = read_to_string(schema_file_path.clone()).map_err(|e| {
            ErrFR::new("Error when reading schema file")
                .info(&schema_file_path.clone().to_string_lossy())
                .raw(e)
        })?;

        let sch: Schema = serde_yml::from_str(&file_content).map_err(|e| {
            ErrFR::new("Error parsing schema")
                .info(&schema_file_path.clone().to_string_lossy())
                .raw(e)
        })?;

        let folder_path = match schema_file_path.parent() {
            Some(v) => v,
            None => {
                return Err(ErrFR::new(
                    "Unable to get parent from schema path. This is unexpected, please report bug.",
                )
                .info(&schema_file_path.clone().to_string_lossy()));
            }
        };

        self.insert(folder_path.into(), sch.clone());

        Ok(Some(sch))
    }

    pub async fn remove_schema(&mut self, path: PathBuf) -> Result<(), ErrFR> {
        self.map.remove(&path);
        Ok(())
    }

    pub async fn remove_schemas_with_children(&mut self, path: PathBuf) -> Result<(), ErrFR> {
        let paths_to_remove: Vec<PathBuf> = self
            .iter()
            .filter(|(p, _)| p.starts_with(&path))
            .map(|(p, _)| p.clone())
            .collect();

        for p in paths_to_remove {
            self.remove_schema(p).await?;
        }

        Ok(())
    }

    pub async fn save_schema(
        &mut self,
        schema_or_folder_path: &PathBuf,
        mut schema: Schema,
    ) -> Result<Schema, ErrFR> {
        schema.version = SCHEMA_VERSION.to_string();
        let serialized = serde_yml::to_string(&schema)
            .map_err(|e| ErrFR::new("Error serializing schema").raw(e))?;

        let schema_path = match schema_or_folder_path.is_dir() {
            true => schema_or_folder_path.join("schema.yaml"),
            false => schema_or_folder_path.clone(),
        };

        let folder_path = schema_path.parent().unwrap();

        if !folder_path.exists() {
            create_dir_all(folder_path).map_err(|e| {
                ErrFR::new("Error creating directory")
                    .info("Could not create schema folder")
                    .raw(e)
            })?;
        }

        write(schema_path.clone(), serialized).map_err(|e| {
            ErrFR::new("Error writing to disk")
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
    pub error: Option<ErrFR>,
}
