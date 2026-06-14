import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        accent: {
          DEFAULT: '#22d3ee',
          muted: '#0891b2',
        },
        surface: {
          DEFAULT: '#0a0e17',
          elevated: '#0f1420',
          card: 'rgba(17, 24, 39, 0.72)',
          border: 'rgba(148, 163, 184, 0.12)',
          'border-strong': 'rgba(148, 163, 184, 0.2)',
        },
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 4px 24px -4px rgba(0,0,0,0.45)',
        glow: '0 0 40px -10px rgba(99, 102, 241, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        spin: 'spin 0.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
