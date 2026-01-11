//! DEX account data decoders

use anyhow::Result;

pub mod raydium;
pub mod orca;
pub mod meteora;

pub use raydium::RaydiumDecoder;
pub use orca::OrcaDecoder;
pub use meteora::MeteoraDecoder;

/// Trait for DEX-specific decoders
pub trait PoolDecoder {
    /// Decode raw account data into pool state
    fn decode(&self, data: &[u8]) -> Result<PoolState>;

    /// Get DEX name
    fn dex_name(&self) -> &'static str;
}

/// Normalized pool state across all DEX types
#[derive(Debug, Clone)]
#[derive(Debug, Clone)]
pub struct PoolState {
    pub token_a_reserve: u64,
    pub token_b_reserve: u64,
    pub token_a_decimals: u8,
    pub token_b_decimals: u8,
    pub fee_rate: f64,
    pub liquidity: u128,
    pub specific_data: SpecificPoolData,
}

#[derive(Debug, Clone)]
pub enum SpecificPoolData {
    Amm { coin_vault_balance: u64, pc_vault_balance: u64 },
    Clmm { sqrt_price: u128, liquidity: u128 },
    Dlmm { active_id: i32, bin_step: u16, base_factor: u16 },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decoder_names() {
        assert_eq!(RaydiumDecoder.dex_name(), "raydium");
        assert_eq!(OrcaDecoder::default().dex_name(), "orca");
        assert_eq!(MeteoraDecoder::default().dex_name(), "meteora");
    }
}
