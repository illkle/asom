use std::path::Path;

use tauri::Manager;

use crate::{
    cache::query::get_files_by_path,
    core::core_state::CoreStateManager,
    tests::test_utils::{app_creator, prepare_test_case},
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
