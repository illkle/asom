use super::dbconn::get_db_conn;

pub async fn create_db_tables() -> Result<(), sqlx::Error> {
    let mut db = get_db_conn().lock().await;

    sqlx::query("DROP TABLE IF EXISTS files;")
        .execute(&mut *db)
        .await?;

    sqlx::query("DROP TABLE IF EXISTS folders;")
        .execute(&mut *db)
        .await?;

    sqlx::query(&format!(
        "CREATE TABLE files (path TEXT PRIMARY KEY, modified TEXT, attributes TEXT CHECK(json_valid(attributes)))",
    ))
    .execute(&mut *db)
    .await?;

    sqlx::query(&format!(
        "CREATE TABLE folders (path TEXT PRIMARY KEY, name TEXT, has_schema BOOLEAN, own_schema BOOLEAN, schema_file_path TEXT);",
    ))
    .execute(&mut *db)
    .await?;

    Ok(())
}
