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

        let config = builder
            .build()
            .context("Failed to build configuration")?;

        let mut settings: Settings = config
            .try_deserialize()
            .context("Failed to deserialize configuration")?;

        // Resolve RPC URLs with priority: RPC_* > ALCHEMY_* > HELIUS_*
        settings.rpc = Self::resolve_rpc_config(&settings.rpc)?;

        // Validate required fields
        settings.validate()?;

        Ok(settings)
    }

    /// Resolve RPC URLs from environment variables with fallback chain
    fn resolve_rpc_config(current: &RpcConfig) -> Result<RpcConfig> {
        // Priority 1: Direct RPC_* environment variables
        if let (Ok(ws), Ok(http)) = (
            std::env::var("RPC_WS_URL"),
            std::env::var("RPC_HTTP_URL"),
        ) {
            if !ws.contains("${") && !http.contains("${") {
                return Ok(RpcConfig {
                    websocket_url: ws,
                    http_url: http,
                });
            }
        }

        // Priority 2: Alchemy API key
        if let Ok(api_key) = std::env::var("ALCHEMY_API_KEY") {
            if !api_key.is_empty() && !api_key.contains("your-") {
                return Ok(RpcConfig {
                    websocket_url: format!("wss://solana-mainnet.g.alchemy.com/v2/{}", api_key),
                    http_url: format!("https://solana-mainnet.g.alchemy.com/v2/{}", api_key),
                });
            }
        }

        // Priority 3: Helius API key (fallback)
        if let Ok(api_key) = std::env::var("HELIUS_API_KEY") {
            if !api_key.is_empty() && !api_key.contains("your-") {
                let cluster = std::env::var("SOLANA_CLUSTER").unwrap_or_else(|_| "mainnet".to_string());
                let (http_base, ws_base) = if cluster == "devnet" {
                    ("https://devnet.helius-rpc.com", "wss://devnet.helius-rpc.com")
                } else {
                    ("https://mainnet.helius-rpc.com", "wss://mainnet.helius-rpc.com")
                };

                return Ok(RpcConfig {
                    websocket_url: format!("{}?api-key={}", ws_base, api_key),
                    http_url: format!("{}?api-key={}", http_base, api_key),
                });
            }
        }

        // Fallback: Use config file values if they don't contain placeholders
        if !current.websocket_url.contains("${") && !current.http_url.contains("${") 
            && !current.websocket_url.is_empty() && !current.http_url.is_empty() {
            return Ok(current.clone());
        }

        anyhow::bail!("No valid RPC configuration found. Set ALCHEMY_API_KEY or HELIUS_API_KEY in .env")
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
