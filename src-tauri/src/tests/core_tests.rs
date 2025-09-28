use pretty_assertions::assert_eq;
use std::{path::PathBuf, thread::sleep, time::Duration};

use tauri::Manager;

use crate::{
    cache::query::{get_all_folders, get_files_abstract, FolderListGetResult, FolderOnDisk},
    core::core_state::CoreStateManager,
    schema::types::AttrValue,
    tests::test_utils::{
        app_creator, cleanup_test_case, prepare_test_case, wait_for_condition_async,
        DEFAULT_RETRY_COUNT,
    },
};

use super::test_utils::TestCaseName;

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
    let (test_dir, _) = prepare_test_case(&app, TestCaseName::Basic).await;

    {
        let files = get_files_abstract(&core.context, "".to_string()).await;
        assert!(files.is_ok());

        assert_eq!(
            files.unwrap().len(),
            2,
            "Initial files count is not correct"
        );
    }

    cleanup_test_case(test_dir).await;
}

#[tokio::test(flavor = "multi_thread")]
async fn test_basic_file_ops() {
    let app = app_creator().await;
    let core = app.state::<CoreStateManager>();

    let init_result = core.init(&app).await;
    assert!(init_result.is_ok());

    let (test_dir, _) = prepare_test_case(&app, TestCaseName::Basic).await;

    let empty_path_buf = PathBuf::from("");

    let prepare_cache_result = core.prepare_cache(&app).await;
    assert!(prepare_cache_result.is_ok());

    let watch_path_result = core.watch_path().await;
    assert!(watch_path_result.is_ok());

    {
        let files = get_files_abstract(&core.context, "".to_string()).await;
        assert!(files.is_ok());

        let res = files.unwrap();

        assert_eq!(res.len(), 2, "Initial files count is not correct");

        assert!(
            res.iter().any(|f| {
                f.attrs["author"] == AttrValue::String(Some("Adler, Mortimer J.".to_string()))
            }),
            "Book 1 is not found"
        );

        assert!(
            res.iter().any(|f| {
                f.attrs["author"] == AttrValue::String(Some("Ahrens, Sönke".to_string()))
            }),
            "Book 2 is not found"
        );
    }

    /*
     * Moving file to other dir outside
     */
    std::fs::rename(
        test_dir.clone().join("books").join("How to Read a Book.md"),
        test_dir.clone().join("How to Read a Book.md"),
    )
    .unwrap();

    let after_delete_check = || async {
        let files = get_files_abstract(&core.context, "".to_string()).await;

        if files.is_err() {
            return false;
        }

        let res = files.unwrap();

        res.len() == 1
            && !res.iter().any(|f| {
                f.attrs["author"] == AttrValue::String(Some("Adler, Mortimer J.".to_string()))
            })
    };

    let result = wait_for_condition_async(after_delete_check, DEFAULT_RETRY_COUNT).await;

    assert!(result, "Deleted file was not removed from cache db");

    /*
     * Moving file back from dir outside
     */
    std::fs::rename(
        test_dir.clone().join("How to Read a Book.md"),
        test_dir.clone().join("books").join("How to Read a Book.md"),
    )
    .unwrap();

    let after_move_back = || async {
        let files = get_files_abstract(&core.context, "".to_string()).await;

        if files.is_err() {
            return false;
        }

        let res = files.unwrap();

        res.len() == 2
            && res.iter().any(|f| {
                f.attrs["author"] == AttrValue::String(Some("Adler, Mortimer J.".to_string()))
            })
    };

    let result = wait_for_condition_async(after_move_back, DEFAULT_RETRY_COUNT).await;

    assert!(result, "File moved back did not appear in cache db");

    /*
     * Renaming file
     */
    std::fs::rename(
        test_dir.clone().join("books").join("How to Read a Book.md"),
        test_dir
            .clone()
            .join("books")
            .join("How to Read a Book (renamed).md"),
    )
    .unwrap();

    let sp = empty_path_buf
        .clone()
        .join("books")
        .join("How to Read a Book (renamed).md")
        .to_string_lossy()
        .to_string();

    let after_rename = || async {
        let files = get_files_abstract(&core.context, "".to_string()).await;

        if files.is_err() {
            return false;
        }

        let res = files.unwrap();

        res.len() == 2 && res.iter().any(|f| f.path == Some(sp.clone()))
    };

    let result = wait_for_condition_async(after_rename, DEFAULT_RETRY_COUNT).await;

    assert!(
        result,
        "File renamed either was not removed or did not change path in cache db"
    );

    /*
     * Updating file content
     */
    std::fs::write(
        test_dir
            .clone()
            .join("books")
            .join("How to Take Smart Notes.md"),
        "---\nauthor: 'Tester Tester'\n---\n\nLOL",
    )
    .unwrap();

    let after_update = || async {
        let files = get_files_abstract(&core.context, "".to_string()).await;

        if files.is_err() {
            return false;
        }

        let res = files.unwrap();

        res.len() == 2
            && res
                .iter()
                .any(|f| f.attrs["author"] == AttrValue::String(Some("Tester Tester".to_string())))
    };

    let result = wait_for_condition_async(after_update, DEFAULT_RETRY_COUNT).await;

    assert!(result, "File content was not updated in cache db");

    /*
     * Creating new file
     */
    std::fs::write(
        test_dir.clone().join("books").join("new_file.md"),
        "---\nauthor: 'KKKKKKKKK'\nyear: 2025\n---\n\nTest pass",
    )
    .unwrap();

    let after_create = || async {
        let files = get_files_abstract(&core.context, "".to_string()).await;

        if files.is_err() {
            return false;
        }

        let res = files.unwrap();

        res.len() == 3
            && res.iter().any(|f| {
                f.attrs["author"] == AttrValue::String(Some("KKKKKKKKK".to_string()))
                    && f.attrs["year"] == AttrValue::Integer(Some(2025.0))
            })
    };

    let result = wait_for_condition_async(after_create, DEFAULT_RETRY_COUNT).await;

    assert!(result, "Created file was not added to cache db");

    cleanup_test_case(test_dir).await;
}

#[tokio::test(flavor = "multi_thread")]
async fn test_basic_folder_ops() {
    let app = app_creator().await;
    let core = app.state::<CoreStateManager>();

    let (test_dir, _) = prepare_test_case(&app, TestCaseName::Schemas).await;

    // Check initial folders state
    {
        let folders_result = get_all_folders(&core.context).await;
        assert!(folders_result.is_ok());

        let folders = folders_result.unwrap();

        // Verify initial folder structure exists
        assert!(
            folders.folders.iter().any(|f| f.name == "books"),
            "books folder not found in initial state"
        );
    }

    /*
     * Creating a new folder
     */
    let new_folder_path = test_dir.clone().join("books").join("articles");
    std::fs::create_dir(&new_folder_path).unwrap();

    let after_create = || async {
        let folders_result = get_all_folders(&core.context).await;
        if folders_result.is_err() {
            return false;
        }

        let folders = folders_result.unwrap();
        folders.folders.iter().any(|f| f.name == "articles")
    };

    let result = wait_for_condition_async(after_create, DEFAULT_RETRY_COUNT).await;

    assert!(result, "Created folder was not added to cache db");

    /*
     * Renaming a folder
     */
    let renamed_folder_path = test_dir.clone().join("books").join("articles_renamed");
    std::fs::rename(&new_folder_path, &renamed_folder_path).unwrap();

    let after_rename = || async {
        let folders_result = get_all_folders(&core.context).await;
        if folders_result.is_err() {
            return false;
        }

        let folders = folders_result.unwrap();
        folders.folders.iter().any(|f| f.name == "articles_renamed")
    };

    let result = wait_for_condition_async(after_rename, DEFAULT_RETRY_COUNT).await;

    assert!(
        result,
        "Renamed folder was not correctly updated in cache db"
    );

    /*
     * Deleting a folder
     */
    std::fs::remove_dir(&renamed_folder_path).unwrap();

    let after_delete = || async {
        let folders_result = get_all_folders(&core.context).await;
        if folders_result.is_err() {
            return false;
        }

        let folders = folders_result.unwrap();
        !folders.folders.iter().any(|f| f.name == "articles_renamed")
    };

    let result = wait_for_condition_async(after_delete, DEFAULT_RETRY_COUNT).await;

    assert!(result, "Deleted folder was not removed from cache db");

    /*
     * Create a nested folder structure
     */
    let nested_folder_path = test_dir
        .clone()
        .join("books")
        .join("papers")
        .join("research");
    std::fs::create_dir_all(&nested_folder_path).unwrap();

    let after_nested_create = || async {
        let folders_result = get_all_folders(&core.context).await;
        if folders_result.is_err() {
            return false;
        }

        let folders = folders_result.unwrap();
        folders.folders.iter().any(|f| f.name == "papers")
            && folders.folders.iter().any(|f| f.name == "research")
    };

    let result = wait_for_condition_async(after_nested_create, DEFAULT_RETRY_COUNT).await;

    assert!(
        result,
        "Nested folder structure was not correctly added to cache db"
    );

    cleanup_test_case(test_dir).await;
}

#[tokio::test(flavor = "multi_thread")]
async fn test_schema_ops() {
    let app = app_creator().await;
    let core = app.state::<CoreStateManager>();

    let (test_dir, _) = prepare_test_case(&app, TestCaseName::Basic).await;
    let empty_path_buf = PathBuf::from("");

    // Check initial schemas state
    {
        let schemas = core.context.schemas_cache.get_schemas_list().await;
        assert!(schemas.len() == 1, "Initial schemas count is not correct");

        println!("schemas: {:?}", schemas);

        assert!(
            schemas.contains_key(
                &empty_path_buf
                    .clone()
                    .join("books")
                    .to_string_lossy()
                    .to_string()
            ),
            "Initial schema for owner was not returned by get_all_schemas_cached",
        );

        assert!(
            core.context
                .schemas_cache
                .get_schema(&empty_path_buf.clone().join("books"))
                .await
                .is_some(),
            "Initial schema for owner folder was not returned by get_schema_cached"
        );

        assert!(
            core.context
                .schemas_cache
                .get_schema(&empty_path_buf.clone().join("books").join("favorites"))
                .await
                .is_some(),
            "Initial schema for sub folder was not returned by get_schema_cached"
        );

        assert!(
            core.context
                .schemas_cache
                .get_schema(
                    &empty_path_buf
                        .clone()
                        .join("books")
                        .join("favorites")
                        .join("How to Read a Book.md")
                )
                .await
                .is_some(),
            "Schema for existing file was not returned by get_schema_cached"
        );

        assert!(
            core.context
                .schemas_cache
                .get_schema(&empty_path_buf.clone().join("lol").join("nonexisting"))
                .await
                .is_none(),
            "Schema for non existing folder was returned by get_schema_cached"
        );
    }

    /*
     * Rename schema.yaml to schema.txt
     */

    std::fs::rename(
        test_dir
            .clone()
            .join("books")
            .join(".asom")
            .join("schema.yaml"),
        test_dir
            .clone()
            .join("books")
            .join(".asom")
            .join("schema.txt"),
    )
    .unwrap();

    let after_rename = || async {
        let schemas = core.context.schemas_cache.get_schemas_list().await;
        schemas.is_empty()
    };

    let result = wait_for_condition_async(after_rename, DEFAULT_RETRY_COUNT).await;

    assert!(result, "Schema was not removed from cache after renaming");

    /*
     * Rename schema.txt back to schema.yaml
     */
    std::fs::rename(
        test_dir
            .clone()
            .join("books")
            .join(".asom")
            .join("schema.txt"),
        test_dir
            .clone()
            .join("books")
            .join(".asom")
            .join("schema.yaml"),
    )
    .unwrap();

    let after_rename_back = || async {
        let schemas = core.context.schemas_cache.get_schemas_list().await;

        let schema_for_favs = core
            .context
            .schemas_cache
            .get_schema(&empty_path_buf.clone().join("books").join("favorites"))
            .await;

        schemas.len() == 1 && schema_for_favs.is_some()
    };

    let result = wait_for_condition_async(after_rename_back, DEFAULT_RETRY_COUNT).await;

    assert!(result, "Schema was not added back to cache after renaming");

    cleanup_test_case(test_dir).await;
}

#[tokio::test(flavor = "multi_thread")]
async fn test_nested_ops() {
    let app = app_creator().await;
    let core = app.state::<CoreStateManager>();

    let (test_dir, _) = prepare_test_case(&app, TestCaseName::Nested).await;
    let empty_path_buf = PathBuf::from("");

    let initial_state_check = || async {
        let schemas = core.context.schemas_cache.get_schemas_list().await;

        let books_schema = schemas.get(
            &empty_path_buf
                .clone()
                .join("books")
                .to_string_lossy()
                .to_string(),
        );

        let movies_schema = core
            .context
            .schemas_cache
            .get_schema(&empty_path_buf.clone().join("movies"))
            .await;

        let schema_for_audiobook = core
            .context
            .schemas_cache
            .get_schema(
                &empty_path_buf
                    .clone()
                    .join("books")
                    .join("audiobooks")
                    .join("Sample Audiobook.md"),
            )
            .await;

        let schema_for_book = core
            .context
            .schemas_cache
            .get_schema(
                &empty_path_buf
                    .clone()
                    .join("books")
                    .join("How to Take Smart Notes.md"),
            )
            .await;

        let files = get_files_abstract(&core.context, "".to_string()).await;

        let folders = get_all_folders(&core.context).await;

        if files.is_err() || folders.is_err() {
            return false;
        }

        let files = files.unwrap();
        let folders = folders.unwrap();

        println!("files: {:?}", files.len());
        println!("folders: {:?}", folders.folders.len());
        println!("schemas: {:?}", schemas.len());

        files.len() == 4
            && folders.folders.len() == 7
            && schemas.len() == 3
            && books_schema.is_some()
            && movies_schema.is_some()
            && schema_for_audiobook.is_some_and(|s| s.schema.name == "audiobooks")
            && schema_for_book.is_some_and(|s| s.schema.name == "books")
    };

    let result = wait_for_condition_async(initial_state_check, DEFAULT_RETRY_COUNT).await;

    assert!(result, "Initial state was parsed incorrectly");

    // rename books folder to books_renamed
    std::fs::rename(
        test_dir.clone().join("books"),
        test_dir.clone().join("books_renamed"),
    )
    .unwrap();

    //rename audiobooks folder to audiobooks_renamed
    std::fs::rename(
        test_dir.clone().join("books_renamed").join("audiobooks"),
        test_dir
            .clone()
            .join("books_renamed")
            .join("audiobooks_renamed"),
    )
    .unwrap();

    let after_rename_schemas = || async {
        let books_schema = core
            .context
            .schemas_cache
            .get_schema(&empty_path_buf.clone().join("books_renamed"))
            .await;

        let audiobooks_schema = core
            .context
            .schemas_cache
            .get_schema(
                &empty_path_buf
                    .clone()
                    .join("books_renamed")
                    .join("audiobooks_renamed"),
            )
            .await;

        let schema_for_audiobook = core
            .context
            .schemas_cache
            .get_schema(
                &empty_path_buf
                    .clone()
                    .join("books_renamed")
                    .join("audiobooks_renamed")
                    .join("Sample Audiobook.md"),
            )
            .await;

        let schema_for_book = core
            .context
            .schemas_cache
            .get_schema(
                &empty_path_buf
                    .clone()
                    .join("books_renamed")
                    .join("How to Read a Book.md"),
            )
            .await;

        books_schema.is_some()
            && audiobooks_schema.is_some()
            && schema_for_book.is_some_and(|s| s.schema.name == "books")
            && schema_for_audiobook.is_some_and(|s| s.schema.name == "audiobooks")
    };

    let result = wait_for_condition_async(after_rename_schemas, DEFAULT_RETRY_COUNT).await;

    assert!(
        result,
        "After renaming content is not showing up under new names"
    );

    let afrer_rename_counts = || async {
        let schemas = core.context.schemas_cache.get_schemas_list().await;

        let files = get_files_abstract(&core.context, "".to_string()).await;

        let folders = get_all_folders(&core.context).await;

        if files.is_err() || folders.is_err() {
            return false;
        }

        let files = files.unwrap();
        let folders = folders.unwrap();

        println!("--------------------------------");
        println!("schemas: {:?}", schemas.len());
        println!("schemas: {:?}", schemas.keys());
        println!("files: {:?}", files.len());
        println!("folders: {:?}", folders.folders.len());
        println!("--------------------------------");

        schemas.len() == 3 && files.len() == 4 && folders.folders.len() == 7
    };

    let result = wait_for_condition_async(afrer_rename_counts, DEFAULT_RETRY_COUNT).await;

    assert!(result, "Items count is not correct after nested renaming");

    cleanup_test_case(test_dir).await;
}

#[tokio::test(flavor = "multi_thread")]
async fn test_folder_schema_status() {
    let app = app_creator().await;
    let core = app.state::<CoreStateManager>();

    let (test_dir, _) = prepare_test_case(&app, TestCaseName::Nested).await;

    let empty_path_buf = PathBuf::from("");
    let folders = get_all_folders(&core.context).await;
    assert!(folders.is_ok());

    let mut folders = folders.unwrap();

    let bks_s = empty_path_buf
        .clone()
        .join("books")
        .join(".asom")
        .join("schema.yaml")
        .to_string_lossy()
        .to_string();
    let abks_s = empty_path_buf
        .clone()
        .join("books")
        .join("audiobooks")
        .join(".asom")
        .join("schema.yaml")
        .to_string_lossy()
        .to_string();
    let mvs_s = empty_path_buf
        .clone()
        .join("movies")
        .join(".asom")
        .join("schema.yaml")
        .to_string_lossy()
        .to_string();

    let mut expected = FolderListGetResult {
        folders: vec![
            FolderOnDisk {
                name: test_dir
                    .clone()
                    .file_name()
                    .unwrap()
                    .to_string_lossy()
                    .to_string(),
                path: empty_path_buf.clone().to_string_lossy().to_string(),
                has_schema: false,
                own_schema: false,
                schema_file_path: "".to_string(),
            },
            FolderOnDisk {
                name: "books".to_string(),
                path: empty_path_buf
                    .clone()
                    .join("books")
                    .to_string_lossy()
                    .to_string(),

                has_schema: true,
                own_schema: true,
                schema_file_path: bks_s.clone(),
            },
            FolderOnDisk {
                name: "favorites".to_string(),
                path: empty_path_buf
                    .clone()
                    .join("books")
                    .join("favorites")
                    .to_string_lossy()
                    .to_string(),

                has_schema: true,
                own_schema: false,
                schema_file_path: bks_s,
            },
            FolderOnDisk {
                name: "audiobooks".to_string(),
                path: empty_path_buf
                    .clone()
                    .join("books")
                    .join("audiobooks")
                    .to_string_lossy()
                    .to_string(),
                has_schema: true,
                own_schema: true,
                schema_file_path: abks_s,
            },
            FolderOnDisk {
                name: "movies".to_string(),
                path: empty_path_buf
                    .clone()
                    .join("movies")
                    .to_string_lossy()
                    .to_string(),
                has_schema: true,
                own_schema: true,
                schema_file_path: mvs_s,
            },
            FolderOnDisk {
                name: "noschema".to_string(),
                path: empty_path_buf
                    .clone()
                    .join("noschema")
                    .to_string_lossy()
                    .to_string(),
                has_schema: false,
                own_schema: false,
                schema_file_path: "".to_string(),
            },
            FolderOnDisk {
                name: "nestno".to_string(),
                path: empty_path_buf
                    .clone()
                    .join("noschema")
                    .join("nestno")
                    .to_string_lossy()
                    .to_string(),
                has_schema: false,
                own_schema: false,
                schema_file_path: "".to_string(),
            },
        ],
    };

    folders.folders.sort_by_key(|f| f.path.clone());
    expected.folders.sort_by_key(|f| f.path.clone());
    assert_eq!(folders, expected);

    // rename books folder to books_renamed
    std::fs::rename(
        test_dir.clone().join("books"),
        test_dir.clone().join("books_renamed"),
    )
    .unwrap();

    //rename audiobooks folder to audiobooks_renamed
    std::fs::rename(
        test_dir.clone().join("books_renamed").join("audiobooks"),
        test_dir
            .clone()
            .join("books_renamed")
            .join("audiobooks_renamed"),
    )
    .unwrap();

    // Wait for watcher
    sleep(Duration::from_millis(300));

    let folders = get_all_folders(&core.context).await;
    assert!(folders.is_ok());

    let mut folders = folders.unwrap();

    let bks_s = empty_path_buf
        .clone()
        .join("books_renamed")
        .join(".asom")
        .join("schema.yaml")
        .to_string_lossy()
        .to_string();
    let abks_s = empty_path_buf
        .clone()
        .join("books_renamed")
        .join("audiobooks_renamed")
        .join(".asom")
        .join("schema.yaml")
        .to_string_lossy()
        .to_string();
    let mvs_s = empty_path_buf
        .clone()
        .join("movies")
        .join(".asom")
        .join("schema.yaml")
        .to_string_lossy()
        .to_string();

    let mut expected = FolderListGetResult {
        folders: vec![
            FolderOnDisk {
                name: test_dir
                    .clone()
                    .file_name()
                    .unwrap()
                    .to_string_lossy()
                    .to_string(),
                path: empty_path_buf.clone().to_string_lossy().to_string(),
                has_schema: false,
                own_schema: false,
                schema_file_path: "".to_string(),
            },
            FolderOnDisk {
                name: "books_renamed".to_string(),
                path: empty_path_buf
                    .clone()
                    .join("books_renamed")
                    .to_string_lossy()
                    .to_string(),
                has_schema: true,
                own_schema: true,
                schema_file_path: bks_s.clone(),
            },
            FolderOnDisk {
                name: "favorites".to_string(),
                path: empty_path_buf
                    .clone()
                    .join("books_renamed")
                    .join("favorites")
                    .to_string_lossy()
                    .to_string(),
                has_schema: true,
                own_schema: false,
                schema_file_path: bks_s,
            },
            FolderOnDisk {
                name: "audiobooks_renamed".to_string(),
                path: empty_path_buf
                    .clone()
                    .join("books_renamed")
                    .join("audiobooks_renamed")
                    .to_string_lossy()
                    .to_string(),
                has_schema: true,
                own_schema: true,
                schema_file_path: abks_s,
            },
            FolderOnDisk {
                name: "movies".to_string(),
                path: empty_path_buf
                    .clone()
                    .join("movies")
                    .to_string_lossy()
                    .to_string(),
                has_schema: true,
                own_schema: true,
                schema_file_path: mvs_s,
            },
            FolderOnDisk {
                name: "noschema".to_string(),
                path: empty_path_buf
                    .clone()
                    .join("noschema")
                    .to_string_lossy()
                    .to_string(),
                has_schema: false,
                own_schema: false,
                schema_file_path: "".to_string(),
            },
            FolderOnDisk {
                name: "nestno".to_string(),
                path: empty_path_buf
                    .clone()
                    .join("noschema")
                    .join("nestno")
                    .to_string_lossy()
                    .to_string(),
                has_schema: false,
                own_schema: false,
                schema_file_path: "".to_string(),
            },
        ],
    };

    folders.folders.sort_by_key(|f| f.path.clone());
    expected.folders.sort_by_key(|f| f.path.clone());
    assert_eq!(folders, expected);
}
