use std::collections::BTreeMap;
use std::path::Path;
use std::{
    collections::HashMap,
    fs::{create_dir_all, read_to_string, write},
    path::PathBuf,
    str,
};

use serde::{Deserialize, Serialize};
use sqlx::Row;
use sqlx::SqliteConnection;
use ts_rs::TS;

use super::types::{Schema, SCHEMA_VERSION};
use crate::utils::errorhandling::ErrorFromRust;

#[derive(Debug)]
pub struct SchemasInMemoryCache {
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

    fn insert(&mut self, path: PathBuf, value: Schema) {
        self.map.insert(path, value);
    }

    pub fn get_schema(&self, path: &Path) -> Option<SchemaResult> {
        if let Some(value) = self.map.get(path) {
            return Some(SchemaResult {
                file_path: path.to_path_buf(),
                owner_folder: path.parent().unwrap().to_path_buf(),
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

    pub fn get_schema_safe(&self, path: &Path) -> Result<SchemaResult, ErrorFromRust> {
        let s = self.get_schema(path);
        match s {
            Some(s) => Ok(s),
            None => Err(ErrorFromRust::new("Unable to retrieve schema")
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
        self.map.remove(&path);
        Ok(())
    }

    pub async fn remove_schemas_with_children(
        &mut self,
        path: PathBuf,
    ) -> Result<(), ErrorFromRust> {
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

    pub async fn rebuild_schema_index_in_db(
        &mut self,
        conn: &mut SqliteConnection,
        from_path: &Path,
    ) -> Result<(), ErrorFromRust> {
        let all_folders = sqlx::query("SELECT path FROM folders WHERE path LIKE concat(?1, '%')")
            .bind(from_path.to_string_lossy().to_string())
            .fetch_all(&mut *conn)
            .await
            .map_err(|e| ErrorFromRust::new("Error fetching all folders").raw(e))?;

        for folder in all_folders {
            let folder_path = PathBuf::from(folder.get::<String, _>(0));
            let schema = self.get_schema(&folder_path);

            sqlx::query("UPDATE folders SET schema_file_path = ?, has_schema = ?, own_schema = ? WHERE path = ?")
                .bind(match schema.as_ref() {
                    Some(schema) => schema.file_path.to_string_lossy().to_string(),
                    None => "".to_string(),
                })
                .bind(match schema.as_ref() {
                    Some(_) => true,
                    None => false,
                })
                .bind(match schema.as_ref() {
                    Some(s) => s.owner_folder == folder_path,
                    None => false,
                })
                .execute(&mut *conn)
                .await
                .map_err(|e| ErrorFromRust::new("Error updating db folders for new schema").raw(e))?;
        }

        Ok(())
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SchemaLoadList {
    pub schemas: HashMap<String, Schema>,
    pub error: Option<ErrorFromRust>,
}
