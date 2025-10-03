use crate::cache::dbconn::DatabaseConnection;

pub async fn create_db_tables(db: &DatabaseConnection) -> Result<(), sqlx::Error> {
    let conn = db.get_conn().await;

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
