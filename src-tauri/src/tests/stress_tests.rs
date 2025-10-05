use std::{collections::HashMap, path::Path};

use tauri::Manager;

use crate::{
    cache::query::{get_files_abstract, RecordFromDb},
    core::core_state::CoreStateManager,
    files::read_save::save_file,
    tests::test_utils::{
        app_creator, cleanup_test_case, prepare_test_case, wait_for_condition_async,
        DEFAULT_RETRY_COUNT,
    },
};

use super::test_utils::TestCaseName;

#[tokio::test(flavor = "multi_thread")]
#[ignore]
async fn test_quick_file_creation() {
    let app = app_creator().await;
    let core = app.state::<CoreStateManager>();

    let init_result = core.init(&app).await;
    assert!(init_result.is_ok());

    let (test_dir, _) = prepare_test_case(&app, TestCaseName::Basic).await;

    let prepare_cache_result = core.prepare_cache(&app).await;
    assert!(prepare_cache_result.is_ok());

    let watch_path_result = core.watch_path().await;
    assert!(watch_path_result.is_ok());

    {
        let files = get_files_abstract(&core.context, "".to_string()).await;
        assert!(files.is_ok());

        let res = files.unwrap();

        assert!(res.len() == 2, "Initial files count is not correct");
    }

    let sub_folder = test_dir.join("books").join("stress_test");

    let sub_folder_rel = Path::new("books").join("stress_test");
    std::fs::create_dir_all(sub_folder.clone()).unwrap();

    let mut initial_file_count = 2;
    for i in 0..500 {
        let record = RecordFromDb {
            path: Some(
                sub_folder_rel
                    .clone()
                    .join(format!("test_{}.md", i))
                    .to_string_lossy()
                    .to_string(),
            ),
            modified: None,
            markdown: Some("".to_string()),
            attrs: HashMap::new(),
        };

        let save_result = save_file(&core.context, record, true, true).await;

        assert!(
            save_result.is_ok(),
            "Error saving file {:?}",
            save_result.err().unwrap()
        );
        initial_file_count += 1;
    }

    let final_state_check = || async {
        let files = get_files_abstract(&core.context, "".to_string()).await;
        assert!(files.is_ok());

        let res = files.unwrap();

        println!("Final files count: {}", res.len());
        res.len() == initial_file_count
    };

    let res = wait_for_condition_async(final_state_check, DEFAULT_RETRY_COUNT).await;

    assert!(res, "Final files count is not correct, expected");

    cleanup_test_case(test_dir).await;
}
