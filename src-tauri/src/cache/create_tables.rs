use sqlx::SqliteConnection;

pub async fn create_db_tables(conn: &mut SqliteConnection) -> Result<(), sqlx::Error> {
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
        "CREATE TABLE folders (path TEXT PRIMARY KEY, name TEXT, has_schema BOOLEAN, own_schema BOOLEAN, schema_file_path TEXT);",
    ))
    .execute(&mut *conn)
    .await?;

    Ok(())
}
