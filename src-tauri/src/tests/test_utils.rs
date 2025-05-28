use std::{thread::sleep, time::Duration};

use tauri::{test::MockRuntime, AppHandle, Manager};

use crate::{core::core_state::CoreStateManager, create_mock_app};

use std::{
    env::current_dir,
    path::{Path, PathBuf},
};

use uuid::Uuid;

use fs_extra::dir::{self, CopyOptions};

pub async fn app_creator() -> AppHandle<MockRuntime> {
    let app = create_mock_app();
    app.manage(CoreStateManager::new());
    app.handle().to_owned()
}

pub const DEFAULT_RETRY_COUNT: usize = 10;

/*
 * This function reruns some check multiple times, useful when waiting for watcher to do it's job
 * WARNING: Calling condition_fn the way this does might not release mutexes automatically, it's better to drop them explicitly at the end
 */
pub async fn wait_for_condition_async<F, Fut>(condition_fn: F, max_attempts: usize) -> bool
where
    F: Fn() -> Fut,
    Fut: std::future::Future<Output = bool>,
{
    let mut current_wait = Duration::from_millis(25);

    for _ in 0..max_attempts {
        if condition_fn().await {
            return true;
        }

        tokio::time::sleep(current_wait).await;
        current_wait *= 2;
    }

    false
}

pub enum TestCaseName {
    Basic,
    Schemas,
    Nested,
}

impl TestCaseName {
    pub fn get_path(&self) -> &str {
        match self {
            TestCaseName::Basic => "basic",
            TestCaseName::Schemas => "schemas",
            TestCaseName::Nested => "nested",
        }
    }
}

pub fn get_basic_case_path() -> PathBuf {
    Path::new("").join("src").join("tests").join("cases")
}

pub fn get_working_path() -> PathBuf {
    Path::new("")
        .join("src")
        .join("tests")
        .join("tests_working_dir")
}

pub async fn prepare_test_case(
    app: &AppHandle<MockRuntime>,
    test_case_name: TestCaseName,
) -> (PathBuf, Uuid) {
    let core = app.state::<CoreStateManager>();

    let current_dir = current_dir().unwrap();

    let test_case_source = Path::new(&current_dir)
        .join(get_basic_case_path())
        .join(test_case_name.get_path());

    let test_case_uuid = Uuid::new_v4();

    let test_dir = Path::new(&current_dir)
        .join(get_working_path())
        .join(test_case_uuid.to_string());

    std::fs::create_dir_all(&test_dir).unwrap();

    dir::copy(
        &test_case_source,
        &test_dir,
        &CopyOptions::new().content_only(true),
    )
    .unwrap();

    let init_result = core.init(app).await;
    assert!(init_result.is_ok());

    // Wait init to start monitor process
    sleep(Duration::from_millis(100));

    core.test_only_set_root_path(test_dir.to_string_lossy().to_string())
        .await;

    core.database_conn.lock().await.test_only_init().await;

    let prepare_cache_result = core.prepare_cache(app).await;
    assert!(prepare_cache_result.is_ok());

    let watch_path_result = core.watch_path().await;
    assert!(watch_path_result.is_ok());

    (test_dir, test_case_uuid)
}

pub async fn cleanup_test_case(path: PathBuf) {
    std::fs::remove_dir_all(path.clone()).unwrap();
}
