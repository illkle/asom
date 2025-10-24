use log::{error, warn};
use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use tokio::sync::{broadcast, Mutex};

#[derive(Debug)]
pub struct GlobalWatcher {
    watcher: RecommendedWatcher,
    sender: broadcast::Sender<Event>,
    current_path: Mutex<Option<String>>,
    #[allow(dead_code)]
    dropped_events: Arc<AtomicU64>,
}

impl GlobalWatcher {
    pub fn new() -> notify::Result<Self> {
        let (sender, _) = broadcast::channel(10000);
        let sender_clone = sender.clone();
        let dropped_events = Arc::new(AtomicU64::new(0));
        let dropped_events_clone = dropped_events.clone();

        let watcher = notify::recommended_watcher(move |res: notify::Result<Event>| match res {
            Ok(event) => match sender_clone.send(event) {
                Ok(_) => (),
                Err(err) => {
                    error!("watcher error sending event: {:?}", err);
                    dropped_events_clone.fetch_add(1, Ordering::SeqCst);
                    warn!(
                        "watcher dropped event due to full channel. Total dropped: {}",
                        dropped_events_clone.load(Ordering::SeqCst)
                    );
                }
            },
            Err(err) => {
                error!("watcher error receiving event: {:?}", err);
            }
        })?;

        Ok(GlobalWatcher {
            watcher,
            sender,
            current_path: Mutex::new(None),
            dropped_events,
        })
    }

    pub async fn watch_path(&mut self, path: &str) -> notify::Result<()> {
        if let Some(current_path) = self.current_path.lock().await.take() {
            self.watcher.unwatch(Path::new(&current_path))?;
        }

        self.watcher
            .watch(Path::new(path), RecursiveMode::Recursive)?;

        *self.current_path.lock().await = Some(path.to_string());

        Ok(())
    }

    pub async fn subscribe_to_events(&self) -> broadcast::Receiver<Event> {
        self.sender.subscribe()
    }
}
