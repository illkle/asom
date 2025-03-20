use notify::RecommendedWatcher;
use notify::{Event, RecursiveMode, Watcher};
use std::path::Path;
use tokio::sync::{broadcast, Mutex};

#[derive(Debug)]
pub struct GlobalWatcher {
    watcher: RecommendedWatcher,
    sender: broadcast::Sender<Event>,
    current_path: Mutex<Option<String>>,
}

impl GlobalWatcher {
    pub fn new() -> notify::Result<Self> {
        let (sender, _) = broadcast::channel(16);
        let sender_clone = sender.clone();

        let watcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
            if let Ok(event) = res {
                let _ = sender_clone.send(event);
            }
        })?;

        Ok(GlobalWatcher {
            watcher,
            sender,
            current_path: Mutex::new(None),
        })
    }

    pub async fn watch_path(&mut self, path: &str) -> notify::Result<()> {
        if let Some(current_path) = self.current_path.lock().await.take() {
            self.watcher.unwatch(Path::new(&current_path))?;
        }

        let res = self
            .watcher
            .watch(Path::new(path), RecursiveMode::Recursive)?;

        *self.current_path.lock().await = Some(path.to_string());

        Ok(res)
    }

    pub async fn subscribe_to_events(&self) -> broadcast::Receiver<Event> {
        self.sender.subscribe()
    }
}
