# Frontend Design Document (The Terminal)

## 1. Visual Identity

**Theme**: "Terminal" / "High-Frequency Trading Matrix"
**Philosophy**: Zero-distraction, high-contrast, data-dense.

### Color Palette

| Variable              | Hex Code  | Purpose                                       |
| :-------------------- | :-------- | :-------------------------------------------- |
| `bg-terminal`         | `#0a0a0a` | Deep black background (Vantablack style)      |
| `text-terminal-green` | `#00ff41` | Profit, Success, Online Status (Matrix Green) |
| `text-terminal-red`   | `#ff3333` | Loss, Error, Disconnected (Alert Red)         |
| `text-terminal-dim`   | `#444444` | Borders, Labels, Inactive text                |
| `text-white`          | `#ffffff` | Primary data values                           |

### Typography

- **Font Family**: Monospace (`JetBrains Mono`, `Fira Code`, or System Mono).
- **Scale**: Small (12px - 14px) for maximum information density.
- **Weight**: Regular (400) for data, Bold (700) for headers/alerts.

### Visual Effects

- **Glow**: Used on "Online" indicators and "Arbitrage Detected" events.
  - `box-shadow: 0 0 10px #00ff41`
- **Scanline**: A subtle CSS overlay to mimic CRT monitors (opacity 0.15).
- **Pulse**: CSS animation on new arbitrage opportunities to grab attention.

---

## 2. Layout Structure

The dashboard uses a **Fixed Grid Layout** (no scrolling on the main body).

```
+-------------------------------------------------------+
|  HUD (Heads-Up Display) - Fixed Top Bar               |
+-------------------+-----------------------------------+
|                   |                                   |
|                   |                                   |
|  PRICE FEED       |   TERMINAL LOGS                   |
|  (33% Width)      |   (66% Width)                     |
|                   |                                   |
|  - Scrollable     |   - Scrollable (Auto-bottom)      |
|  - Grid View      |   - List View                     |
|                   |                                   |
+-------------------+-----------------------------------+
```

---

## 3. Component Styling

### A. HUD (`components/HUD.tsx`)

- **Border**: Bottom border `1px solid #444`.
- **Status Indicator**:
  - `w-3 h-3 rounded-full`
  - **Green**: Connected (with glow)
  - **Red**: Disconnected (no glow)
- **Metrics**: Uppercase labels in Dim Gray, values in White.

### B. Price Grid (`components/PriceGrid.tsx`)

- **Header**: Sticky top, `bg-terminal-dim/20` (transparent gray).
- **Rows**:
  - `hover:bg-white/5` (Subtle highlight on hover).
  - **Pair**: White, Bold.
  - **Dex**: Dim Gray, Uppercase.
  - **Price**: Green (if updated recently).
  - **Latency**: Dim Gray (e.g., "400ms").

### C. Terminal Log (`components/TerminalLog.tsx`)

- **Background**: Slightly lighter black (`bg-black/50`).
- **Message Format**: `[TIMESTAMP] [TYPE] [MESSAGE]`
- **Highlighting**:
  - **Arbitrage**: Bright Green + Bold + Pulse animation.
  - **Errors**: Red.
  - **Info**: Dim Gray.

---

## 4. Interaction Design

- **Real-Time**: No manual refreshing. Data flows in via WebSocket.
- **Connection State**: The UI automatically dims or shows a "Reconnecting..." status if the WebSocket drops.
- **Notifications**: Visual pulse on the specific log line when an opportunity is found.

## 5. CSS Architecture

- **Framework**: Tailwind CSS.
- **Configuration**: colors defined in `tailwind.config.ts`.
- **Global Styles**: CRT scanline and scrollbar customization in `globals.css`.
