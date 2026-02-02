import type { Config } from 'tailwindcss';

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
      colors: {
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',  // Light purple
          600: '#9333ea',  // Primary purple
          700: '#7e22ce',  // Dark purple
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
        gray: {
          100: '#333333',
          200: '#4F4F4F',
          300: '#828282',
          400: '#999999',
          500: '#E0E0E0',
        }
      }
    }
  },
  plugins: [],
};
export default config;
