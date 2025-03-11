use notify::RecommendedWatcher;
use notify::{Event, RecursiveMode, Watcher};
use std::path::Path;
use tokio::sync::broadcast;

#[derive(Debug)]
pub struct GlobalWatcher {
    watcher: RecommendedWatcher,
    sender: broadcast::Sender<Event>,
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

        Ok(GlobalWatcher { watcher, sender })
    }

    pub async fn watch_path(&mut self, path: &str) -> notify::Result<()> {
        self.watcher
            .watch(Path::new(path), RecursiveMode::Recursive)
    }

    pub async fn subscribe_to_events(&self) -> broadcast::Receiver<Event> {
        self.sender.subscribe()
    }
}
