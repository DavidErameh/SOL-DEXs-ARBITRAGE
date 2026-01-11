# Frontend Design & Architecture Document

## Solana Real-Time Price Monitor Dashboard - "Hyper-Real Edition"

**Version**: 2.0 (Terminal Retrofit)
**Stack**: Next.js 14 + Tailwind CSS
**Aesthetic Goal**: "Hollywood Hacker Terminal" / "Retro Bloomberg"
**Key Reference**: Fallout Terminals, Matrix Code Rain, 80s Phosphor Screens

---

## 1. DESIGN PHILOSOPHY Update

### The "Hyper-Real" Look

- **Visuals**: Distinct scanlines, slight chromatic aberration, and "text bloom" (glow).
- **Typography**: STRICTLY "numeric-like" fonts. No modern sans-serifs.
- **Feedback**: Interactions should feel "crunchy" - hard blinks, instant color inversions.
- **Palette**: High-contrast Phosphor Green (`#00ff41`) against Deep Void Black (`#000500`).

---

## 2. NEW COLOR SYSTEM

### Phosphor Palette

| Token            | Hex       | Usage                             |
| ---------------- | --------- | --------------------------------- |
| `--bg-void`      | `#000500` | Deepest black (slight green tint) |
| `--bg-grid`      | `#001100` | Grid lines / faint backgrounds    |
| `--text-primary` | `#00ff41` | Standard text (Phosphor Green)    |
| `--text-dim`     | `#008f11` | Secondary text                    |
| `--alert-solid`  | `#ff0000` | Critical Errors (Red Phosphor)    |
| `--warn-solid`   | `#ffb700` | Warnings (Amber Phosphor)         |

### Glow Effects

All primary text must have a subtle `text-shadow`.

```css
.text-glow {
  text-shadow: 0 0 2px #003800, 0 0 5px #00ff41;
}
.text-glow-strong {
  text-shadow: 0 0 5px #00ff41, 0 0 10px #00ff41;
}
```

---

## 3. TYPOGRAPHY OVERHAUL

### Fonts

1.  **Headers / Labels**: `VT323` (Google Fonts)
    - Large, pixelated, 80s terminal style.
    - Use for: `<h1>`, Table Headers, Status Logs.
2.  **Data / Numbers**: `Share Tech Mono` (Google Fonts)
    - Precise, industrial, "numeric-like".
    - Use for: Prices, percentages, latencies.

### Sizing

- Base size increased to `16px` (retro screens were low res).
- Headers: `24px`+.

---

## 4. FX LAYER (The "CRT" Look)

Every page must be wrapped in a container that provides:

1.  **Scanlines**:
    ```css
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0) 50%,
      rgba(0, 0, 0, 0.2) 50%,
      rgba(0, 0, 0, 0.2)
    );
    background-size: 100% 4px;
    ```
2.  **Vignette**: Darkened corners.
3.  **Flicker**: Subtle distinct opacity animation (1% variance).

---

## 5. COMPONENT UPDATES

### 5.1 Status Header

- Replace the simple dot with a blinking `[CONNECTED]` block.
- Logo font: `VT323` at 32px.

### 5.2 Price Matrix

- Borders: Solid, single-pixel lines (`border-dim`).
- Hover: Invert colors (Black text on Green background).
- Updates: "Glitch" effect instead of fade.

### 5.3 Terminal Log

- Prefix all lines with `>` prompt.
- Active line cursor blink: `_`.

---

## 6. IMPLEMENTATION PLAN

1.  Install new fonts via `next/font`.
2.  Update `tailwind.config.ts` with new colors/fonts.
3.  Create `<ScanlineOverlay />` component.
4.  Refactor components to stick to the new strict aesthetic.
