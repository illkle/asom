use ts_rs::TS;

use crate::schema::{
    operations::get_all_schemas_cached,
    types::{Schema, SchemaAttrType},
};

use super::dbconn::get_db_conn;

pub async fn create_db_tables_for_all_schemas() -> Result<(), sqlx::Error> {
    let schemas = get_all_schemas_cached().await;

    for schema in schemas {
        create_db_tables_for_schema(schema).await?;
    }

    Ok(())
}

pub async fn create_db_tables() -> Result<(), sqlx::Error> {
    let mut db = get_db_conn().lock().await;

    sqlx::query("DROP TABLE IF EXISTS files;")
        .execute(&mut *db)
        .await?;

    sqlx::query("DROP TABLE IF EXISTS folders;")
        .execute(&mut *db)
        .await?;

    sqlx::query(&format!(
        "CREATE TABLE files (path TEXT PRIMARY KEY, modified TEXT, attributes TEXT CHECK(json_valid(metadata)))",
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

pub async fn create_db_tables_for_schema(schema: Schema) -> Result<(), sqlx::Error> {
    if schema.items.is_empty() {
        return Ok(());
    }

    let mut db = get_db_conn().lock().await;

    let TableNames {
        table_prefix,
        files_table,
        folders_table,
    } = get_table_names(schema.internal_name.clone());

    sqlx::query(&format!("DROP TABLE IF EXISTS {};", folders_table))
        .execute(&mut *db)
        .await?;

    sqlx::query(&format!(
        "CREATE TABLE {} (path TEXT PRIMARY KEY, name TEXT);",
        folders_table
    ))
    .execute(&mut *db)
    .await?;

    let mut columns: Vec<String> = Vec::new();

    let mut side_tables: Vec<String> = Vec::new();
    let mut side_tables_names: Vec<String> = Vec::new();

    for schema_i in schema.items {
        let columm_name = schema_i.name.clone();
        let table_name = format!("{}{}", table_prefix, columm_name);
        match schema_i.value {
            SchemaAttrType::Text(_) | SchemaAttrType::Date(_) | SchemaAttrType::Image(_) => {
                columns.push(format!("{} TEXT", columm_name));
            }
            SchemaAttrType::Number(_) => {
                columns.push(format!("{} REAL", columm_name));
            }
            SchemaAttrType::TextCollection(_) | SchemaAttrType::DateCollection(_) => {
                side_tables.push(format!(
                    "CREATE TABLE {} 
                    (id INTEGER PRIMARY KEY, ind INTEGER, path TEXT, value TEXT, 
                    UNIQUE(ind,path) FOREIGN KEY (path) 
                    REFERENCES {} (path) ON DELETE CASCADE);",
                    table_name, files_table
                ));
                side_tables_names.push(table_name);
            }
            SchemaAttrType::DatesPairCollection(_) => {
                side_tables.push(format!(
                    "CREATE TABLE {} 
                    (id INTEGER PRIMARY KEY, ind INTEGER, path TEXT, started TEXT, finished TEXT,
                    UNIQUE(ind,path) FOREIGN KEY (path) 
                    REFERENCES {} (path) ON DELETE CASCADE);",
                    table_name, files_table
                ));
                side_tables_names.push(table_name);
            }
        }
    }

    for tbl in side_tables_names {
        sqlx::query(&format!("DROP TABLE IF EXISTS {}", tbl))
            .execute(&mut *db)
            .await?;
    }

    sqlx::query(&format!("DROP TABLE IF EXISTS {}", files_table))
        .execute(&mut *db)
        .await?;

    sqlx::query(&format!(
        "CREATE TABLE {} (path TEXT PRIMARY KEY, modified TEXT, {})",
        files_table,
        columns.join(", ")
    ))
    .execute(&mut *db)
    .await?;

    for q in side_tables {
        sqlx::query(&q).execute(&mut *db).await?;
    }

    Ok(())
}

#[derive(TS)]
#[ts(export)]
pub struct TableNames {
    pub table_prefix: String,
    pub files_table: String,
    pub folders_table: String,
}

pub fn get_table_names(schema_internal_name: String) -> TableNames {
    let table_prefix = format!("{}_", schema_internal_name);
    return TableNames {
        table_prefix: table_prefix.clone(),
        files_table: format!("{}{}", table_prefix.clone(), "files"),
        folders_table: format!("{}{}", table_prefix.clone(), "folders"),
    };
}
