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
