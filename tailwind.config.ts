import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          900: '#164e63',
        },
        state: {
          s0: '#10b981',
          s1: '#3b82f6',
          s2: '#f59e0b',
          s3: '#f97316',
          s4: '#ef4444',
          c0: '#10b981',
          c1: '#3b82f6',
          c2: '#f59e0b',
          c3: '#f97316',
          c4: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
