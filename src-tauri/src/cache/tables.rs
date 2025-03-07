use crate::core::core::CoreStateManager;

pub async fn create_db_tables(core: &CoreStateManager) -> Result<(), sqlx::Error> {
    let mut db = core.database_conn.lock().await;
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
        "CREATE TABLE folders (path TEXT PRIMARY KEY, name TEXT, has_schema BOOLEAN, own_schema BOOLEAN, schema_file_path TEXT);",
    ))
    .execute(&mut *conn)
    .await?;

    Ok(())
}
