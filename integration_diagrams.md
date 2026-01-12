# INTEGRATION ARCHITECTURE DIAGRAMS
## Visual Guide: Rust Backend ↔ Next.js Frontend

---

## 1. SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ORACLE CLOUD INSTANCE                             │
│                          (4 OCPU, 24GB RAM - FREE)                          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                       RUST BACKEND PROCESS                            │ │
│  │                    (solana-price-monitor)                             │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  EXISTING PRICE MONITORING SYSTEM                               │ │ │
│  │  │                                                                 │ │ │
│  │  │  Helius → Decoder → Calculator → Cache → Detector              │ │ │
│  │  │    ↓         ↓          ↓          ↓         ↓                  │ │ │
│  │  │  [WebSocket streams from Solana blockchain]                    │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                            ↓                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  NEW: WEBSOCKET SERVER MODULE                                   │ │ │
│  │  │                                                                 │ │ │
│  │  │  • Listens: ws://localhost:8080                                │ │ │
│  │  │  • Broadcasts: Price updates, Opportunities, Health, Logs      │ │ │
│  │  │  • Handles: Multiple concurrent client connections             │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                            ↓                                                │
│                      [WebSocket Protocol]                                   │
│                     ws://localhost:8080                                     │
│                      [JSON Messages]                                        │
│                            ↓                                                │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    NEXT.JS FRONTEND PROCESS                           │ │
│  │                    (npm run dev / build)                              │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  WEBSOCKET CLIENT HOOK (useWebSocket)                           │ │ │
│  │  │  • Connects to ws://localhost:8080                              │ │ │
│  │  │  • Auto-reconnects on disconnect                                │ │ │
│  │  │  • Parses JSON messages                                         │ │ │
│  │  │  • Updates React state                                          │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                            ↓                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  DASHBOARD COMPONENTS                                           │ │ │
│  │  │  • OpportunitiesTable (live updates)                            │ │ │
│  │  │  • PriceCard (flash animations)                                 │ │ │
│  │  │  • PriceChart (real-time graph)                                 │ │ │
│  │  │  • MetricsPanel (system stats)                                  │ │ │
│  │  │  • HealthMonitor (component status)                             │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [Optional: Nginx reverse proxy on port 80 for external access]            │
└─────────────────────────────────────────────────────────────────────────────┘
                                  ↓
                           [User's Browser]
                        https://your-domain.com
```

---

## 2. MESSAGE FLOW (Detailed)

### 2.1 Price Update Flow (High Frequency)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   HELIUS     │       │    RUST      │       │  WEBSOCKET   │       │   NEXT.JS    │
│   GEYSER     │       │   BACKEND    │       │   SERVER     │       │  FRONTEND    │
└──────────────┘       └──────────────┘       └──────────────┘       └──────────────┘
       │                      │                      │                      │
       │  Pool State Change   │                      │                      │
       ├─────────────────────>│                      │                      │
       │  (WebSocket msg)     │                      │                      │
       │                      │                      │                      │
       │                 ┌────┴─────┐                │                      │
       │                 │ Decoder  │                │                      │
       │                 │ (Borsh)  │                │                      │
       │                 └────┬─────┘                │                      │
       │                      │                      │                      │
       │                 ┌────▼──────┐               │                      │
       │                 │Calculator │               │                      │
       │                 │(AMM/CLMM) │               │                      │
       │                 └────┬──────┘               │                      │
       │                      │                      │                      │
       │                 ┌────▼──────┐               │                      │
       │                 │  Cache    │               │                      │
       │                 │  Update   │               │                      │
       │                 └────┬──────┘               │                      │
       │                      │                      │                      │
       │                 ┌────▼──────────────┐       │                      │
       │                 │ Create Message:   │       │                      │
       │                 │ PriceUpdateMessage│       │                      │
       │                 │ {                 │       │                      │
       │                 │   type: "price_   │       │                      │
       │                 │          update", │       │                      │
       │                 │   pair: "SOL/USDC"│       │                      │
       │                 │   dex: "raydium", │       │                      │
       │                 │   price: 176.23,  │       │                      │
       │                 │   ...             │       │                      │
       │                 │ }                 │       │                      │
       │                 └────┬──────────────┘       │                      │
       │                      │                      │                      │
       │                      │ price_tx.send(msg)   │                      │
       │                      ├─────────────────────>│                      │
       │                      │                      │                      │
       │                      │                 ┌────▼─────┐                │
       │                      │                 │Broadcast │                │
       │                      │                 │to all    │                │
       │                      │                 │connected │                │
       │                      │                 │clients   │                │
       │                      │                 └────┬─────┘                │
       │                      │                      │                      │
       │                      │                      │ JSON over WebSocket  │
       │                      │                      ├─────────────────────>│
       │                      │                      │                      │
       │                      │                      │                 ┌────▼────────┐
       │                      │                      │                 │ onmessage   │
       │                      │                      │                 │ JSON.parse()│
       │                      │                      │                 └────┬────────┘
       │                      │                      │                      │
       │                      │                      │                 ┌────▼────────┐
       │                      │                      │                 │ setPrices() │
       │                      │                      │                 │ (React)     │
       │                      │                      │                 └────┬────────┘
       │                      │                      │                      │
       │                      │                      │                 ┌────▼────────┐
       │                      │                      │                 │ PriceCard   │
       │                      │                      │                 │ (re-render) │
       │                      │                      │                 │ Flash green!│
       │                      │                      │                 └─────────────┘

Latency: ~50ms (Helius) + ~15ms (Decode) + ~12ms (Calc) + ~5ms (Cache) +
         ~10ms (Broadcast) + ~20ms (Network) + ~5ms (React) = ~117ms total
```

### 2.2 Opportunity Detection Flow (Low Frequency)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   PRICE      │       │  OPPORTUNITY │       │  WEBSOCKET   │       │   NEXT.JS    │
│   CACHE      │       │  DETECTOR    │       │   SERVER     │       │  FRONTEND    │
└──────────────┘       └──────────────┘       └──────────────┘       └──────────────┘
       │                      │                      │                      │
       │  Price data ready    │                      │                      │
       │  (SOL/USDC on 3 DEXs)│                      │                      │
       ├─────────────────────>│                      │                      │
       │                      │                      │                      │
       │                 ┌────▼─────────┐            │                      │
       │                 │ Compare      │            │                      │
       │                 │ prices:      │            │                      │
       │                 │ RAY: $176.23 │            │                      │
       │                 │ ORC: $176.31 │            │                      │
       │                 │ MET: $176.19 │            │                      │
       │                 └────┬─────────┘            │                      │
       │                      │                      │                      │
       │                 ┌────▼─────────┐            │                      │
       │                 │ Calculate:   │            │                      │
       │                 │ Gross: 0.87% │            │                      │
       │                 │ Costs: 0.5%  │            │                      │
       │                 │ Net: 0.37%   │            │                      │
       │                 └────┬─────────┘            │                      │
       │                      │                      │                      │
       │                 ┌────▼─────────┐            │                      │
       │                 │ Validation:  │            │                      │
       │                 │ ✓ >0.5% min  │            │                      │
       │                 │ ✓ Liquidity  │            │                      │
       │                 │ ✓ Slot align │            │                      │
       │                 └────┬─────────┘            │                      │
       │                      │                      │                      │
       │                 ┌────▼──────────────┐       │                      │
       │                 │ Create Message:   │       │                      │
       │                 │ OpportunityMessage│       │                      │
       │                 │ {                 │       │                      │
       │                 │   type: "opp...", │       │                      │
       │                 │   pair: "SOL/USDC"│       │                      │
       │                 │   buy_dex: "ray", │       │                      │
       │                 │   net_profit: 0.37│       │                      │
       │                 │   ...             │       │                      │
       │                 │ }                 │       │                      │
       │                 └────┬──────────────┘       │                      │
       │                      │                      │                      │
       │                      │ opp_tx.send(msg)     │                      │
       │                      ├─────────────────────>│                      │
       │                      │                      │                      │
       │                      │                 ┌────▼─────┐                │
       │                      │                 │Broadcast │                │
       │                      │                 └────┬─────┘                │
       │                      │                      │                      │
       │                      │                      │ JSON over WebSocket  │
       │                      │                      ├─────────────────────>│
       │                      │                      │                      │
       │                      │                      │                 ┌────▼────────┐
       │                      │                      │                 │ JSON.parse()│
       │                      │                      │                 └────┬────────┘
       │                      │                      │                      │
       │                      │                      │                 ┌────▼─────────┐
       │                      │                      │                 │setOpps()     │
       │                      │                      │                 │(prepend new) │
       │                      │                      │                 └────┬─────────┘
       │                      │                      │                      │
       │                      │                      │                 ┌────▼─────────┐
       │                      │                      │                 │OppsTable     │
       │                      │                      │                 │Slide-in anim│
       │                      │                      │                 │New row green│
       │                      │                      │                 └──────────────┘
```

---

## 3. BROADCAST CHANNEL ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         RUST BACKEND (main.rs)                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  tokio::sync::broadcast Channels (Created at startup)              │ │
│  │                                                                    │ │
│  │  let (price_tx, _) = broadcast::channel::<PriceUpdateMessage>(1000);│ │
│  │  let (opp_tx, _) = broadcast::channel::<OpportunityMessage>(100);  │ │
│  │  let (health_tx, _) = broadcast::channel::<HealthMessage>(10);     │ │
│  │  let (log_tx, _) = broadcast::channel::<LogMessage>(500);          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Senders (tx) passed to:                 Receivers (rx) for each client:│
│                                                                          │
│  ┌──────────────────┐                    ┌─────────────────────────┐   │
│  │  Calculator      │                    │  WebSocket Server       │   │
│  │  price_tx.send() │                    │  ┌───────────────────┐  │   │
│  └──────────────────┘                    │  │ Client 1          │  │   │
│                                          │  │ price_rx.recv()   │  │   │
│  ┌──────────────────┐                    │  │ opp_rx.recv()     │  │   │
│  │  Detector        │                    │  │ health_rx.recv()  │  │   │
│  │  opp_tx.send()   │                    │  │ log_rx.recv()     │  │   │
│  └──────────────────┘                    │  └───────────────────┘  │   │
│                                          │                         │   │
│  ┌──────────────────┐                    │  ┌───────────────────┐  │   │
│  │  Health Monitor  │                    │  │ Client 2          │  │   │
│  │  health_tx.send()│                    │  │ (same receivers)  │  │   │
│  └──────────────────┘                    │  └───────────────────┘  │   │
│                                          │                         │   │
│  ┌──────────────────┐                    │  ┌───────────────────┐  │   │
│  │  Logger          │                    │  │ Client 3          │  │   │
│  │  log_tx.send()   │                    │  │ (same receivers)  │  │   │
│  └──────────────────┘                    │  └───────────────────┘  │   │
│                                          └─────────────────────────┘   │
│                                                                          │
│  Key Characteristics:                                                   │
│  • One sender per channel (cloned for different modules)                │
│  • Multiple receivers (one per connected client)                        │
│  • Messages broadcast to ALL receivers simultaneously                   │
│  • Non-blocking sends (fire-and-forget)                                 │
│  • Automatic receiver cleanup on client disconnect                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. WEBSOCKET CLIENT LIFECYCLE

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENT LIFECYCLE                     │
└─────────────────────────────────────────────────────────────────────┘

[Dashboard Component Mounts]
         │
         ▼
┌─────────────────────┐
│ useWebSocket() hook │
│ initializes         │
└─────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ ws = new WebSocket(             │
│   "ws://localhost:8080"         │
│ )                               │
└─────────────────────────────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌──────────────────┐
│ ws.onopen       │              │ ws.onerror       │
│ setConnected()  │              │ console.error()  │
└─────────────────┘              └──────────────────┘
         │                                  │
         ▼                                  │
┌─────────────────────────────────┐        │
│ CONNECTED STATE                 │        │
│ • isConnected = true            │        │
│ • Green indicator in header     │        │
└─────────────────────────────────┘        │
         │                                  │
         ▼                                  │
┌─────────────────────────────────┐        │
│ ws.onmessage (continuous)       │        │
│ │                               │        │
│ ├─ Parse JSON                   │        │
│ ├─ Update state based on type:  │        │
│ │  • price_update → setPrices() │        │
│ │  • opportunity → setOpps()    │        │
│ │  • health → setHealth()       │        │
│ │  • log → setLogs()            │        │
│ │                               │        │
│ └─ Trigger React re-render      │        │
└─────────────────────────────────┘        │
         │                                  │
         │ (if connection drops)            │
         ▼                                  │
┌─────────────────┐                        │
│ ws.onclose      │◄───────────────────────┘
│ setConnected()  │
│ (false)         │
└─────────────────┘
         │
         ▼
┌───────────────────────────────────┐
│ RECONNECTION LOGIC                │
│ • Exponential backoff             │
│ • Attempt 1: 1 second             │
│ • Attempt 2: 2 seconds            │
│ • Attempt 3: 4 seconds            │
│ • ...                             │
│ • Max: 30 seconds                 │
└───────────────────────────────────┘
         │
         ▼
   [Try connect again]
         │
         └─────────────────┐
                           │
         ┌─────────────────┘
         ▼
[Component Unmounts]
         │
         ▼
┌─────────────────┐
│ ws.close()      │
│ cleanup         │
└─────────────────┘
```

---

## 5. DATA SYNCHRONIZATION MODEL

```
┌──────────────────────────────────────────────────────────────────┐
│                    RUST BACKEND (Source of Truth)                │
│                                                                  │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │   Raydium   │   │    Orca     │   │   Meteora   │           │
│  │  $176.23    │   │  $176.31    │   │  $176.19    │           │
│  └─────────────┘   └─────────────┘   └─────────────┘           │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                    │
│                    ┌───────▼────────┐                           │
│                    │  PRICE CACHE   │                           │
│                    │  (DashMap)     │                           │
│                    │                │                           │
│                    │  SOL/USDC:     │                           │
│                    │   RAY: $176.23 │                           │
│                    │   ORC: $176.31 │                           │
│                    │   MET: $176.19 │                           │
│                    └───────┬────────┘                           │
│                            │                                    │
│                            │ Broadcast on every update          │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ WebSocket (JSON)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    NEXT.JS FRONTEND (View Layer)                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  REACT STATE (useState)                                  │  │
│  │                                                          │  │
│  │  prices: Map<string, PriceData[]> = {                    │  │
│  │    "SOL/USDC": [                                         │  │
│  │      { dex: "raydium", price: 176.23, ... },            │  │
│  │      { dex: "orca", price: 176.31, ... },               │  │
│  │      { dex: "meteora", price: 176.19, ... }             │  │
│  │    ]                                                     │  │
│  │  }                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                   │
│                            ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  DASHBOARD COMPONENTS (React re-render on state change)  │  │
│  │                                                          │  │
│  │  PriceCard displays:                                     │  │
│  │  ┌───────────┬──────────┬──────────┐                     │  │
│  │  │ Raydium   │ $176.23  │ 45.2M    │ ← Flash green!     │  │
│  │  │ Orca      │ $176.31  │ 32.8M    │                    │  │
│  │  │ Meteora   │ $176.19  │ 18.4M    │                    │  │
│  │  └───────────┴──────────┴──────────┘                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

KEY PRINCIPLES:
• Backend owns the data (single source of truth)
• Frontend is a view layer (reactive to backend changes)
• WebSocket provides one-way data flow (backend → frontend)
• No frontend → backend messages (read-only from frontend perspective)
• State updates trigger React re-renders automatically
```

---

## 6. NETWORK TOPOLOGY

```
┌─────────────────────────────────────────────────────────────┐
│            ORACLE CLOUD INSTANCE (Always Free)              │
│            IP: 123.456.789.012                              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  INTERNAL NETWORK (localhost)                         │ │
│  │                                                       │ │
│  │  ┌──────────────────┐        ┌──────────────────┐    │ │
│  │  │ Rust Backend     │        │ Next.js Frontend │    │ │
│  │  │ Port: 8080       │◄──────►│ Port: 3000       │    │ │
│  │  │ (WebSocket)      │  ws:// │ (HTTP/React)     │    │ │
│  │  └──────────────────┘        └──────────────────┘    │ │
│  │                                     │                │ │
│  └─────────────────────────────────────┼────────────────┘ │
│                                        │                  │
│  ┌─────────────────────────────────────▼────────────────┐ │
│  │  Nginx Reverse Proxy (Optional)                      │ │
│  │  Port: 80 (HTTP) / 443 (HTTPS)                       │ │
│  │                                                      │ │
│  │  location / {                                        │ │
│  │    proxy_pass http://localhost:3000;                 │ │
│  │  }                                                   │ │
│  │                                                      │ │
│  │  location /ws {                                      │ │
│  │    proxy_pass http://localhost:8080;                 │ │
│  │    proxy_http_version 1.1;                           │ │
│  │    proxy_set_header Upgrade $http_upgrade;           │ │
│  │    proxy_set_header Connection "Upgrade";            │ │
│  │  }                                                   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                        │                  │
└────────────────────────────────────────┼──────────────────┘
                                         │
                                 [Firewall: Port 80, 22]
                                         │
                                         ▼
                              ┌────────────────────┐
                              │  PUBLIC INTERNET   │
                              │                    │
                              │  User Browser      │
                              │  https://          │
                              │  your-domain.com   │
                              └────────────────────┘

DEPLOYMENT SCENARIOS:

1. LOCAL DEVELOPMENT:
   • Backend: cargo run (localhost:8080)
   • Frontend: npm run dev (localhost:3000)
   • Access: http://localhost:3000
   • WebSocket: ws://localhost:8080 (direct)

2. PRODUCTION (INTERNAL):
   • Both on same instance, internal communication
   • No external WebSocket exposure needed
   • Frontend makes WebSocket connection to localhost

3. PRODUCTION (EXTERNAL - Optional):
   • Nginx proxies WebSocket to /ws endpoint
   • Frontend connects to wss://your-domain.com/ws
   • More complex but allows scaling later
```

---

## 7. TIMING DIAGRAM (Real-Time Update)

```
Time (ms)  Backend                  WebSocket Server         Frontend
═══════════════════════════════════════════════════════════════════════════
    0      [Price change on Helius]
           │
   50      ├─ Decode account data
           │
   65      ├─ Calculate AMM price
           │
   77      ├─ Update cache
           │
   82      ├─ Create PriceUpdateMessage
           │
   87      └─ price_tx.send(msg) ──────────►│
                                             │
   89                                        ├─ Serialize to JSON
                                             │
   91                                        ├─ ws.send(json) ──────►│
                                             │                        │
   111                                       │                        ├─ onmessage fires
                                             │                        │
   113                                       │                        ├─ JSON.parse()
                                             │                        │
   115                                       │                        ├─ setPrices()
                                             │                        │
   120                                       │                        └─ React re-render
                                                                      │
   125                                                                └─ [User sees update!]

TOTAL LATENCY: 125ms (Well under 400ms target!)

Breakdown:
- Helius → Backend: 50ms
- Backend processing: 27ms
- WebSocket send: 4ms
- Network transmission: 20ms
- Frontend processing: 24ms
```

---

These diagrams provide a complete visual understanding of how data flows from the Solana blockchain through your Rust backend to the Next.js frontend in real-time!
