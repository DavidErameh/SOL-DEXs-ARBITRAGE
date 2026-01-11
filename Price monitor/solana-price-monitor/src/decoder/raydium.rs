use borsh::{BorshDeserialize, BorshSerialize};
use solana_sdk::pubkey::Pubkey;
use super::{PoolDecoder, PoolState};
use anyhow::Result;

#[derive(BorshDeserialize, BorshSerialize, Debug, Clone)]
#[repr(C)]
pub struct RaydiumAmmInfo {
    pub status: u64,
    pub nonce: u64,
    pub order_num: u64,
    pub depth: u64,
    pub coin_decimals: u64,
    pub pc_decimals: u64,
    pub state: u64,
    pub reset_flag: u64,
    pub min_size: u64,
    pub vol_max_cut_ratio: u64,
    pub amount_wave_ratio: u64,
    pub coin_lot_size: u64,
    pub pc_lot_size: u64,
    pub min_price_multiplier: u64,
    pub max_price_multiplier: u64,
    pub sys_decimal_value: u64,
    pub fees: [u64; 8], // Padding/Fees
    pub coin_vault: Pubkey,
    pub pc_vault: Pubkey,
    pub coin_vault_balance: u64, // Reserve A
    pub pc_vault_balance: u64,   // Reserve B
    // We don't need to decode the rest for price monitoring
}

pub struct RaydiumDecoder;

impl PoolDecoder for RaydiumDecoder {
    fn decode(&self, data: &[u8]) -> Result<PoolState> {
        // Raydium AMM layout is complex and has a header. 
        // We usually skip the first 8 bytes (discriminator) if it's an Anchor account, 
        // but Raydium is raw Borsh/C-struct. 
        // However, standard Raydium AMM data starts directly.
        
        // Note: Real Raydium layout might be slightly different depending on version.
        // This follows the architecture.md spec.
        
        let amm_info = RaydiumAmmInfo::try_from_slice(data)?;

        Ok(PoolState {
            token_a_reserve: amm_info.coin_vault_balance,
            token_b_reserve: amm_info.pc_vault_balance,
            token_a_decimals: amm_info.coin_decimals as u8,
            token_b_decimals: amm_info.pc_decimals as u8,
            fee_rate: 0.0025, // Default Raydium fee 0.25%
            liquidity: 0, // Raydium V4 doesn't track liquidity in the same way as CLMM
            specific_data: super::SpecificPoolData::Amm {
                coin_vault_balance: amm_info.coin_vault_balance,
                pc_vault_balance: amm_info.pc_vault_balance,
            },
        })
    }

    fn dex_name(&self) -> &'static str {
        "raydium"
    }
}
