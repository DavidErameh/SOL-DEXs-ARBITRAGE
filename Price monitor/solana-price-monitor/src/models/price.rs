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
