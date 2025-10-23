use std::{path::Path, time::Duration};

use tauri::Manager;

use crate::{
    cache::query::get_files_by_path,
    core::core_state::CoreStateManager,
    tests::test_utils::{
        app_creator, prepare_test_case, wait_for_condition_async, DEFAULT_RETRY_COUNT,
    },
};

use super::test_utils::TestCaseName;

#[tokio::test(flavor = "multi_thread")]
async fn test_c_get_files_by_path_with_subschema() {
    let app = app_creator().await;
    let core = app.state::<CoreStateManager>();

    let (_, _) = prepare_test_case(&app, TestCaseName::Nested).await;

    let files = get_files_by_path(&core.context, Path::new("books")).await;

    assert!(files.is_ok());

    let files = files.unwrap();
    println!(
        "files: {:?}",
        files
            .records
            .iter()
            .map(|r| r.path.clone().unwrap())
            .collect::<Vec<String>>()
    );

    // TODO: There is a third file but it is assigned to another schema in subfolder
    // assert_eq!(files.records.len(), 2);
}

#[tokio::test(flavor = "multi_thread")]
async fn test_new_schema_file_appears() {
    let app = app_creator().await;
    let core = app.state::<CoreStateManager>();

    let (path, _) = prepare_test_case(&app, TestCaseName::Basic).await;

    let files = get_files_by_path(&core.context, Path::new("books")).await;

    assert!(files.unwrap().records.iter().len() == 2);

    std::fs::create_dir_all(path.clone().join("books_copy").join(".asom")).unwrap();

    std::fs::copy(
        path.clone()
            .join("books")
            .join("How to Take Smart Notes.md"),
        path.clone()
            .join("books_copy")
            .join("How to Take Smart Notes.md"),
    )
    .unwrap();

    std::fs::copy(
        path.clone().join("books").join("How to Read a Book.md"),
        path.clone()
            .join("books_copy")
            .join("How to Read a Book.md"),
    )
    .unwrap();

    tokio::time::sleep(Duration::from_millis(300)).await;

    std::fs::copy(
        path.clone().join("books").join(".asom").join("schema.yaml"),
        path.clone()
            .join("books_copy")
            .join(".asom")
            .join("schema.yaml"),
    )
    .unwrap();

    let state_check = || async {
        let files = get_files_by_path(&core.context, Path::new("books_copy")).await;
        if files.is_err() {
            println!("files error: {:?}", files.err().unwrap());
            return false;
        }

        println!("files: {:?}", files.as_ref().unwrap().records.iter().len());

        files.as_ref().unwrap().records.iter().len() == 2
    };

    let result = wait_for_condition_async(state_check, DEFAULT_RETRY_COUNT).await;
    assert!(
        result,
        "After creating new schema file, relevant files were parsed"
    );
}
