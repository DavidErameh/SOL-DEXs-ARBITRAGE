use super::{PoolDecoder, PoolState};
use anyhow::Result;

pub struct MeteoraDecoder;

impl PoolDecoder for MeteoraDecoder {
    fn decode(&self, _data: &[u8]) -> Result<PoolState> {
        // Placeholder for Meteora DLMM
        // TODO: Implement Meteora DLMM layout
        Ok(PoolState {
            token_a_reserve: 0,
            token_b_reserve: 0,
            token_a_decimals: 0,
            token_b_decimals: 0,
            fee_rate: 0.0,
            liquidity: 0,
        })
    }

    fn dex_name(&self) -> &'static str {
        "meteora"
    }
}
