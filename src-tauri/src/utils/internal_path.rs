use std::path::PathBuf;

use crate::core::core_state::CoreStateManager;

pub struct AsomPath {
    pub absolute: PathBuf,
    pub relative: PathBuf,
    pub root: PathBuf,

    pub schema_file: PathBuf,
    pub schema_folder: PathBuf,
}

impl AsomPath {
    pub async fn from_absolute(core: &CoreStateManager, absolute: PathBuf) -> Self {
        let root = core.root_path_safe().await.unwrap();

        let schema_file = core
            .schemas_cache
            .get_schema(absolute.as_path())
            .await
            .unwrap();

        let relative = absolute.strip_prefix(&root).unwrap();

        Self {
            absolute: absolute.clone(),
            relative: relative.to_path_buf(),
            root: PathBuf::from(&root),
            schema_file: schema_file.file_path,
            schema_folder: schema_file.owner_folder,
        }
    }
}
