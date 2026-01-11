# Frontend Technical Specification & Design System (v2.6)

## Executive Summary

This document defines the architectural and visual specification for the Solana **Arbitrage Detection & Alert Terminal**. The interface is designed as a mission-critical "Bloomberg-style" dashboard, prioritizing real-time profit detection over raw price monitoring. It leverages **Shadcn UI** for high-fidelity components and **Tailwind CSS** for terminal aesthetics.

---

## 1. Design System (Shadcn UI Integration)

### 1.1 Aesthetic Pillars

- **Theme**: `Void Black` base with `Phosphor Green` (#00ff41) accents.
- **Typography**: `JetBrains Mono` for all numerical data; `Inter` for functional UI.
- **Components**:
  - `Resizable`: For the primary 60/40 screen split.
  - `Table`: For the high-density Arbitrage Scanner.
  - `Card`: For structured Opportunity Alerts.
  - `Tooltip`: For fee and slot data breakdowns.

### 1.2 Layout Split (60/40)

The 60/40 split ensures the **Arbitrage Scanner** (Left) has max visibility, while the **Opportunity Timeline** (Right) provides temporal context.

---

## 2. Component Wireframes & Data Display

### 2.1 Arbitrage Scanner (The Money View)

Each row represents a unified pair opportunity.

```text
┌─────────────────────────────────────────────────────────────────────┐
│ PAIR      BUY DEX   BUY PRICE  SELL DEX  SELL PRICE  SPREAD         │
├─────────────────────────────────────────────────────────────────────┤
│ SOL/USDC  Raydium   127.38     Orca      127.95      +0.45%         │ ← GREEN (Profitable)
│ Liquidity: $2.3M               $1.8M                                │
│ Est. Size: 1.2 SOL             Net Profit: +0.18% (after fees)      │
├─────────────────────────────────────────────────────────────────────┤
│ SOL/USDT  Orca      127.52     Meteora   127.48      -0.03%         │ ← DIM (Inactive)
│ Liquidity: $890K               $1.2M                                │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Opportunity Timeline (The Alert Log)

High-fidelity cards replace standard log lines for detected opportunities.

```text
┌────────────────────────────────────────────────────────────────┐
│ [11:42:15.794] ● ARBITRAGE DETECTED                            │
│                                                                │
│ Pair:         SOL/USDC                                         │
│ Strategy:     Spatial                                          │
│ Buy:          Raydium @ 127.38                                 │
│ Sell:         Orca @ 127.95                                    │
│ Gross:        +0.45%                                           │
│ Net (fees):   +0.18%  ← PRIMARY KPI                            │
│ Confidence:   82%                                              │
└────────────────────────────────────────────────────────────────┘
```

### 2.3 System Footer

```text
UPTIME: 12h 34m | CACHE: 187/500 | UPDATES/s: 23 | MEM: 45% | CPU: 12%
```

---

## 3. Data Logic & Calculation

### 3.1 Profit Detection Logic

The frontend calculates real-time Net Profit for immediate visual feedback:

```text
Gross Profit:  +0.45%
- Buy DEX Fee: -0.25%
- Sell DEX Fee: -0.25%
- Slippage:    -0.15% (Dynamic based on vault depth)
- Network:     -0.02% (Gas + Jito Tip)
────────────────────────
Net Profit:     +0.18%
```

### 3.2 Backend Mapping

| Field       | Source      | Purpose                            |
| :---------- | :---------- | :--------------------------------- |
| `liquidity` | PriceUpdate | Validates capacity for "Est. Size" |
| `vaults`    | PriceUpdate | Inputs for Slippage Impact model   |
| `slot`      | PriceUpdate | Badge: "ALIGNED" vs "DRIFT"        |

---

## 4. Development Roadmap

1. **Foundation**: Scaffold Shadcn UI and Resizable Layout.
2. **Scanner**: Implement the 3-line high-density Table row.
3. **Timeline**: Build the card-based Alert System with strict filtering.
4. **Logic**: Port the `NetProfit` calculation engine into the Hook layer.
