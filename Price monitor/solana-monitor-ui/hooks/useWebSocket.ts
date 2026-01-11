import { useEffect, useState, useRef, useCallback } from 'react';

export type PriceUpdate = {
  type: 'price';
  data: {
    pair: string;
    dex: string;
    price: number;
    slot: number;
    ts: number;
  };
};

export type Opportunity = {
  active: boolean; // Computed on frontend for UI persistence
  type: 'opportunity';
  data: {
    opportunity_type: 'Spatial' | 'Statistical' | 'Triangular';
    token_pair: string;
    buy_dex: string;
    sell_dex: string;
    buy_price: number;
    sell_price: number;
    net_profit_percent: number;
    recommended_size: number;
    confidence: number;
    detected_at: string;
  };
};

export type SystemMetrics = {
  type: 'metrics';
  data: {
    fps: number;
    cache_entries: number;
  };
};

export type ApiMessage = PriceUpdate | Opportunity | SystemMetrics;

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ApiMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('Connected to WebSocket');
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected. Reconnecting...');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        ws.close();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('Connection failed:', e);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return { isConnected, lastMessage };
}
