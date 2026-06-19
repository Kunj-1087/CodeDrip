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
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        border: 'var(--color-border)',
        ink: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)',
        'card-hover': '0 2px 4px rgba(15,23,42,0.06), 0 12px 28px rgba(15,23,42,0.12)',
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
