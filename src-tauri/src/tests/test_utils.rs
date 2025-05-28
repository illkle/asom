use std::{
    thread::sleep,
    time::{Duration, Instant},
};

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

pub const DEFAULT_RETRY_COUNT: usize = 50;
pub const DEFAULT_RETRY_INTERVAL: Duration = Duration::from_millis(10);
pub const DEFAULT_RETRY_TIMEOUT: Duration = Duration::from_secs(2);

/*
 * This function reruns some check multiple times, useful when waiting for watcher to do it's job
 * WARNING: Calling condition_fn the way this does might not release mutexes automatically, it's better to drop them explicitly at the end
 */
pub async fn wait_for_condition_async<F, Fut>(
    condition_fn: F,
    max_attempts: usize,
    interval: Duration,
    timeout: Duration,
) -> bool
where
    F: Fn() -> Fut,
    Fut: std::future::Future<Output = bool>,
{
    let start = Instant::now();

    for _ in 0..max_attempts {
        if condition_fn().await {
            return true;
        }

        if start.elapsed() >= timeout {
            return false;
        }

        tokio::time::sleep(interval).await;
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

const BASIC_CASE_PATH: &str = "src/tests/cases/";
const WORKING_PATH: &str = "src/tests/tests_working_dir/";

pub async fn prepare_test_case(
    app: &AppHandle<MockRuntime>,
    test_case_name: TestCaseName,
) -> (PathBuf, Uuid) {
    let core = app.state::<CoreStateManager>();

    let current_dir = current_dir().unwrap();

    let test_case_source = Path::new(&current_dir)
        .join(BASIC_CASE_PATH)
        .join(test_case_name.get_path());

    let test_case_uuid = Uuid::new_v4();

    let test_dir = Path::new(&current_dir)
        .join(WORKING_PATH)
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
