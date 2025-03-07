use sqlx::{sqlite::SqliteConnectOptions, Connection, SqliteConnection};

#[derive(Debug)]
pub struct DatabaseConnection {
    conn: Option<SqliteConnection>,
}

impl DatabaseConnection {
    pub fn new() -> Self {
        Self { conn: None }
    }

    pub async fn get_conn(&mut self) -> &mut SqliteConnection {
        match self.conn {
            Some(ref mut conn) => conn,
            None => {
                let options = SqliteConnectOptions::new()
                    .filename("files.db")
                    .create_if_missing(true);

                let conn = SqliteConnection::connect_with(&options).await.unwrap();
                self.conn = Some(conn);

                self.conn.as_mut().unwrap()
            }
        }
    }
}
