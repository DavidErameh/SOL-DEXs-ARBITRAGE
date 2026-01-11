"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

export type PriceUpdate = {
  pair: string;
  dex: string;
  price: number;
  slot: number;
  ts: number;
};

export type Opportunity = {
  pair: string;
  buy_dex: string;
  sell_dex: string;
  profit_pct: number;
  est_profit_usdc: number;
  details: string;
  ts: number;
};

type Metrics = {
    fps: number;
    cache_entries: number;
}

export function useSolanaStream() {
  const [isConnected, setIsConnected] = useState(false);
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Helper to add log
  const addLog = useCallback((msg: string) => {
    setLogs(prev => {
        const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
        return newLogs.slice(-100); // Keep last 100 logs
    });
  }, []);

  useEffect(() => {
    const connect = () => {
      // Connect to Rust Backend
      const ws = new WebSocket('ws://localhost:3001/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        addLog("SYSTEM_CONNECTED | Link Established");
      };

      ws.onclose = () => {
        setIsConnected(false);
        addLog("SYSTEM_DISCONNECTED | Reconnecting in 3s...");
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        // addLog("ERROR | Connection Failed");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'price') {
            const data = msg.data as PriceUpdate;
            setPrices(prev => {
               const next = new Map(prev);
               // Key: "SOL/USDC-orca"
               next.set(`${data.pair}-${data.dex}`, data);
               return next;
            });
          } 
          else if (msg.type === 'opportunity') {
            const opp = msg.data as Opportunity;
            addLog(`🚀 ARB_DETECTED | ${opp.pair} | ${opp.profit_pct.toFixed(2)}% | $${opp.est_profit_usdc.toFixed(2)}`);
          }
           else if (msg.type === 'metrics') {
            setMetrics(msg.data);
          }
        } catch (e) {
          console.error("Parse error", e);
        }
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, [addLog]);

  return { isConnected, prices, logs, metrics };
}
