# SOLANA ARBITRAGE MONITOR - WIREFRAMES

## Layout Philosophy
**Inspiration**: Bloomberg Terminal density + modern fintech clarity  
**Theme**: Terminal-dark aesthetic with functional data organization  
**Grid**: 12-column responsive grid, dense but organized

---

## MAIN DASHBOARD LAYOUT

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ HEADER BAR (60px height, bg-zinc-950, border-b border-zinc-800)               │
│ ┌─────────────────────┬──────────────────────────────────┬──────────────────┐ │
│ │ LOGO + TITLE        │ GLOBAL METRICS (Centered)        │ SYSTEM STATUS    │ │
│ │ "SOL ARB MONITOR"   │ ↓ Latency: 156ms                 │ ● WS: Connected  │ │
│ │ (18px, white)       │ ↑ Updates/s: 342                 │ ● Cache: 99.2%   │ │
│ │                     │ ⚡ Opps/hr: 12                   │ 󰅐 12:34:56 UTC  │ │
│ └─────────────────────┴──────────────────────────────────┴──────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│ MAIN CONTENT AREA (bg-zinc-900)                                                │
│                                                                                │
│ ┌────────────────────────────────────────────────────────────────────────────┐ │
│ │ LEFT PANEL (60% width, pr-4)                                               │ │
│ │                                                                            │ │
│ │ ┌──────────────────────────────────────────────────────────────────────┐   │ │
│ │ │ ACTIVE OPPORTUNITIES (bg-zinc-950, rounded-lg, p-4, border-zinc-800) │   │ │
│ │ │ ┌─────────┬─────────┬──────────┬──────────┬──────────┬───────────┐  │   │ │
│ │ │ │ TYPE    │ PAIR    │ BUY/SELL │ PROFIT % │ SIZE     │ CONF %    │  │   │ │
│ │ │ ├─────────┼─────────┼──────────┼──────────┼──────────┼───────────┤  │   │ │
│ │ │ │ SPATIAL │ SOL/USDC│ RAY→ORCA │ +0.87%   │ 12.4 SOL │ 92%       │  │   │ │
│ │ │ │ (green) │         │          │ (GREEN)  │          │ (blue)    │  │   │ │
│ │ │ ├─────────┼─────────┼──────────┼──────────┼──────────┼───────────┤  │   │ │
│ │ │ │ STAT    │ SOL/USDT│ Z:-2.3σ  │ +0.45%   │ 8.7 SOL  │ 78%       │  │   │ │
│ │ │ │ (blue)  │         │ LONG     │ (GREEN)  │          │ (blue)    │  │   │ │
│ │ │ └─────────┴─────────┴──────────┴──────────┴──────────┴───────────┘  │   │ │
│ │ │ Live updates, max 10 rows, auto-scroll                              │   │ │
│ │ └──────────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                            │ │
│ │ ┌──────────────────────────────────────────────────────────────────────┐   │ │
│ │ │ REAL-TIME PRICES (bg-zinc-950, rounded-lg, p-4, mt-4)                │   │ │
│ │ │ Tabs: [SOL/USDC*] [SOL/USDT] [BONK/SOL] [JTO/SOL] ...               │   │ │
│ │ │                                                                      │   │ │
│ │ │ ┌─────────────┬──────────────┬──────────────┬──────────────┐        │   │ │
│ │ │ │ DEX         │ PRICE        │ LIQUIDITY    │ LAST UPDATE  │        │   │ │
│ │ │ ├─────────────┼──────────────┼──────────────┼──────────────┤        │   │ │
│ │ │ │ RAYDIUM     │ $176.23      │ $45.2M       │ 0.2s ago     │        │   │ │
│ │ │ │             │ (white)      │ (gray)       │ (green)      │        │   │ │
│ │ │ ├─────────────┼──────────────┼──────────────┼──────────────┤        │   │ │
│ │ │ │ ORCA        │ $176.31      │ $32.8M       │ 0.5s ago     │        │   │ │
│ │ │ │             │ (white)      │ (gray)       │ (green)      │        │   │ │
│ │ │ ├─────────────┼──────────────┼──────────────┼──────────────┤        │   │ │
│ │ │ │ METEORA     │ $176.19      │ $18.4M       │ 1.2s ago     │        │   │ │
│ │ │ │             │ (white)      │ (gray)       │ (yellow)     │        │   │ │
│ │ │ └─────────────┴──────────────┴──────────────┴──────────────┘        │   │ │
│ │ │                                                                      │   │ │
│ │ │ SPREAD INDICATOR (visual bar showing price range)                   │   │ │
│ │ │ Min: $176.19 ━━━━━━━━━━━━━━●━━━━━━━━━ Max: $176.31 (0.07% spread) │   │ │
│ │ └──────────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                            │ │
│ │ ┌──────────────────────────────────────────────────────────────────────┐   │ │
│ │ │ PRICE HISTORY CHART (bg-zinc-950, rounded-lg, p-4, mt-4, h-64)       │   │ │
│ │ │ Line chart: 3 lines (Raydium=green, Orca=blue, Meteora=purple)      │   │ │
│ │ │ X-axis: Last 60 minutes, Y-axis: Price                               │   │ │
│ │ │ Annotations for detected opportunities (vertical markers)            │   │ │
│ │ └──────────────────────────────────────────────────────────────────────┘   │ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│ ┌────────────────────────────────────────────────────────────────────────────┐ │
│ │ RIGHT PANEL (40% width, pl-4)                                              │ │
│ │                                                                            │ │
│ │ ┌──────────────────────────────────────────────────────────────────────┐   │ │
│ │ │ PERFORMANCE METRICS (bg-zinc-950, rounded-lg, p-4)                   │   │ │
│ │ │ ┌──────────────────────┬──────────────────────┐                      │   │ │
│ │ │ │ METRIC               │ VALUE                │                      │   │ │
│ │ │ ├──────────────────────┼──────────────────────┤                      │   │ │
│ │ │ │ Avg Detection (p95)  │ 156ms (green <200ms) │                      │   │ │
│ │ │ │ Price Updates/min    │ 4,231                │                      │   │ │
│ │ │ │ Cache Hit Rate       │ 99.2%                │                      │   │ │
│ │ │ │ Stale Prices         │ 2 (0.3%) (green)     │                      │   │ │
│ │ │ │ Uptime               │ 23h 14m              │                      │   │ │
│ │ │ └──────────────────────┴──────────────────────┘                      │   │ │
│ │ └──────────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                            │ │
│ │ ┌──────────────────────────────────────────────────────────────────────┐   │ │
│ │ │ OPPORTUNITY STATS (bg-zinc-950, rounded-lg, p-4, mt-4)               │   │ │
│ │ │ Last Hour:                                                           │   │ │
│ │ │ • Spatial: 8 (green)                                                 │   │ │
│ │ │ • Statistical: 3 (blue)                                              │   │ │
│ │ │ • Triangular: 1 (purple)                                             │   │ │
│ │ │                                                                      │   │ │
│ │ │ Avg Profit: +0.62%                                                   │   │ │
│ │ │ Best Opportunity: +1.24% (SOL/USDC spatial)                          │   │ │
│ │ └──────────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                            │ │
│ │ ┌──────────────────────────────────────────────────────────────────────┐   │ │
│ │ │ SYSTEM HEALTH (bg-zinc-950, rounded-lg, p-4, mt-4)                   │   │ │
│ │ │ ┌────────────┬─────────────┬──────────┐                              │   │ │
│ │ │ │ COMPONENT  │ STATUS      │ LATENCY  │                              │   │ │
│ │ │ ├────────────┼─────────────┼──────────┤                              │   │ │
│ │ │ │ WebSocket  │ ● Connected │ 45ms     │                              │   │ │
│ │ │ │ Price Calc │ ● Running   │ 12ms     │                              │   │ │
│ │ │ │ Detector   │ ● Active    │ 34ms     │                              │   │ │
│ │ │ │ Cache      │ ● Healthy   │ 3ms      │                              │   │ │
│ │ │ └────────────┴─────────────┴──────────┘                              │   │ │
│ │ └──────────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                            │ │
│ │ ┌──────────────────────────────────────────────────────────────────────┐   │ │
│ │ │ ACTIVITY LOG (bg-zinc-950, rounded-lg, p-4, mt-4, h-48)              │   │ │
│ │ │ [12:34:56] Opportunity detected: SOL/USDC +0.87%                     │   │ │
│ │ │ [12:34:23] Price update: SOL/USDC Raydium $176.23                    │   │ │
│ │ │ [12:33:45] WebSocket reconnected successfully                        │   │ │
│ │ │ [12:33:12] Cache cleanup: 43 stale entries removed                   │   │ │
│ │ │ Auto-scroll, color-coded by severity (green/yellow/red)              │   │ │
│ │ └──────────────────────────────────────────────────────────────────────┘   │ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## DETAILED COMPONENT WIREFRAMES

### 1. ACTIVE OPPORTUNITIES TABLE
```
┌──────────────────────────────────────────────────────────────────┐
│ ACTIVE OPPORTUNITIES                            [Filter ▼] [⚙️]  │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────┬─────────┬──────────┬────────┬─────────┬──────┬────────┐│
│ │ ●    │ TYPE    │ PAIR     │ ROUTE  │ PROFIT  │ SIZE │ CONF   ││
│ ├──────┼─────────┼──────────┼────────┼─────────┼──────┼────────┤│
│ │ 🟢   │ SPATIAL │ SOL/USDC │ R→O    │ +0.87%  │ 12.4 │ 92%    ││
│ │      │ (badge) │ (14px)   │ (12px) │ (green) │ SOL  │ (blue) ││
│ │      │         │          │        │ (16px)  │      │        ││
│ ├──────┼─────────┼──────────┼────────┼─────────┼──────┼────────┤│
│ │ 🔵   │ STAT    │ SOL/USDT │ Z:-2.3 │ +0.45%  │ 8.7  │ 78%    ││
│ │      │ (badge) │          │ LONG   │ (green) │ SOL  │        ││
│ ├──────┼─────────┼──────────┼────────┼─────────┼──────┼────────┤│
│ │ 🟣   │ TRIANG  │ SOL/BONK │ S→U→B  │ +0.34%  │ 15.2 │ 65%    ││
│ │      │ (badge) │ /USDC    │ (3hop) │ (green) │ SOL  │        ││
│ └──────┴─────────┴──────────┴────────┴─────────┴──────┴────────┘│
│                                                                  │
│ Hover: Row highlights (bg-zinc-800)                             │
│ Click: Expand for detailed breakdown                            │
└──────────────────────────────────────────────────────────────────┘
```

### 2. REAL-TIME PRICE CARD (Single Token Pair)
```
┌──────────────────────────────────────────────────────────────┐
│ SOL/USDC                                    Last: 0.2s ago ⟳ │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ RAYDIUM          $176.23       $45.2M        ━━━━━━━━━━  │ │
│ │ (logo 24x24)     (20px bold)   (14px gray)   (bars)      │ │
│ │                  ↑ +0.02%                                 │ │
│ │                  (green 12px)                             │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ ORCA             $176.31       $32.8M        ━━━━━━━━    │ │
│ │                  ↑ +0.05%                                 │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ METEORA          $176.19       $18.4M        ━━━━━━      │ │
│ │                  ↓ -0.01%                                 │ │
│ │                  (red 12px)                               │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ SPREAD: 0.07% ($0.12)  [━━━━━━●━━━━━━━━━━━━━━━━━━━━]       │
│         (orange if >0.3%, green if >0.5%)                    │
└──────────────────────────────────────────────────────────────┘
```

### 3. PERFORMANCE METRIC CARD
```
┌──────────────────────────────────────────────────┐
│ ⚡ DETECTION LATENCY (P95)                       │
├──────────────────────────────────────────────────┤
│          156ms                                   │
│     (48px, green if <200ms)                      │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 0ms                 200ms (target)        400ms  │
│                       ▲                          │
│                     (156ms marker)               │
│                                                  │
│ Trend: ↓ -12ms from 1h ago (green)              │
└──────────────────────────────────────────────────┘
```

### 4. SYSTEM STATUS INDICATOR (Header)
```
┌────────────────────────────────────────┐
│ ● WebSocket: Connected                 │
│ ● Cache: 99.2% (2341/2348 entries)     │
│ ⏱️ 12:34:56 UTC                         │
│ ↑ Uptime: 23h 14m                      │
└────────────────────────────────────────┘

States:
● Green = Healthy/Connected
● Yellow = Warning/Degraded  
● Red = Error/Disconnected
```

### 5. OPPORTUNITY DETAIL MODAL (Click on row)
```
┌─────────────────────────────────────────────────────────────┐
│ OPPORTUNITY DETAILS                                    [✕]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ TYPE: Spatial Arbitrage          DETECTED: 12:34:56 UTC    │
│ PAIR: SOL/USDC                   CONFIDENCE: 92%           │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ROUTE                                                   │ │
│ │ BUY:  Raydium @ $176.23 (45.2M liquidity)              │ │
│ │ SELL: Orca @ $176.31 (32.8M liquidity)                 │ │
│ │                                                         │ │
│ │ GROSS PROFIT: 0.87%                                     │ │
│ │ COSTS:                                                  │ │
│ │  - DEX Fees (0.5%):        -$0.088                     │ │
│ │  - Slippage (0.3%):        -$0.053                     │ │
│ │  - Gas + Jito (est):       -$0.012                     │ │
│ │                                                         │ │
│ │ NET PROFIT: 0.37% ($0.65)  (green if >0.5%)            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ RECOMMENDED SIZE: 12.4 SOL                                  │
│ (5% of smallest pool liquidity)                             │
│                                                             │
│ TIMING:                                                     │
│  Detection Latency: 156ms                                   │
│  Slot Alignment: ✓ (Δ1 slot)                                │
│  Data Freshness: 0.2s                                       │
│                                                             │
│ [COPY DETAILS] [EXPORT CSV] [DISMISS]                       │
└─────────────────────────────────────────────────────────────┘
```

---

## COLOR PALETTE REFERENCE

**Background Layers:**
- Primary BG: `#0a0a0a` (zinc-950)
- Secondary BG: `#18181b` (zinc-900)
- Card BG: `#27272a` (zinc-800) on hover
- Border: `#3f3f46` (zinc-700)

**Accent Colors:**
- **Green** (Profit/Positive): `#22c55e` (green-500)
- **Red** (Loss/Negative): `#ef4444` (red-500)
- **Blue** (Info/Statistical): `#3b82f6` (blue-500)
- **Purple** (Triangular): `#a855f7` (purple-500)
- **Orange** (Warning): `#f97316` (orange-500)
- **White** (Primary Text): `#fafafa` (zinc-50)
- **Gray** (Secondary Text): `#a1a1aa` (zinc-400)

**Semantic Usage:**
- Profit >0.5%: Bright green
- Profit 0-0.5%: Muted green
- Loss: Red
- Latency <200ms: Green
- Latency 200-400ms: Orange
- Latency >400ms: Red

---

## RESPONSIVE BREAKPOINTS

**Desktop (≥1280px):** 60/40 split as shown
**Tablet (768-1279px):** 50/50 split, reduce padding
**Mobile (<768px):** Stack vertically, opportunities table first

---

## INTERACTION STATES

**Hover:**
- Table rows: bg-zinc-800, subtle glow
- Buttons: Slight brightness increase

**Active/Selected:**
- Selected tab: border-b-2 border-green-500
- Active opportunity: bg-zinc-800 with left border accent

**Loading:**
- Skeleton screens with shimmer animation
- "Updating..." spinner (12px) next to component title

**Error:**
- Red border on affected component
- Error message in red text below

---

## ACCESSIBILITY NOTES

- All color indicators paired with icons/text
- Minimum contrast ratio 4.5:1
- Focus visible states (ring-2 ring-blue-500)
- Screen reader labels for all interactive elements
- Keyboard navigation: Tab through opportunities, Enter to expand

---

## ANIMATION GUIDELINES

- New opportunity: Slide in from top (300ms ease-out)
- Price update: Flash green/red briefly (200ms)
- Chart updates: Smooth line transition (500ms)
- Modal: Fade in + scale (200ms)
- **Keep animations subtle** - terminal aesthetic, not flashy
