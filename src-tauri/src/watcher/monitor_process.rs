use notify::Event;
use std::sync::Arc;
use tauri::AppHandle;
use tauri::Manager;
use tokio::select;
use tokio::sync::broadcast;
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

use crate::core::core_state::CoreStateManager;
use crate::emitter::emit_event_to_frontend;
use crate::utils::errorhandling::send_err_to_frontend;
use crate::watcher::event_handlers::handle_event;

#[allow(dead_code)]
pub enum MonitorCommand {
    Shutdown,
}

pub struct MonitorConfig<T: tauri::Runtime> {
    pub command_buffer_size: usize,
    pub app: AppHandle<T>,
}

pub async fn run_monitor<T: tauri::Runtime>(
    mut event_rx: broadcast::Receiver<Event>,
    config: MonitorConfig<T>,
) -> mpsc::Sender<MonitorCommand> {
    let (cmd_tx, mut cmd_rx) = mpsc::channel::<MonitorCommand>(config.command_buffer_size);
    let app = Arc::new(config.app);

    tokio::spawn({
        async move {
            loop {
                select! {
                    Ok(event) = event_rx.recv() => {
                        log::info!("received event {:?}", event);
                        let app_clone = app.clone();
                        let st = app_clone.state::<CoreStateManager>();
                        let res = handle_event(&st.context, event).await;
                        for event in res.events {
                            emit_event_to_frontend(&app, event).await;
                        }
                        for error in res.errors {
                            send_err_to_frontend(&app, &error);
                        }
                    }

                    Some(MonitorCommand::Shutdown) = cmd_rx.recv() => {
                        log::warn!("Shutting down monitor...");
                        break;
                    }
                    _ = sleep(Duration::from_millis(50)) => (),
                }
            }
        }
    });

    cmd_tx
}
