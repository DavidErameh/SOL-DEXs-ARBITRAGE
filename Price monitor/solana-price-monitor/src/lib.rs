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
pub use detector::{OpportunityDetector, StatisticalArbitrageDetector, TriangularArbitrageDetector};
pub use models::{Opportunity, OpportunityType, PriceData};

