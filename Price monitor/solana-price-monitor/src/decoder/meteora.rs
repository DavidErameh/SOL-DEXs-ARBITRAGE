//! Meteora DLMM (Dynamic Liquidity Market Maker) decoder

use borsh::{BorshDeserialize, BorshSerialize};
use solana_sdk::pubkey::Pubkey;
use super::{PoolDecoder, PoolState};
use anyhow::Result;

/// Meteora DLMM LbPair account state
/// Layout based on Meteora DLMM program
#[derive(BorshDeserialize, BorshSerialize, Debug, Clone)]
pub struct LbPairState {
    pub parameters: LbPairParameters,
    pub v_parameters: VParameters,
    pub bump_seed: [u8; 1],
    pub bin_step_seed: [u8; 2],
    pub pair_type: u8,
    pub active_id: i32,
    pub bin_step: u16,
    pub status: u8,
    pub require_base_factor_seed: u8,
    pub base_factor_seed: [u8; 2],
    pub padding_1: [u8; 2],
    pub token_x_mint: Pubkey,
    pub token_y_mint: Pubkey,
    pub reserve_x: Pubkey,
    pub reserve_y: Pubkey,
    pub protocol_fee: ProtocolFee,
    pub padding_2: [u8; 32],
    pub reward_infos: [RewardInfo; 2],
    pub oracle: Pubkey,
    pub bin_array_bitmap: [u64; 16],
    pub last_updated_at: i64,
    pub whitelisted_wallet: Pubkey,
    pub pre_activation_swap_address: Pubkey,
    pub base_key: Pubkey,
    pub activation_slot: u64,
    pub pre_activation_slot_duration: u64,
    pub padding_3: [u8; 8],
    pub lock_duration: u64,
    pub creator: Pubkey,
    pub reserved: [u8; 24],
}

#[derive(BorshDeserialize, BorshSerialize, Debug, Clone, Default)]
pub struct LbPairParameters {
    pub base_factor: u16,
    pub filter_period: u16,
    pub decay_period: u16,
    pub reduction_factor: u16,
    pub variable_fee_control: u32,
    pub max_volatility_accumulator: u32,
    pub min_bin_id: i32,
    pub max_bin_id: i32,
    pub protocol_share: u16,
    pub padding: [u8; 6],
}

#[derive(BorshDeserialize, BorshSerialize, Debug, Clone, Default)]
pub struct VParameters {
    pub volatility_accumulator: u32,
    pub volatility_reference: u32,
    pub index_reference: i32,
    pub padding: [u8; 4],
    pub last_update_timestamp: i64,
    pub padding_2: [u8; 8],
}

#[derive(BorshDeserialize, BorshSerialize, Debug, Clone, Default)]
pub struct ProtocolFee {
    pub amount_x: u64,
    pub amount_y: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Debug, Clone, Default)]
pub struct RewardInfo {
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub funder: Pubkey,
    pub reward_duration: u64,
    pub reward_duration_end: u64,
    pub reward_rate: u128,
    pub last_update_time: u64,
    pub cumulative_seconds_with_empty_liquidity_reward: u64,
}

pub struct MeteoraDecoder {
    /// Decimals for token X
    pub token_x_decimals: u8,
    /// Decimals for token Y
    pub token_y_decimals: u8,
}

impl Default for MeteoraDecoder {
    fn default() -> Self {
        Self {
            token_x_decimals: 9,  // SOL default
            token_y_decimals: 6,  // USDC default
        }
    }
}

impl MeteoraDecoder {
    pub fn new(token_x_decimals: u8, token_y_decimals: u8) -> Self {
        Self {
            token_x_decimals,
            token_y_decimals,
        }
    }

    /// Calculate price from active bin ID and bin step
    /// Formula: price = (1 + bin_step / 10000) ^ active_id
    pub fn calculate_price_from_bin(&self, active_id: i32, bin_step: u16) -> f64 {
        let base = 1.0 + (bin_step as f64 / 10000.0);
        let raw_price = base.powi(active_id);
        
        // Adjust for decimal differences
        let decimal_adjustment = 10f64.powi(self.token_x_decimals as i32 - self.token_y_decimals as i32);
        raw_price * decimal_adjustment
    }

    /// Calculate fee rate from bin step
    /// Meteora uses dynamic fees based on volatility
    pub fn calculate_fee_rate(&self, bin_step: u16, base_factor: u16) -> f64 {
        // Base fee = bin_step * base_factor / 10^10
        (bin_step as f64 * base_factor as f64) / 10_000_000_000.0
    }
}

impl PoolDecoder for MeteoraDecoder {
    fn decode(&self, data: &[u8]) -> Result<PoolState> {
        // Meteora uses Anchor, skip 8 byte discriminator
        if data.len() < 8 {
            anyhow::bail!("Data too short for Meteora DLMM");
        }

        let lb_pair = LbPairState::try_from_slice(&data[8..])?;

        let fee_rate = self.calculate_fee_rate(
            lb_pair.bin_step,
            lb_pair.parameters.base_factor,
        );

        Ok(PoolState {
            token_a_reserve: 0, // DLMM uses bins, not simple reserves
            token_b_reserve: 0,
            token_a_decimals: self.token_x_decimals,
            token_b_decimals: self.token_y_decimals,
            fee_rate,
            liquidity: 0, // Would need to aggregate across bins
            specific_data: super::SpecificPoolData::Dlmm {
                active_id: lb_pair.active_id,
                bin_step: lb_pair.bin_step,
                base_factor: lb_pair.parameters.base_factor,
            },
        })
    }

    fn dex_name(&self) -> &'static str {
        "meteora"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_price_from_bin() {
        let decoder = MeteoraDecoder::new(9, 6);
        
        // bin_step = 100 (1%), active_id = 0 => price = 1.0
        let price = decoder.calculate_price_from_bin(0, 100);
        assert!((price - 1000.0).abs() < 0.001); // With decimal adjustment
        
        // active_id = 100, bin_step = 100 => price = 1.01^100 ≈ 2.7
        let price = decoder.calculate_price_from_bin(100, 100);
        assert!(price > 2000.0); // With decimal adjustment
    }

    #[test]
    fn test_fee_calculation() {
        let decoder = MeteoraDecoder::default();
        
        // bin_step = 25, base_factor = 10000 => fee = 25 * 10000 / 10^10 = 0.000025
        let fee = decoder.calculate_fee_rate(25, 10000);
        assert!((fee - 0.000025).abs() < 0.0000001);
    }
}
