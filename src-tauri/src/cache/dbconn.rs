use std::{
    path::{Path, PathBuf},
    str::FromStr,
};

use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    Pool, Sqlite,
};

#[derive(Debug)]
pub struct DatabaseConnection {
    conn: Option<Pool<Sqlite>>,
}

pub enum InitMode {
    /* I used in-memory originally, but it seems to randomly drop whole db after some time of using the app. Unsure why, so for now InMemory is just for running tests. */
    #[allow(dead_code)]
    InMemory,
    #[allow(dead_code)]
    InFolder(PathBuf),
}

impl DatabaseConnection {
    pub fn new() -> Self {
        Self { conn: None }
    }

    pub async fn init(&mut self, mode: InitMode) -> Result<(), sqlx::Error> {
        match mode {
            InitMode::InMemory => self.init_in_memory().await,
            InitMode::InFolder(folder_path) => self.init_in_folder(&folder_path).await,
        }

        self.create_tables().await
    }

    #[allow(dead_code)]
    pub async fn init_in_memory(&mut self) {
        let conn = SqlitePoolOptions::new()
            .max_connections(20)
            .min_connections(1)
            .connect("sqlite::memory:?cache=shared")
            .await
            .unwrap();
        self.conn = Some(conn);
    }

    #[allow(dead_code)]
    pub async fn init_in_folder(&mut self, folder_path: &Path) {
        let path = folder_path.join("asom_files_folders_cache.db");

        log::info!("database_conn: in folder {}", path.to_string_lossy());

        let conn_options =
            SqliteConnectOptions::from_str(&format!("sqlite:///{}", path.to_string_lossy()))
                .unwrap()
                .create_if_missing(true);

        let conn = SqlitePoolOptions::new()
            .max_connections(20)
            .min_connections(1)
            .connect_with(conn_options)
            .await
            .unwrap();
        self.conn = Some(conn);
    }

    pub async fn get_conn(&self) -> Pool<Sqlite> {
        self.conn.as_ref().unwrap().clone()
    }

    pub async fn create_tables(&self) -> Result<(), sqlx::Error> {
        let conn = self.get_conn().await;

        log::warn!("Creating/recreating tables in cache db");

        sqlx::query("DROP TABLE IF EXISTS files;")
            .execute(&conn)
            .await?;

        sqlx::query("DROP TABLE IF EXISTS folders;")
            .execute(&conn)
            .await?;

        sqlx::query("CREATE TABLE files (path TEXT PRIMARY KEY, modified INTEGER, attributes TEXT CHECK(json_valid(attributes)))")
        .execute(&conn)
        .await?;

        sqlx::query("CREATE TABLE folders (path TEXT PRIMARY KEY, name TEXT);")
            .execute(&conn)
            .await?;
        Ok(())
    }

    pub async fn wipe_db(&self) -> Result<(), sqlx::Error> {
        let conn = self.get_conn().await;
        log::info!("database_conn: wiping db");
        sqlx::query("DELETE FROM files;").execute(&conn).await?;
        sqlx::query("DELETE FROM folders;").execute(&conn).await?;
        Ok(())
    }
}
