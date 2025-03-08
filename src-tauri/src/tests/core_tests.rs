use std::{env::current_dir, path::Path};

use tauri::{test::MockRuntime, AppHandle, Manager};
use uuid::Uuid;

use fs_extra::dir::{self, CopyOptions};

use crate::{cache::query::get_files_abstact, core::core::CoreStateManager, create_mock_app};

pub async fn app_creator() -> AppHandle<MockRuntime> {
    let app = create_mock_app();
    app.manage(CoreStateManager::new());
    app.handle().to_owned()
}

pub enum TestCaseName {
    Basic,
}

impl TestCaseName {
    pub fn get_path(&self) -> &str {
        match self {
            TestCaseName::Basic => "basic",
        }
    }
}

const BASIC_CASE_PATH: &str = "src/tests/cases/";
const WORKING_PATH: &str = "src/tests/tests_working_dir/";

pub async fn prepare_test_case(app: &AppHandle<MockRuntime>, test_case_name: TestCaseName) {
    let core = app.state::<CoreStateManager>();

    let current_dir = current_dir().unwrap();

    let test_case_source = Path::new(&current_dir)
        .join(BASIC_CASE_PATH)
        .join(test_case_name.get_path());

    let test_case_uuid = Uuid::new_v4();

    let test_dir = Path::new(&current_dir)
        .join(WORKING_PATH)
        .join(test_case_uuid.to_string());

    println!("Test case source: {}", test_case_source.display());
    println!("Test case dir: {}", test_dir.display());

    std::fs::create_dir_all(&test_dir).unwrap();

    dir::copy(
        &test_case_source,
        &test_dir,
        &CopyOptions::new().content_only(true),
    )
    .unwrap();

    core.set_root_path(test_dir.to_string_lossy().to_string())
        .await;
}

#[tokio::test(flavor = "multi_thread")]
async fn test_init_basic() {
    let app = app_creator().await;
    let core = app.state::<CoreStateManager>();

    let init_result = core.init(&app).await;
    assert!(init_result.is_ok());
}

#[tokio::test(flavor = "multi_thread")]
async fn test_init_with_folder() {
    let app = app_creator().await;
    let core = app.state::<CoreStateManager>();

    let init_result = core.init(&app).await;
    assert!(init_result.is_ok());

    prepare_test_case(&app, TestCaseName::Basic).await;

    let prepare_cache_result = core.prepare_cache(&app).await;
    assert!(prepare_cache_result.is_ok());

    let watch_path_result = core.watch_path().await;
    assert!(watch_path_result.is_ok());

    {
        let mut db = core.database_conn.lock().await;
        let conn = db.get_conn().await;

        let files = get_files_abstact(conn, "".to_string()).await;
        assert!(files.is_ok());

        assert!(
            files.unwrap().len() == 2,
            "Initial files count is not correct"
        );
    }
}
