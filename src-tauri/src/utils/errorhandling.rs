use tauri::AppHandle;
use ts_rs::TS;

use crate::emitter::{emit_event, IPCEmitEvent};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, TS)]
#[ts(export)]
pub enum ErrorActionCode {
    FileSaveRetry,
    FileSaveRetryForced,
    FileReadRetry,
    InitOnceRetry,
    PrepareCacheRetry,
    WatchPathRetry,
    NoRootPath,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ErrorFromRust {
    #[serde(rename = "isError")]
    pub is_error: bool,
    pub title: String,
    #[ts(optional)]
    pub info: Option<String>,

    #[ts(optional)]
    pub raw_error: Option<String>,

    pub sub_errors: Vec<ErrorFromRust>,

    // Pass code for custom bind on frontend
    #[ts(optional)]
    pub action_code: Option<ErrorActionCode>,

    // Label for button that will call action
    #[ts(optional)]
    pub action_label: Option<String>,
}

impl ErrorFromRust {
    pub fn new(title: &str) -> Self {
        ErrorFromRust {
            is_error: true,
            title: title.to_string(),
            sub_errors: vec![],
            raw_error: None,
            info: None,
            action_label: None,
            action_code: None,
        }
    }
    pub fn info(mut self, descrition: &str) -> Self {
        self.info = Some(descrition.to_string());
        self
    }

    pub fn action_c(mut self, code: ErrorActionCode, label: &str) -> Self {
        self.action_code = Some(code);
        self.action_label = Some(label.to_string());
        self
    }
    pub fn raw<T: ToString>(mut self, thing: T) -> Self {
        self.raw_error = Some(thing.to_string());
        self
    }
    pub fn sub(mut self, thing: ErrorFromRust) -> Self {
        self.sub_errors.push(thing);
        self
    }
    pub fn subs(mut self, full_array_to_set: Vec<ErrorFromRust>) -> Self {
        self.sub_errors = full_array_to_set;
        self
    }
}

// This will show a notification on frontend, regardless of what is opened. Prefer returning error from invoke if possible.
pub fn send_err_to_frontend(app: &AppHandle, e: &ErrorFromRust) {
    emit_event(app, IPCEmitEvent::ErrorHappened(e.clone()));
}
