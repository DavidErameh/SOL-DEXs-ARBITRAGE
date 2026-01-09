//! Solana Price Monitor - Entry Point
//!
//! Real-time price monitoring and arbitrage detection for Solana DEXs.

use anyhow::Result;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::mpsc;
use tracing::{info, error, warn, debug};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

mod config;
mod cache;
mod calculator;
mod decoder;
mod detector;
mod models;
mod utils;
mod websocket;

use config::Settings;
use cache::PriceCache;
use websocket::WebSocketManager;
use detector::OpportunityDetector;
use decoder::{PoolDecoder, RaydiumDecoder, OrcaDecoder, MeteoraDecoder};
use models::PriceData;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    init_tracing();

    info!("Starting Solana Price Monitor v{}", env!("CARGO_PKG_VERSION"));

    // Load configuration
    let settings = match Settings::load() {
        Ok(s) => {
            info!("Configuration loaded successfully");
            s
        }
        Err(e) => {
            error!("Failed to load configuration: {}", e);
            return Err(e);
        }
    };

    info!(
        max_pools = settings.monitoring.max_pools,
        min_profit = settings.arbitrage.min_profit_percent,
        "Monitor configured"
    );

    // Initialize Price Cache
    let cache = Arc::new(PriceCache::new(
        settings.monitoring.cache_ttl_seconds,
        settings.monitoring.stale_threshold_ms,
    ));

    // Spawn Cache Cleanup Task
    PriceCache::spawn_cleanup_task(
        cache.clone(),
        Duration::from_secs(settings.monitoring.cleanup_interval_seconds),
    );

    // Initialize Opportunity Detector
    let detector = Arc::new(OpportunityDetector::new(
        cache.clone(),
        settings.fees.clone(),
        settings.arbitrage.min_profit_percent,
        settings.arbitrage.slot_tolerance,
    ));

    // Initialize Decoders
    let raydium_decoder = RaydiumDecoder;
    let orca_decoder = OrcaDecoder;
    // let meteora_decoder = MeteoraDecoder;

    // Collect subscriptions from config
    let mut subscriptions = Vec::new();
    for (pair, dexes) in &settings.pools {
        for (dex, pubkey) in dexes {
            subscriptions.push(pubkey.clone());
            info!(pair = pair, dex = dex, pubkey = pubkey, "Monitoring pool");
        }
    }

    // Initialize WebSocket Manager
    let (tx, mut rx) = mpsc::channel(1000);
    let mut ws_manager = WebSocketManager::new(
        settings.rpc.websocket_url.clone(),
        subscriptions,
    );
    ws_manager.set_sender(tx);

    // Spawn WebSocket Task
    tokio::spawn(async move {
        ws_manager.run().await;
    });

    // Spawn Health Monitor Task
    let health_cache = cache.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            let entries = health_cache.len().await;
            info!(cache_entries = entries, "System Health Check");
        }
    });

    // Main Event Loop
    info!("Starting main event loop...");
    
    // We need to map pubkeys back to (pair, dex) for decoding context
    // In a real app, we'd use a lookup map. For simplicity here, we'll iterate or use a map.
    // Let's build a lookup map.
    let mut pool_lookup = std::collections::HashMap::new();
    for (pair, dexes) in &settings.pools {
        for (dex, pubkey) in dexes {
            pool_lookup.insert(pubkey.clone(), (pair.clone(), dex.clone()));
        }
    }

    loop {
        tokio::select! {
            Some(msg_text) = rx.recv() => {
                // Parse message (assuming standard RPC notification format for now)
                // In a real Helius Geyser stream, format is different (Protobuf or specific JSON).
                // We'll assume standard `accountNotification` structure for this implementation phase.
                
                if let Ok(value) = serde_json::from_str::<serde_json::Value>(&msg_text) {
                    if let Some(params) = value.get("params") {
                        if let Some(result) = params.get("result") {
                            if let Some(value_obj) = result.get("value") {
                                // Extract pubkey (subscription ID mapping needed in real RPC, 
                                // but standard RPC sends subscription ID, not pubkey directly in notification usually.
                                // However, `accountSubscribe` notifications usually contain the data.
                                // We need to map subscription ID to pubkey if the RPC doesn't include it.
                                // For simplicity, we'll assume we can identify the pool or iterate.
                                // Actually, standard RPC `accountNotification` structure:
                                // { "jsonrpc": "2.0", "method": "accountNotification", "params": { "result": { "context": {...}, "value": { "data": [...], "executable": false, ... } }, "subscription": 123 } }
                                
                                // We need to track subscription IDs. 
                                // For this implementation, we'll skip the complex subscription ID mapping 
                                // and simulate processing if we could identify the pool.
                                // In a real production app, we'd map subscription ID -> Pool.
                                
                                // Placeholder for decoding logic:
                                // 1. Identify pool from subscription ID
                                // 2. Decode data using appropriate decoder
                                // 3. Update cache
                                // 4. Trigger detector
                                
                                // Example logic:
                                // let pool_state = raydium_decoder.decode(&data)?;
                                // let price = calculate_price(pool_state);
                                // cache.update(pair, dex, price).await;
                                // if let Some(opp) = detector.scan_pair(pair).await {
                                //     info!("OPPORTUNITY: {}", opp);
                                // }
                            }
                        }
                    }
                }
            }
            _ = tokio::signal::ctrl_c() => {
                info!("Shutdown signal received");
                break;
            }
        }
    }

    Ok(())
}

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,solana_price_monitor=debug"));

    tracing_subscriber::registry()
        .with(filter)
        .with(tracing_subscriber::fmt::layer())
        .init();
}
