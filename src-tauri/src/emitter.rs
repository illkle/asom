use std::collections::HashMap;

use serde::Serialize;
use tauri::{AppHandle, Emitter};
use ts_rs::TS;

use crate::{
    cache::query::RecordFromDb, schema::types::Schema, utils::errorhandling::ErrFR,
    watcher::event_handlers::FolderEventEmit,
};

#[derive(Serialize, TS, Clone, Debug)]
#[ts(export)]
#[ts(tag = "type", content = "data")]
#[serde(tag = "t", content = "c")]
pub enum IPCEmitEvent {
    FileRemove(String),
    FileAdd(RecordFromDb),
    FileUpdate(RecordFromDb),
    FolderRemove(FolderEventEmit),
    FolderAdd(FolderEventEmit),
    ErrorHappened(ErrFR),
    SchemasUpdated(HashMap<String, Schema>),
    SchemaUpdated(Schema),
}

pub fn get_event_name(event: &IPCEmitEvent) -> String {
    match event {
        IPCEmitEvent::FileRemove(_) => "FileRemove".to_string(),
        IPCEmitEvent::FileAdd(_) => "FileAdd".to_string(),
        IPCEmitEvent::FileUpdate(_) => "FileUpdate".to_string(),
        IPCEmitEvent::FolderRemove(_) => "FolderRemove".to_string(),
        IPCEmitEvent::FolderAdd(_) => "FolderAdd".to_string(),
        IPCEmitEvent::ErrorHappened(_) => "ErrorHappened".to_string(),
        IPCEmitEvent::SchemasUpdated(_) => "SchemasUpdated".to_string(),
        IPCEmitEvent::SchemaUpdated(_) => "SchemaUpdated".to_string(),
    }
}

pub fn emit_event<T: tauri::Runtime>(app: &AppHandle<T>, data: IPCEmitEvent) {
    let event_name = get_event_name(&data);

    app.emit(&event_name, data).unwrap();
}
