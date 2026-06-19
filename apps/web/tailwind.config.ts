import type { Config } from 'tailwindcss';

// Colors are CSS custom properties so the store's brand palette (loaded from the
// store_settings DB row by StoreContext) drives the UI at runtime — rebranding
// is config/data only, never a Tailwind edit. Dark mode flips surface/text vars.
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // rgb(var(--token) / <alpha-value>) lets Tailwind apply opacity modifiers
        // (e.g. bg-primary/10) to runtime-injected, channel-based brand colors.
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        ink: 'rgb(var(--color-text) / <alpha-value>)',
        muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
      },
      fontFamily: {
        // Dual-font strategy (Precision Core): Inter for everything, a mono stack
        // for technical values (specs, SKUs, prices in data tables). Self-hosted/
        // system stacks only — no runtime Google Fonts fetch.
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'JetBrains Mono',
          'Cascadia Code',
          'Consolas',
          'monospace',
        ],
      },
      // Precision Core shapes: 4px standard, 8px for large containers, pills for badges.
      borderRadius: { DEFAULT: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem' },
      boxShadow: {
        // Depth comes from 1px outlines + tonal layers; shadow is reserved for
        // hover/elevated surfaces only (subtle ambient).
        card: '0 1px 2px rgba(15,23,42,0.04)',
        'card-hover': '0 4px 12px rgba(15,23,42,0.08)',
      },
      transitionDuration: { DEFAULT: '200ms' },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease',
        'slide-up': 'slide-up 240ms ease',
      },
    },
  },
  plugins: [],
};

export default config;
