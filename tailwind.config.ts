import type { Config } from 'tailwindcss';

// ============================================================================
// DESIGN SYSTEM — TIER 3: UTILITY LAYER
// Maps CSS custom-property tokens to Tailwind utility classes.
// e.g.  text-ds-text-primary  →  rgb(var(--ds-text-primary) / <alpha-value>)
// ============================================================================

/** Helper — wraps a CSS variable in rgb() with Tailwind alpha support */
const dsColor = (token: string) => `rgb(var(--ds-${token}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      height: {
        screen: '100dvh',
      },
      borderWidth: {
        1: '1px',
      },
      /* ----- Design-system semantic colors ----- */
      colors: {
        /* Legacy compat (still consumed by a few built-in refs) */
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },

        /* === Design-system tokens === */
        ds: {
          // Brand
          'brand-primary': dsColor('brand-primary'),
          'brand-primary-hover': dsColor('brand-primary-hover'),
          'brand-primary-active': dsColor('brand-primary-active'),
          'brand-primary-light': dsColor('brand-primary-light'),
          'brand-accent': dsColor('brand-accent'),
          'brand-muted': dsColor('brand-muted'),
          'brand-subtle': dsColor('brand-subtle'),
          'brand-surface': dsColor('brand-surface'),

          // Text
          'text-primary': dsColor('text-primary'),
          'text-secondary': dsColor('text-secondary'),
          'text-tertiary': dsColor('text-tertiary'),
          'text-placeholder': dsColor('text-placeholder'),
          'text-disabled': dsColor('text-disabled'),
          'text-inverse': dsColor('text-inverse'),
          'text-brand': dsColor('text-brand'),
          'text-link': dsColor('text-link'),
          'text-link-hover': dsColor('text-link-hover'),

          // Surfaces
          'surface-base': dsColor('surface-base'),
          'surface-raised': dsColor('surface-raised'),
          'surface-overlay': dsColor('surface-overlay'),
          'surface-sunken': dsColor('surface-sunken'),
          'surface-disabled': dsColor('surface-disabled'),

          // Borders
          'border-base': dsColor('border-base'),
          'border-strong': dsColor('border-strong'),
          'border-subtle': dsColor('border-subtle'),
          'border-brand': dsColor('border-brand'),
          'border-focus': dsColor('border-focus'),

          // Status
          'status-success': dsColor('status-success'),
          'status-success-text': dsColor('status-success-text'),
          'status-success-bg': dsColor('status-success-bg'),
          'status-error': dsColor('status-error'),
          'status-error-text': dsColor('status-error-text'),
          'status-error-bg': dsColor('status-error-bg'),
          'status-warning': dsColor('status-warning'),
          'status-warning-text': dsColor('status-warning-text'),
          'status-warning-bg': dsColor('status-warning-bg'),
          'status-info': dsColor('status-info'),
          'status-info-text': dsColor('status-info-text'),
          'status-info-bg': dsColor('status-info-bg'),

          // Interaction / Focus
          'ring': dsColor('ring'),
          'focus-ring': dsColor('focus-ring'),

          // Rating
          'rating-fill': dsColor('rating-fill'),
          'rating-empty': dsColor('rating-empty'),

          // Palette pass-throughs (for the few cases that genuinely need raw values)
          'palette-purple-50': dsColor('palette-purple-50'),
          'palette-purple-100': dsColor('palette-purple-100'),
          'palette-purple-200': dsColor('palette-purple-200'),
          'palette-purple-300': dsColor('palette-purple-300'),
          'palette-purple-400': dsColor('palette-purple-400'),
          'palette-purple-500': dsColor('palette-purple-500'),
          'palette-purple-600': dsColor('palette-purple-600'),
          'palette-purple-700': dsColor('palette-purple-700'),
          'palette-purple-800': dsColor('palette-purple-800'),
          'palette-purple-900': dsColor('palette-purple-900'),
          'palette-purple-950': dsColor('palette-purple-950'),
          'palette-neutral-50': dsColor('palette-neutral-50'),
          'palette-neutral-100': dsColor('palette-neutral-100'),
          'palette-neutral-200': dsColor('palette-neutral-200'),
          'palette-neutral-300': dsColor('palette-neutral-300'),
          'palette-neutral-400': dsColor('palette-neutral-400'),
          'palette-neutral-500': dsColor('palette-neutral-500'),
          'palette-neutral-600': dsColor('palette-neutral-600'),
          'palette-neutral-700': dsColor('palette-neutral-700'),
          'palette-neutral-800': dsColor('palette-neutral-800'),
          'palette-neutral-900': dsColor('palette-neutral-900'),
          'palette-neutral-950': dsColor('palette-neutral-950'),
        },

        /* Keep raw Tailwind purple/gray available for backwards compat during migration */
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        secondary: {
          100: '#2A6BB3',
        },
        state: {
          info: '#3b82f6',
          success: '#22c55e',
          error: '#ef4444',
          warning: '#f59e0b',
        },
        black: {
          DEFAULT: '#060606',
          200: '#1D1D1D',
          300: '#282828',
        },
      },

      /* ----- Design-system shadows ----- */
      boxShadow: {
        'ds-xs': 'var(--ds-shadow-xs)',
        'ds-sm': 'var(--ds-shadow-sm)',
        'ds-md': 'var(--ds-shadow-md)',
        'ds-lg': 'var(--ds-shadow-lg)',
        'ds-xl': 'var(--ds-shadow-xl)',
        'ds-elevated': 'var(--ds-shadow-elevated)',
      },

      /* ----- Design-system border-radius ----- */
      borderRadius: {
        'ds-xs': 'var(--ds-radius-xs)',
        'ds-sm': 'var(--ds-radius-sm)',
        'ds-md': 'var(--ds-radius-md)',
        'ds-lg': 'var(--ds-radius-lg)',
        'ds-xl': 'var(--ds-radius-xl)',
        'ds-full': 'var(--ds-radius-full)',
      },

      /* ----- Design-system z-index ----- */
      zIndex: {
        'ds-base': 'var(--ds-z-base)',
        'ds-raised': 'var(--ds-z-raised)',
        'ds-dropdown': 'var(--ds-z-dropdown)',
        'ds-sticky': 'var(--ds-z-sticky)',
        'ds-header': 'var(--ds-z-header)',
        'ds-overlay': 'var(--ds-z-overlay)',
        'ds-modal': 'var(--ds-z-modal)',
        'ds-toast': 'var(--ds-z-toast)',
      },
    },
  },
  plugins: [],
};
export default config;
