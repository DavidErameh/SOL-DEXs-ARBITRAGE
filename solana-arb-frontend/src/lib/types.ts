export type OpportunityType = 'spatial' | 'statistical' | 'triangular';

export interface Opportunity {
  id: string;
  type: OpportunityType;
  pair: string;
  route: string;
  profit: number; // percentage
  size: number; // in SOL or USD
  confidence: number; // 0-100
  timestamp: number;
}

export interface PriceUpdate {
  dex: 'Raydium' | 'Orca' | 'Meteora';
  price: number;
  liquidity: number;
  lastUpdate: number; // seconds ago
}

export type TokenPair = 'SOL/USDC' | 'SOL/USDT' | 'BONK/SOL';

export interface PricesMap {
  [key: string]: PriceUpdate[];
}

export interface SystemLog {
  id: string;
  time: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface SystemHealthMetrics {
  websocket: 'connected' | 'disconnected' | 'connecting';
  priceCalc: 'optimal' | 'degraded' | 'offline';
  detector: 'active' | 'idle';
  cacheHitRate: number;
}
