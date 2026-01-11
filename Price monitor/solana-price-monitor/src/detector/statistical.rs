//! Statistical arbitrage detection (mean reversion / pairs trading)

use crate::cache::PriceCache;
use crate::models::{Opportunity, OpportunityType};
use chrono::Utc;
use std::collections::VecDeque;
use std::sync::Arc;
use tracing::debug;

/// Configuration for statistical arbitrage
#[derive(Debug, Clone)]
pub struct StatArbConfig {
    /// Minimum correlation threshold for pair selection
    pub min_correlation: f64,
    /// Z-score threshold for entry signals (e.g., 2.0 = 2 standard deviations)
    pub z_score_entry: f64,
    /// Z-score threshold for exit signals (e.g., 0.0 = mean)
    pub z_score_exit: f64,
    /// Stop loss z-score threshold
    pub z_score_stop_loss: f64,
    /// Rolling window size for statistics
    pub window_size: usize,
    /// Minimum profit threshold (percentage)
    pub min_profit_percent: f64,
}

impl Default for StatArbConfig {
    fn default() -> Self {
        Self {
            min_correlation: 0.7,
            z_score_entry: 2.0,
            z_score_exit: 0.0,
            z_score_stop_loss: 3.0,
            window_size: 100,
            min_profit_percent: 0.3,
        }
    }
}

/// Statistics for a cointegrated pair
#[derive(Debug, Clone)]
pub struct PairStatistics {
    pub token_a: String,
    pub token_b: String,
    pub beta: f64,                    // Cointegration coefficient
    pub mean_spread: f64,             // Historical mean
    pub std_dev_spread: f64,          // Standard deviation
    pub half_life: f64,               // Mean reversion speed (seconds)
    pub spread_history: VecDeque<f64>, // Rolling window
    pub last_updated: i64,
}

impl PairStatistics {
    pub fn new(token_a: String, token_b: String, window_size: usize) -> Self {
        Self {
            token_a,
            token_b,
            beta: 1.0,
            mean_spread: 0.0,
            std_dev_spread: 1.0,
            half_life: 3600.0, // 1 hour default
            spread_history: VecDeque::with_capacity(window_size),
            last_updated: Utc::now().timestamp(),
        }
    }

    /// Update statistics with new spread observation
    pub fn update(&mut self, spread: f64, window_size: usize) {
        self.spread_history.push_back(spread);
        
        // Maintain window size
        while self.spread_history.len() > window_size {
            self.spread_history.pop_front();
        }

        // Recalculate statistics if we have enough data
        if self.spread_history.len() >= 20 {
            self.recalculate_statistics();
        }

        self.last_updated = Utc::now().timestamp();
    }

    fn recalculate_statistics(&mut self) {
        let spreads: Vec<f64> = self.spread_history.iter().cloned().collect();
        let n = spreads.len() as f64;

        // Mean
        self.mean_spread = spreads.iter().sum::<f64>() / n;

        // Standard deviation
        let variance = spreads.iter()
            .map(|x| (x - self.mean_spread).powi(2))
            .sum::<f64>() / n;
        self.std_dev_spread = variance.sqrt().max(0.0001); // Prevent division by zero
    }

    /// Calculate current z-score
    pub fn calculate_z_score(&self, current_spread: f64) -> f64 {
        (current_spread - self.mean_spread) / self.std_dev_spread
    }
}

/// Detector for statistical arbitrage opportunities
pub struct StatisticalArbitrageDetector {
    cache: Arc<PriceCache>,
    config: StatArbConfig,
    pair_stats: std::collections::HashMap<String, PairStatistics>,
}

impl StatisticalArbitrageDetector {
    pub fn new(cache: Arc<PriceCache>, config: StatArbConfig) -> Self {
        Self {
            cache,
            config,
            pair_stats: std::collections::HashMap::new(),
        }
    }

    /// Calculate spread between two token pairs
    /// spread = log(price_A) - β * log(price_B)
    fn calculate_spread(&self, price_a: f64, price_b: f64, beta: f64) -> f64 {
        price_a.ln() - beta * price_b.ln()
    }

    /// Detect statistical arbitrage opportunity between two correlated pairs
    pub async fn detect(
        &mut self,
        pair_a: &str,
        pair_b: &str,
        dex: &str,
    ) -> Option<Opportunity> {
        // Get prices for both pairs (DashMap is lock-free, no await)
        let price_a = self.cache.get(pair_a, dex)?;
        let price_b = self.cache.get(pair_b, dex)?;

        // Check for stale data
        if self.cache.is_stale(&price_a) || self.cache.is_stale(&price_b) {
            return None;
        }

        // Get or create pair statistics
        let stats_key = format!("{}:{}", pair_a, pair_b);
        
        // First, get the beta value if stats exist, or use default
        let beta = self.pair_stats.get(&stats_key)
            .map(|s| s.beta)
            .unwrap_or(1.0);

        // Calculate current spread using the extracted beta
        let current_spread = self.calculate_spread(price_a.price, price_b.price, beta);
        
        // Now get or create the stats (mutable borrow)
        let stats = self.pair_stats.entry(stats_key.clone()).or_insert_with(|| {
            PairStatistics::new(pair_a.to_string(), pair_b.to_string(), self.config.window_size)
        });
        
        // Update statistics
        stats.update(current_spread, self.config.window_size);

        // Need enough history for reliable signals
        if stats.spread_history.len() < 20 {
            return None;
        }

        // Calculate z-score
        let z_score = stats.calculate_z_score(current_spread);

        debug!(
            pair_a = pair_a,
            pair_b = pair_b,
            z_score = z_score,
            mean = stats.mean_spread,
            std = stats.std_dev_spread,
            "Statistical arbitrage scan"
        );

        // Check entry signals
        if z_score.abs() > self.config.z_score_entry {
            // Estimate profit based on mean reversion expectation
            let expected_reversion = z_score.abs() * stats.std_dev_spread;
            let estimated_profit_percent = (expected_reversion / current_spread.abs()) * 100.0;

            if estimated_profit_percent > self.config.min_profit_percent {
                let (buy_pair, sell_pair) = if z_score < 0.0 {
                    // Spread too low: buy A, sell B
                    (pair_a.to_string(), pair_b.to_string())
                } else {
                    // Spread too high: sell A, buy B
                    (pair_b.to_string(), pair_a.to_string())
                };

                return Some(Opportunity {
                    opportunity_type: OpportunityType::Statistical,
                    token_pair: format!("{}:{}", pair_a, pair_b),
                    buy_dex: dex.to_string(),
                    sell_dex: dex.to_string(),
                    buy_price: price_a.price,
                    sell_price: price_b.price,
                    net_profit_percent: estimated_profit_percent,
                    recommended_size: (price_a.liquidity.min(price_b.liquidity) as f64 * 0.02) as u64,
                    confidence: calculate_confidence(z_score, stats.spread_history.len()),
                    detected_at: Utc::now(),
                });
            }
        }

        None
    }
}

fn calculate_confidence(z_score: f64, history_len: usize) -> f64 {
    // More extreme z-score and longer history = higher confidence
    let z_factor = (z_score.abs() / 3.0).min(1.0);
    let history_factor = (history_len as f64 / 100.0).min(1.0);
    
    (z_factor * 0.6 + history_factor * 0.4).clamp(0.0, 1.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pair_statistics() {
        let mut stats = PairStatistics::new("BTC".to_string(), "ETH".to_string(), 100);
        
        // Add some spread observations
        for i in 0..30 {
            let spread = 0.05 + (i as f64 * 0.001);
            stats.update(spread, 100);
        }

        assert!(stats.spread_history.len() == 30);
        assert!(stats.mean_spread > 0.0);
        assert!(stats.std_dev_spread > 0.0);
    }

    #[test]
    fn test_z_score_calculation() {
        let mut stats = PairStatistics::new("A".to_string(), "B".to_string(), 100);
        stats.mean_spread = 0.05;
        stats.std_dev_spread = 0.01;

        // 2 standard deviations above mean
        let z_score = stats.calculate_z_score(0.07);
        assert!((z_score - 2.0).abs() < 0.001);

        // 2 standard deviations below mean
        let z_score = stats.calculate_z_score(0.03);
        assert!((z_score + 2.0).abs() < 0.001);
    }
}
