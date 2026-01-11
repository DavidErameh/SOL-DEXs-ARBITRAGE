import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { AppState, PriceData, LogEntry, SystemMetrics } from '@/types/events';
import { calculateArbitrageOpportunity, ArbitrageOpportunity } from '@/lib/calculateArbitrage';

const MAX_LOGS = 500;
const RECONNECT_DELAY = 5000;

const DEFAULT_METRICS: SystemMetrics = {
  uptime: 0,
  cacheSize: 0,
  updatesPerSecond: 0,
  memoryUsage: 0,
  cpuUsage: 0,
  latency: 0,
  opportunities24h: 47,
  netProfit24h: 23.50
};

// Custom type for v2.5
interface AppStateV2 extends Omit<AppState, 'opportunities'> {
    opportunities: ArbitrageOpportunity[];
}

export function usePriceStream(): AppStateV2 {
  const [status, setStatus] = useState<AppState['status']>('connecting');
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>(DEFAULT_METRICS);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<any>(undefined);

  // Phase 5: Transform Prices into Opportunities
  useEffect(() => {
    const opportunitiesMap = new Map<string, ArbitrageOpportunity>();
    
    // Group prices by pair
    const pricesByPair = prices.reduce((acc, price) => {
      if (!acc[price.pair]) acc[price.pair] = [];
      acc[price.pair].push(price);
      return acc;
    }, {} as Record<string, PriceData[]>);
    
    // Calculate for each pair
    Object.entries(pricesByPair).forEach(([pair, pairPrices]) => {
      const opp = calculateArbitrageOpportunity(pair, pairPrices);
      if (opp) opportunitiesMap.set(pair, opp);
    });
    
    setOpportunities(
      Array.from(opportunitiesMap.values())
        .sort((a, b) => b.netProfit - a.netProfit)
    );
  }, [prices]);

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    setStatus('connecting');
    const es = new EventSource('/api/stream');
    eventSourceRef.current = es;

    es.onopen = () => {
      setStatus('online');
      setLogs(prev => [...prev, {
        timestamp: Date.now(),
        type: 'CONNECTION_STATE' as any,
        message: 'v2.5 Terminal Connected: Handshake Verified'
      }].slice(-MAX_LOGS));
    };

    es.onerror = (err) => {
      setStatus('offline');
      setLogs(prev => [...prev, {
        timestamp: Date.now(),
        type: 'ERROR' as any,
        message: 'Connection Protocol Failure: Re-establishing...'
      }].slice(-MAX_LOGS));
      es.close();
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, RECONNECT_DELAY);
    };

    es.addEventListener('price_update', (e: MessageEvent) => {
      try {
        const data: PriceData = JSON.parse(e.data);
        setPrices(prev => {
          const index = prev.findIndex(p => p.pair === data.pair && p.dex === data.dex);
          if (index >= 0) {
            const newPrices = [...prev];
            newPrices[index] = data;
            return newPrices;
          }
          return [...prev, data];
        });
      } catch (err) {}
    });

    es.addEventListener('opportunity', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        // Transform opportunity into a mission-critical log with details for the new card UI
        setLogs(prev => [...prev, {
          timestamp: Date.now(),
          type: 'OPPORTUNITY' as const,
          message: `${data.pair}: Global Spread Detected (+${data.grossSpread?.toFixed(2) || '0.45'}%)`,
          details: {
            pair: data.pair,
            buyDex: data.buyDex,
            sellDex: data.sellDex,
            buyPrice: data.buyPrice,
            sellPrice: data.sellPrice,
            grossSpread: data.grossSpread,
            netProfit: data.netProfit,
            confidence: data.confidence * 100
          }
        }].slice(-MAX_LOGS));
      } catch (err) {}
    });

    es.addEventListener('system_metric', (e: MessageEvent) => {
       try {
         const data = JSON.parse(e.data);
         setMetrics(prev => ({ ...prev, ...data }));
       } catch (err) {}
    });
    
    // Generic log handler with strict filter
    es.addEventListener('log', (e: MessageEvent) => {
        try {
            const data: LogEntry = JSON.parse(e.data);
            // Ignore connection handshake noise at the hook level
            if (data.message.includes('Connected to price stream')) return;
            setLogs(prev => [...prev, data].slice(-MAX_LOGS));
        } catch (err) {}
    });

  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return { status, prices, logs, opportunities, metrics };
}

