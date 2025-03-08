use notify::Event;

use tauri::AppHandle;
use tokio::select;
use tokio::sync::broadcast;
use tokio::sync::mpsc;

use crate::watcher::event_handler::handle_event;

#[allow(dead_code)]
pub enum MonitorCommand {
    Shutdown,
}

/// Configuration for the monitor
pub struct MonitorConfig<T: tauri::Runtime> {
    pub command_buffer_size: usize,
    pub log_to_stdout: bool,
    pub app: AppHandle<T>,
}

/// Runs a monitor that processes file events indefinitely
pub async fn run_monitor<T: tauri::Runtime>(
    event_rx: broadcast::Receiver<Event>,
    config: MonitorConfig<T>,
) -> mpsc::Sender<MonitorCommand> {
    let (cmd_tx, mut cmd_rx) = mpsc::channel::<MonitorCommand>(config.command_buffer_size);
    let cmd_tx_clone = cmd_tx.clone();

    tokio::spawn(async move {
        let mut event_rx = event_rx;

        loop {
            select! {
                Ok(event) = event_rx.recv() => {
                    if config.log_to_stdout {
                             println!("Received event: {:?}", event);
                    }

                    handle_event(event, &config.app).await
                }
                Some(MonitorCommand::Shutdown) = cmd_rx.recv() => {
                    println!("Shutting down monitor...");
                    break;
                }
            }
        }

        drop(event_rx);
        drop(cmd_tx_clone);
    });

    cmd_tx
}
