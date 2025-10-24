use tauri::AppHandle;
use ts_rs::TS;

use crate::emitter::{emit_event_to_frontend, IPCEmitEvent};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, TS)]
#[ts(export)]
pub enum ErrFRActionCode {
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
#[ts(optional_fields)]
#[serde(rename_all = "camelCase")]
pub struct ErrFR {
    #[serde(rename = "isError")]
    pub is_error: bool,
    pub title: String,
    pub info: Option<String>,
    pub raw_error: Option<String>,
    pub sub_errors: Vec<ErrFR>,
    // Pass code for custom bind on frontend
    pub action_code: Option<ErrFRActionCode>,
    // Label for button that will call action
    pub action_label: Option<String>,
}

impl ErrFR {
    pub fn new(title: &str) -> Self {
        ErrFR {
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

    pub fn action_c(mut self, code: ErrFRActionCode, label: &str) -> Self {
        self.action_code = Some(code);
        self.action_label = Some(label.to_string());
        self
    }
    pub fn raw<T: ToString>(mut self, thing: T) -> Self {
        self.raw_error = Some(thing.to_string());
        self
    }
    pub fn sub(mut self, thing: ErrFR) -> Self {
        self.sub_errors.push(thing);
        self
    }
    #[allow(dead_code)]
    pub fn subs(mut self, full_array_to_set: Vec<ErrFR>) -> Self {
        self.sub_errors = full_array_to_set;
        self
    }
}

// This will show a notification on frontend, regardless of what is opened. Prefer returning error from invoke if possible.
pub fn send_err_to_frontend<T: tauri::Runtime>(app: &AppHandle<T>, e: &ErrFR) {
    let app_clone = app.clone();
    let e_clone = e.clone();
    tokio::task::spawn(async move {
        emit_event_to_frontend(&app_clone, IPCEmitEvent::ErrorHappened(e_clone)).await;
    });
}
