//! AMM and CLMM price calculation functions

/// Calculate spot price for constant product AMM (x * y = k)
///
/// # Arguments
/// * `reserve_in` - Reserve of input token
/// * `reserve_out` - Reserve of output token
/// * `decimals_in` - Decimals of input token
/// * `decimals_out` - Decimals of output token
///
/// # Returns
/// Normalized price (output per input)
pub fn calculate_amm_price(
    reserve_in: u64,
    reserve_out: u64,
    decimals_in: u8,
    decimals_out: u8,
) -> f64 {
    if reserve_in == 0 {
        return 0.0;
    }

    let adj_reserve_in = reserve_in as f64 / 10f64.powi(decimals_in as i32);
    let adj_reserve_out = reserve_out as f64 / 10f64.powi(decimals_out as i32);

    adj_reserve_out / adj_reserve_in
}

/// Calculate output amount for a swap with fees
///
/// # Arguments
/// * `amount_in` - Amount of input token
/// * `reserve_in` - Reserve of input token
/// * `reserve_out` - Reserve of output token
/// * `fee_rate` - Fee rate (e.g., 0.003 for 0.3%)
///
/// # Returns
/// Amount of output token received
pub fn calculate_output_amount(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
    fee_rate: f64,
) -> u64 {
    if reserve_in == 0 || reserve_out == 0 {
        return 0;
    }

    let amount_in_with_fee = amount_in as f64 * (1.0 - fee_rate);
    let numerator = amount_in_with_fee * reserve_out as f64;
    let denominator = reserve_in as f64 + amount_in_with_fee;

    (numerator / denominator) as u64
}

/// Calculate price from CLMM sqrt_price (Q64.64 fixed-point)
///
/// # Arguments
/// * `sqrt_price_x64` - Square root of price in Q64.64 format
///
/// # Returns
/// Actual price
pub fn calculate_clmm_price(sqrt_price_x64: u128) -> f64 {
    let sqrt_price = sqrt_price_x64 as f64 / (1u128 << 64) as f64;
    sqrt_price * sqrt_price
}

/// Estimate slippage for CLMM swap
///
/// # Arguments
/// * `amount_in` - Trade size
/// * `liquidity` - Pool liquidity
///
/// # Returns
/// Estimated slippage percentage
pub fn estimate_clmm_slippage(amount_in: u64, liquidity: u128) -> f64 {
    if liquidity == 0 {
        return 100.0;
    }

    let price_impact = (amount_in as f64) / (liquidity as f64) * 100.0;
    price_impact.min(10.0) // Cap at 10%
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_amm_price_calculation() {
        // 1 SOL = 100 USDC scenario
        // SOL vault: 1000 SOL (9 decimals)
        // USDC vault: 100000 USDC (6 decimals)
        let price = calculate_amm_price(
            1_000_000_000_000, // 1000 SOL in lamports
            100_000_000_000,   // 100000 USDC in micro-units
            9,
            6,
        );

        assert!((price - 100.0).abs() < 0.001);
    }

    #[test]
    fn test_output_amount() {
        let output = calculate_output_amount(
            1_000_000_000, // 1 SOL
            100_000_000_000_000, // 100k SOL reserve
            10_000_000_000_000,  // 10M USDC reserve
            0.003, // 0.3% fee
        );

        // Should get approximately 99.7 USDC worth (minus slippage)
        assert!(output > 0);
    }

    #[test]
    fn test_clmm_price() {
        // sqrt_price for price = 100 would be sqrt(100) = 10
        // In Q64.64: 10 * 2^64
        let sqrt_price_x64: u128 = 10 * (1u128 << 64);
        let price = calculate_clmm_price(sqrt_price_x64);

        assert!((price - 100.0).abs() < 0.001);
    }
}
