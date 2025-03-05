use std::path::Path;
use walkdir::WalkDir;

use crate::files::io::{read_file_by_path, FileReadMode};
use crate::schema::operations::{cache_schema, get_schema_cached};
use crate::utils::errorhandling::ErrorFromRust;

use super::dbconn::get_db_conn;
use super::query::BookFromDb;

// Function to insert a file record into the database
pub async fn insert_file(file: &BookFromDb) -> Result<(), ErrorFromRust> {
    let mut db = get_db_conn().lock().await;

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
    .execute(&mut *db)
    .await
    .map_err(|e| ErrorFromRust::new("Error when inserting file").raw(e))?;

    Ok(())
}

pub async fn cache_file(path: &Path) -> Result<BookFromDb, ErrorFromRust> {
    match read_file_by_path(&path.to_string_lossy(), FileReadMode::OnlyMeta).await {
        Ok(file) => insert_file(&file.book).await.map(|_| file.book),
        Err(e) => Err(e),
    }
}

pub async fn remove_file_from_cache(path: &Path) -> Result<(), ErrorFromRust> {
    let mut db = get_db_conn().lock().await;

    sqlx::query(&format!("DELETE FROM files WHERE path=?1",))
        .bind(path.to_string_lossy().to_string())
        .execute(&mut *db)
        .await
        .map_err(|e| ErrorFromRust::new("Error when removing file from cache").raw(e))?;

    Ok(())
}

pub async fn cache_files_folders_schemas<P: AsRef<Path>>(dir: P) -> Result<(), ErrorFromRust> {
    let mut err = ErrorFromRust::new("Error when caching files and folders");

    for entry in WalkDir::new(dir.as_ref())
        .into_iter()
        .filter_map(Result::ok)
    {
        // log path
        println!("Caching: {}", entry.path().to_string_lossy());
        if entry.file_type().is_file() {
            if let Some(extension) = entry.path().extension() {
                if extension == "md" {
                    match cache_file(&entry.path()).await {
                        Ok(_) => (),
                        Err(e) => {
                            println!("Error caching file: {}", e.title);
                            err = err.sub(e.info(&entry.file_name().to_string_lossy()));
                        }
                    }
                }
            }
        }

        if entry.file_type().is_dir() {
            let path = entry.path();

            // Cache schema if if exists. If it doesn't exist, it will error and we don't care.
            let _ = cache_schema(path.into()).await;

            // This will use schema cache, so it must be after caching_schema
            match cache_folder(&entry.path()).await {
                Ok(_) => (),
                Err(e) => {
                    println!("Error caching folder: {}", e.title);
                    err = err.sub(e);
                }
            }
        }
    }

    Ok(())
}

pub async fn cache_folder(path: &Path) -> Result<(), ErrorFromRust> {
    println!("Caching folder: {}", path.to_string_lossy());
    let mut db = get_db_conn().lock().await;

    let folder_name = match path.file_name() {
        Some(s) => s.to_string_lossy().to_string(),
        // None is root path(technically it's also "some/folder/" but I assume this will never happen)
        None => "/".to_string(),
    };

    let files_schema = get_schema_cached(&path.to_string_lossy().to_string()).await;

    let has_schema = match files_schema {
        Some(_) => true,
        None => false,
    };

    let own_schema = match files_schema {
        Some(schema) => schema.internal_path == path.to_string_lossy().to_string(),
        None => false,
    };

    sqlx::query(
       &format!(
            "INSERT INTO folders (path, name, has_schema, own_schema) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(path) DO UPDATE SET name=excluded.name, has_schema=excluded.has_schema, own_schema=excluded.own_schema"
        )
    )
    .bind(path.to_string_lossy().to_string())
    .bind(folder_name)
    .bind(has_schema)
    .bind(own_schema)
    .execute(&mut *db)
    .await
    .map_err(|e| {
        println!("Error caching folder: {}", e);
        ErrorFromRust::new("Error when caching folder").raw(e)
    })?;

    println!("Cached folder: {}", path.to_string_lossy());

    Ok(())
}

pub async fn remove_folder_from_cache(path: &Path) -> Result<(), ErrorFromRust> {
    let mut db = get_db_conn().lock().await;

    sqlx::query(&format!(
        "DELETE FROM folders WHERE path LIKE concat(?1, '%')",
    ))
    .bind(path.to_string_lossy().to_string())
    .execute(&mut *db)
    .await
    .map_err(|e| ErrorFromRust::new("Error when removing folder from cache").raw(e))?;

    Ok(())
}

pub async fn remove_files_in_folder_rom_cache(path: &Path) -> Result<(), ErrorFromRust> {
    let mut db = get_db_conn().lock().await;

    sqlx::query(&format!(
        "DELETE FROM files WHERE path LIKE concat(?1, '%')",
    ))
    .bind(path.to_string_lossy().to_string())
    .execute(&mut *db)
    .await
    .map_err(|e| ErrorFromRust::new("Error when removing folder from cache").raw(e))?;

    Ok(())
}
