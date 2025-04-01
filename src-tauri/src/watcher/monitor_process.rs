use notify::Event;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use tauri::AppHandle;
use tokio::select;
use tokio::sync::broadcast;
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration, Instant};

use crate::watcher::event_handlers::handle_event;

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
    mut event_rx: broadcast::Receiver<Event>,
    config: MonitorConfig<T>,
) -> mpsc::Sender<MonitorCommand> {
    let (cmd_tx, mut cmd_rx) = mpsc::channel::<MonitorCommand>(config.command_buffer_size);
    let app = Arc::new(config.app);
    let log_to_stdout = config.log_to_stdout;

    // Metrics
    let processed_events = Arc::new(AtomicU64::new(0));
    let processing_time = Arc::new(AtomicU64::new(0));

    // Spawn event buffering task
    tokio::spawn({
        let processed_events = processed_events.clone();
        let processing_time = processing_time.clone();
        async move {
            let mut buffer = Vec::with_capacity(100);
            let mut last_metrics = Instant::now();

            loop {
                select! {
                    Ok(event) = event_rx.recv() => {
                        buffer.push(event);
                        if buffer.len() >= 50 {
                            process_batch(&mut buffer, &app, &processed_events, &processing_time, log_to_stdout).await;
                        }
                    }
                    _ = sleep(Duration::from_millis(50)) => {
                        if !buffer.is_empty() {
                            process_batch(&mut buffer, &app, &processed_events, &processing_time, log_to_stdout).await;
                        }
                    }
                    Some(MonitorCommand::Shutdown) = cmd_rx.recv() => {
                        println!("Shutting down monitor...");
                        break;
                    }
                }

                // Print metrics every 1 seconds
                if config.log_to_stdout && last_metrics.elapsed() > Duration::from_secs(1) {
                    let total_processed = processed_events.load(Ordering::SeqCst);
                    let avg_processing_time =
                        processing_time.load(Ordering::SeqCst) / total_processed.max(1);
                    println!(
                        "Metrics - Total processed: {}, Avg processing time: {}ms",
                        total_processed, avg_processing_time
                    );
                    last_metrics = Instant::now();
                }
            }
        }
    });

    cmd_tx
}

async fn process_batch<T: tauri::Runtime>(
    buffer: &mut Vec<Event>,
    app: &Arc<AppHandle<T>>,
    processed_events: &Arc<AtomicU64>,
    processing_time: &Arc<AtomicU64>,
    log_to_stdout: bool,
) {
    if log_to_stdout {
        println!("Processing batch of {} events", buffer.len());
    }

    let start_time = Instant::now();
    let events = buffer.drain(..).collect::<Vec<_>>();

    // Process events in parallel with a semaphore to limit concurrency
    let semaphore = Arc::new(tokio::sync::Semaphore::new(20));
    let handles: Vec<_> = events
        .into_iter()
        .map(|event| {
            let app = app.clone();
            let semaphore = semaphore.clone();
            let processed_events = processed_events.clone();
            let event_clone = event.clone();

            tokio::spawn(async move {
                let _permit = semaphore.acquire().await.unwrap();
                if log_to_stdout {
                    println!("Processing event: {:?}", event);
                }
                handle_event(event, &app).await;
                processed_events.fetch_add(1, Ordering::SeqCst);
                if log_to_stdout {
                    println!("Done processing event: {:?}", event_clone);
                }
            })
        })
        .collect();

    // Wait for all events to be processed
    for handle in handles {
        if let Err(e) = handle.await {
            eprintln!("Error processing event: {:?}", e);
        }
    }

    // Update metrics
    let elapsed = start_time.elapsed().as_millis() as u64;
    processing_time.fetch_add(elapsed, Ordering::SeqCst);
}
