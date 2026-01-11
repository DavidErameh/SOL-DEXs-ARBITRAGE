use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    extract::State,
    response::IntoResponse,
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::broadcast;
use tower_http::cors::CorsLayer;
use tracing::{info, warn, error, debug};
use crate::models::{PriceData, Opportunity};

/// Messages sent to frontend clients
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum ApiMessage {
    #[serde(rename = "price")]
    PriceUpdate {
        pair: String,
        dex: String,
        price: f64,
        slot: u64,
        ts: u64,
    },
    #[serde(rename = "opportunity")]
    OpportunityFound(Opportunity),
    #[serde(rename = "metrics")]
    SystemMetrics {
        fps: u64,
        cache_entries: usize,
    },
}

#[derive(Clone)]
struct AppState {
    tx: broadcast::Sender<ApiMessage>,
}

/// Start the API server
pub async fn start_server(
    port: u16,
    tx: broadcast::Sender<ApiMessage>,
) {
    let app_state = AppState { tx };

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!("API Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: AppState) {
    let mut rx = state.tx.subscribe();

    debug!("New WebSocket client connected");

    while let Ok(msg) = rx.recv().await {
        if let Ok(json) = serde_json::to_string(&msg) {
            if let Err(e) = socket.send(Message::Text(json)).await {
                // Client disconnected
                debug!("Client disconnected: {}", e);
                break;
            }
        }
    }
}
