use crate::core::core::DatabaseConnectionMutex;

pub async fn create_db_tables(dbm: &DatabaseConnectionMutex) -> Result<(), sqlx::Error> {
    let mut db = dbm.lock().await;
    let conn = db.get_conn().await;

    sqlx::query("DROP TABLE IF EXISTS files;")
        .execute(&mut *conn)
        .await?;

    sqlx::query("DROP TABLE IF EXISTS folders;")
        .execute(&mut *conn)
        .await?;

    sqlx::query(&format!(
        "CREATE TABLE files (path TEXT PRIMARY KEY, modified TEXT, attributes TEXT CHECK(json_valid(attributes)))",
    ))
    .execute(&mut *conn)
    .await?;

    sqlx::query(&format!(
        "CREATE TABLE folders (path TEXT PRIMARY KEY, name TEXT);",
    ))
    .execute(&mut *conn)
    .await?;

    Ok(())
}
