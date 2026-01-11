import { ArbitrageOpportunity } from '../lib/calculateArbitrage';

export type EventType = 
  | 'price_update'
  | 'opportunity'
  | 'system_metric'
  | 'connection_status';

export interface PriceData {
  pair: string;        // "SOL/USDC"
  dex: string;         // "Raydium" | "Orca" | "Meteora"
  price: number;       // 127.45
  change24h: number;   // 0.12 (percentage)
  liquidity?: number;  // Optional
  timestamp: number;
}

export interface OpportunityEvent {
  type: 'opportunity';
  timestamp: number;
  strategy: 'spatial' | 'statistical' | 'triangular';
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  grossProfit: number;
  netProfit: number;
  recommendedSize: number;
  confidence: number;
}

export interface LogEntry {
  timestamp: number;
  type: 'OPPORTUNITY' | 'INFO' | 'WARNING' | 'ERROR' | 'METRIC' | 'CONNECTION_STATE' | 'CACHE_CLEANUP';
  message: string;
  details?: Record<string, any>;
}

export interface SystemMetrics {
  uptime: number;
  cacheSize: number;
  updatesPerSecond: number;
  memoryUsage: number;
  cpuUsage: number;
  latency: number;
  opportunities24h: number;
  netProfit24h: number;
}

export interface AppState {
  status: 'connecting' | 'online' | 'offline';
  prices: PriceData[];
  logs: LogEntry[];
  opportunities: ArbitrageOpportunity[]; 
  metrics: SystemMetrics;
}

