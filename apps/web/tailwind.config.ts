import type { Config } from 'tailwindcss';

// CodeDrip v2 — Technical · Robotic · Terminal-Like
//
// Colors are space-separated RGB CSS custom properties so Tailwind's alpha
// modifiers compose correctly (e.g. bg-accent/20, text-accent/80).
// Dark/light toggling is driven by `html.dark` / `html.light` class (set
// by ThemeContext), using Tailwind's `class` dark mode strategy.
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '320px',
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Brand accent (red)
        primary: 'rgb(var(--accent-primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--accent-hover) / <alpha-value>)',
        'primary-light': 'rgba(var(--accent-muted) / 0.12)',
        secondary: 'rgb(var(--bg-tertiary) / <alpha-value>)',
        accent: 'rgb(var(--accent-primary) / <alpha-value>)',

        // Backgrounds
        surface: 'rgb(var(--bg-tertiary) / <alpha-value>)',
        'surface-2': 'rgb(var(--bg-secondary) / <alpha-value>)',
        'surface-3': 'rgb(var(--bg-elevated) / <alpha-value>)',

        // Borders
        border: 'rgba(var(--border-default) / 0.5)',
        'border-strong': 'rgba(var(--border-strong) / 0.6)',

        // Text
        ink: 'rgb(var(--text-primary) / <alpha-value>)',
        muted: 'rgb(var(--text-secondary) / <alpha-value>)',
        faint: 'rgb(var(--text-muted) / <alpha-value>)',

        // Semantic
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--error) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
      },

      fontFamily: {
        sans: ['var(--font-primary)', 'JetBrains Mono', 'Geist Mono', 'monospace'],
        display: ['var(--font-display)', 'JetBrains Mono', 'Space Mono', 'monospace'],
        mono: ['var(--font-code)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.05' }],
      },

      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.02em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.05em',
        wider: '0.10em',
        widest: '0.15em',
      },

      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },

      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        card: 'var(--shadow-xs)',
        'card-hover': 'var(--shadow-md)',
        glow: 'var(--accent-glow)',
        'glow-strong': 'var(--accent-glow-strong)',
      },

      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      transitionDuration: {
        DEFAULT: '150ms',
        fast: '100ms',
        slow: '250ms',
      },

      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(calc(100% + 1rem))' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },

      animation: {
        'fade-in': 'fade-in 150ms ease',
        'slide-up': 'slide-up 240ms ease',
        'scale-in': 'scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'toast-in': 'toast-in 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};

export default config;
