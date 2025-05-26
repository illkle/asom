use std::{
    collections::HashMap,
    time::{Duration, SystemTime},
};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use ts_rs::TS;

use crate::{
    cache::query::RecordFromDb, core::core::CoreStateManager, schema::types::Schema,
    utils::errorhandling::ErrFR, watcher::event_handlers::FolderEventEmit,
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
        IPCEmitEvent::SchemaUpdated(_) => "SchemaUpdated".to_string(),
        IPCEmitEvent::EventOverflow(_) => "EventOverflow".to_string(),
    }
}

const OVERFLOW_IGNORE_MS: u32 = 200;

pub async fn emit_event<T: tauri::Runtime>(app: &AppHandle<T>, data: IPCEmitEvent) {
    let state = app.state::<CoreStateManager>();
    let can_emit = state.emit_rate_limit.check();

    match can_emit {
        Ok(_) => {
            println!("emitting event NOT RATE LIMITED",);
            let event_name = get_event_name(&data);
            app.emit(&event_name, data).unwrap();
        }
        Err(_) => {
            let mut last_overflow = state.last_rate_overflow.lock().await;

            if last_overflow.elapsed().unwrap() < Duration::from_millis(OVERFLOW_IGNORE_MS.into()) {
                println!("ignoring event because of rate limit",);
                return;
            }
            println!("sending overflow event",);
            *last_overflow = SystemTime::now();
            drop(last_overflow);

            let event_name = get_event_name(&IPCEmitEvent::EventOverflow(OVERFLOW_IGNORE_MS));
            app.emit(&event_name, IPCEmitEvent::EventOverflow(OVERFLOW_IGNORE_MS))
                .unwrap();
        }
    }
}
