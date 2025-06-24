use sqlx::{sqlite::SqliteConnectOptions, Connection, SqliteConnection};

#[derive(Debug)]
pub struct DatabaseConnection {
    conn: Option<SqliteConnection>,
}

impl DatabaseConnection {
    pub fn new() -> Self {
        Self { conn: None }
    }

    /* Prod build uses default value set in get_conn, this is explicit init with custom path for tests running in parralel */
    #[cfg(test)]
    pub async fn test_only_init(&mut self) {
        let options = SqliteConnectOptions::new().in_memory(true);

        let conn = SqliteConnection::connect_with(&options).await.unwrap();
        self.conn = Some(conn);
    }

    pub async fn get_conn(&mut self) -> &mut SqliteConnection {
        match self.conn {
            Some(ref mut conn) => conn,
            None => {
                /*
                DEBUG MODE
                    let options = SqliteConnectOptions::new()
                        .filename("files.db")
                        .create_if_missing(true);
                    let conn = SqliteConnection::connect_with(&options).await.unwrap();
                */
                let conn =
                    SqliteConnection::connect_with(&SqliteConnectOptions::new().in_memory(true))
                        .await
                        .unwrap();
                self.conn = Some(conn);

                self.conn.as_mut().unwrap()
            }
        }
    }
}
