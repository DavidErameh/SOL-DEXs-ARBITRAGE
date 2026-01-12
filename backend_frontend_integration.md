# BACKEND-FRONTEND INTEGRATION GUIDE
## Connecting Rust Price Monitor to Next.js Dashboard

**Version:** 1.0  
**Last Updated:** January 2026

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 System Components

```
┌──────────────────────────────────────────────────────────────────┐
│                    RUST BACKEND (Oracle Cloud)                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  PRICE MONITOR CORE                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │   WebSocket  │  │   Account    │  │    Price     │     │ │
│  │  │   Manager    │─→│   Decoder    │─→│  Calculator  │     │ │
│  │  │  (Helius)    │  │  (Raydium/   │  │   (AMM/      │     │ │
│  │  │              │  │   Orca/etc)  │  │    CLMM)     │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │          │                 │                  │            │ │
│  │          └─────────────────┴──────────────────┘            │ │
│  │                            │                               │ │
│  │                            ▼                               │ │
│  │                  ┌──────────────────┐                      │ │
│  │                  │   PRICE CACHE    │                      │ │
│  │                  │  (DashMap)       │                      │ │
│  │                  └──────────────────┘                      │ │
│  │                            │                               │ │
│  │                            ▼                               │ │
│  │                  ┌──────────────────┐                      │ │
│  │                  │   OPPORTUNITY    │                      │ │
│  │                  │    DETECTOR      │                      │ │
│  │                  │  (Multi-strat)   │                      │ │
│  │                  └──────────────────┘                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              WEBSOCKET SERVER MODULE (NEW)                 │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Listens on ws://localhost:8080                      │  │ │
│  │  │  - Accepts frontend connections                      │  │ │
│  │  │  - Broadcasts price updates                          │  │ │
│  │  │  - Sends opportunities in real-time                  │  │ │
│  │  │  - Streams system health metrics                     │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                            │
                            │ JSON over WebSocket
                            │ (ws://localhost:8080)
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                 NEXT.JS FRONTEND (Browser)                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              WEBSOCKET CLIENT HOOK                         │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  useWebSocket("ws://localhost:8080")                 │  │ │
│  │  │  - Connects on mount                                 │  │ │
│  │  │  - Auto-reconnects on disconnect                     │  │ │
│  │  │  - Parses JSON messages                              │  │ │
│  │  │  - Updates React state                               │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  REACT STATE MANAGEMENT                    │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐           │ │
│  │  │   Prices   │  │   Opps     │  │   Health   │           │ │
│  │  │  useState  │  │  useState  │  │  useState  │           │ │
│  │  └────────────┘  └────────────┘  └────────────┘           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  DASHBOARD COMPONENTS                      │ │
│  │  - OpportunitiesTable                                     │ │
│  │  - PriceCard (with flash animations)                      │ │
│  │  - PriceChart (Recharts)                                  │ │
│  │  - MetricsPanel                                           │ │
│  │  - HealthMonitor                                          │ │
│  │  - ActivityLog                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. MESSAGE PROTOCOL

### 2.1 Message Types (Rust → Frontend)

All messages are JSON objects with a `type` field for discrimination.

#### Message Type 1: Price Update

**Triggered:** Every time a price changes on any DEX  
**Frequency:** High (potentially 100-1000/sec during active trading)

```json
{
  "type": "price_update",
  "timestamp": "2026-01-11T12:34:56.789Z",
  "pair": "SOL/USDC",
  "dex": "raydium",
  "price": 176.23,
  "liquidity": 45200000,
  "slot": 234567890,
  "last_update_ms": 234
}
```

**Rust Struct:**
```rust
#[derive(Serialize, Clone)]
pub struct PriceUpdateMessage {
    #[serde(rename = "type")]
    pub message_type: String, // Always "price_update"
    pub timestamp: String,     // ISO 8601
    pub pair: String,          // "SOL/USDC"
    pub dex: String,           // "raydium" | "orca" | "meteora"
    pub price: f64,            // Normalized price
    pub liquidity: u64,        // Pool liquidity in USD
    pub slot: u64,             // Solana slot number
    pub last_update_ms: u64,   // How long ago (ms)
}
```

#### Message Type 2: Opportunity Detected

**Triggered:** When arbitrage opportunity passes validation  
**Frequency:** Low (0-20/hour depending on market conditions)

```json
{
  "type": "opportunity",
  "timestamp": "2026-01-11T12:34:56.789Z",
  "opportunity_type": "spatial",
  "pair": "SOL/USDC",
  "buy_dex": "raydium",
  "sell_dex": "orca",
  "buy_price": 176.23,
  "sell_price": 176.31,
  "gross_profit_percent": 0.87,
  "net_profit_percent": 0.37,
  "recommended_size": 12.4,
  "confidence": 92,
  "costs": {
    "dex_fees": 0.5,
    "slippage": 0.3,
    "gas_jito": 0.06
  },
  "timing": {
    "detection_latency_ms": 156,
    "slot_delta": 1,
    "data_freshness_ms": 234
  }
}
```

**Rust Struct:**
```rust
#[derive(Serialize, Clone)]
pub struct OpportunityMessage {
    #[serde(rename = "type")]
    pub message_type: String,
    pub timestamp: String,
    pub opportunity_type: String, // "spatial" | "statistical" | "triangular"
    pub pair: String,
    pub buy_dex: String,
    pub sell_dex: String,
    pub buy_price: f64,
    pub sell_price: f64,
    pub gross_profit_percent: f64,
    pub net_profit_percent: f64,
    pub recommended_size: f64,
    pub confidence: u8,
    pub costs: CostBreakdown,
    pub timing: TimingInfo,
}

#[derive(Serialize, Clone)]
pub struct CostBreakdown {
    pub dex_fees: f64,
    pub slippage: f64,
    pub gas_jito: f64,
}

#[derive(Serialize, Clone)]
pub struct TimingInfo {
    pub detection_latency_ms: u64,
    pub slot_delta: u64,
    pub data_freshness_ms: u64,
}
```

#### Message Type 3: System Health

**Triggered:** Every 5 seconds (configurable)  
**Frequency:** 0.2/sec (720/hour)

```json
{
  "type": "health",
  "timestamp": "2026-01-11T12:34:56.789Z",
  "components": {
    "websocket": {
      "status": "connected",
      "latency_ms": 45
    },
    "price_calculator": {
      "status": "running",
      "latency_ms": 12
    },
    "detector": {
      "status": "active",
      "latency_ms": 34
    },
    "cache": {
      "status": "healthy",
      "latency_ms": 3,
      "hit_rate": 99.2,
      "entry_count": 2341
    }
  },
  "metrics": {
    "avg_detection_latency_p95": 156,
    "price_updates_per_min": 4231,
    "stale_prices": 2,
    "uptime_seconds": 83640
  }
}
```

**Rust Struct:**
```rust
#[derive(Serialize, Clone)]
pub struct HealthMessage {
    #[serde(rename = "type")]
    pub message_type: String,
    pub timestamp: String,
    pub components: ComponentsHealth,
    pub metrics: SystemMetrics,
}

#[derive(Serialize, Clone)]
pub struct ComponentsHealth {
    pub websocket: ComponentStatus,
    pub price_calculator: ComponentStatus,
    pub detector: ComponentStatus,
    pub cache: CacheStatus,
}

#[derive(Serialize, Clone)]
pub struct ComponentStatus {
    pub status: String, // "connected" | "running" | "active" | "error"
    pub latency_ms: u64,
}

#[derive(Serialize, Clone)]
pub struct CacheStatus {
    pub status: String,
    pub latency_ms: u64,
    pub hit_rate: f64,
    pub entry_count: usize,
}

#[derive(Serialize, Clone)]
pub struct SystemMetrics {
    pub avg_detection_latency_p95: u64,
    pub price_updates_per_min: u32,
    pub stale_prices: u32,
    pub uptime_seconds: u64,
}
```

#### Message Type 4: Activity Log

**Triggered:** On significant events (opportunities, errors, reconnections)  
**Frequency:** Variable (1-100/hour)

```json
{
  "type": "log",
  "timestamp": "2026-01-11T12:34:56.789Z",
  "level": "info",
  "message": "Opportunity detected: SOL/USDC +0.87%",
  "context": {
    "pair": "SOL/USDC",
    "profit": 0.87
  }
}
```

**Rust Struct:**
```rust
#[derive(Serialize, Clone)]
pub struct LogMessage {
    #[serde(rename = "type")]
    pub message_type: String,
    pub timestamp: String,
    pub level: String, // "info" | "warning" | "error"
    pub message: String,
    pub context: Option<serde_json::Value>,
}
```

---

## 3. BACKEND IMPLEMENTATION (Rust)

### 3.1 New Module Structure

Add to existing project:

```
src/
├── main.rs
├── lib.rs
├── websocket_server/          # NEW MODULE
│   ├── mod.rs                 # Module declaration
│   ├── server.rs              # WebSocket server setup
│   ├── broadcaster.rs         # Broadcast messages to clients
│   ├── messages.rs            # Message type definitions
│   └── handlers.rs            # Client connection handlers
├── websocket/                 # EXISTING (Helius connection)
├── decoder/
├── cache/
├── calculator/
├── detector/
└── ...
```

### 3.2 Cargo.toml Dependencies

Add these to existing dependencies:

```toml
[dependencies]
# Existing dependencies...
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# NEW: WebSocket server for frontend
tokio-tungstenite = "0.21"
futures-util = "0.3"
```

### 3.3 Integration Points

The WebSocket server needs access to:

1. **Price Cache** - To broadcast price updates
2. **Opportunity Detector** - To send detected opportunities
3. **Health Monitor** - To send system metrics
4. **Activity Logger** - To send log events

**Integration Pattern:**

```rust
// In main.rs
use tokio::sync::broadcast;

#[tokio::main]
async fn main() -> Result<()> {
    // Existing setup...
    let config = load_config()?;
    let cache = PriceCache::new();
    
    // NEW: Create broadcast channels
    let (price_tx, _) = broadcast::channel::<PriceUpdateMessage>(1000);
    let (opp_tx, _) = broadcast::channel::<OpportunityMessage>(100);
    let (health_tx, _) = broadcast::channel::<HealthMessage>(10);
    let (log_tx, _) = broadcast::channel::<LogMessage>(500);
    
    // Start WebSocket server in separate task
    let ws_server = websocket_server::start_server(
        "127.0.0.1:8080",
        price_tx.clone(),
        opp_tx.clone(),
        health_tx.clone(),
        log_tx.clone(),
    );
    tokio::spawn(ws_server);
    
    // Existing monitoring tasks...
    // When price updates, send to broadcast channel:
    price_tx.send(price_update_msg)?;
    
    // When opportunity detected, send to broadcast:
    opp_tx.send(opportunity_msg)?;
    
    // ... rest of main loop
}
```

---

## 4. FRONTEND IMPLEMENTATION (Next.js)

### 4.1 WebSocket Client Hook

**File:** `lib/hooks/useWebSocket.ts`

```typescript
import { useEffect, useState, useRef, useCallback } from 'react';

type MessageType = 'price_update' | 'opportunity' | 'health' | 'log';

interface WebSocketMessage {
  type: MessageType;
  timestamp: string;
  [key: string]: any;
}

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Exponential backoff reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        reconnectTimeout.current = setTimeout(() => {
          console.log(`Reconnecting... (attempt ${reconnectAttempts.current})`);
          connect();
        }, delay);
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return { isConnected, lastMessage };
}
```

### 4.2 Message Handler Hook

**File:** `lib/hooks/useWebSocketData.ts`

```typescript
import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

interface PriceData {
  pair: string;
  dex: string;
  price: number;
  liquidity: number;
  lastUpdate: number;
}

interface Opportunity {
  type: string;
  pair: string;
  buyDex: string;
  sellDex: string;
  netProfitPercent: number;
  recommendedSize: number;
  confidence: number;
  timestamp: string;
}

interface SystemHealth {
  components: any;
  metrics: any;
}

interface ActivityLog {
  timestamp: string;
  level: string;
  message: string;
}

export function useWebSocketData() {
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:8080');
  
  const [prices, setPrices] = useState<Map<string, PriceData[]>>(new Map());
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'price_update':
        setPrices((prev) => {
          const newPrices = new Map(prev);
          const pairPrices = newPrices.get(lastMessage.pair) || [];
          
          // Update or add price for this DEX
          const existingIndex = pairPrices.findIndex(
            (p) => p.dex === lastMessage.dex
          );
          
          const newPrice: PriceData = {
            pair: lastMessage.pair,
            dex: lastMessage.dex,
            price: lastMessage.price,
            liquidity: lastMessage.liquidity,
            lastUpdate: lastMessage.last_update_ms,
          };
          
          if (existingIndex >= 0) {
            pairPrices[existingIndex] = newPrice;
          } else {
            pairPrices.push(newPrice);
          }
          
          newPrices.set(lastMessage.pair, pairPrices);
          return newPrices;
        });
        break;

      case 'opportunity':
        setOpportunities((prev) => {
          // Keep only last 50 opportunities
          const newOpp: Opportunity = {
            type: lastMessage.opportunity_type,
            pair: lastMessage.pair,
            buyDex: lastMessage.buy_dex,
            sellDex: lastMessage.sell_dex,
            netProfitPercent: lastMessage.net_profit_percent,
            recommendedSize: lastMessage.recommended_size,
            confidence: lastMessage.confidence,
            timestamp: lastMessage.timestamp,
          };
          return [newOpp, ...prev].slice(0, 50);
        });
        break;

      case 'health':
        setHealth({
          components: lastMessage.components,
          metrics: lastMessage.metrics,
        });
        break;

      case 'log':
        setLogs((prev) => {
          const newLog: ActivityLog = {
            timestamp: lastMessage.timestamp,
            level: lastMessage.level,
            message: lastMessage.message,
          };
          // Keep only last 100 logs
          return [newLog, ...prev].slice(0, 100);
        });
        break;
    }
  }, [lastMessage]);

  return {
    isConnected,
    prices,
    opportunities,
    health,
    logs,
  };
}
```

### 4.3 Dashboard Integration

**File:** `app/page.tsx`

```typescript
'use client';

import { useWebSocketData } from '@/lib/hooks/useWebSocketData';
import { OpportunitiesTable } from '@/components/dashboard/opportunities-table';
import { PriceCard } from '@/components/dashboard/price-card';
// ... other imports

export default function Dashboard() {
  const { isConnected, prices, opportunities, health, logs } = useWebSocketData();

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="h-16 bg-zinc-950 border-b border-zinc-800">
        {/* System status shows isConnected */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
          )} />
          <span className="text-sm text-zinc-300">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="grid grid-cols-12 gap-4 p-4">
        {/* Left: Opportunities + Prices */}
        <div className="col-span-7">
          <OpportunitiesTable opportunities={opportunities} />
          
          {/* Pass prices for SOL/USDC */}
          <PriceCard 
            pair="SOL/USDC" 
            prices={prices.get('SOL/USDC') || []} 
          />
        </div>

        {/* Right: Metrics + Health */}
        <div className="col-span-5">
          <MetricsPanel health={health} />
          <ActivityLog logs={logs} />
        </div>
      </main>
    </div>
  );
}
```

---

## 5. DATA FLOW DIAGRAMS

### 5.1 Price Update Flow

```
HELIUS GEYSER                 RUST BACKEND                    NEXT.JS
     │                             │                              │
     │  Pool Account Update        │                              │
     ├────────────────────────────>│                              │
     │                             │                              │
     │                        ┌────┴─────┐                        │
     │                        │ Decoder  │                        │
     │                        └────┬─────┘                        │
     │                             │                              │
     │                        ┌────▼─────┐                        │
     │                        │Calculator│                        │
     │                        └────┬─────┘                        │
     │                             │                              │
     │                        ┌────▼─────┐                        │
     │                        │  Cache   │                        │
     │                        │  Update  │                        │
     │                        └────┬─────┘                        │
     │                             │                              │
     │                        ┌────▼─────────┐                    │
     │                        │ Broadcast    │                    │
     │                        │ price_tx     │                    │
     │                        └────┬─────────┘                    │
     │                             │                              │
     │                        ┌────▼──────────┐                   │
     │                        │ WebSocket     │                   │
     │                        │ Server        │                   │
     │                        │ (broadcasts)  │                   │
     │                        └────┬──────────┘                   │
     │                             │                              │
     │                             │  JSON: PriceUpdateMessage    │
     │                             ├─────────────────────────────>│
     │                             │                              │
     │                             │                         ┌────▼─────┐
     │                             │                         │useWebSocket│
     │                             │                         │ (parses) │
     │                             │                         └────┬─────┘
     │                             │                              │
     │                             │                         ┌────▼─────┐
     │                             │                         │ useState │
     │                             │                         │ (prices) │
     │                             │                         └────┬─────┘
     │                             │                              │
     │                             │                         ┌────▼─────┐
     │                             │                         │PriceCard │
     │                             │                         │ (flash)  │
     │                             │                         └──────────┘

Total Latency: 50ms (Geyser) + 15ms (Decode) + 12ms (Calc) + 
               5ms (Cache) + 10ms (Broadcast) + 20ms (Network) + 
               5ms (React render) = ~117ms
```

### 5.2 Opportunity Detection Flow

```
CACHE                        RUST BACKEND                     NEXT.JS
  │                               │                               │
  │  Price Data Available         │                               │
  ├──────────────────────────────>│                               │
  │                               │                               │
  │                          ┌────▼──────┐                        │
  │                          │ Detector  │                        │
  │                          │ (Spatial, │                        │
  │                          │  Stat,    │                        │
  │                          │  Triang)  │                        │
  │                          └────┬──────┘                        │
  │                               │                               │
  │                          ┌────▼─────────┐                     │
  │                          │ Validation   │                     │
  │                          │ - Net profit │                     │
  │                          │ - Liquidity  │                     │
  │                          │ - Slot align │                     │
  │                          └────┬─────────┘                     │
  │                               │                               │
  │                               │ ✓ Passes                      │
  │                          ┌────▼──────────┐                    │
  │                          │ Broadcast     │                    │
  │                          │ opp_tx        │                    │
  │                          └────┬──────────┘                    │
  │                               │                               │
  │                          ┌────▼──────────┐                    │
  │                          │ WebSocket     │                    │
  │                          │ Server        │                    │
  │                          └────┬──────────┘                    │
  │                               │                               │
  │                               │ JSON: OpportunityMessage      │
  │                               ├──────────────────────────────>│
  │                               │                               │
  │                               │                          ┌────▼─────┐
  │                               │                          │useState  │
  │                               │                          │(opps)    │
  │                               │                          └────┬─────┘
  │                               │                               │
  │                               │                          ┌────▼─────┐
  │                               │                          │Opps Table│
  │                               │                          │(slide-in)│
  │                               │                          └──────────┘
```

---

## 6. TESTING STRATEGY

### 6.1 Backend Testing

**Test WebSocket Server Independently:**

```bash
# Terminal 1: Start backend
cd solana-price-monitor
cargo run

# Terminal 2: Test with websocat
websocat ws://localhost:8080

# You should see JSON messages streaming
```

**Mock Message Sender (for testing frontend without full backend):**

```rust
// src/websocket_server/mock.rs
pub async fn send_mock_data(tx: broadcast::Sender<PriceUpdateMessage>) {
    let mut interval = tokio::time::interval(Duration::from_secs(1));
    loop {
        interval.tick().await;
        
        let msg = PriceUpdateMessage {
            message_type: "price_update".to_string(),
            timestamp: Utc::now().to_rfc3339(),
            pair: "SOL/USDC".to_string(),
            dex: "raydium".to_string(),
            price: 176.0 + (rand::random::<f64>() * 2.0 - 1.0), // ±$1
            liquidity: 45_200_000,
            slot: 234567890,
            last_update_ms: 234,
        };
        
        let _ = tx.send(msg);
    }
}
```

### 6.2 Frontend Testing

**Test in Browser Console:**

```javascript
// Open browser console on http://localhost:3000
// Check WebSocket connection
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (e) => console.log(JSON.parse(e.data));

// Should see messages streaming
```

---

## 7. DEPLOYMENT CONSIDERATIONS

### 7.1 Local Development

- **Backend:** `cargo run` (starts on localhost:8080)
- **Frontend:** `npm run dev` (connects to ws://localhost:8080)
- **No CORS issues** - same machine

### 7.2 Production (Both on Oracle Cloud)

- **Backend:** Runs on Oracle Cloud instance
- **Frontend:** Next.js served from same instance via nginx
- **WebSocket URL:** `ws://localhost:8080` (internal)
- **Public access:** Only frontend (port 80/443), WebSocket stays internal

**Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
    }

    # WebSocket proxy (if frontend needs external access)
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 8. PERFORMANCE CONSIDERATIONS

### 8.1 Message Rate Limiting

**Problem:** If monitoring 21 pools × 3 DEXs = 63 price sources, and each updates 10x/min, that's 630 messages/min (10.5/sec).

**Solution:** Throttle price updates per pair/DEX:

```rust
// Only broadcast if price changed >0.01% or >1 second since last broadcast
if price_change_percent > 0.01 || time_since_last > 1000 {
    let _ = price_tx.send(msg);
}
```

### 8.2 Frontend Batching

**Problem:** React re-renders on every message = potential performance issues.

**Solution:** Batch updates using `requestAnimationFrame`:

```typescript
const [pendingUpdates, setPendingUpdates] = useState<PriceData[]>([]);

useEffect(() => {
  if (lastMessage?.type === 'price_update') {
    setPendingUpdates((prev) => [...prev, lastMessage]);
  }
}, [lastMessage]);

useEffect(() => {
  let rafId: number;
  
  const applyUpdates = () => {
    if (pendingUpdates.length > 0) {
      // Apply all pending updates at once
      setPrices((prev) => {
        const newPrices = new Map(prev);
        pendingUpdates.forEach((update) => {
          // ... apply update
        });
        return newPrices;
      });
      setPendingUpdates([]);
    }
    rafId = requestAnimationFrame(applyUpdates);
  };
  
  rafId = requestAnimationFrame(applyUpdates);
  return () => cancelAnimationFrame(rafId);
}, [pendingUpdates]);
```

---

## 9. TROUBLESHOOTING

| Issue | Cause | Solution |
|-------|-------|----------|
| **Connection refused** | Backend not running | Start Rust backend: `cargo run` |
| **Auto-reconnect loop** | Wrong WebSocket URL | Check URL is `ws://localhost:8080` |
| **Messages not displaying** | JSON parse error | Check backend message format matches frontend types |
| **High CPU usage (frontend)** | Too many re-renders | Implement batching (Section 8.2) |
| **Stale data** | Message rate limiting too aggressive | Reduce throttle threshold |
| **CORS errors** | N/A for WebSocket | WebSocket doesn't use CORS |

---

## 10. NEXT STEPS

1. **Implement Rust WebSocket Server Module** (Use provided prompt)
2. **Add Broadcast Channels** to existing detector/cache
3. **Test Backend Independently** with `websocat`
4. **Implement Frontend Hook** (`useWebSocket`, `useWebSocketData`)
5. **Integrate into Dashboard** components
6. **Test End-to-End** with real price data
7. **Deploy to Oracle Cloud** (both backend + frontend)

---

**Total Implementation Time:** ~3-4 hours
- Backend WebSocket module: 2 hours
- Frontend hooks + integration: 1.5 hours
- Testing + debugging: 30 minutes

**Zero Additional Cost:** Everything runs on existing Oracle Cloud instance, no new services needed.
