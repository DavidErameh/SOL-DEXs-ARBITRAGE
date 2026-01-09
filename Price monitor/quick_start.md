# Quick Start Guide

## Solana Price Monitoring System - Complete Setup

**Version**: 1.0  
**Last Updated**: January 2026  
**Target**: AI Coding Agents & Developers

---

## Overview

This guide provides **complete, executable steps** to set up the Solana Price Monitor project from scratch. Every command, file, and configuration is included with verification checkpoints.

**Time to Complete**: ~15 minutes  
**End Result**: Compiling Rust project with all module scaffolds

---

## 1. PREREQUISITES

### 1.1 Required Tools

| Tool  | Minimum Version | Check Command     | Purpose            |
| ----- | --------------- | ----------------- | ------------------ |
| Rust  | 1.75.0          | `rustc --version` | Language toolchain |
| Cargo | 1.75.0          | `cargo --version` | Package manager    |
| Git   | Any             | `git --version`   | Version control    |

### 1.2 Install Rust (if not installed)

**Windows (PowerShell as Administrator):**

```powershell
# Download and run rustup installer
Invoke-WebRequest -Uri https://win.rustup.rs -OutFile rustup-init.exe
.\rustup-init.exe -y
# Restart terminal after installation
```

**macOS/Linux:**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env
```

### 1.3 Verify Installation

```bash
rustc --version
# Expected output: rustc 1.75.0 (xx 2024-xx-xx) or higher

cargo --version
# Expected output: cargo 1.75.0 (xx 2024-xx-xx) or higher
```

> [!NOTE]
> If Rust version is below 1.75, run: `rustup update stable`

---

## 2. PROJECT INITIALIZATION

### 2.1 Create Project Directory

**Windows (PowerShell):**

```powershell
cd C:\Users\Administrator\SOL DEXs ARBITRAGE\Price monitor
New-Item -ItemType Directory -Name "solana-price-monitor" -Force
cd solana-price-monitor
```

**macOS/Linux:**

```bash
cd ~/projects  # or your preferred location
mkdir -p solana-price-monitor
cd solana-price-monitor
```

### 2.2 Initialize Cargo Project

```bash
cargo init --name solana-price-monitor
```

**Expected output:**

```
     Created binary (application) package
```

### 2.3 Create Directory Structure

**Windows (PowerShell):**

```powershell
# Create all module directories
$dirs = @(
    "src/config",
    "src/websocket",
    "src/decoder",
    "src/cache",
    "src/calculator",
    "src/detector",
    "src/models",
    "src/utils"
)
foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Path $dir -Force
}
```

**macOS/Linux:**

```bash
mkdir -p src/{config,websocket,decoder,cache,calculator,detector,models,utils}
```

### 2.4 Verify Structure

```bash
# List structure (works on both platforms)
cargo tree 2>/dev/null || echo "Dependencies not yet configured"
```

**Expected directory structure:**

```
solana-price-monitor/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── config/
│   ├── websocket/
│   ├── decoder/
│   ├── cache/
│   ├── calculator/
│   ├── detector/
│   ├── models/
│   └── utils/
```

---

## 3. DEPENDENCY CONFIGURATION

### 3.1 Replace Cargo.toml

Replace the entire contents of `Cargo.toml` with:

```toml
[package]
name = "solana-price-monitor"
version = "0.1.0"
edition = "2021"
rust-version = "1.75"
description = "Real-time Solana DEX price monitoring and arbitrage detection"
authors = ["Development Team"]

[dependencies]
# ============================================
# ASYNC RUNTIME
# ============================================
tokio = { version = "1.35", features = ["full"] }
futures = "0.3"

# ============================================
# WEBSOCKET & NETWORKING
# ============================================
tokio-tungstenite = { version = "0.21", features = ["native-tls"] }
tonic = "0.11"
prost = "0.12"

# ============================================
# SOLANA SDK (2026 Stable)
# ============================================
solana-sdk = "1.18"
solana-client = "1.18"

# ============================================
# SERIALIZATION
# ============================================
borsh = "1.5"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
base64 = "0.21"

# ============================================
# ERROR HANDLING
# ============================================
anyhow = "1.0"
thiserror = "1.0"

# ============================================
# LOGGING & TRACING
# ============================================
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }

# ============================================
# CONFIGURATION
# ============================================
config = "0.14"
dotenv = "0.15"

# ============================================
# STATISTICS & MATH
# ============================================
statrs = "0.17"

# ============================================
# DATE/TIME
# ============================================
chrono = { version = "0.4", features = ["serde"] }

[dev-dependencies]
criterion = "0.5"
mockall = "0.12"
tokio-test = "0.4"

[[bench]]
name = "price_calculation"
harness = false

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
strip = true
panic = "abort"

[profile.dev]
opt-level = 0
debug = true
```

---

## 4. CONFIGURATION FILES

### 4.1 Create config.toml

Create file `config.toml` in the project root:

```toml
# ============================================
# Solana Price Monitor Configuration
# ============================================

[rpc]
# Helius RPC endpoints (loaded from environment)
websocket_url = "${HELIUS_WS_URL}"
http_url = "${HELIUS_HTTP_URL}"

[monitoring]
# Maximum number of pools to monitor simultaneously
max_pools = 50
# Time-to-live for cache entries in seconds
cache_ttl_seconds = 60
# Cleanup interval for stale entries
cleanup_interval_seconds = 10
# Price staleness threshold in milliseconds
stale_threshold_ms = 2000

[arbitrage]
# Minimum net profit percentage to flag opportunity
min_profit_percent = 0.5
# Maximum trade size as percentage of pool liquidity
max_trade_size_percent = 5.0
# Maximum slot difference for price comparison
slot_tolerance = 2

[fees]
# Default DEX fee percentage
default_dex_fee = 0.25
# Estimated slippage percentage
estimated_slippage = 0.3
# Gas cost as percentage of trade
gas_cost_percent = 0.01
# Jito tip as percentage of trade
jito_tip_percent = 0.05

# ============================================
# Pool Addresses by Token Pair
# ============================================

[pools.sol_usdc]
raydium = "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2"
orca = "HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ"
meteora = "7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5"

[pools.sol_usdt]
raydium = "7XawhbbxtsRcQA8KTkHT9f9nc6d69UwqCDh6U5EEbEmX"
```

### 4.2 Create .env.example

Create file `.env.example` in the project root:

```bash
# ============================================
# Solana Price Monitor Environment Variables
# ============================================

# Helius API Configuration
# Get your free API key at: https://dev.helius.xyz/
HELIUS_API_KEY=your-api-key-here

# Constructed URLs (do not modify format)
HELIUS_WS_URL=wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}
HELIUS_HTTP_URL=https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}

# Logging Configuration
# Options: trace, debug, info, warn, error
RUST_LOG=info,solana_price_monitor=debug

# Optional: Prometheus metrics port
# METRICS_PORT=9090
```

### 4.3 Create .gitignore

Create file `.gitignore` in the project root:

```gitignore
# Build artifacts
/target/
**/*.rs.bk

# Environment files (contain secrets)
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# Logs
*.log
logs/

# OS files
.DS_Store
Thumbs.db

# Benchmark data
*.profdata
```

---

## 5. SOURCE FILE SCAFFOLDING

### 5.1 src/main.rs

Replace the contents of `src/main.rs`:

```rust
//! Solana Price Monitor - Entry Point
//!
//! Real-time price monitoring and arbitrage detection for Solana DEXs.

use anyhow::Result;
use tracing::{info, error};
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

    // TODO: Initialize components
    // - WebSocket manager
    // - Price cache
    // - Opportunity detector

    info!("Solana Price Monitor initialized. Ready to connect.");

    // Keep running (placeholder for actual event loop)
    tokio::signal::ctrl_c().await?;
    info!("Shutdown signal received. Exiting.");

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
```

### 5.2 src/lib.rs

Create file `src/lib.rs`:

```rust
//! Solana Price Monitor Library
//!
//! This crate provides real-time price monitoring and arbitrage detection
//! for Solana DEXs including Raydium, Orca, and Meteora.

pub mod cache;
pub mod calculator;
pub mod config;
pub mod decoder;
pub mod detector;
pub mod models;
pub mod utils;
pub mod websocket;

// Re-export commonly used types
pub use cache::PriceCache;
pub use config::Settings;
pub use detector::OpportunityDetector;
pub use models::{Opportunity, OpportunityType, PriceData};
```

### 5.3 src/config/mod.rs

Create file `src/config/mod.rs`:

```rust
//! Configuration management module
//!
//! Loads settings from config.toml and environment variables.

use anyhow::{Context, Result};
use serde::Deserialize;
use std::collections::HashMap;

/// Application settings loaded from config.toml and environment
#[derive(Debug, Deserialize, Clone)]
pub struct Settings {
    pub rpc: RpcConfig,
    pub monitoring: MonitoringConfig,
    pub arbitrage: ArbitrageConfig,
    pub fees: FeesConfig,
    pub pools: HashMap<String, HashMap<String, String>>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct RpcConfig {
    pub websocket_url: String,
    pub http_url: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct MonitoringConfig {
    pub max_pools: usize,
    pub cache_ttl_seconds: u64,
    pub cleanup_interval_seconds: u64,
    pub stale_threshold_ms: u64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ArbitrageConfig {
    pub min_profit_percent: f64,
    pub max_trade_size_percent: f64,
    pub slot_tolerance: u64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct FeesConfig {
    pub default_dex_fee: f64,
    pub estimated_slippage: f64,
    pub gas_cost_percent: f64,
    pub jito_tip_percent: f64,
}

impl Settings {
    /// Load settings from config.toml and environment variables
    pub fn load() -> Result<Self> {
        // Load .env file if present
        dotenv::dotenv().ok();

        let builder = config::Config::builder()
            .add_source(config::File::with_name("config").required(false))
            .add_source(config::Environment::with_prefix("APP").separator("__"));

        let settings = builder
            .build()
            .context("Failed to build configuration")?
            .try_deserialize::<Settings>()
            .context("Failed to deserialize configuration")?;

        // Validate required fields
        settings.validate()?;

        Ok(settings)
    }

    fn validate(&self) -> Result<()> {
        if self.rpc.websocket_url.contains("your-api-key") {
            anyhow::bail!("HELIUS_WS_URL not configured. Please set your API key in .env");
        }

        if self.monitoring.max_pools == 0 {
            anyhow::bail!("max_pools must be greater than 0");
        }

        if self.arbitrage.min_profit_percent <= 0.0 {
            anyhow::bail!("min_profit_percent must be positive");
        }

        Ok(())
    }
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            rpc: RpcConfig {
                websocket_url: String::new(),
                http_url: String::new(),
            },
            monitoring: MonitoringConfig {
                max_pools: 50,
                cache_ttl_seconds: 60,
                cleanup_interval_seconds: 10,
                stale_threshold_ms: 2000,
            },
            arbitrage: ArbitrageConfig {
                min_profit_percent: 0.5,
                max_trade_size_percent: 5.0,
                slot_tolerance: 2,
            },
            fees: FeesConfig {
                default_dex_fee: 0.25,
                estimated_slippage: 0.3,
                gas_cost_percent: 0.01,
                jito_tip_percent: 0.05,
            },
            pools: HashMap::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = Settings::default();
        assert_eq!(settings.monitoring.max_pools, 50);
        assert_eq!(settings.arbitrage.min_profit_percent, 0.5);
    }
}
```

### 5.4 src/models/mod.rs

Create file `src/models/mod.rs`:

```rust
//! Data models for the price monitoring system

mod price;
mod opportunity;

pub use price::PriceData;
pub use opportunity::{Opportunity, OpportunityType};
```

### 5.5 src/models/price.rs

Create file `src/models/price.rs`:

```rust
//! Price data structures

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Represents price data for a token pair on a specific DEX
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceData {
    /// Normalized price (output tokens per input token)
    pub price: f64,

    /// Pool liquidity in USD
    pub liquidity: u64,

    /// Solana slot number when price was captured
    pub slot: u64,

    /// Timestamp of the price update
    pub timestamp: DateTime<Utc>,

    /// Vault A balance (for slippage calculation)
    pub vault_a_balance: u64,

    /// Vault B balance (for slippage calculation)
    pub vault_b_balance: u64,

    /// DEX fee rate (e.g., 0.003 for 0.3%)
    pub fee_rate: f64,
}

impl PriceData {
    /// Create new PriceData with current timestamp
    pub fn new(
        price: f64,
        liquidity: u64,
        slot: u64,
        vault_a_balance: u64,
        vault_b_balance: u64,
        fee_rate: f64,
    ) -> Self {
        Self {
            price,
            liquidity,
            slot,
            timestamp: Utc::now(),
            vault_a_balance,
            vault_b_balance,
            fee_rate,
        }
    }

    /// Check if price data is stale (older than threshold)
    pub fn is_stale(&self, threshold_ms: u64) -> bool {
        let age = Utc::now() - self.timestamp;
        age.num_milliseconds() as u64 > threshold_ms
    }

    /// Calculate price impact for a given trade size
    pub fn calculate_price_impact(&self, trade_size: u64) -> f64 {
        let smaller_vault = self.vault_a_balance.min(self.vault_b_balance);
        if smaller_vault == 0 {
            return 100.0; // Maximum impact for empty pool
        }
        (trade_size as f64 / smaller_vault as f64) * 100.0
    }
}

impl Default for PriceData {
    fn default() -> Self {
        Self {
            price: 0.0,
            liquidity: 0,
            slot: 0,
            timestamp: Utc::now(),
            vault_a_balance: 0,
            vault_b_balance: 0,
            fee_rate: 0.003,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_price_data_creation() {
        let price = PriceData::new(100.0, 1_000_000, 12345, 500_000, 500_000, 0.003);
        assert_eq!(price.price, 100.0);
        assert_eq!(price.slot, 12345);
    }

    #[test]
    fn test_price_impact() {
        let price = PriceData::new(100.0, 1_000_000, 12345, 100_000, 100_000, 0.003);
        let impact = price.calculate_price_impact(1_000);
        assert!((impact - 1.0).abs() < 0.001); // 1% impact
    }
}
```

### 5.6 src/models/opportunity.rs

Create file `src/models/opportunity.rs`:

```rust
//! Arbitrage opportunity structures

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Type of arbitrage opportunity
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OpportunityType {
    /// Price difference between two DEXs for same pair
    Spatial,
    /// Mean reversion based on statistical analysis
    Statistical,
    /// Circular path through three tokens
    Triangular,
}

/// Represents a detected arbitrage opportunity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Opportunity {
    /// Type of arbitrage
    pub opportunity_type: OpportunityType,

    /// Token pair (e.g., "SOL-USDC")
    pub token_pair: String,

    /// DEX to buy from (lower price)
    pub buy_dex: String,

    /// DEX to sell on (higher price)
    pub sell_dex: String,

    /// Price on buy DEX
    pub buy_price: f64,

    /// Price on sell DEX
    pub sell_price: f64,

    /// Net profit after all costs (percentage)
    pub net_profit_percent: f64,

    /// Recommended trade size in base units
    pub recommended_size: u64,

    /// Confidence score (0.0 - 1.0)
    pub confidence: f64,

    /// When the opportunity was detected
    pub detected_at: DateTime<Utc>,
}

impl Opportunity {
    /// Calculate gross profit percentage (before costs)
    pub fn gross_profit_percent(&self) -> f64 {
        if self.buy_price == 0.0 {
            return 0.0;
        }
        ((self.sell_price - self.buy_price) / self.buy_price) * 100.0
    }

    /// Check if opportunity is still valid (not too old)
    pub fn is_valid(&self, max_age_ms: u64) -> bool {
        let age = Utc::now() - self.detected_at;
        age.num_milliseconds() as u64 <= max_age_ms
    }

    /// Get a human-readable summary
    pub fn summary(&self) -> String {
        format!(
            "{:?}: {} | Buy {} @ {:.4} -> Sell {} @ {:.4} | Net: {:.2}%",
            self.opportunity_type,
            self.token_pair,
            self.buy_dex,
            self.buy_price,
            self.sell_dex,
            self.sell_price,
            self.net_profit_percent
        )
    }
}

impl std::fmt::Display for Opportunity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.summary())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gross_profit_calculation() {
        let opp = Opportunity {
            opportunity_type: OpportunityType::Spatial,
            token_pair: "SOL-USDC".to_string(),
            buy_dex: "raydium".to_string(),
            sell_dex: "orca".to_string(),
            buy_price: 100.0,
            sell_price: 101.0,
            net_profit_percent: 0.5,
            recommended_size: 1000,
            confidence: 0.85,
            detected_at: Utc::now(),
        };

        assert!((opp.gross_profit_percent() - 1.0).abs() < 0.001);
    }
}
```

### 5.7 src/cache/mod.rs

Create file `src/cache/mod.rs`:

```rust
//! In-memory price cache with TTL support

use crate::models::PriceData;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tracing::{debug, info};

/// Thread-safe price cache with automatic cleanup
pub struct PriceCache {
    /// Inner data: Map<TokenPair, Map<DEX, PriceData>>
    data: Arc<RwLock<HashMap<String, HashMap<String, PriceData>>>>,
    /// Time-to-live for cache entries
    ttl: Duration,
    /// Staleness threshold in milliseconds
    stale_threshold_ms: u64,
}

impl PriceCache {
    /// Create a new price cache
    pub fn new(ttl_seconds: u64, stale_threshold_ms: u64) -> Self {
        Self {
            data: Arc::new(RwLock::new(HashMap::new())),
            ttl: Duration::from_secs(ttl_seconds),
            stale_threshold_ms,
        }
    }

    /// Get price for a specific pair and DEX
    pub async fn get(&self, pair: &str, dex: &str) -> Option<PriceData> {
        let cache = self.data.read().await;
        cache.get(pair)?.get(dex).cloned()
    }

    /// Get all DEX prices for a token pair
    pub async fn get_all_dexes(&self, pair: &str) -> Vec<(String, PriceData)> {
        let cache = self.data.read().await;
        cache
            .get(pair)
            .map(|m| m.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
            .unwrap_or_default()
    }

    /// Update price for a pair/DEX combination
    pub async fn update(&self, pair: &str, dex: &str, price_data: PriceData) {
        let mut cache = self.data.write().await;
        cache
            .entry(pair.to_string())
            .or_insert_with(HashMap::new)
            .insert(dex.to_string(), price_data);

        debug!(pair = pair, dex = dex, "Price cache updated");
    }

    /// Check if data is stale
    pub fn is_stale(&self, data: &PriceData) -> bool {
        data.is_stale(self.stale_threshold_ms)
    }

    /// Remove stale entries from cache
    pub async fn cleanup_stale_entries(&self) {
        let mut cache = self.data.write().await;
        let mut removed = 0;

        for pair_map in cache.values_mut() {
            pair_map.retain(|_, price_data| {
                let keep = !price_data.is_stale(self.ttl.as_millis() as u64);
                if !keep {
                    removed += 1;
                }
                keep
            });
        }

        // Remove empty pair entries
        cache.retain(|_, v| !v.is_empty());

        if removed > 0 {
            info!(removed = removed, "Cleaned up stale cache entries");
        }
    }

    /// Get total number of cached prices
    pub async fn len(&self) -> usize {
        let cache = self.data.read().await;
        cache.values().map(|m| m.len()).sum()
    }

    /// Check if cache is empty
    pub async fn is_empty(&self) -> bool {
        self.len().await == 0
    }

    /// Spawn background cleanup task
    pub fn spawn_cleanup_task(cache: Arc<Self>, interval: Duration) {
        tokio::spawn(async move {
            let mut ticker = tokio::time::interval(interval);
            loop {
                ticker.tick().await;
                cache.cleanup_stale_entries().await;
            }
        });
    }
}

impl Clone for PriceCache {
    fn clone(&self) -> Self {
        Self {
            data: Arc::clone(&self.data),
            ttl: self.ttl,
            stale_threshold_ms: self.stale_threshold_ms,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_cache_operations() {
        let cache = PriceCache::new(60, 2000);

        let price = PriceData::new(100.0, 1_000_000, 12345, 500_000, 500_000, 0.003);
        cache.update("SOL-USDC", "raydium", price.clone()).await;

        let retrieved = cache.get("SOL-USDC", "raydium").await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().price, 100.0);
    }

    #[tokio::test]
    async fn test_get_all_dexes() {
        let cache = PriceCache::new(60, 2000);

        cache.update("SOL-USDC", "raydium", PriceData::new(100.0, 1_000_000, 1, 500_000, 500_000, 0.003)).await;
        cache.update("SOL-USDC", "orca", PriceData::new(100.5, 800_000, 1, 400_000, 400_000, 0.003)).await;

        let all = cache.get_all_dexes("SOL-USDC").await;
        assert_eq!(all.len(), 2);
    }
}
```

### 5.8 src/calculator/mod.rs

Create file `src/calculator/mod.rs`:

```rust
//! Price calculation module

mod amm;

pub use amm::{calculate_amm_price, calculate_output_amount, calculate_clmm_price};
```

### 5.9 src/calculator/amm.rs

Create file `src/calculator/amm.rs`:

```rust
//! AMM and CLMM price calculation functions

/// Calculate spot price for constant product AMM (x * y = k)
///
/// # Arguments
/// * `reserve_in` - Reserve of input token
/// * `reserve_out` - Reserve of output token
/// * `decimals_in` - Decimals of input token
/// * `decimals_out` - Decimals of output token
///
/// # Returns
/// Normalized price (output per input)
pub fn calculate_amm_price(
    reserve_in: u64,
    reserve_out: u64,
    decimals_in: u8,
    decimals_out: u8,
) -> f64 {
    if reserve_in == 0 {
        return 0.0;
    }

    let adj_reserve_in = reserve_in as f64 / 10f64.powi(decimals_in as i32);
    let adj_reserve_out = reserve_out as f64 / 10f64.powi(decimals_out as i32);

    adj_reserve_out / adj_reserve_in
}

/// Calculate output amount for a swap with fees
///
/// # Arguments
/// * `amount_in` - Amount of input token
/// * `reserve_in` - Reserve of input token
/// * `reserve_out` - Reserve of output token
/// * `fee_rate` - Fee rate (e.g., 0.003 for 0.3%)
///
/// # Returns
/// Amount of output token received
pub fn calculate_output_amount(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
    fee_rate: f64,
) -> u64 {
    if reserve_in == 0 || reserve_out == 0 {
        return 0;
    }

    let amount_in_with_fee = amount_in as f64 * (1.0 - fee_rate);
    let numerator = amount_in_with_fee * reserve_out as f64;
    let denominator = reserve_in as f64 + amount_in_with_fee;

    (numerator / denominator) as u64
}

/// Calculate price from CLMM sqrt_price (Q64.64 fixed-point)
///
/// # Arguments
/// * `sqrt_price_x64` - Square root of price in Q64.64 format
///
/// # Returns
/// Actual price
pub fn calculate_clmm_price(sqrt_price_x64: u128) -> f64 {
    let sqrt_price = sqrt_price_x64 as f64 / (1u128 << 64) as f64;
    sqrt_price * sqrt_price
}

/// Estimate slippage for CLMM swap
///
/// # Arguments
/// * `amount_in` - Trade size
/// * `liquidity` - Pool liquidity
///
/// # Returns
/// Estimated slippage percentage
pub fn estimate_clmm_slippage(amount_in: u64, liquidity: u128) -> f64 {
    if liquidity == 0 {
        return 100.0;
    }

    let price_impact = (amount_in as f64) / (liquidity as f64) * 100.0;
    price_impact.min(10.0) // Cap at 10%
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_amm_price_calculation() {
        // 1 SOL = 100 USDC scenario
        // SOL vault: 1000 SOL (9 decimals)
        // USDC vault: 100000 USDC (6 decimals)
        let price = calculate_amm_price(
            1_000_000_000_000, // 1000 SOL in lamports
            100_000_000_000,   // 100000 USDC in micro-units
            9,
            6,
        );

        assert!((price - 100.0).abs() < 0.001);
    }

    #[test]
    fn test_output_amount() {
        let output = calculate_output_amount(
            1_000_000_000, // 1 SOL
            100_000_000_000_000, // 100k SOL reserve
            10_000_000_000_000,  // 10M USDC reserve
            0.003, // 0.3% fee
        );

        // Should get approximately 99.7 USDC worth (minus slippage)
        assert!(output > 0);
    }

    #[test]
    fn test_clmm_price() {
        // sqrt_price for price = 100 would be sqrt(100) = 10
        // In Q64.64: 10 * 2^64
        let sqrt_price_x64: u128 = 10 * (1u128 << 64);
        let price = calculate_clmm_price(sqrt_price_x64);

        assert!((price - 100.0).abs() < 0.001);
    }
}
```

### 5.10 src/detector/mod.rs

Create file `src/detector/mod.rs`:

```rust
//! Opportunity detection module

mod spatial;

pub use spatial::{detect_spatial_arbitrage, OpportunityDetector};
```

### 5.11 src/detector/spatial.rs

Create file `src/detector/spatial.rs`:

```rust
//! Spatial arbitrage detection (cross-DEX price differences)

use crate::cache::PriceCache;
use crate::config::FeesConfig;
use crate::models::{Opportunity, OpportunityType, PriceData};
use chrono::Utc;
use std::sync::Arc;
use tracing::debug;

/// Detector for spatial arbitrage opportunities
pub struct OpportunityDetector {
    cache: Arc<PriceCache>,
    fees: FeesConfig,
    min_profit_percent: f64,
    slot_tolerance: u64,
}

impl OpportunityDetector {
    /// Create a new opportunity detector
    pub fn new(
        cache: Arc<PriceCache>,
        fees: FeesConfig,
        min_profit_percent: f64,
        slot_tolerance: u64,
    ) -> Self {
        Self {
            cache,
            fees,
            min_profit_percent,
            slot_tolerance,
        }
    }

    /// Scan for spatial arbitrage on a token pair
    pub async fn scan_pair(&self, pair: &str) -> Option<Opportunity> {
        detect_spatial_arbitrage(
            &self.cache,
            pair,
            self.min_profit_percent,
            &self.fees,
            self.slot_tolerance,
        ).await
    }

    /// Scan all configured pairs
    pub async fn scan_all(&self, pairs: &[&str]) -> Vec<Opportunity> {
        let mut opportunities = Vec::new();

        for pair in pairs {
            if let Some(opp) = self.scan_pair(pair).await {
                opportunities.push(opp);
            }
        }

        opportunities
    }
}

/// Detect spatial arbitrage opportunity for a token pair
pub async fn detect_spatial_arbitrage(
    cache: &PriceCache,
    pair: &str,
    min_profit: f64,
    fees: &FeesConfig,
    slot_tolerance: u64,
) -> Option<Opportunity> {
    let prices = cache.get_all_dexes(pair).await;

    if prices.len() < 2 {
        debug!(pair = pair, count = prices.len(), "Not enough DEXs for comparison");
        return None;
    }

    // Find min and max prices
    let (buy_dex, buy_data) = prices
        .iter()
        .filter(|(_, p)| !cache.is_stale(p))
        .min_by(|a, b| a.1.price.partial_cmp(&b.1.price).unwrap_or(std::cmp::Ordering::Equal))?;

    let (sell_dex, sell_data) = prices
        .iter()
        .filter(|(_, p)| !cache.is_stale(p))
        .max_by(|a, b| a.1.price.partial_cmp(&b.1.price).unwrap_or(std::cmp::Ordering::Equal))?;

    // Same DEX = no opportunity
    if buy_dex == sell_dex {
        return None;
    }

    // Validate slot alignment
    if sell_data.slot.abs_diff(buy_data.slot) > slot_tolerance {
        debug!(
            pair = pair,
            buy_slot = buy_data.slot,
            sell_slot = sell_data.slot,
            "Slot desynchronization"
        );
        return None;
    }

    // Calculate gross profit
    let gross_profit = (sell_data.price - buy_data.price) / buy_data.price * 100.0;

    // Calculate total costs
    let total_costs = calculate_total_costs(buy_data, sell_data, fees);
    let net_profit = gross_profit - total_costs;

    if net_profit > min_profit {
        let recommended_size = calculate_optimal_size(buy_data, sell_data);
        let confidence = calculate_confidence(buy_data, sell_data);

        Some(Opportunity {
            opportunity_type: OpportunityType::Spatial,
            token_pair: pair.to_string(),
            buy_dex: buy_dex.clone(),
            sell_dex: sell_dex.clone(),
            buy_price: buy_data.price,
            sell_price: sell_data.price,
            net_profit_percent: net_profit,
            recommended_size,
            confidence,
            detected_at: Utc::now(),
        })
    } else {
        None
    }
}

fn calculate_total_costs(buy: &PriceData, sell: &PriceData, fees: &FeesConfig) -> f64 {
    let buy_fee = buy.fee_rate * 100.0;
    let sell_fee = sell.fee_rate * 100.0;

    buy_fee + sell_fee + fees.estimated_slippage + fees.gas_cost_percent + fees.jito_tip_percent
}

fn calculate_optimal_size(buy: &PriceData, sell: &PriceData) -> u64 {
    // Use minimum liquidity to avoid excessive slippage
    let min_liquidity = buy.liquidity.min(sell.liquidity);

    // Cap at 5% of minimum pool
    (min_liquidity as f64 * 0.05) as u64
}

fn calculate_confidence(buy: &PriceData, sell: &PriceData) -> f64 {
    // Confidence based on:
    // - Slot alignment (closer = higher)
    // - Liquidity depth
    // - Data freshness

    let slot_diff = buy.slot.abs_diff(sell.slot) as f64;
    let slot_factor = 1.0 - (slot_diff / 10.0).min(0.5);

    let min_liquidity = buy.liquidity.min(sell.liquidity) as f64;
    let liquidity_factor = (min_liquidity / 1_000_000.0).min(1.0);

    (slot_factor * 0.6 + liquidity_factor * 0.4).clamp(0.0, 1.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_spatial_detection() {
        let cache = Arc::new(PriceCache::new(60, 2000));

        // Add prices with a spread
        cache.update("SOL-USDC", "raydium", PriceData::new(100.0, 1_000_000, 100, 500_000, 500_000, 0.003)).await;
        cache.update("SOL-USDC", "orca", PriceData::new(102.0, 800_000, 100, 400_000, 400_000, 0.003)).await;

        let fees = FeesConfig {
            default_dex_fee: 0.25,
            estimated_slippage: 0.3,
            gas_cost_percent: 0.01,
            jito_tip_percent: 0.05,
        };

        let opp = detect_spatial_arbitrage(&cache, "SOL-USDC", 0.5, &fees, 2).await;

        // 2% gross - ~0.9% costs = ~1.1% net profit
        assert!(opp.is_some());
        let opp = opp.unwrap();
        assert_eq!(opp.buy_dex, "raydium");
        assert_eq!(opp.sell_dex, "orca");
    }
}
```

### 5.12 src/websocket/mod.rs

Create file `src/websocket/mod.rs`:

```rust
//! WebSocket connection management

use anyhow::Result;
use std::time::Duration;
use tracing::{info, warn, error};

/// WebSocket connection manager for Helius Geyser
pub struct WebSocketManager {
    url: String,
    reconnect_attempts: u32,
    max_reconnect_delay: Duration,
}

impl WebSocketManager {
    /// Create a new WebSocket manager
    pub fn new(url: String) -> Self {
        Self {
            url,
            reconnect_attempts: 0,
            max_reconnect_delay: Duration::from_secs(30),
        }
    }

    /// Connect to WebSocket with exponential backoff
    pub async fn connect_with_backoff(&mut self) -> Result<()> {
        let delay = Duration::from_millis(
            100 * 2u64.pow(self.reconnect_attempts.min(8))
        );

        let actual_delay = delay.min(self.max_reconnect_delay);

        if self.reconnect_attempts > 0 {
            warn!(
                attempt = self.reconnect_attempts,
                delay_ms = actual_delay.as_millis(),
                "Reconnecting to WebSocket"
            );
            tokio::time::sleep(actual_delay).await;
        }

        match self.connect().await {
            Ok(_) => {
                self.reconnect_attempts = 0;
                info!("WebSocket connected successfully");
                Ok(())
            }
            Err(e) => {
                self.reconnect_attempts += 1;
                error!(error = ?e, "WebSocket connection failed");
                Err(e)
            }
        }
    }

    /// Internal connection logic (placeholder)
    async fn connect(&self) -> Result<()> {
        // TODO: Implement actual WebSocket connection
        // For now, just validate URL format
        if self.url.is_empty() || !self.url.starts_with("wss://") {
            anyhow::bail!("Invalid WebSocket URL");
        }

        info!(url = %self.url, "Would connect to WebSocket");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_websocket_manager_creation() {
        let manager = WebSocketManager::new("wss://example.com".to_string());
        assert_eq!(manager.reconnect_attempts, 0);
    }
}
```

### 5.13 src/decoder/mod.rs

Create file `src/decoder/mod.rs`:

```rust
//! DEX account data decoders

use anyhow::Result;
use borsh::BorshDeserialize;

/// Trait for DEX-specific decoders
pub trait PoolDecoder {
    /// Decode raw account data into pool state
    fn decode(&self, data: &[u8]) -> Result<PoolState>;

    /// Get DEX name
    fn dex_name(&self) -> &'static str;
}

/// Normalized pool state across all DEX types
#[derive(Debug, Clone)]
pub struct PoolState {
    pub token_a_reserve: u64,
    pub token_b_reserve: u64,
    pub token_a_decimals: u8,
    pub token_b_decimals: u8,
    pub fee_rate: f64,
    pub liquidity: u128,
}

/// Raydium AMM decoder (placeholder)
pub struct RaydiumDecoder;

impl PoolDecoder for RaydiumDecoder {
    fn decode(&self, _data: &[u8]) -> Result<PoolState> {
        // TODO: Implement actual Raydium decoding
        anyhow::bail!("Raydium decoder not yet implemented")
    }

    fn dex_name(&self) -> &'static str {
        "raydium"
    }
}

/// Orca Whirlpool decoder (placeholder)
pub struct OrcaDecoder;

impl PoolDecoder for OrcaDecoder {
    fn decode(&self, _data: &[u8]) -> Result<PoolState> {
        // TODO: Implement actual Orca decoding
        anyhow::bail!("Orca decoder not yet implemented")
    }

    fn dex_name(&self) -> &'static str {
        "orca"
    }
}

/// Meteora DLMM decoder (placeholder)
pub struct MeteoraDecoder;

impl PoolDecoder for MeteoraDecoder {
    fn decode(&self, _data: &[u8]) -> Result<PoolState> {
        // TODO: Implement actual Meteora decoding
        anyhow::bail!("Meteora decoder not yet implemented")
    }

    fn dex_name(&self) -> &'static str {
        "meteora"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decoder_names() {
        assert_eq!(RaydiumDecoder.dex_name(), "raydium");
        assert_eq!(OrcaDecoder.dex_name(), "orca");
        assert_eq!(MeteoraDecoder.dex_name(), "meteora");
    }
}
```

### 5.14 src/utils/mod.rs

Create file `src/utils/mod.rs`:

```rust
//! Utility functions

mod health;

pub use health::{HealthStatus, check_health};
```

### 5.15 src/utils/health.rs

Create file `src/utils/health.rs`:

```rust
//! Health check utilities

use serde::Serialize;

/// Health status of the system
#[derive(Debug, Clone, Serialize)]
pub struct HealthStatus {
    pub healthy: bool,
    pub cache_entries: usize,
    pub websocket_connected: bool,
    pub last_update_ms: u64,
    pub uptime_seconds: u64,
}

impl HealthStatus {
    pub fn new() -> Self {
        Self {
            healthy: true,
            cache_entries: 0,
            websocket_connected: false,
            last_update_ms: 0,
            uptime_seconds: 0,
        }
    }
}

impl Default for HealthStatus {
    fn default() -> Self {
        Self::new()
    }
}

/// Perform health check
pub fn check_health(
    cache_entries: usize,
    websocket_connected: bool,
    last_update_ms: u64,
    uptime_seconds: u64,
) -> HealthStatus {
    let stale_threshold = 5000; // 5 seconds

    let healthy = websocket_connected && last_update_ms < stale_threshold;

    HealthStatus {
        healthy,
        cache_entries,
        websocket_connected,
        last_update_ms,
        uptime_seconds,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_check() {
        let status = check_health(10, true, 100, 3600);
        assert!(status.healthy);
        assert_eq!(status.cache_entries, 10);
    }

    #[test]
    fn test_unhealthy_when_disconnected() {
        let status = check_health(0, false, 100, 60);
        assert!(!status.healthy);
    }
}
```

---

## 6. BUILD VERIFICATION

### 6.1 Verify Syntax

```bash
cargo check
```

**Expected output:**

```
   Compiling solana-price-monitor v0.1.0 (/path/to/project)
    Finished dev [unoptimized + debuginfo] target(s) in X.XXs
```

### 6.2 Build Debug Version

```bash
cargo build
```

**Expected output:**

```
   Compiling solana-price-monitor v0.1.0
    Finished dev [unoptimized + debuginfo] target(s) in X.XXs
```

### 6.3 Run All Tests

```bash
cargo test
```

**Expected output:**

```
running X tests
test cache::tests::test_cache_operations ... ok
test cache::tests::test_get_all_dexes ... ok
test calculator::amm::tests::test_amm_price_calculation ... ok
test calculator::amm::tests::test_output_amount ... ok
test calculator::amm::tests::test_clmm_price ... ok
test config::tests::test_default_settings ... ok
test decoder::tests::test_decoder_names ... ok
test detector::spatial::tests::test_spatial_detection ... ok
test models::opportunity::tests::test_gross_profit_calculation ... ok
test models::price::tests::test_price_data_creation ... ok
test models::price::tests::test_price_impact ... ok
test utils::health::tests::test_health_check ... ok
test utils::health::tests::test_unhealthy_when_disconnected ... ok
test websocket::tests::test_websocket_manager_creation ... ok

test result: ok. X passed; 0 failed; 0 ignored
```

### 6.4 Check Formatting

```bash
cargo fmt --check
```

**Expected output:** (no output means code is formatted correctly)

If formatting issues exist, fix with:

```bash
cargo fmt
```

### 6.5 Run Clippy Lints

```bash
cargo clippy -- -D warnings
```

**Expected output:**

```
    Finished dev [unoptimized + debuginfo] target(s)
```

### 6.6 Build Release Version

```bash
cargo build --release
```

**Expected output:**

```
   Compiling solana-price-monitor v0.1.0
    Finished release [optimized] target(s) in X.XXs
```

---

## 7. SMOKE TEST

### 7.1 Run the Application

```bash
cargo run
```

**Expected output:**

```
2026-01-09T17:00:00.000000Z  INFO solana_price_monitor: Starting Solana Price Monitor v0.1.0
2026-01-09T17:00:00.000000Z  INFO solana_price_monitor: Configuration loaded successfully
...
```

> [!NOTE]
> The application will exit with a configuration error if `.env` is not configured, which is expected for the smoke test.

---

## 8. NEXT STEPS

After completing this Quick Start, proceed with:

- [ ] **Obtain Helius API key** at [https://dev.helius.xyz/](https://dev.helius.xyz/) (free tier available)
- [ ] **Configure environment**: Copy `.env.example` to `.env` and add your API key
- [ ] **Implement WebSocket connection**: Complete the WebSocket manager with actual Helius integration
- [ ] **Add DEX decoders**: Implement Raydium, Orca, and Meteora account parsers
- [ ] **Connect components**: Wire up the price cache with live data
- [ ] **Test with real data**: Monitor actual pool prices

---

## 9. TROUBLESHOOTING

| Issue                             | Cause                    | Solution                                   |
| --------------------------------- | ------------------------ | ------------------------------------------ |
| `solana-sdk` compilation error    | Rust version too old     | Run `rustup update stable`                 |
| `error[E0433]: failed to resolve` | Missing module file      | Verify all `mod.rs` files exist            |
| OpenSSL/TLS errors                | Missing system libraries | Install OpenSSL dev package                |
| Very slow builds                  | Debug mode + cold cache  | Use `cargo build --release`                |
| Test failures                     | Async runtime issues     | Ensure `tokio-test` is in dev-dependencies |

---

## 10. VERIFICATION CHECKLIST

Before considering setup complete, verify:

- [ ] `cargo check` passes with no errors
- [ ] `cargo build` succeeds
- [ ] `cargo test` runs with all tests passing
- [ ] `cargo clippy -- -D warnings` shows no warnings
- [ ] `cargo run` starts and shows log output
- [ ] All 15 source files are created
- [ ] Directory structure matches specification

---

**Document Version**: 1.0  
**Created**: January 2026  
**Status**: Ready for Agent Execution
