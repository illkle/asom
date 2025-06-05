use sqlx::SqliteConnection;
use std::collections::HashMap;
use std::path::Path;
use walkdir::WalkDir;

use crate::core::core_state::{DatabaseConnectionMutex, SchemasCacheMutex};
use crate::files::read_save::{read_file_by_path, FileReadMode};
use crate::schema::types::AttrValue;
use crate::utils::errorhandling::ErrFR;

use super::query::RecordFromDb;

fn get_search_index(attrs: &HashMap<String, AttrValue>) -> String {
    let mut search_index = String::new();

    for value in attrs.values() {
        match value {
            AttrValue::String(s) => {
                search_index.push_str(&s.clone().unwrap_or("".to_string()));
            }
            AttrValue::StringVec(s) => {
                for s in s.clone().unwrap_or(vec![]) {
                    search_index.push_str(&s);
                }
            }
            AttrValue::DatePairVec(d) => {
                for d in d.clone().unwrap_or(vec![]) {
                    search_index.push_str(&format!(
                        "{} {}",
                        d.started.map_or("".to_string(), |s| s.to_string()),
                        d.finished.map_or("".to_string(), |f| f.to_string())
                    ));
                }
            }
            AttrValue::Integer(i) => {
                search_index.push_str(&i.unwrap_or(0.0).to_string());
            }
            AttrValue::Float(f) => {
                search_index.push_str(&f.unwrap_or(0.0).to_string());
            }
        }
    }

    search_index = search_index.to_lowercase();

    search_index
}

// Function to insert a file record into the database
pub async fn insert_file_into_cache_db(
    dbm: &DatabaseConnectionMutex,
    file: &RecordFromDb,
) -> Result<(), Box<ErrFR>> {
    let path = match file.path.as_ref() {
        Some(p) => p,
        None => return Ok(()),
    };

    let attrs = serde_json::to_string(&file.attrs).map_err(|e| {
        ErrFR::new("Error when serializing file attributes. This should never happen.").raw(e)
    })?;

    let mut db = dbm.lock().await;
    let conn = db.get_conn().await;

    sqlx::query(
        "INSERT INTO files (path, modified, attributes, search_index) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(path) DO UPDATE SET modified=excluded.modified, attributes=excluded.attributes, search_index=excluded.search_index",
    )
    .bind(path.to_string())
    .bind(file.modified.clone())
    .bind(&attrs)
    .bind(get_search_index(&file.attrs))
    .execute(conn)
    .await
    .map_err(|e| ErrFR::new("Error when inserting file").raw(e))?;

    Ok(())
}

pub async fn cache_file(
    schemas_cache: &SchemasCacheMutex,
    dbm: &DatabaseConnectionMutex,
    path: &Path,
) -> Result<RecordFromDb, Box<ErrFR>> {
    println!("cache_file {:?}", path);
    match read_file_by_path(
        schemas_cache,
        &path.to_string_lossy(),
        FileReadMode::OnlyMeta,
    )
    .await
    {
        Ok(file) => {
            println!("insert_file_into_cache_db {:?}", path);
            insert_file_into_cache_db(dbm, &file.record).await?;
            Ok(file.record)
        }
        Err(e) => Err(e),
    }
}

pub async fn remove_file_from_cache(
    dbm: &DatabaseConnectionMutex,
    path: &Path,
) -> Result<(), Box<ErrFR>> {
    let mut db = dbm.lock().await;
    let conn = db.get_conn().await;

    sqlx::query("DELETE FROM files WHERE path=?1")
        .bind(path.to_string_lossy().to_string())
        .execute(conn)
        .await
        .map_err(|e| ErrFR::new("Error when removing file from cache").raw(e))?;

    Ok(())
}

pub async fn cache_files_folders_schemas(
    schemas_cache: &SchemasCacheMutex,
    dbm: &DatabaseConnectionMutex,
    dir: &Path,
) -> Result<(), Box<ErrFR>> {
    let mut err = ErrFR::new("Error when caching files and folders");

    for entry in WalkDir::new(dir).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() {
            if let Some(extension) = entry.path().extension() {
                if extension == "md" {
                    match cache_file(schemas_cache, dbm, entry.path()).await {
                        Ok(_) => (),
                        Err(e) => {
                            err = err.sub(e.info(&entry.file_name().to_string_lossy()));
                        }
                    }
                }
            }
        }

        if entry.file_type().is_dir() {
            // We have to cache schema, because it's required to properly cache files
            // (when walking through dir it goes folder > content inside)
            {
                let mut schemas_cache = schemas_cache.lock().await;
                let _ = schemas_cache.cache_schema(entry.path().into()).await;
            }
            match cache_folder(dbm, entry.path()).await {
                Ok(_) => (),
                Err(e) => {
                    err = err.sub(*e);
                }
            }
        }
    }

    Ok(())
}

pub async fn cache_folder(dbm: &DatabaseConnectionMutex, path: &Path) -> Result<(), Box<ErrFR>> {
    let folder_name = match path.file_name() {
        Some(s) => s.to_string_lossy().to_string(),
        // None is root path(technically it's also "some/folder/" but I assume this will never happen)
        None => "/".to_string(),
    };

    if folder_name.starts_with('.') {
        return Ok(());
    }

    let mut db = dbm.lock().await;
    let conn = db.get_conn().await;

    sqlx::query("INSERT INTO folders (path, name) VALUES (?1, ?2) ON CONFLICT(path) DO UPDATE SET name=excluded.name")
    .bind(path.to_string_lossy().to_string())
    .bind(folder_name)
    .execute(conn)
    .await
    .map_err(|e| {
        Box::new(ErrFR::new("Error when caching folder").raw(e))
    })?;

    Ok(())
}

pub async fn remove_folder_from_cache(
    conn: &mut SqliteConnection,
    path: &Path,
) -> Result<(), Box<ErrFR>> {
    sqlx::query("DELETE FROM folders WHERE path LIKE concat(?1, '%')")
        .bind(path.to_string_lossy().to_string())
        .execute(conn)
        .await
        .map_err(|e| ErrFR::new("Error when removing folder from cache").raw(e))?;

    Ok(())
}

pub async fn remove_files_in_folder_rom_cache(
    conn: &mut SqliteConnection,
    path: &Path,
) -> Result<(), Box<ErrFR>> {
    sqlx::query("DELETE FROM files WHERE path LIKE concat(?1, '%')")
        .bind(path.to_string_lossy().to_string())
        .execute(conn)
        .await
        .map_err(|e| ErrFR::new("Error when removing folder from cache").raw(e))?;

    Ok(())
}
