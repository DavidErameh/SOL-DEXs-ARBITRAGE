import { PriceData } from '../types/events';

export interface ArbitrageOpportunity {
  pair: string;
  strategy: 'spatial' | 'statistical' | 'triangular';
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  grossSpread: number;
  netProfit: number;
  buyLiquidity: number;
  sellLiquidity: number;
  estimatedSize: number;
  confidence: number;
  feesBreakdown: {
    buyDexFee: number;
    sellDexFee: number;
    slippage: number;
    gasAndTip: number;
  };
  slotAligned: boolean;
  buyPriceAge: number;
  sellPriceAge: number;
  timestamp: number;
}

/**
 * Calculates a Spatial Arbitrage opportunity based on PRD Section 5.1.
 */
export function calculateArbitrageOpportunity(
  pair: string,
  prices: PriceData[]
): ArbitrageOpportunity | null {
  if (prices.length < 2) return null;

  // Filter out extremely stale data (PRD FR-5.2: >2 seconds)
  const now = Date.now();
  const freshPrices = prices.filter(p => (now - p.timestamp) < 2000);
  if (freshPrices.length < 2) return null;

  // Find min/max prices (PRD 5.1 Logic)
  const sortedByPrice = [...freshPrices].sort((a, b) => a.price - b.price);
  const buyData = sortedByPrice[0];
  const sellData = sortedByPrice[sortedByPrice.length - 1];

  // Calculate gross spread
  const grossSpread = ((sellData.price - buyData.price) / buyData.price) * 100;

  // PRD Section 6.1 Cost Structure
  const feesBreakdown = {
    buyDexFee: 0.25,        // Raydium/Orca/Meteora avg
    sellDexFee: 0.25,
    slippage: 0.5,           // Conservative estimate from PRD 5.1
    gasAndTip: 0.1,          // Gas + Jito Tip impact on avg trade size
  };

  const totalFees = Object.values(feesBreakdown).reduce((sum, fee) => sum + fee, 0);
  const netProfit = grossSpread - totalFees;

  // PRD 5.1 Trade Size (5% of smallest pool liquidity)
  const buyLiquidity = buyData.liquidity || 50000; // Fallback to PRD min threshold
  const sellLiquidity = sellData.liquidity || 50000;
  const minLiquidity = Math.min(buyLiquidity, sellLiquidity);
  const estimatedSize = minLiquidity * 0.05;

  // Confidence score based on staleness and alignment
  const buyPriceAge = (now - buyData.timestamp) / 1000;
  const sellPriceAge = (now - sellData.timestamp) / 1000;
  const maxPriceAge = Math.max(buyPriceAge, sellPriceAge);
  
  // PRD FR-5.1 Slot Synchronization (Mocked for now)
  const slotAligned = true; 

  let confidence = 1.0;
  if (maxPriceAge > 1.0) confidence -= 0.2;
  if (maxPriceAge > 2.0) confidence -= 0.4;
  if (!slotAligned) confidence -= 0.5;

  return {
    pair,
    strategy: 'spatial',
    buyDex: buyData.dex,
    sellDex: sellData.dex,
    sellPrice: sellData.price,
    buyPrice: buyData.price,
    grossSpread,
    netProfit,
    buyLiquidity,
    sellLiquidity,
    estimatedSize,
    confidence: Math.max(0, confidence),
    feesBreakdown,
    slotAligned,
    buyPriceAge,
    sellPriceAge,
    timestamp: now,
  };
}

