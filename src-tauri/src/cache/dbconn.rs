use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};

#[derive(Debug)]
pub struct DatabaseConnection {
    conn: Option<Pool<Sqlite>>,
}

impl DatabaseConnection {
    pub fn new() -> Self {
        Self { conn: None }
    }

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
    pub async fn init_in_folder(&mut self) {
        let conn = SqlitePoolOptions::new()
            .max_connections(20)
            .min_connections(1)
            .connect("sqlite://files.db")
            .await
            .unwrap();
        self.conn = Some(conn);
    }

    pub async fn get_conn(&self) -> Pool<Sqlite> {
        self.conn.as_ref().unwrap().clone()
    }
}
