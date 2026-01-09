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
