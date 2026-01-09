//! WebSocket connection management

use anyhow::{Result, Context};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashSet;
use std::time::Duration;
use tokio::net::TcpStream;
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};
use tokio_tungstenite::tungstenite::Message;
use tracing::{info, warn, error, debug};
use url::Url;

/// WebSocket connection manager for Helius Geyser / RPC
pub struct WebSocketManager {
    url: String,
    reconnect_attempts: u32,
    max_reconnect_delay: Duration,
    subscriptions: HashSet<String>,
    tx: Option<mpsc::Sender<String>>, // Channel to send raw messages to main loop
}

#[derive(Serialize)]
struct SubscriptionRequest {
    jsonrpc: String,
    id: u64,
    method: String,
    params: (String, SubscriptionConfig),
}

#[derive(Serialize)]
struct SubscriptionConfig {
    encoding: String,
    commitment: String,
}

impl WebSocketManager {
    /// Create a new WebSocket manager
    pub fn new(url: String, subscriptions: Vec<String>) -> Self {
        Self {
            url,
            reconnect_attempts: 0,
            max_reconnect_delay: Duration::from_secs(30),
            subscriptions: subscriptions.into_iter().collect(),
            tx: None,
        }
    }

    /// Set the channel to send received messages to
    pub fn set_sender(&mut self, tx: mpsc::Sender<String>) {
        self.tx = Some(tx);
    }

    /// Connect to WebSocket with exponential backoff and maintain connection
    pub async fn run(&mut self) {
        loop {
            let delay = Duration::from_millis(
                100 * 2u64.pow(self.reconnect_attempts.min(8)) as u64
            );
            let actual_delay = delay.min(self.max_reconnect_delay);

            if self.reconnect_attempts > 0 {
                warn!(
                    attempt = self.reconnect_attempts,
                    delay_ms = actual_delay.as_millis(),
                    "Reconnecting to WebSocket..."
                );
                tokio::time::sleep(actual_delay).await;
            }

            match self.connect_and_listen().await {
                Ok(_) => {
                    self.reconnect_attempts = 0;
                    info!("WebSocket connection closed gracefully");
                }
                Err(e) => {
                    self.reconnect_attempts += 1;
                    error!(error = ?e, "WebSocket connection failed/terminated");
                }
            }
        }
    }

    /// Internal connection and event loop
    async fn connect_and_listen(&mut self) -> Result<()> {
        let url = Url::parse(&self.url).context("Invalid WebSocket URL")?;
        info!(url = %url, "Connecting to WebSocket");

        let (ws_stream, _) = connect_async(url).await.context("Failed to connect")?;
        info!("WebSocket connected");

        let (mut write, mut read) = ws_stream.split();

        // Subscribe to accounts
        for (id, pubkey) in self.subscriptions.iter().enumerate() {
            let request = json!({
                "jsonrpc": "2.0",
                "id": id + 1,
                "method": "accountSubscribe",
                "params": [
                    pubkey,
                    {
                        "encoding": "base64",
                        "commitment": "processed"
                    }
                ]
            });

            let msg = Message::Text(request.to_string());
            write.send(msg).await.context("Failed to send subscription")?;
            debug!(pubkey = pubkey, "Sent subscription request");
        }

        // Process messages
        while let Some(msg) = read.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Some(tx) = &self.tx {
                        if let Err(e) = tx.send(text).await {
                            error!("Failed to send message to channel: {}", e);
                            break;
                        }
                    }
                }
                Ok(Message::Binary(bin)) => {
                    // Handle binary if needed, usually RPC sends Text JSON
                    debug!("Received binary message: {} bytes", bin.len());
                }
                Ok(Message::Ping(_)) => {
                    // Tungstenite handles pongs automatically
                }
                Ok(Message::Close(_)) => {
                    info!("Received close frame");
                    break;
                }
                Err(e) => {
                    error!("WebSocket read error: {}", e);
                    return Err(e.into());
                }
                _ => {}
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_websocket_manager_creation() {
        let manager = WebSocketManager::new(
            "wss://example.com".to_string(),
            vec!["Pubkey1".to_string()]
        );
        assert_eq!(manager.reconnect_attempts, 0);
        assert_eq!(manager.subscriptions.len(), 1);
    }
}
