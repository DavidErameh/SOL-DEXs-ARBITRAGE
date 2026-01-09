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
        // debug!(pair = pair, count = prices.len(), "Not enough DEXs for comparison");
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
    
    // Architecture: buy_fee + sell_fee + slippage + gas + tip
    buy_fee + sell_fee + fees.estimated_slippage + fees.gas_cost_percent + fees.jito_tip_percent
}

fn calculate_optimal_size(buy: &PriceData, sell: &PriceData) -> u64 {
    // Use minimum liquidity to avoid excessive slippage
    let min_liquidity = buy.liquidity.min(sell.liquidity);

    // Cap at 5% of minimum pool (Architecture recommendation)
    (min_liquidity as f64 * 0.05) as u64
}

fn calculate_confidence(buy: &PriceData, sell: &PriceData) -> f64 {
    // Confidence based on:
    // - Slot alignment (closer = higher)
    // - Liquidity depth
    
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

    #[test]
    fn test_profit_calculation() {
        let buy = PriceData::new(100.0, 1000, 1, 100, 100, 0.0025);
        let sell = PriceData::new(105.0, 1000, 1, 100, 100, 0.0030);
        let fees = FeesConfig {
            default_dex_fee: 0.25,
            estimated_slippage: 0.3,
            gas_cost_percent: 0.01,
            jito_tip_percent: 0.05,
        };
        
        // Gross: 5%
        // Costs: 0.25 + 0.30 + 0.3 + 0.01 + 0.05 = 0.91%
        // Net: 4.09%
        
        let costs = calculate_total_costs(&buy, &sell, &fees);
        assert!((costs - 0.91).abs() < 0.001);
    }
}
