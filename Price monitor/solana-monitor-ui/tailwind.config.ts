import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Updated Phosphor Palette
        void: '#000500',         // Deepest black with green tint
        grid: '#001100',         // Grid lines
        surface: '#001100',      // Component backgrounds
        primary: '#00ff41',      // Phosphor Green (Main Text)
        dim: '#008f11',          // Secondary Text
        
        // Semantic aliases
        'profit-green': '#00ff41',
        'loss-red': '#ff0000',    // Red Phosphor
        'alert-amber': '#ffb700', // Amber Phosphor
        'border-subtle': '#003300', // Dark Green Border within grid
      },
      fontFamily: {
        // New Retro Fonts
        pixel: ['var(--font-vt323)', 'monospace'],
        mono: ['var(--font-share-tech)', 'var(--font-jetbrains-mono)', 'monospace'],
        sans: ['var(--font-share-tech)', 'sans-serif'], // Default to Share Tech
      },
      backgroundImage: {
        'scanlines': 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))',
      },
      backgroundSize: {
        'scanlines': '100% 4px',
      },
      animation: {
        'flash-green': 'flash-green 300ms ease-out forwards',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'crt-flicker': 'crt-flicker 0.15s infinite',
        'glitch': 'glitch 0.2s cubic-bezier(.25, .46, .45, .94) both infinite',
      },
      keyframes: {
        'flash-green': {
          '0%': { backgroundColor: 'rgba(0, 255, 65, 0.2)', color: '#000' },
          '100%': { backgroundColor: 'transparent', color: 'inherit' },
        },
        'crt-flicker': {
          '0%': { opacity: '0.97' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.98' },
        },
         'glitch': {
          '0%': { translate: '0' },
          '20%': { translate: '-2px 2px' },
          '40%': { translate: '-2px -2px' },
          '60%': { translate: '2px 2px' },
          '80%': { translate: '2px -2px' },
          '100%': { translate: '0' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
