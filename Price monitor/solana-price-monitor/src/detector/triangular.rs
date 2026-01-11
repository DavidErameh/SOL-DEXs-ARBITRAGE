//! Triangular arbitrage detection (A → B → C → A)

use crate::cache::PriceCache;
use crate::config::FeesConfig;
use crate::models::{Opportunity, OpportunityType};
use chrono::Utc;
use std::sync::Arc;
use tracing::debug;

/// Configuration for triangular arbitrage
#[derive(Debug, Clone)]
pub struct TriangularArbConfig {
    /// Minimum profit threshold after fees (percentage)
    pub min_profit_percent: f64,
    /// Maximum slot difference allowed between prices
    pub slot_tolerance: u64,
}

impl Default for TriangularArbConfig {
    fn default() -> Self {
        Self {
            min_profit_percent: 0.3,
            slot_tolerance: 2,
        }
    }
}

/// A triangular path through three trading pairs
#[derive(Debug, Clone)]
pub struct TriangularPath {
    /// Starting token (e.g., "SOL")
    pub token_start: String,
    /// Intermediate token 1 (e.g., "USDC")
    pub token_mid: String,
    /// Intermediate token 2 (e.g., "BONK")
    pub token_end: String,
    /// Trading pair for leg 1: start -> mid
    pub pair_1: String,
    /// Trading pair for leg 2: mid -> end
    pub pair_2: String,
    /// Trading pair for leg 3: end -> start
    pub pair_3: String,
    /// DEX to execute on (single-DEX triangular)
    pub dex: String,
}

impl TriangularPath {
    pub fn new(
        token_start: &str,
        token_mid: &str,
        token_end: &str,
        dex: &str,
    ) -> Self {
        Self {
            token_start: token_start.to_string(),
            token_mid: token_mid.to_string(),
            token_end: token_end.to_string(),
            pair_1: format!("{}-{}", token_start, token_mid),
            pair_2: format!("{}-{}", token_mid, token_end),
            pair_3: format!("{}-{}", token_end, token_start),
            dex: dex.to_string(),
        }
    }
}

/// Detector for triangular arbitrage opportunities
pub struct TriangularArbitrageDetector {
    cache: Arc<PriceCache>,
    config: TriangularArbConfig,
    fees: FeesConfig,
}

impl TriangularArbitrageDetector {
    pub fn new(cache: Arc<PriceCache>, config: TriangularArbConfig, fees: FeesConfig) -> Self {
        Self {
            cache,
            config,
            fees,
        }
    }

    /// Detect triangular arbitrage opportunity for a given path
    pub async fn detect(&self, path: &TriangularPath) -> Option<Opportunity> {
        // Get prices for all three legs (DashMap is lock-free, no await)
        let price_1 = self.cache.get(&path.pair_1, &path.dex)?;
        let price_2 = self.cache.get(&path.pair_2, &path.dex)?;
        let price_3 = self.cache.get(&path.pair_3, &path.dex)?;

        // Check for stale data
        if self.cache.is_stale(&price_1) 
            || self.cache.is_stale(&price_2) 
            || self.cache.is_stale(&price_3) 
        {
            return None;
        }

        // Validate slot alignment
        let max_slot = price_1.slot.max(price_2.slot).max(price_3.slot);
        let min_slot = price_1.slot.min(price_2.slot).min(price_3.slot);
        if max_slot - min_slot > self.config.slot_tolerance {
            debug!(
                path = ?path,
                slot_diff = max_slot - min_slot,
                "Triangular path slot desynchronization"
            );
            return None;
        }

        // Calculate effective rates for each leg
        // Leg 1: Start -> Mid (selling Start for Mid)
        let rate_1 = price_1.price * (1.0 - price_1.fee_rate);
        // Leg 2: Mid -> End (selling Mid for End)
        let rate_2 = price_2.price * (1.0 - price_2.fee_rate);
        // Leg 3: End -> Start (selling End for Start)
        let rate_3 = price_3.price * (1.0 - price_3.fee_rate);

        // Calculate final amount after full cycle
        // Starting with 1 unit of token_start
        let final_amount = rate_1 * rate_2 * rate_3;

        // Calculate profit percentage
        let gross_profit_percent = (final_amount - 1.0) * 100.0;

        // Deduct additional costs (gas, tips, slippage for 3 swaps)
        let additional_costs = self.fees.gas_cost_percent 
            + self.fees.jito_tip_percent 
            + (self.fees.estimated_slippage * 3.0); // 3 swaps
        
        let net_profit_percent = gross_profit_percent - additional_costs;

        debug!(
            path = format!("{} -> {} -> {} -> {}", 
                path.token_start, path.token_mid, path.token_end, path.token_start),
            gross = gross_profit_percent,
            net = net_profit_percent,
            "Triangular arbitrage calculation"
        );

        if net_profit_percent > self.config.min_profit_percent {
            // Calculate recommended size based on minimum liquidity
            let min_liquidity = price_1.liquidity.min(price_2.liquidity).min(price_3.liquidity);
            let recommended_size = (min_liquidity as f64 * 0.03) as u64; // 3% of smallest pool

            // Calculate confidence based on liquidity and slot alignment
            let confidence = calculate_triangular_confidence(
                min_liquidity,
                max_slot - min_slot,
            );

            return Some(Opportunity {
                opportunity_type: OpportunityType::Triangular,
                token_pair: format!("{}->{}->{}->{}",
                    path.token_start, path.token_mid, path.token_end, path.token_start),
                buy_dex: path.dex.clone(),
                sell_dex: path.dex.clone(),
                buy_price: 1.0, // Starting with 1 unit
                sell_price: final_amount,
                net_profit_percent,
                recommended_size,
                confidence,
                detected_at: Utc::now(),
            });
        }

        None
    }

    /// Scan all configured triangular paths
    pub async fn scan_all(&self, paths: &[TriangularPath]) -> Vec<Opportunity> {
        let mut opportunities = Vec::new();

        for path in paths {
            if let Some(opp) = self.detect(path).await {
                opportunities.push(opp);
            }
        }

        opportunities
    }
}

fn calculate_triangular_confidence(min_liquidity: u64, slot_diff: u64) -> f64 {
    // Higher liquidity and lower slot difference = higher confidence
    let liquidity_factor = (min_liquidity as f64 / 1_000_000.0).min(1.0);
    let slot_factor = 1.0 - (slot_diff as f64 / 5.0).min(0.5);

    (liquidity_factor * 0.5 + slot_factor * 0.5).clamp(0.0, 1.0)
}

/// Generate common triangular paths for Solana DEXs
pub fn generate_common_paths(dex: &str) -> Vec<TriangularPath> {
    vec![
        // SOL-based triangles
        TriangularPath::new("SOL", "USDC", "BONK", dex),
        TriangularPath::new("SOL", "USDC", "JTO", dex),
        TriangularPath::new("SOL", "USDC", "JUP", dex),
        TriangularPath::new("SOL", "USDC", "RAY", dex),
        TriangularPath::new("SOL", "USDT", "BONK", dex),
        // Stablecoin bridges
        TriangularPath::new("SOL", "USDC", "USDT", dex),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_triangular_path_creation() {
        let path = TriangularPath::new("SOL", "USDC", "BONK", "raydium");
        
        assert_eq!(path.token_start, "SOL");
        assert_eq!(path.pair_1, "SOL-USDC");
        assert_eq!(path.pair_2, "USDC-BONK");
        assert_eq!(path.pair_3, "BONK-SOL");
    }

    #[test]
    fn test_generate_common_paths() {
        let paths = generate_common_paths("raydium");
        assert!(paths.len() >= 5);
    }

    #[test]
    fn test_confidence_calculation() {
        // High liquidity, low slot diff
        let conf = calculate_triangular_confidence(1_000_000, 0);
        assert!(conf > 0.8);

        // Low liquidity, high slot diff
        let conf = calculate_triangular_confidence(100_000, 3);
        assert!(conf < 0.6);
    }
}
