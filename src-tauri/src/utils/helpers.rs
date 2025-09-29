use std::path::{Path, PathBuf};

use serde::Serialize;
use ts_rs::TS;

use crate::files::read_save::RecordReadResult;

#[derive(TS, Clone, Serialize)]
#[ts(export)]
pub struct BreadcrumbItem {
    pub label: String,
    pub path: String,
}

#[derive(TS, Clone, Serialize)]
#[ts(export)]
pub struct FileBreadCrumbs {
    pub start: Vec<BreadcrumbItem>,
    pub middle: Vec<BreadcrumbItem>,
    pub end: Vec<BreadcrumbItem>,
}

pub fn get_breadcrumb_items(record_read_result: &RecordReadResult) -> FileBreadCrumbs {
    let mut crumbs = Vec::new();
    let mut current = PathBuf::new();

    let path = record_read_result.record.path.clone().unwrap_or_default();

    for part in Path::new(&path).components() {
        current.push(part.as_os_str());
        crumbs.push(BreadcrumbItem {
            label: part.as_os_str().to_string_lossy().to_string(),
            path: current.to_string_lossy().to_string(),
        });
    }

    if crumbs.len() > 4 {
        return FileBreadCrumbs {
            start: crumbs[0..1].to_vec(),
            middle: crumbs[1..crumbs.len() - 2].to_vec(),
            end: crumbs[crumbs.len() - 2..crumbs.len()].to_vec(),
        };
    }

    FileBreadCrumbs {
        start: crumbs,
        middle: vec![],
        end: vec![],
    }
}
