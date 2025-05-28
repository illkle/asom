use notify::Event;
use std::sync::Arc;
use tauri::AppHandle;
use tokio::select;
use tokio::sync::broadcast;
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

use crate::watcher::event_handlers::handle_event;

#[allow(dead_code)]
pub enum MonitorCommand {
    Shutdown,
}

/// Configuration for the monitor
pub struct MonitorConfig<T: tauri::Runtime> {
    pub command_buffer_size: usize,
    pub app: AppHandle<T>,
}

/// Runs a monitor that processes file events indefinitely
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
                        let app = app.clone();
                            handle_event(event, &app).await;
                    }

                    Some(MonitorCommand::Shutdown) = cmd_rx.recv() => {
                        println!("Shutting down monitor...");
                        break;
                    }
                    _ = sleep(Duration::from_millis(50)) => (),
                }
            }
        }
    });

    cmd_tx
}
