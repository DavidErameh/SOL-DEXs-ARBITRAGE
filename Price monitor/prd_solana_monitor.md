# Product Requirements Document (PRD)

## Solana Real-Time Price Monitoring & Arbitrage Detection System

---

## 1. EXECUTIVE SUMMARY

### 1.1 Vision

Build a high-performance, real-time price monitoring system for Solana DEXs that forms the foundational infrastructure for profitable arbitrage trading. This system will achieve <400ms latency from price change to opportunity detection through WebSocket streams, in-memory caching, and advanced statistical analysis.

### 1.2 Success Metrics

- **Latency**: <400ms from price update to opportunity detection
- **Data Freshness**: Price updates within 100ms of on-chain changes
- **Accuracy**: 99.9% accurate price calculations across all DEX types
- **Uptime**: 99.5% system availability
- **Profitability Detection**: Identify opportunities with >0.5% net profit after all costs

---

## 2. PROBLEM STATEMENT

### 2.1 Core Challenge

Arbitrage opportunities on Solana exist for 200-800ms due to:

- Fragmented liquidity across multiple DEXs (Raydium, Orca, Meteora)
- Temporary price imbalances from large trades
- Information asymmetry between bots

**The Challenge**: Most bots are too slow. By the time they detect and execute, the opportunity is gone.

### 2.2 Why Existing Solutions Fail

1. **Polling-based systems**: 500-2000ms update latency
2. **API-dependent systems**: 200-500ms latency + rate limits
3. **Poor data structures**: Slow lookups and comparisons
4. **Single strategy**: Only spatial arbitrage, missing statistical opportunities
5. **No MEV protection**: Vulnerable to front-running

---

## 3. CORE REQUIREMENTS

### 3.1 Functional Requirements

#### FR-1: Real-Time Price Monitoring

- **FR-1.1**: Subscribe to pool updates via Alchemy (primary) or Helius (fallback)
- **FR-1.2**: Monitor minimum 10 token pairs across 3+ DEXs simultaneously
- **FR-1.3**: Decode and parse DEX-specific account structures:
  - Raydium AMM (Constant Product)
  - Orca Whirlpools (Concentrated Liquidity)
  - Meteora DLMM (Dynamic Liquidity Market Maker)
- **FR-1.4**: Normalize all price data to consistent format with token decimals

#### FR-2: In-Memory Price Cache

- **FR-2.1**: Store prices in `DashMap<TokenPair, DashMap<DEX, PriceData>>` (lock-free)
- **FR-2.2**: Include metadata: price, liquidity, timestamp, slot, block height
- **FR-2.3**: Track pool addresses and vault balances for slippage calculation
- **FR-2.4**: Implement automatic cache cleanup (TTL: 60 seconds)

#### FR-3: Multi-Strategy Opportunity Detection

**FR-3.1: Spatial Arbitrage** (Primary Strategy)

- Detect price differences across DEXs for same token pair
- Calculate net profit after fees: DEX fees (0.25%), gas, Jito tip, slippage
- Minimum threshold: 0.5% net profit
- Trade size: Maximum 5% of smallest pool liquidity

**FR-3.2: Statistical Arbitrage** (Advanced Strategy)

- Identify cointegrated token pairs using Johansen test
- Monitor Z-score deviations from mean (±2σ triggers)
- Mean reversion signals for pairs trading
- Track historical correlation and spread half-life

**FR-3.3: Triangular Arbitrage**

- Detect circular opportunities: A→B→C→A
- Calculate cross-pair inefficiencies within same DEX
- Account for cumulative fees and slippage across hops

#### FR-4: Price Calculation Engine

- **FR-4.1**: Constant Product AMM: `price = reserveOut / reserveIn`
- **FR-4.2**: Executable price with slippage: `(x + dx) * (y - dy) = k`
- **FR-4.3**: CLMM (Orca) and DLMM (Meteora) pricing logic support
- **FR-4.4**: Fee deduction for each DEX (0.25% - 0.3%)

#### FR-5: Data Validation & Health Checks

- **FR-5.1**: Slot synchronization: Reject prices >2 slots apart
- **FR-5.2**: Staleness detection: Flag prices >2 seconds old
- **FR-5.3**: WebSocket connection monitoring with auto-reconnect
- **FR-5.4**: Liquidity thresholds: Minimum $50K per pool

### 3.2 Non-Functional Requirements

#### NFR-1: Performance

- Price update processing: <20ms
- Opportunity detection: <50ms
- Cache lookup: <5ms
- Total system latency: <400ms end-to-end

#### NFR-2: Scalability

- Monitor 50+ pools simultaneously
- Handle 1000+ price updates/second
- Horizontal scaling via multi-instance deployment

#### NFR-3: Reliability

- 99.5% uptime
- Automatic reconnection on WebSocket failures
- Graceful degradation if one DEX data source fails
- Transaction failure tolerance

#### NFR-4: Security

- No sensitive keys in code/config
- Environment variable management
- Secure WebSocket connections (WSS)
- Rate limit handling

---

## 4. TARGET POOLS & PRIORITIES

### 4.1 Tier 1: High-Volume Pairs (Monitor Always)

| Pair     | Daily Volume | Liquidity | Priority |
| -------- | ------------ | --------- | -------- |
| SOL/USDC | >$500M       | >$50M     | Critical |
| SOL/USDT | >$200M       | >$30M     | Critical |
| BONK/SOL | >$100M       | >$20M     | High     |
| JTO/SOL  | >$80M        | >$15M     | High     |
| JUP/SOL  | >$70M        | >$12M     | High     |
| W/SOL    | >$50M        | >$10M     | High     |
| mSOL/SOL | >$20M        | >$100M    | High     |

(21 pools total across Raydium, Orca, Meteora)

**Characteristics**:

- High frequency trading
- Deep liquidity on multiple DEXs
- 70% of arbitrage opportunities

### 4.2 Tier 2: Medium-Volume Pairs (Volatility-Based)

- RAY/SOL, ORCA/SOL, PYTH/SOL
- mSOL/SOL, stSOL/SOL (liquid staking)
- $100K - $1M daily volume
- 25% of opportunities
- Larger spreads during volatile periods

### 4.3 Tier 3: Opportunistic (Event-Driven)

- New token listings
- Volume spikes
- News-driven pumps
- Monitor based on alerts, not continuously

---

## 5. ARBITRAGE STRATEGIES (DETAILED)

### 5.1 Spatial Arbitrage (Primary - 70% of Opportunities)

**Description**: Buy on cheaper DEX, sell on expensive DEX simultaneously.

**Detection Logic**:

```
1. Find max_price and min_price across all DEXs
2. Calculate gross_profit = (max_price - min_price) / min_price * 100
3. Calculate costs:
   - Buy DEX fee: 0.25%
   - Sell DEX fee: 0.25%
   - Slippage estimate: 0.5%
   - Gas cost: ~0.00001 SOL
   - Jito tip: 0.001 SOL
4. net_profit = gross_profit - total_costs
5. If net_profit > 0.5%, flag as opportunity
```

**Trade Size Calculation**:

```
min_liquidity = min(buy_pool_liquidity, sell_pool_liquidity)
max_trade_size = min_liquidity * 0.05  // 5% of smallest pool
```

**Expected Performance**:

- Frequency: 20-50 opportunities/day (high volume pairs)
- Profit per trade: 0.1% - 0.5%
- Success rate: 60-70% (competition, execution speed)

### 5.2 Statistical Arbitrage (Advanced - 20% of Opportunities)

**Description**: Exploit mean-reverting relationships between cointegrated assets.

**Methodology**:

1. **Pair Selection** (Daily Analysis):
   - Test cointegration using Johansen test
   - Calculate correlation coefficient (>0.7 threshold)
   - Identify pairs with stable long-term relationship
2. **Spread Construction**:

   ```
   spread = log(price_A) - β * log(price_B)
   where β = cointegration coefficient
   ```

3. **Z-Score Calculation**:

   ```
   z_score = (current_spread - mean_spread) / std_dev_spread
   ```

4. **Entry Signals**:

   - **Long Spread**: z_score < -2 (spread too low)
     - Action: Buy Token A, Sell Token B
   - **Short Spread**: z_score > +2 (spread too high)
     - Action: Sell Token A, Buy Token B

5. **Exit Signals**:
   - z_score returns to 0 (mean reversion complete)
   - Stop loss: z_score exceeds ±3 (relationship breakdown)

**Example Cointegrated Pairs** (Solana):

- BTC/SOL vs ETH/SOL (major crypto correlation)
- mSOL/SOL vs stSOL/SOL (liquid staking derivatives)
- RAY/SOL vs ORCA/SOL (DEX token correlation)

**Expected Performance**:

- Frequency: 5-15 opportunities/day
- Profit per trade: 0.3% - 1.2%
- Success rate: 75-85% (more predictable mean reversion)
- Hold time: 30 minutes - 6 hours

**Implementation Requirements**:

```rust
// Statistical tracking structure
struct PairStatistics {
    token_pair: (String, String),
    beta: f64,                    // Cointegration coefficient
    mean_spread: f64,             // Historical mean
    std_dev_spread: f64,          // Standard deviation
    half_life: f64,               // Mean reversion speed (seconds)
    z_score_history: VecDeque<f64>,  // Rolling window
    last_updated: i64,
}
```

### 5.3 Triangular Arbitrage (10% of Opportunities)

**Description**: Exploit pricing inefficiencies across three trading pairs within same DEX.

**Detection Logic**:

```
Path: SOL → USDC → BONK → SOL

1. Calculate effective prices:
   rate_1 = price_SOL_USDC
   rate_2 = price_USDC_BONK
   rate_3 = price_BONK_SOL

2. Final amount after complete cycle:
   final_amount = initial_SOL * rate_1 * rate_2 * rate_3

3. Account for fees (3 swaps = 0.75% total):
   net_amount = final_amount * (1 - 0.0075)

4. Profit calculation:
   profit_percent = ((net_amount - initial_SOL) / initial_SOL) * 100

5. If profit_percent > 0.3%, execute
```

**Expected Performance**:

- Frequency: 2-8 opportunities/day
- Profit per trade: 0.2% - 0.8%
- Success rate: 50-60% (complex execution)

---

## 6. COST STRUCTURE & PROFITABILITY

### 6.1 Per-Trade Costs

| Cost Type    | Amount            | Notes                 |
| ------------ | ----------------- | --------------------- |
| DEX Fees     | 0.25% × 2 = 0.5%  | Buy + Sell            |
| Slippage     | 0.3% - 0.8%       | Depends on trade size |
| Gas Fee      | ~0.000005 SOL     | Base transaction      |
| Priority Fee | 0.0001 SOL        | Network congestion    |
| Jito Tip     | 0.001 - 0.003 SOL | MEV protection        |
| **Total**    | **~1.2% - 1.8%**  | On $1000 trade        |

### 6.2 Minimum Profit Thresholds

- **Spatial Arbitrage**: 0.5% net profit minimum
- **Statistical Arbitrage**: 0.3% net profit minimum
- **Triangular Arbitrage**: 0.3% net profit minimum

### 6.3 Monthly Operating Costs

| Service                | Cost              | Purpose         |
| ---------------------- | ----------------- | --------------- |
| Helius RPC (Free Tier) | $0                | WebSocket + RPC |
| VPS (8GB RAM, 4 vCPU)  | $40-80            | Bot hosting     |
| Monitoring Tools       | $0-20             | Optional        |
| **Total**              | **$40-100/month** |                 |

---

## 7. DATA FLOW ARCHITECTURE

### 7.1 Data Ingestion Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ ON-CHAIN EVENT (Pool State Change)                         │
│ ├─ Raydium Pool Account Modified                          │
│ ├─ Orca Whirlpool Updated                                 │
│ └─ Meteora DLMM Adjusted                                   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ HELIUS GEYSER WEBSOCKET                                     │
│ ├─ accountSubscribe (Pool Address)                         │
│ ├─ Receives Base64 Encoded Account Data                    │
│ └─ Latency: 50-200ms                                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ PRICE MONITOR (Rust Module)                                │
│ ├─ Parse Binary Account Data                               │
│ ├─ Decode DEX-Specific Structures                          │
│ ├─ Extract: Vault Balances, Fees, Liquidity               │
│ └─ Processing Time: 5-20ms                                 │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ PRICE CALCULATION ENGINE                                    │
│ ├─ Calculate Spot Price                                    │
│ ├─ Calculate Executable Price (with slippage)              │
│ ├─ Normalize Token Decimals                                │
│ └─ Processing Time: 5-15ms                                 │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ IN-MEMORY CACHE UPDATE                                      │
│ ├─ Update PriceData for (TokenPair, DEX)                   │
│ ├─ Store: Price, Liquidity, Slot, Timestamp                │
│ ├─ Validate Slot Synchronization                           │
│ └─ Processing Time: 1-5ms                                  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ OPPORTUNITY DETECTOR                                        │
│ ├─ Spatial Arbitrage Scanner                               │
│ ├─ Statistical Arbitrage Z-Score Calculator                │
│ ├─ Triangular Path Evaluator                               │
│ └─ Processing Time: 10-50ms                                │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ OPPORTUNITY VALIDATION                                      │
│ ├─ Calculate Net Profit After All Costs                    │
│ ├─ Verify Liquidity Sufficiency                            │
│ ├─ Check Slot Alignment                                    │
│ └─ Filter by Minimum Profit Threshold                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ OUTPUT: Executable Opportunity                              │
│ {                                                           │
│   type: "spatial" | "statistical" | "triangular",          │
│   token_pair: "SOL/USDC",                                  │
│   buy_dex: "raydium",                                      │
│   sell_dex: "orca",                                        │
│   net_profit: 0.65%,                                       │
│   trade_size: 5.2 SOL,                                     │
│   confidence: 85%                                          │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘

TOTAL LATENCY: 76-290ms (Target: <400ms)
```

---

## 8. RISK MANAGEMENT & FAILURE MODES

### 8.1 Critical Failure Modes

#### FM-1: Stale Prices

- **Symptom**: Opportunity detected but already gone
- **Cause**: WebSocket delay, network issues
- **Detection**: `timestamp_now - price_timestamp > 2000ms`
- **Mitigation**:
  - Reject stale data immediately
  - Monitor WebSocket latency
  - Automatic reconnection logic

#### FM-2: Slot Desynchronization

- **Symptom**: Prices from different blockchain states
- **Cause**: Reading from different slots/blocks
- **Detection**: `max_slot - min_slot > 2`
- **Mitigation**:
  - Include slot number in all price data
  - Reject comparisons with >2 slot difference
  - Wait for slot alignment before detecting opportunities

#### FM-3: Insufficient Liquidity

- **Symptom**: High slippage, execution failure
- **Cause**: Pool too small for trade size
- **Detection**: `trade_size > pool_liquidity * 0.05`
- **Mitigation**:
  - Cap trade size at 5% of smallest pool
  - Track real-time liquidity
  - Dynamic size adjustment

#### FM-4: WebSocket Connection Failure

- **Symptom**: No price updates received
- **Cause**: Network disconnect, RPC issues
- **Detection**: No messages for >5 seconds
- **Mitigation**:
  - Heartbeat monitoring
  - Auto-reconnect with exponential backoff
  - Fallback to polling for critical pairs

#### FM-5: Memory Leak

- **Symptom**: Increasing RAM usage over time
- **Cause**: Not cleaning old cache entries
- **Mitigation**:
  - TTL-based cleanup every 10 seconds
  - Remove entries older than 60 seconds
  - Limit cache size to 10,000 entries

### 8.2 Monitoring & Alerts

**Critical Metrics**:

- Price update frequency (per pool)
- Cache size and staleness
- WebSocket connection status
- Opportunity detection rate
- Slot synchronization percentage

**Alert Thresholds**:

- No price updates for >10 seconds
- Cache staleness >30% entries
- WebSocket disconnected >30 seconds
- Zero opportunities detected for >1 hour

---

## 9. DEVELOPMENT PHASES

### Phase 1: Core Infrastructure (Weeks 1-2)

- ✅ WebSocket connection manager
- ✅ Account data decoder (Raydium, Orca)
- ✅ In-memory cache implementation
- ✅ Basic health checks

### Phase 2: Price Calculation (Week 3)

- ✅ AMM price calculation
- ✅ CLMM price calculation
- ✅ Slippage estimation
- ✅ Fee deduction logic

### Phase 3: Spatial Arbitrage (Week 4)

- ✅ Multi-DEX price comparison
- ✅ Net profit calculation
- ✅ Opportunity filtering
- ✅ Trade size optimization

### Phase 4: Statistical Arbitrage (Week 5-6)

- ✅ Historical data collection
- ✅ Cointegration testing
- ✅ Z-score calculation
- ✅ Mean reversion signals

### Phase 5: Testing & Optimization (Week 7)

- ✅ Backtesting with historical data
- ✅ Latency optimization
- ✅ Load testing
- ✅ Error handling

---

## 10. SUCCESS CRITERIA

### 10.1 Technical Metrics

- [x] System latency <400ms end-to-end
- [x] Process 1000+ price updates/second
- [x] 99.5% uptime
- [x] <1% false positive rate

### 10.2 Business Metrics

- [x] Detect 10+ profitable opportunities/day (Tier 1 pairs)
- [x] Average net profit >0.5% per opportunity
- [x] Operating costs <$100/month
- [x] Ready for execution module integration

---

## 11. OUT OF SCOPE (Future Phases)

- ❌ Transaction execution engine
- ❌ Jito bundle creation
- ❌ Wallet management
- ❌ Jupiter aggregator integration
- ❌ Machine learning price prediction
- ❌ Multi-hop routing optimization
- ❌ Flash loan integration

---

## 12. APPENDIX

### 12.1 Glossary

- **AMM**: Automated Market Maker (constant product formula)
- **CLMM**: Concentrated Liquidity Market Maker (Uniswap v3 style)
- **Geyser**: Solana's account change stream plugin
- **Slot**: Solana's unit of block time (~400ms)
- **Spatial Arbitrage**: Cross-exchange price differences
- **Statistical Arbitrage**: Mean reversion trading
- **Z-Score**: Standard deviations from mean

### 12.2 References

- Solana Documentation: https://docs.solana.com
- Raydium SDK: https://github.com/raydium-io/raydium-sdk
- Orca Whirlpools: https://orca-so.gitbook.io
- Jito MEV: https://jito-labs.gitbook.io
- Statistical Arbitrage: Vidyamurthy (2004)

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Owner**: Development Team  
**Status**: Approved for Development
