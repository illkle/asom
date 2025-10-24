use std::collections::BTreeMap;
use std::path::Path;
use std::sync::Arc;
use std::{
    collections::HashMap,
    ffi::OsStr,
    fs::{create_dir_all, read_to_string, write},
    path::PathBuf,
    str,
};

use log::info;
use serde::{Deserialize, Serialize};
use tokio::sync::{RwLock, RwLockReadGuard};
use ts_rs::TS;

use super::types::{Schema, SCHEMA_VERSION};
use crate::core::core_state::AppContext;
use crate::schema::types::SchemaLocation;
use crate::utils::errorhandling::ErrFR;

#[derive(Debug)]
pub struct SchemasInMemoryCache {
    // Path is the owner folder path. So file is key + schema.yaml
    map: Arc<RwLock<BTreeMap<PathBuf, Schema>>>,
}

#[derive(Debug, Clone, TS, Serialize, Deserialize)]
#[ts(export)]
pub struct SchemaResult {
    pub schema: Schema,
    pub location: SchemaLocation,
}

const INTERNAL_FOLDER_NAME: &str = ".asom";
const SCHEMA_FILE_NAME: &str = "schema.yaml";

/** Takes either schema owner folder path, internal config path(folder/.asom) or schema file path and return both paths */
fn locate_schema_and_folder(path_absolute: &Path) -> Result<(PathBuf, PathBuf), Box<ErrFR>> {
    let is_dir_safe_for_deleted = match path_absolute.exists() {
        true => path_absolute.is_dir(),
        false => path_absolute.extension().is_none(),
    };

    let schema_file_path = match (is_dir_safe_for_deleted, path_absolute.file_name()) {
        (true, Some(name)) if name == OsStr::new(INTERNAL_FOLDER_NAME) => {
            path_absolute.join(SCHEMA_FILE_NAME)
        }
        (false, Some(name)) if name == OsStr::new(SCHEMA_FILE_NAME) => path_absolute.to_path_buf(),
        (true, _) => path_absolute
            .join(INTERNAL_FOLDER_NAME)
            .join(SCHEMA_FILE_NAME),
        (_, None) => {
            return Err(Box::new(ErrFR::new("Unable to get basename from schema path")
                .info(&format!(
                    "This is super unexpected, maybe you are using symlinks? Please report bug.\n{}",
                    &path_absolute.to_string_lossy()
                ))));
        }
        (_, _) => {
            return Err(Box::new(ErrFR::new(
                format!("Schema file must be named {}", SCHEMA_FILE_NAME,).as_str(),
            )));
        }
    };
    let folder_path =
        schema_file_path
            .parent()
            .and_then(|p| p.parent())
            .ok_or_else(|| {
                Box::new(ErrFR::new(
                "Unable to get parent from schema path. This is unexpected, please report bug.",
            )
            .info(&schema_file_path.to_string_lossy()))
            })?;

    Ok((schema_file_path.clone(), folder_path.to_path_buf()))
}

impl SchemasInMemoryCache {
    pub fn new() -> Self {
        Self {
            map: Arc::new(RwLock::new(BTreeMap::new())),
        }
    }

    pub async fn clear_cache(&self) {
        self.map.write().await.clear();
    }

    async fn insert(&self, relative_folder_path: PathBuf, value: Schema) {
        info!("schema_cache: insert to map: {:?}", relative_folder_path);
        self.map.write().await.insert(relative_folder_path, value);
    }

    fn get_schema_internal(
        &self,
        map: &RwLockReadGuard<'_, BTreeMap<PathBuf, Schema>>,
        path_relative: &Path,
    ) -> Option<SchemaResult> {
        if let Some(value) = map.get(path_relative) {
            return Some(SchemaResult {
                location: SchemaLocation {
                    schema_path: path_relative
                        .to_path_buf()
                        .join(INTERNAL_FOLDER_NAME)
                        .join(SCHEMA_FILE_NAME),
                    schema_owner_folder: path_relative.to_path_buf(),
                },
                schema: value.clone(),
            });
        }

        let mut current = path_relative;
        while let Some(parent) = current.parent() {
            if let Some(value) = map.get(parent) {
                return Some(SchemaResult {
                    location: SchemaLocation {
                        schema_path: parent
                            .to_path_buf()
                            .join(INTERNAL_FOLDER_NAME)
                            .join(SCHEMA_FILE_NAME),
                        schema_owner_folder: parent.to_path_buf(),
                    },
                    schema: value.clone(),
                });
            }
            current = parent;
        }

        None
    }

    pub async fn get_schema(&self, path_relative: &Path) -> Option<SchemaResult> {
        let map = self.map.read().await;
        self.get_schema_internal(&map, path_relative)
    }

    pub fn get_schema_by_lock(
        &self,
        map: &RwLockReadGuard<'_, BTreeMap<PathBuf, Schema>>,
        path: &Path,
    ) -> Option<SchemaResult> {
        self.get_schema_internal(map, path)
    }

    pub async fn get_read_lock(&self) -> RwLockReadGuard<'_, BTreeMap<PathBuf, Schema>> {
        self.map.read().await
    }

    async fn iter(&self) -> Vec<(PathBuf, Schema)> {
        self.map
            .read()
            .await
            .iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    }

    pub async fn get_schema_safe(&self, path: &Path) -> Result<SchemaResult, Box<ErrFR>> {
        let s = self.get_schema(path).await;
        match s {
            Some(s) => Ok(s),
            None => Err(Box::new(ErrFR::new("Unable to retrieve schema")
                .info(
                    "Unless you changed files manually this should not happen. Try restarting the app",
                )
                .raw(path.to_string_lossy().to_string()))),
        }
    }

    pub async fn get_schemas_list(&self) -> HashMap<String, Schema> {
        self.iter()
            .await
            .into_iter()
            .filter_map(|(path, v)| match v.items.is_empty() {
                true => None,
                false => Some((path.to_string_lossy().to_string(), v)),
            })
            .collect()
    }

    pub async fn get_schemas_list_with_empty(&self) -> HashMap<String, Schema> {
        self.iter()
            .await
            .into_iter()
            .map(|(path, v)| (path.to_string_lossy().to_string(), v))
            .collect()
    }

    pub async fn cache_schema_absolute_path(
        &self,
        ctx: &AppContext,
        path_absolute: PathBuf,
    ) -> Result<Option<Schema>, Box<ErrFR>> {
        let (schema_file_path, folder_path) = locate_schema_and_folder(&path_absolute)?;

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

        let relative_folder_path = ctx.absolute_path_to_relative(&folder_path).await?;

        self.insert(relative_folder_path, sch.clone()).await;

        Ok(Some(sch))
    }

    pub async fn remove_schema(
        &self,
        ctx: &AppContext,
        path_absolute: PathBuf,
    ) -> Result<(), Box<ErrFR>> {
        let (_, folder_path) = locate_schema_and_folder(&path_absolute)?;

        let relative_folder_path = ctx.absolute_path_to_relative(&folder_path).await?;

        self.map.write().await.remove(&relative_folder_path);
        Ok(())
    }

    pub async fn remove_schemas_with_children(
        &self,
        path_relative: &Path,
    ) -> Result<(), Box<ErrFR>> {
        let paths_to_remove: Vec<PathBuf> = self
            .iter()
            .await
            .into_iter()
            .filter(|(p, _)| p.starts_with(path_relative))
            .map(|(p, _)| p)
            .collect();

        let mut w = self.map.write().await;

        for p in paths_to_remove {
            w.remove(&p);
        }

        Ok(())
    }

    pub async fn save_schema(
        &self,
        ctx: &AppContext,
        relative_path_schema_or_folder: &Path,
        mut schema: Schema,
    ) -> Result<Schema, Box<ErrFR>> {
        schema.version = SCHEMA_VERSION.to_string();

        schema = schema.remove_empty_and_duplicates();

        let serialized = serde_yml::to_string(&schema)
            .map_err(|e| ErrFR::new("Error serializing schema").raw(e))?;

        let absolute_path_schema_or_folder = ctx
            .relative_path_to_absolute(relative_path_schema_or_folder)
            .await?;

        let (absolute_schema_path, absolute_folder_path) =
            locate_schema_and_folder(&absolute_path_schema_or_folder)?;

        let asom_folder_path = absolute_folder_path.join(INTERNAL_FOLDER_NAME);

        if !asom_folder_path.exists() {
            create_dir_all(&asom_folder_path).map_err(|e| {
                ErrFR::new("Error creating directory")
                    .info(&format!(
                        "Could not create schema folder {}",
                        &asom_folder_path.to_string_lossy()
                    ))
                    .raw(e)
            })?;
        }

        write(absolute_schema_path.clone(), serialized).map_err(|e| {
            ErrFR::new("Error writing to disk")
                .info("Schema was not saved")
                .raw(e)
        })?;

        let relative_folder_path = ctx.absolute_path_to_relative(&absolute_folder_path).await?;

        self.insert(relative_folder_path.clone(), schema.clone())
            .await;

        Ok(schema)
    }
}

#[cfg(test)]
mod tests {
    use crate::schema::types::{SchemaAttrType, SchemaItem, TextSettings};

    use super::*;

    #[tokio::test(flavor = "multi_thread")]
    async fn test_double_insert() {
        let cache = SchemasInMemoryCache::new();
        let schema1 = Schema {
            fill_api_search_from: None,
            fill_from_filename: None,
            name: "test".to_string(),
            items: vec![SchemaItem {
                name: "test".to_string(),
                value: SchemaAttrType::Text(TextSettings::default()),
            }],
            version: "1.0.0".to_string(),
        };
        cache.insert(PathBuf::from("test"), schema1).await;
        let schema2 = Schema {
            fill_api_search_from: None,
            fill_from_filename: None,
            name: "test222".to_string(),
            items: vec![SchemaItem {
                name: "test".to_string(),
                value: SchemaAttrType::Text(TextSettings::default()),
            }],
            version: "1.0.0".to_string(),
        };
        cache.insert(PathBuf::from("test"), schema2).await;

        let schemas = cache.get_schemas_list().await;
        assert_eq!(schemas.len(), 1);
        let s1 = schemas.get("test").unwrap();
        assert_eq!(s1.name, "test222");
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn test_locate_schema_and_folder() {
        let mock_path = PathBuf::from("test");
        let mock_path_with_internal_folder = mock_path.join(".asom");
        let mock_path_with_schema_file = mock_path_with_internal_folder.join("schema.yaml");

        let (f_1, p_1) = locate_schema_and_folder(&mock_path).unwrap();
        let (f_2, p_2) = locate_schema_and_folder(&mock_path_with_internal_folder).unwrap();
        let (f_3, p_3) = locate_schema_and_folder(&mock_path_with_schema_file).unwrap();
        assert_eq!(f_1, mock_path_with_schema_file);
        assert_eq!(p_1, mock_path);
        assert_eq!(f_2, mock_path_with_schema_file);
        assert_eq!(p_2, mock_path);
        assert_eq!(f_3, mock_path_with_schema_file);
        assert_eq!(p_3, mock_path);
    }
}
