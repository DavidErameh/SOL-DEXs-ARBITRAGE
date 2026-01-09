use borsh::{BorshDeserialize, BorshSerialize};
use solana_sdk::pubkey::Pubkey;
use super::{PoolDecoder, PoolState};
use anyhow::Result;

#[derive(BorshDeserialize, BorshSerialize, Debug, Clone)]
pub struct WhirlpoolState {
    pub whirlpool_bump: [u8; 1],
    pub tick_spacing: u16,
    pub tick_spacing_seed: [u8; 2],
    pub fee_rate: u16,              // Basis points (e.g., 30 = 0.3%)
    pub protocol_fee_rate: u16,
    pub liquidity: u128,            // Current liquidity
    pub sqrt_price: u128,           // Q64.64 fixed-point
    pub tick_current_index: i32,
    pub protocol_fee_owed_a: u64,
    pub protocol_fee_owed_b: u64,
    pub token_mint_a: Pubkey,
    pub token_vault_a: Pubkey,
    pub fee_growth_global_a: u128,
    pub token_mint_b: Pubkey,
    pub token_vault_b: Pubkey,
    pub fee_growth_global_b: u128,
    pub reward_last_updated_timestamp: u64,
    // ... truncated for brevity, we only need up to here for price/liquidity
}

pub struct OrcaDecoder;

impl PoolDecoder for OrcaDecoder {
    fn decode(&self, data: &[u8]) -> Result<PoolState> {
        // Orca Whirlpools are Anchor accounts, so skip 8 byte discriminator
        if data.len() < 8 {
            anyhow::bail!("Data too short for Orca Whirlpool");
        }
        
        let whirlpool = WhirlpoolState::try_from_slice(&data[8..])?;

        // Calculate reserves is complex for CLMM, usually we rely on sqrt_price and liquidity
        // For PoolState normalization, we might store 0 for reserves if we use CLMM math
        
        Ok(PoolState {
            token_a_reserve: 0, // CLMM doesn't have simple reserves
            token_b_reserve: 0,
            token_a_decimals: 0, // Need to fetch from mints or config
            token_b_decimals: 0,
            fee_rate: whirlpool.fee_rate as f64 / 10000.0,
            liquidity: whirlpool.liquidity,
        })
    }

    fn dex_name(&self) -> &'static str {
        "orca"
    }
}
