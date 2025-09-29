use std::{
    collections::HashMap,
    time::{Duration, SystemTime},
};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use ts_rs::TS;

use crate::{
    cache::query::RecordFromDb,
    core::core_state::CoreStateManager,
    schema::types::{Schema, SchemaLocation},
    utils::errorhandling::ErrFR,
};

#[derive(Serialize, TS, Clone, Debug)]
pub struct FileEventDataRemoved {
    pub path: String,
    pub schema: SchemaLocation,
}

#[derive(Serialize, TS, Clone, Debug)]
pub struct FileEventDataExisting {
    pub path: String,
    pub record: RecordFromDb,
    pub schema: SchemaLocation,
}

#[derive(Serialize, TS, Clone, Debug)]
pub struct FolderEventData {
    pub path: String,
    pub schema: SchemaLocation,
}

#[derive(Serialize, TS, Clone, Debug)]
#[ts(export)]
#[ts(tag = "type", content = "data")]
#[serde(tag = "t", content = "c")]
pub enum IPCEmitEvent {
    FileRemove(FileEventDataRemoved),
    FileAdd(FileEventDataExisting),
    FileUpdate(FileEventDataExisting),
    FolderRemove(FolderEventData),
    FolderAdd(FolderEventData),
    ErrorHappened(ErrFR),
    SchemasUpdated(HashMap<String, Schema>),
    EventOverflow(u32),
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
        IPCEmitEvent::EventOverflow(_) => "EventOverflow".to_string(),
    }
}

impl IPCEmitEvent {
    pub fn print_event(&self) -> String {
        match self {
            IPCEmitEvent::FileRemove(data) => format!("FileRemove: {}", data.path),
            IPCEmitEvent::FileAdd(data) => format!("FileAdd: {}", data.path),
            IPCEmitEvent::FileUpdate(data) => format!("FileUpdate: {}", data.path),
            IPCEmitEvent::FolderRemove(data) => format!("FolderRemove: {}", data.path),
            IPCEmitEvent::FolderAdd(data) => format!("FolderAdd: {}", data.path),
            IPCEmitEvent::ErrorHappened(data) => format!("ErrorHappened: {}", data.title),
            IPCEmitEvent::SchemasUpdated(data) => {
                format!("SchemasUpdated: new count {}", data.len())
            }
            IPCEmitEvent::EventOverflow(data) => format!("EventOverflow: {}", data),
        }
    }
}

const OVERFLOW_IGNORE_MS: u32 = 200;

pub async fn emit_event<T: tauri::Runtime>(app: &AppHandle<T>, data: IPCEmitEvent) {
    let state = app.state::<CoreStateManager>();
    let can_emit = state.emit_rate_limit.check();

    match can_emit {
        Ok(_) => {
            let event_name = get_event_name(&data);
            app.emit(&event_name, data).unwrap();
        }
        Err(_) => {
            let mut last_overflow = state.last_rate_overflow.lock().await;

            if last_overflow.elapsed().unwrap() < Duration::from_millis(OVERFLOW_IGNORE_MS.into()) {
                return;
            }
            *last_overflow = SystemTime::now();
            drop(last_overflow);

            let event_name = get_event_name(&IPCEmitEvent::EventOverflow(OVERFLOW_IGNORE_MS));
            app.emit(&event_name, IPCEmitEvent::EventOverflow(OVERFLOW_IGNORE_MS))
                .unwrap();
        }
    }
}
