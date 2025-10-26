use log::error;
use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use tauri::{AppHandle, Manager};

use tokio::time::{sleep, Duration};
use tokio::{select, sync::Mutex};

use crate::{
    core::core_state::CoreStateManager, emitter::emit_event_to_frontend,
    utils::errorhandling::send_err_to_frontend, watcher::event_handlers::handle_event,
};

#[derive(Debug)]
pub struct GlobalWatcher {
    watcher: RecommendedWatcher,
    current_path: Mutex<Option<String>>,
}

impl GlobalWatcher {
    pub fn new<T: tauri::Runtime>(app: AppHandle<T>) -> notify::Result<Self> {
        let (wc_sender, mut wc_receiver) = tokio::sync::mpsc::channel(10000);

        // FS watch process
        let watcher = notify::recommended_watcher(move |res: notify::Result<Event>| match res {
            Ok(event) => {
                if let Err(e) = wc_sender.blocking_send(event) {
                    error!("watcher error sending event: {:?}", e);
                }
            }
            Err(err) => {
                error!("watcher error receiving event: {:?}", err);
            }
        })?;

        // Handle events from FS watch process and send to cache\frontend
        tauri::async_runtime::spawn({
            async move {
                loop {
                    select! {
                        Some(event) = wc_receiver.recv() => {
                            log::trace!("received event {:?}", event);
                            let app_clone = app.clone();
                            let st = app_clone.try_state::<CoreStateManager>();
                            if st.is_none() {
                                log::error!("Trying to handle event but CoreStateManager not found in app");
                                return;
                            }

                            let res = handle_event(&st.unwrap().context, event).await;
                            for event in res.events {
                                emit_event_to_frontend(&app, event).await;
                            }
                            for error in res.errors {
                                send_err_to_frontend(&app, &error);
                            }
                        }
                        _ = sleep(Duration::from_millis(50)) => (),
                    }
                }
            }
        });

        Ok(GlobalWatcher {
            watcher,
            current_path: Mutex::new(None),
        })
    }

    pub async fn set_watch_path(&mut self, path: &str) -> notify::Result<()> {
        if let Some(current_path) = self.current_path.lock().await.take() {
            self.watcher.unwatch(Path::new(&current_path))?;
        }

        self.watcher
            .watch(Path::new(path), RecursiveMode::Recursive)?;

        *self.current_path.lock().await = Some(path.to_string());

        Ok(())
    }
}
