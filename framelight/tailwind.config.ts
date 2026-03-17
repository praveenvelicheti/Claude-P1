import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pink:   { DEFAULT: '#fbe3e8', dark: '#f5c8d2' },
        teal:   { DEFAULT: '#5cbdb9', light: '#89d0cd', pale: '#ebf6f5' },
        ink:    { DEFAULT: '#1a3a3a', mid: '#3d7a78', muted: '#7aadab' },
        border: '#ceecea',
        appbg:  '#f8fdfc',
        red:    '#e07878',
      },
      fontFamily: {
        display: ['Cormorant', 'Georgia', 'serif'],
        ui:      ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        teal: '0 4px 16px rgba(92,189,185,0.35)',
        card: '0 12px 36px rgba(92,189,185,0.15)',
      },
    },
  },
  plugins: [],
} satisfies Config
