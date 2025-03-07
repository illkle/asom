use std::collections::HashMap;

use serde::Serialize;
use tauri::{AppHandle, Emitter};
use ts_rs::TS;

use crate::{
    cache::query::BookFromDb, schema::types::Schema, utils::errorhandling::ErrorFromRust,
    watcher::event_handler::FolderEventEmit,
};

#[derive(Serialize, TS, Clone)]
#[ts(export)]
#[ts(tag = "type", content = "data")]
#[serde(tag = "t", content = "c")]
pub enum IPCEmitEvent {
    FileRemove(String),
    FileAdd(BookFromDb),
    FileUpdate(BookFromDb),
    FolderRemove(FolderEventEmit),
    FolderAdd(FolderEventEmit),
    ErrorHappened(ErrorFromRust),
    SchemasUpdated(HashMap<String, Schema>),
}

pub fn emit_event(app: &AppHandle, data: IPCEmitEvent) {
    match data {
        IPCEmitEvent::FileRemove(v) => app.emit("FileRemove", v).unwrap(),
        IPCEmitEvent::FileAdd(v) => app.emit("FileAdd", v).unwrap(),
        IPCEmitEvent::FileUpdate(v) => app.emit("FileUpdate", v).unwrap(),
        IPCEmitEvent::FolderRemove(v) => app.emit("FolderRemove", v).unwrap(),
        IPCEmitEvent::FolderAdd(v) => app.emit("FolderAdd", v).unwrap(),
        IPCEmitEvent::ErrorHappened(v) => app.emit("ErrorHappened", v).unwrap(),
        IPCEmitEvent::SchemasUpdated(v) => app.emit("SchemasUpdated", v).unwrap(),
    };
}
