"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Opportunity, PriceUpdate, SystemHealthMetrics, SystemLog } from "@/lib/types";

interface WebSocketData {
  latestOpportunities: Opportunity[];
  prices: Record<string, PriceUpdate[]>;
  logs: SystemLog[];
  health: SystemHealthMetrics;
  status: 'connected' | 'disconnected' | 'connecting';
}

export function useWebSocket(url: string = "ws://localhost:8080") {
  const [data, setData] = useState<Partial<WebSocketData>>({
    status: 'disconnected'
  });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setData(prev => ({ ...prev, status: 'connected' }));
      };
      
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          // Handle different message types (simplified for now)
          if (parsed.type === 'prices') {
            setData(prev => ({ ...prev, prices: parsed.data }));
          } else if (parsed.type === 'opportunity') {
            setData(prev => ({ 
              ...prev, 
              latestOpportunities: [parsed.data, ...(prev.latestOpportunities || []).slice(0, 9)] 
            }));
          } else if (parsed.type === 'health') {
            setData(prev => ({ ...prev, health: parsed.data }));
          } else if (parsed.type === 'log') {
             setData(prev => ({ 
              ...prev, 
              logs: [...(prev.logs || []).slice(-49), parsed.data] 
            }));
          }
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        setData(prev => ({ ...prev, status: 'disconnected' }));
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("WebSocket connection failed", e);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [url]);

  useEffect(() => {
    setData(prev => ({ ...prev, status: 'connecting' }));
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        // @ts-ignore
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return data;
}
