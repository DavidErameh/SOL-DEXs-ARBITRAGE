//! Solana Price Monitor - Entry Point
//!
//! Real-time price monitoring and arbitrage detection for Solana DEXs.

use anyhow::Result;
use std::collections::HashMap;
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
mod api; // New module

use config::Settings;
use cache::PriceCache;
use websocket::WebSocketManager;
use detector::{OpportunityDetector, StatisticalArbitrageDetector, TriangularArbitrageDetector, 
               StatArbConfig, TriangularArbConfig, generate_common_paths};
use decoder::{PoolDecoder, RaydiumDecoder, OrcaDecoder, MeteoraDecoder, PoolState};
use calculator::{calculate_amm_price, calculate_clmm_price};
use models::PriceData;
use api::ApiMessage; // Import ApiMessage

/// Pool metadata for decoding context
#[derive(Clone)]
struct PoolInfo {
    pair: String,
    dex: String,
    decoder_type: DecoderType,
}

#[derive(Clone, Copy)]
enum DecoderType {
    Raydium,
    Orca,
    Meteora,
}

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

    // Initialize Broadcast Channel for Frontend API
    let (api_tx, _) = tokio::sync::broadcast::channel::<ApiMessage>(1000);
    let api_tx_clone = api_tx.clone();

    // Spawn API Server
    tokio::spawn(async move {
        api::start_server(3001, api_tx_clone).await;
    });

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

    // Initialize Detectors
    let spatial_detector = Arc::new(OpportunityDetector::new(
        cache.clone(),
        settings.fees.clone(),
        settings.arbitrage.min_profit_percent,
        settings.arbitrage.slot_tolerance,
    ));

    let stat_detector = Arc::new(tokio::sync::RwLock::new(StatisticalArbitrageDetector::new(
        cache.clone(),
        StatArbConfig::default(),
    )));

    let triangular_detector = Arc::new(TriangularArbitrageDetector::new(
        cache.clone(),
        TriangularArbConfig::default(),
        settings.fees.clone(),
    ));

    // Initialize Decoders
    let raydium_decoder = RaydiumDecoder;
    let orca_decoder = OrcaDecoder::default();
    let meteora_decoder = MeteoraDecoder::default();

    // Build pool lookup map: pubkey -> PoolInfo
    let mut pool_lookup: HashMap<String, PoolInfo> = HashMap::new();
    let mut subscriptions = Vec::new();

    for (pair, dexes) in &settings.pools {
        for (dex, pubkey) in dexes {
            let decoder_type = match dex.to_lowercase().as_str() {
                "raydium" => DecoderType::Raydium,
                "orca" => DecoderType::Orca,
                "meteora" => DecoderType::Meteora,
                _ => {
                    warn!(dex = dex, "Unknown DEX type, defaulting to Raydium");
                    DecoderType::Raydium
                }
            };

            pool_lookup.insert(pubkey.clone(), PoolInfo {
                pair: pair.clone(),
                dex: dex.clone(),
                decoder_type,
            });

            subscriptions.push(pubkey.clone());
            info!(pair = pair, dex = dex, pubkey = pubkey, "Monitoring pool");
        }
    }

    // Track subscription ID -> pubkey mapping
    let mut subscription_id_map: HashMap<u64, String> = HashMap::new();

    // Initialize WebSocket Manager
    let (tx, mut rx) = mpsc::channel(1000);
    let mut ws_manager = WebSocketManager::new(
        settings.rpc.websocket_url.clone(),
        subscriptions.clone(),
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
            let entries = health_cache.len(); // DashMap is lock-free, no await needed
            info!(cache_entries = entries, "System Health Check");
        }
    });

    // Generate triangular paths for scanning
    let triangular_paths = generate_common_paths("raydium");
    let pairs: Vec<&str> = settings.pools.keys().map(|s| s.as_str()).collect();

    // Main Event Loop
    info!("Starting main event loop...");

    loop {
        tokio::select! {
            Some(msg_text) = rx.recv() => {
                if let Err(e) = process_message(
                    &msg_text,
                    &pool_lookup,
                    &mut subscription_id_map,
                    &subscriptions,
                    &raydium_decoder,
                    &orca_decoder,
                    &meteora_decoder,
                    &cache,
                    &spatial_detector,
                    &stat_detector,
                    &triangular_detector,
                    &triangular_paths,
                    &pairs,
                    &api_tx, // Pass broadcast sender
                ).await {
                    debug!(error = ?e, "Error processing message");
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

/// Process incoming WebSocket message
async fn process_message(
    msg_text: &str,
    pool_lookup: &HashMap<String, PoolInfo>,
    subscription_id_map: &mut HashMap<u64, String>,
    subscriptions: &[String],
    raydium_decoder: &RaydiumDecoder,
    orca_decoder: &OrcaDecoder,
    meteora_decoder: &MeteoraDecoder,
    cache: &Arc<PriceCache>,
    spatial_detector: &Arc<OpportunityDetector>,
    stat_detector: &Arc<tokio::sync::RwLock<StatisticalArbitrageDetector>>,
    triangular_detector: &Arc<TriangularArbitrageDetector>,
    triangular_paths: &[detector::TriangularPath],
    pairs: &[&str],
    api_tx: &tokio::sync::broadcast::Sender<ApiMessage>,
) -> Result<()> {
    let value: serde_json::Value = serde_json::from_str(msg_text)?;

    // Handle subscription confirmation: map subscription ID to pubkey
    if let Some(result) = value.get("result") {
        if let Some(id) = value.get("id").and_then(|v| v.as_u64()) {
            let idx = (id - 1) as usize;
            if idx < subscriptions.len() {
                if let Some(sub_id) = result.as_u64() {
                    subscription_id_map.insert(sub_id, subscriptions[idx].clone());
                    debug!(sub_id = sub_id, pubkey = subscriptions[idx], "Subscription confirmed");
                }
            }
        }
        return Ok(());
    }

    // Handle account notification
    if value.get("method").and_then(|m| m.as_str()) == Some("accountNotification") {
        if let Some(params) = value.get("params") {
            let sub_id = params.get("subscription").and_then(|v| v.as_u64()).unwrap_or(0);
            
            // Get pubkey from subscription ID
            let pubkey = match subscription_id_map.get(&sub_id) {
                Some(pk) => pk.clone(),
                None => {
                    debug!(sub_id = sub_id, "Unknown subscription ID");
                    return Ok(());
                }
            };

            // Get pool info
            let pool_info = match pool_lookup.get(&pubkey) {
                Some(info) => info.clone(),
                None => {
                    debug!(pubkey = pubkey, "Pool not found in lookup");
                    return Ok(());
                }
            };

            // Extract account data
            if let Some(result) = params.get("result") {
                if let Some(value_obj) = result.get("value") {
                    let slot = result.get("context")
                        .and_then(|c| c.get("slot"))
                        .and_then(|s| s.as_u64())
                        .unwrap_or(0);

                    // Decode account data
                    if let Some(data_array) = value_obj.get("data").and_then(|d| d.as_array()) {
                        if let Some(data_b64) = data_array.first().and_then(|d| d.as_str()) {
                            let decoded = base64::Engine::decode(
                                &base64::engine::general_purpose::STANDARD,
                                data_b64
                            )?;

                            // Decode pool state using appropriate decoder
                            let pool_state: PoolState = match pool_info.decoder_type {
                                DecoderType::Raydium => raydium_decoder.decode(&decoded)?,
                                DecoderType::Orca => orca_decoder.decode(&decoded)?,
                                DecoderType::Meteora => meteora_decoder.decode(&decoded)?,
                            };

                            // Calculate price based on pool type
                            let price = match pool_state.specific_data {
                                decoder::SpecificPoolData::Amm { coin_vault_balance, pc_vault_balance } => {
                                    calculate_amm_price(
                                        coin_vault_balance,
                                        pc_vault_balance,
                                        pool_state.token_a_decimals,
                                        pool_state.token_b_decimals,
                                    )
                                }
                                decoder::SpecificPoolData::Clmm { sqrt_price, .. } => {
                                    // Use helper from OrcaDecoder (or implemented inline)
                                    // Logic: price = (sqrt_price / 2^64)^2 * decimal_adjustment
                                    let sqrt_price_f64 = sqrt_price as f64 / (1u128 << 64) as f64;
                                    let raw_price = sqrt_price_f64 * sqrt_price_f64;
                                    let decimal_adjustment = 10f64.powi(pool_state.token_a_decimals as i32 - pool_state.token_b_decimals as i32);
                                    raw_price * decimal_adjustment
                                }
                                decoder::SpecificPoolData::Dlmm { active_id, bin_step, .. } => {
                                    // Logic: price = (1 + bin_step / 10000)^active_id * decimal_adjustment
                                    let base = 1.0 + (bin_step as f64 / 10000.0);
                                    let raw_price = base.powi(active_id);
                                    let decimal_adjustment = 10f64.powi(pool_state.token_a_decimals as i32 - pool_state.token_b_decimals as i32);
                                    raw_price * decimal_adjustment
                                }
                            };

                            if price > 0.0 {
                                // Update cache
                                let price_data = PriceData::new(
                                    price,
                                    pool_state.liquidity as u64,
                                    slot,
                                    pool_state.token_a_reserve,
                                    pool_state.token_b_reserve,
                                    pool_state.fee_rate,
                                );

                                cache.update(&pool_info.pair, &pool_info.dex, price_data).await;

                                debug!(
                                    pair = pool_info.pair,
                                    dex = pool_info.dex,
                                    price = price,
                                    slot = slot,
                                    "Price updated"
                                );

                                // Broadcast price update
                                let _ = api_tx.send(ApiMessage::PriceUpdate {
                                    pair: pool_info.pair.clone(),
                                    dex: pool_info.dex.clone(),
                                    price,
                                    slot,
                                    ts: chrono::Utc::now().timestamp_millis() as u64,
                                });

                                // Scan for opportunities
                                scan_opportunities(
                                    &pool_info.pair,
                                    spatial_detector,
                                    stat_detector,
                                    triangular_detector,
                                    triangular_paths,
                                    pairs,
                                    api_tx,
                                ).await;
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

/// Scan for arbitrage opportunities after price update
async fn scan_opportunities(
    updated_pair: &str,
    spatial_detector: &Arc<OpportunityDetector>,
    stat_detector: &Arc<tokio::sync::RwLock<StatisticalArbitrageDetector>>,
    triangular_detector: &Arc<TriangularArbitrageDetector>,
    triangular_paths: &[detector::TriangularPath],
    _pairs: &[&str],
    api_tx: &tokio::sync::broadcast::Sender<ApiMessage>,
) {
    // 1. Spatial Arbitrage (cross-DEX)
    if let Some(opp) = spatial_detector.scan_pair(updated_pair).await {
        info!(
            opportunity = %opp,
            "🚀 SPATIAL ARBITRAGE DETECTED"
        );
        let _ = api_tx.send(ApiMessage::OpportunityFound(opp));
    }

    // 2. Triangular Arbitrage (scan all paths)
    for path in triangular_paths {
        if let Some(opp) = triangular_detector.detect(path).await {
            info!(
                opportunity = %opp,
                "🔺 TRIANGULAR ARBITRAGE DETECTED"
            );
            let _ = api_tx.send(ApiMessage::OpportunityFound(opp));
        }
    }

    // 3. Statistical Arbitrage would be scanned periodically, not on every update
    // This is handled separately due to the need for historical data
}

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,solana_price_monitor=debug"));

    tracing_subscriber::registry()
        .with(filter)
        .with(tracing_subscriber::fmt::layer())
        .init();
}
