# SOLANA ARBITRAGE MONITOR
## Visual Design System & Implementation Guide

**Version:** 1.0  
**Framework:** Next.js 15 + shadcn/ui  
**Design Language:** Financial Terminal Dark

---

## 1. DESIGN PHILOSOPHY

### Core Principles

**1.1 Information Density over Aesthetics**
Bloomberg users take pride in manipulating complex interfaces - the more painful the UI, the more satisfied these users are. Our approach: **Density with clarity**.

- Pack maximum information in minimum space
- Use typography hierarchy to create order
- Let data breathe despite density

**1.2 Speed is Everything**
Real-time financial analytics enable users to view live data feeds from trading platforms, and when traders can view real-time fluctuation, they don't just monitor, they engage with data.

- Update latency <100ms for price changes
- Visual feedback for all state changes
- Progressive loading (skeleton screens)

**1.3 Terminal Aesthetic, Modern UX**
Bloomberg has moved toward a tabbed panel model where users can fully customize their workflow by displaying an arbitrary number of tabs or windows.

- Dark, focused environment (reduce eye strain)
- Green text on black = classic terminal nostalgia
- Modern touches: rounded corners, smooth animations

---

## 2. COLOR SYSTEM

### 2.1 Foundation Palette

```css
/* Background Hierarchy */
--bg-primary: #0a0a0a;      /* zinc-950 - Main canvas */
--bg-secondary: #18181b;    /* zinc-900 - Cards/panels */
--bg-tertiary: #27272a;     /* zinc-800 - Hover states */
--bg-elevated: #3f3f46;     /* zinc-700 - Elevated cards */

/* Borders & Dividers */
--border-subtle: #3f3f46;   /* zinc-700 - Default borders */
--border-strong: #52525b;   /* zinc-600 - Emphasized borders */
--border-accent: #22c55e;   /* green-500 - Active/selected */

/* Text Hierarchy */
--text-primary: #fafafa;    /* zinc-50 - Headlines, prices */
--text-secondary: #d4d4d8;  /* zinc-300 - Body text */
--text-tertiary: #a1a1aa;   /* zinc-400 - Metadata, labels */
--text-muted: #71717a;      /* zinc-500 - Disabled, placeholders */
```

### 2.2 Semantic Colors

```css
/* Profit/Loss */
--profit-strong: #22c55e;   /* green-500 - >0.5% profit */
--profit-weak: #4ade80;     /* green-400 - 0-0.5% profit */
--loss: #ef4444;            /* red-500 - Negative */
--neutral: #a1a1aa;         /* zinc-400 - Zero change */

/* Opportunity Types */
--spatial: #22c55e;         /* green-500 - Spatial arbitrage */
--statistical: #3b82f6;     /* blue-500 - Statistical arbitrage */
--triangular: #a855f7;      /* purple-500 - Triangular arbitrage */

/* System Status */
--status-healthy: #22c55e;  /* green-500 - Connected, <200ms */
--status-warning: #f97316;  /* orange-500 - Degraded, 200-400ms */
--status-error: #ef4444;    /* red-500 - Disconnected, >400ms */

/* Chart Colors */
--chart-raydium: #22c55e;   /* green-500 */
--chart-orca: #3b82f6;      /* blue-500 */
--chart-meteora: #a855f7;   /* purple-500 */
```

### 2.3 Color Usage Rules

**Text on Dark Backgrounds:**
- Primary data (prices, profits): `--text-primary` (white)
- Supporting data (DEX names): `--text-secondary` (light gray)
- Metadata (timestamps): `--text-tertiary` (mid gray)

**Profit/Loss Indicators:**
```typescript
const getProfitColor = (profit: number) => {
  if (profit >= 0.5) return 'text-green-500'; // Strong profit
  if (profit > 0) return 'text-green-400';    // Weak profit
  if (profit < 0) return 'text-red-500';      // Loss
  return 'text-zinc-400';                     // Neutral
};
```

**Status Indicators:**
```typescript
const getStatusColor = (latency: number) => {
  if (latency < 200) return 'bg-green-500';
  if (latency < 400) return 'bg-orange-500';
  return 'bg-red-500';
};
```

---

## 3. TYPOGRAPHY

### 3.1 Font Families

```css
/* Primary: JetBrains Mono (Monospace for data) */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

/* Secondary: Inter (UI elements) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

--font-mono: 'JetBrains Mono', monospace;
--font-sans: 'Inter', system-ui, sans-serif;
```

**Why These Fonts?**
- **JetBrains Mono**: Excellent character differentiation (0 vs O, 1 vs l), optimized for code/data
- **Inter**: Clean, highly legible at small sizes, excellent for UI labels

### 3.2 Type Scale

```css
/* Headlines & Prices */
--text-4xl: 48px / 1.1;    /* Hero numbers (rare) */
--text-3xl: 36px / 1.2;    /* Large metrics */
--text-2xl: 24px / 1.3;    /* Card titles */
--text-xl: 20px / 1.4;     /* Primary prices */

/* Body & UI */
--text-lg: 18px / 1.5;     /* Emphasized body */
--text-base: 16px / 1.5;   /* Default body */
--text-sm: 14px / 1.5;     /* Secondary text */
--text-xs: 12px / 1.4;     /* Metadata, timestamps */

/* Monospace Data */
--data-lg: 18px / 1.2;     /* Large data values */
--data-base: 16px / 1.2;   /* Standard data */
--data-sm: 14px / 1.2;     /* Small data */
--data-xs: 12px / 1.2;     /* Dense tables */
```

### 3.3 Font Weights

```css
--font-normal: 400;   /* Body text, labels */
--font-medium: 500;   /* Emphasized text */
--font-semibold: 600; /* Headings, important values */
--font-bold: 700;     /* Critical alerts, large numbers */
```

### 3.4 Typography Usage Matrix

| Element | Font Family | Size | Weight | Color | Example |
|---------|-------------|------|--------|-------|---------|
| Page Title | Inter | 2xl (24px) | Semibold (600) | text-primary | "Active Opportunities" |
| Card Title | Inter | xl (20px) | Semibold (600) | text-primary | "Real-Time Prices" |
| Price (Large) | JetBrains Mono | xl (20px) | Bold (700) | text-primary | "$176.23" |
| Price (Table) | JetBrains Mono | base (16px) | Semibold (600) | text-primary | "$176.23" |
| Percentage | JetBrains Mono | base (16px) | Semibold (600) | Semantic | "+0.87%" |
| DEX Name | Inter | sm (14px) | Medium (500) | text-secondary | "Raydium" |
| Metadata | JetBrains Mono | xs (12px) | Normal (400) | text-tertiary | "0.2s ago" |
| Label | Inter | xs (12px) | Medium (500) | text-tertiary | "LIQUIDITY" |

---

## 4. SPACING & LAYOUT

### 4.1 Spacing Scale

Consistency of the interface is critical to ensuring clients navigate through noise and access data quickly.

```css
--space-1: 4px;    /* Tight inline spacing */
--space-2: 8px;    /* Small gaps */
--space-3: 12px;   /* Default gap */
--space-4: 16px;   /* Card padding */
--space-5: 20px;   /* Section spacing */
--space-6: 24px;   /* Large gaps */
--space-8: 32px;   /* Section margins */
--space-10: 40px;  /* Page margins */
```

### 4.2 Component Padding Standards

```typescript
// Card padding
className="p-4"  // Default: 16px all sides

// Dense tables
className="px-3 py-2"  // 12px horizontal, 8px vertical

// Header bar
className="px-6 py-3"  // 24px horizontal, 12px vertical

// Modal padding
className="p-6"  // 24px all sides
```

### 4.3 Grid System

**12-Column Responsive Grid**

```typescript
// Desktop (≥1280px): 60/40 split
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-7">Left Panel</div>
  <div className="col-span-5">Right Panel</div>
</div>

// Tablet (768-1279px): 50/50 split
<div className="lg:col-span-7 md:col-span-6">...</div>

// Mobile (<768px): Full width stack
<div className="lg:col-span-7 md:col-span-6 col-span-12">...</div>
```

---

## 5. COMPONENT LIBRARY

### 5.1 Card Component

```tsx
// Base card with terminal aesthetic
<Card className="
  bg-zinc-950 
  border-zinc-800 
  rounded-lg 
  shadow-lg 
  shadow-black/50
">
  <CardHeader className="pb-3">
    <CardTitle className="text-xl font-semibold text-zinc-50">
      Title
    </CardTitle>
  </CardHeader>
  <CardContent className="pt-0">
    {/* Content */}
  </CardContent>
</Card>
```

### 5.2 Data Table

```tsx
<Table>
  <TableHeader>
    <TableRow className="border-zinc-700 hover:bg-transparent">
      <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wide">
        Type
      </TableHead>
      {/* More headers */}
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="
      border-zinc-800 
      hover:bg-zinc-800/50 
      transition-colors
    ">
      <TableCell className="font-mono text-sm">
        {/* Data */}
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### 5.3 Metric Display

```tsx
// Large metric card
<div className="flex flex-col items-center justify-center p-6 bg-zinc-950 rounded-lg">
  <div className="text-xs text-zinc-400 uppercase tracking-wide mb-2">
    Detection Latency (P95)
  </div>
  <div className={cn(
    "text-4xl font-bold font-mono",
    latency < 200 ? "text-green-500" : "text-orange-500"
  )}>
    {latency}ms
  </div>
  <div className="text-xs text-zinc-500 mt-2">
    Target: &lt;200ms
  </div>
</div>
```

### 5.4 Status Indicator

```tsx
<div className="flex items-center gap-2">
  <div className={cn(
    "w-2 h-2 rounded-full",
    isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
  )} />
  <span className="text-sm text-zinc-300">
    {isConnected ? "Connected" : "Disconnected"}
  </span>
</div>
```

### 5.5 Badge Component

```tsx
// Opportunity type badges
<Badge variant="outline" className={cn(
  "font-mono text-xs",
  type === 'spatial' && "border-green-500 text-green-400",
  type === 'statistical' && "border-blue-500 text-blue-400",
  type === 'triangular' && "border-purple-500 text-purple-400"
)}>
  {type.toUpperCase()}
</Badge>
```

---

## 6. DATA VISUALIZATION

### 6.1 Price Chart (Recharts)

Line charts are generally best for displaying how financial metrics like revenue or stock prices change over time, making trends and fluctuations easy to identify.

```tsx
<LineChart width={800} height={300} data={priceHistory}>
  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
  <XAxis 
    dataKey="timestamp" 
    stroke="#a1a1aa"
    style={{ fontSize: 12 }}
  />
  <YAxis 
    stroke="#a1a1aa"
    style={{ fontSize: 12 }}
    domain={['auto', 'auto']}
  />
  <Tooltip 
    contentStyle={{
      backgroundColor: '#18181b',
      border: '1px solid #3f3f46',
      borderRadius: '8px'
    }}
  />
  <Line 
    type="monotone" 
    dataKey="raydium" 
    stroke="#22c55e" 
    strokeWidth={2}
    dot={false}
  />
  <Line 
    type="monotone" 
    dataKey="orca" 
    stroke="#3b82f6" 
    strokeWidth={2}
    dot={false}
  />
  <Line 
    type="monotone" 
    dataKey="meteora" 
    stroke="#a855f7" 
    strokeWidth={2}
    dot={false}
  />
</LineChart>
```

### 6.2 Spread Indicator

```tsx
// Visual bar showing price range
<div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
  <div 
    className="absolute h-full bg-gradient-to-r from-green-500 to-orange-500"
    style={{
      left: `${(minPrice / maxPrice) * 100}%`,
      width: `${((maxPrice - minPrice) / maxPrice) * 100}%`
    }}
  />
  <div 
    className="absolute w-2 h-2 bg-white rounded-full -translate-y-0"
    style={{ left: `${(currentPrice / maxPrice) * 100}%` }}
  />
</div>
```

### 6.3 Progress Bar (Cache Health)

```tsx
<div className="space-y-1">
  <div className="flex justify-between text-xs text-zinc-400">
    <span>Cache Hit Rate</span>
    <span className="font-mono text-green-400">99.2%</span>
  </div>
  <Progress 
    value={99.2} 
    className="h-1.5 bg-zinc-800"
    indicatorClassName="bg-green-500"
  />
</div>
```

---

## 7. INTERACTION PATTERNS

### 7.1 Hover States

```css
/* Table rows */
.hover\:bg-zinc-800\/50:hover {
  background-color: rgb(39 39 42 / 0.5);
  transition: background-color 200ms ease;
}

/* Buttons */
.hover\:brightness-110:hover {
  filter: brightness(1.1);
  transition: filter 150ms ease;
}
```

### 7.2 Focus States (Accessibility)

```css
/* Keyboard focus visible */
.focus-visible\:ring-2:focus-visible {
  outline: none;
  ring: 2px solid #3b82f6; /* blue-500 */
  ring-offset: 2px;
  ring-offset-color: #0a0a0a;
}
```

### 7.3 Loading States

```tsx
// Skeleton for price card
<div className="animate-pulse">
  <div className="h-4 bg-zinc-800 rounded w-20 mb-2" />
  <div className="h-6 bg-zinc-800 rounded w-32 mb-1" />
  <div className="h-3 bg-zinc-800 rounded w-16" />
</div>
```

### 7.4 Real-Time Updates

```tsx
// Flash animation on price update
const [isFlashing, setIsFlashing] = useState(false);

useEffect(() => {
  if (priceChanged) {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);
  }
}, [price]);

<div className={cn(
  "transition-colors duration-200",
  isFlashing && (isIncrease ? "bg-green-500/20" : "bg-red-500/20")
)}>
  {price}
</div>
```

---

## 8. SHADCN/UI COMPONENTS USED

### 8.1 Installation

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add button
npx shadcn-ui@latest add tooltip
```

### 8.2 Theme Configuration (tailwind.config.ts)

```typescript
export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "#0a0a0a",
        foreground: "#fafafa",
        primary: {
          DEFAULT: "#22c55e",
          foreground: "#0a0a0a",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#fafafa",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 9. RESPONSIVE DESIGN

### 9.1 Breakpoint Strategy

```typescript
// Mobile-first approach
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px' // Large desktop
}

// Usage in components
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  xl:grid-cols-12 
  gap-4
">
  <div className="xl:col-span-7">...</div>
  <div className="xl:col-span-5">...</div>
</div>
```

### 9.2 Mobile Optimizations

**Stack vertically:**
```tsx
<div className="flex flex-col lg:flex-row gap-4">
  {/* Opportunities first on mobile */}
  <div className="order-1 lg:order-1">Opportunities</div>
  <div className="order-2 lg:order-2">Metrics</div>
</div>
```

**Reduce table columns on mobile:**
```tsx
<TableCell className="hidden md:table-cell">
  {liquidity}
</TableCell>
```

---

## 10. PERFORMANCE OPTIMIZATIONS

### 10.1 Code Splitting

```typescript
// Lazy load heavy components
const PriceChart = dynamic(() => import('@/components/PriceChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

### 10.2 Virtualization for Long Lists

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// For activity log (1000+ entries)
const virtualizer = useVirtualizer({
  count: logs.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 32, // Row height
  overscan: 5
});
```

### 10.3 Memoization

```typescript
// Prevent unnecessary re-renders
const sortedOpportunities = useMemo(() => 
  opportunities.sort((a, b) => b.profit - a.profit),
  [opportunities]
);

const PriceRow = memo(({ price }: PriceRowProps) => {
  // Component definition
});
```

---

## 11. ACCESSIBILITY (WCAG 2.1 AA)

### 11.1 Color Contrast Requirements

All color combinations must meet **4.5:1** contrast ratio:

✅ **Pass:**
- `#fafafa` (white) on `#0a0a0a` (black): 18.5:1
- `#22c55e` (green) on `#0a0a0a`: 7.8:1
- `#3b82f6` (blue) on `#0a0a0a`: 6.2:1

⚠️ **Caution:**
- `#a1a1aa` (gray) on `#18181b`: 4.6:1 (just passes)

### 11.2 Semantic HTML

```tsx
// Use proper heading hierarchy
<h1 className="sr-only">Solana Arbitrage Monitor</h1>
<h2>Active Opportunities</h2>
<h3>SOL/USDC Prices</h3>

// Use <time> for timestamps
<time dateTime={isoTimestamp}>{displayTime}</time>

// Use <table> properly
<table>
  <caption className="sr-only">Real-time DEX prices</caption>
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

### 11.3 Keyboard Navigation

```tsx
// Tab order
tabIndex={0}  // Focusable
tabIndex={-1} // Not in tab order but programmatically focusable

// Keyboard handlers
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleExpand();
  }
}}
```

---

## 12. ANIMATION PRINCIPLES

Use animation to highlight important changes and transitions in data, but ensure animation is unobtrusive and does not distract from underlying data.

### 12.1 Duration Scale

```css
--duration-instant: 100ms;   /* Micro-interactions */
--duration-fast: 200ms;      /* Hover states, flashes */
--duration-normal: 300ms;    /* Slide-ins, fades */
--duration-slow: 500ms;      /* Chart transitions */
```

### 12.2 Easing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);  /* Default */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 12.3 Animation Examples

```tsx
// Slide in new opportunity
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  {opportunity}
</motion.div>

// Pulse on new data
<motion.div
  animate={{ scale: [1, 1.05, 1] }}
  transition={{ duration: 0.2 }}
>
  {price}
</motion.div>
```

---

## 13. IMPLEMENTATION CHECKLIST

**Phase 1: Setup**
- [ ] Initialize Next.js 15 project
- [ ] Install shadcn/ui components
- [ ] Configure Tailwind with theme
- [ ] Setup font imports (JetBrains Mono, Inter)

**Phase 2: Layout**
- [ ] Build header with system status
- [ ] Create 60/40 grid layout
- [ ] Implement responsive breakpoints

**Phase 3: Components**
- [ ] Active Opportunities table
- [ ] Real-time Price cards with tabs
- [ ] Price history chart (Recharts)
- [ ] Performance metrics cards
- [ ] System health indicators
- [ ] Activity log

**Phase 4: Interactivity**
- [ ] WebSocket connection for real-time data
- [ ] Opportunity detail modal
- [ ] Filter/sort controls
- [ ] Keyboard navigation

**Phase 5: Polish**
- [ ] Loading states (skeletons)
- [ ] Error handling UI
- [ ] Animations (price flashes, slide-ins)
- [ ] Accessibility audit
- [ ] Performance testing (Lighthouse)

---

## 14. SAMPLE CODE STRUCTURE

```
app/
├── layout.tsx          # Root layout with fonts
├── page.tsx            # Main dashboard
├── globals.css         # Tailwind + custom styles
components/
├── ui/                 # shadcn components
│   ├── card.tsx
│   ├── table.tsx
│   ├── badge.tsx
│   └── ...
├── dashboard/
│   ├── header.tsx
│   ├── opportunities-table.tsx
│   ├── price-card.tsx
│   ├── price-chart.tsx
│   ├── metrics-panel.tsx
│   ├── health-monitor.tsx
│   └── activity-log.tsx
lib/
├── utils.ts           # cn() helper
├── websocket.ts       # WebSocket connection
└── types.ts           # TypeScript interfaces
```

---

This guide ensures your terminal interface is both **functionally dense** like Bloomberg and **visually modern** for 2026. Every design decision is backed by financial dashboard research and optimized for the arbitrage monitoring use case.
