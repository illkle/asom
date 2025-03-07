use std::path::Path;
use walkdir::WalkDir;

use crate::core::core::CoreStateManager;
use crate::files::io::{read_file_by_path, FileReadMode};
use crate::utils::errorhandling::ErrorFromRust;

use super::query::BookFromDb;

// Function to insert a file record into the database
pub async fn insert_file_into_cache_db(
    core: &CoreStateManager,
    file: &BookFromDb,
) -> Result<(), ErrorFromRust> {
    let mut db = core.database_conn.lock().await;
    let conn = db.get_conn().await;

    let path = match file.path.as_ref() {
        Some(p) => p,
        None => return Ok(()),
    };

    let attrs = serde_json::to_string(&file.attrs).map_err(|e| {
        ErrorFromRust::new("Error when serializing file attributes. This should never happen.")
            .raw(e)
    })?;

    sqlx::query(
        "INSERT INTO files (path, modified, attributes) VALUES (?1, ?2, ?3) ON CONFLICT(path) DO UPDATE SET modified=excluded.modified, attributes=excluded.attributes",
    )
    .bind(path.to_string())
    .bind(file.modified.clone())
    .bind(attrs)
    .execute(conn)
    .await
    .map_err(|e| ErrorFromRust::new("Error when inserting file").raw(e))?;

    Ok(())
}

pub async fn cache_file(core: &CoreStateManager, path: &Path) -> Result<BookFromDb, ErrorFromRust> {
    match read_file_by_path(core, &path.to_string_lossy(), FileReadMode::OnlyMeta).await {
        Ok(file) => insert_file_into_cache_db(core, &file.book)
            .await
            .map(|_| file.book),
        Err(e) => Err(e),
    }
}

pub async fn remove_file_from_cache(
    core: &CoreStateManager,
    path: &Path,
) -> Result<(), ErrorFromRust> {
    let mut db = core.database_conn.lock().await;
    let conn = db.get_conn().await;

    sqlx::query(&format!("DELETE FROM files WHERE path=?1",))
        .bind(path.to_string_lossy().to_string())
        .execute(conn)
        .await
        .map_err(|e| ErrorFromRust::new("Error when removing file from cache").raw(e))?;

    Ok(())
}

pub async fn cache_files_folders_schemas<P: AsRef<Path>>(
    core: &CoreStateManager,
    dir: P,
) -> Result<(), ErrorFromRust> {
    let mut err = ErrorFromRust::new("Error when caching files and folders");

    for entry in WalkDir::new(dir.as_ref())
        .into_iter()
        .filter_map(Result::ok)
    {
        if entry.file_type().is_file() {
            if let Some(extension) = entry.path().extension() {
                if extension == "md" {
                    match cache_file(core, &entry.path()).await {
                        Ok(_) => (),
                        Err(e) => {
                            err = err.sub(e.info(&entry.file_name().to_string_lossy()));
                        }
                    }
                }
            }
        }

        if entry.file_type().is_dir() {
            let path = entry.path();

            // Cache schema if if exists. If it doesn't exist, it will error and we don't care.

            {
                let mut schemas_cache = core.schemas_cache.lock().await;
                let _ = schemas_cache.cache_schema(path.into()).await;
            }

            // This will use schema cache, so it must be after caching_schema
            match cache_folder(core, &entry.path()).await {
                Ok(_) => (),
                Err(e) => {
                    err = err.sub(e);
                }
            }
        }
    }

    Ok(())
}

pub async fn cache_folder_deep(
    core: &CoreStateManager,
    input_path: &Path,
) -> Result<(), ErrorFromRust> {
    let dir = match input_path.is_file() {
        true => match input_path.parent() {
            Some(p) => p,
            None => {
                return Err(ErrorFromRust::new("Error when caching folder")
                    .info("Path is file but has no parent"));
            }
        },
        false => input_path,
    };

    let mut err = ErrorFromRust::new("Error when caching files and folders");

    for entry in WalkDir::new(dir).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_dir() {
            let path = entry.path();

            let mut schemas_cache = core.schemas_cache.lock().await;

            // Cache schema if if exists. If it doesn't exist, it will error and we don't care.
            let _ = schemas_cache.cache_schema(path.into()).await;

            // This will use schema cache, so it must be after caching_schema
            match cache_folder(core, &entry.path()).await {
                Ok(_) => (),
                Err(e) => {
                    err = err.sub(e);
                }
            }
        }
    }

    Ok(())
}

pub async fn cache_folder(core: &CoreStateManager, path: &Path) -> Result<(), ErrorFromRust> {
    let mut db = core.database_conn.lock().await;
    let conn = db.get_conn().await;

    let folder_name = match path.file_name() {
        Some(s) => s.to_string_lossy().to_string(),
        // None is root path(technically it's also "some/folder/" but I assume this will never happen)
        None => "/".to_string(),
    };

    let schemas_cache = core.schemas_cache.lock().await;

    let files_schema = schemas_cache
        .get_schema_owner_folder(&path.to_string_lossy().to_string())
        .await;

    let has_schema = match files_schema.as_ref() {
        Some(_) => true,
        None => false,
    };

    let own_schema = match files_schema.as_ref() {
        Some(schema) => *schema == path.to_string_lossy().to_string(),
        None => false,
    };

    let schema_file_path = match files_schema.as_ref() {
        Some(schema) => schema.clone(),
        None => "".to_string(),
    };

    sqlx::query(
       &format!(
            "INSERT INTO folders (path, name, has_schema, own_schema, schema_file_path) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(path) DO UPDATE SET name=excluded.name, has_schema=excluded.has_schema, own_schema=excluded.own_schema, schema_file_path=excluded.schema_file_path"
        )
    )
    .bind(path.to_string_lossy().to_string())
    .bind(folder_name)
    .bind(has_schema)
    .bind(own_schema)
    .bind(schema_file_path)
    .execute(conn)
    .await
    .map_err(|e| {
        ErrorFromRust::new("Error when caching folder").raw(e)
    })?;

    Ok(())
}

pub async fn remove_folder_from_cache(
    core: &CoreStateManager,
    path: &Path,
) -> Result<(), ErrorFromRust> {
    let mut db = core.database_conn.lock().await;
    let conn = db.get_conn().await;

    sqlx::query(&format!(
        "DELETE FROM folders WHERE path LIKE concat(?1, '%')",
    ))
    .bind(path.to_string_lossy().to_string())
    .execute(conn)
    .await
    .map_err(|e| ErrorFromRust::new("Error when removing folder from cache").raw(e))?;

    Ok(())
}

pub async fn remove_files_in_folder_rom_cache(
    core: &CoreStateManager,
    path: &Path,
) -> Result<(), ErrorFromRust> {
    let mut db = core.database_conn.lock().await;
    let conn = db.get_conn().await;

    sqlx::query(&format!(
        "DELETE FROM files WHERE path LIKE concat(?1, '%')",
    ))
    .bind(path.to_string_lossy().to_string())
    .execute(conn)
    .await
    .map_err(|e| ErrorFromRust::new("Error when removing folder from cache").raw(e))?;

    Ok(())
}
