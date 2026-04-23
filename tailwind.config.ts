import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // K&D brand
        'forest-thrive': '#7A9B49',
        'olive-integrity': '#546121',
        'grounded-black': '#212221',
        // Functional palette derived for UI
        cream: '#FBFAF6',
        'cream-deep': '#F1EEE5',
        ink: '#212221',
        'ink-soft': '#5C544A',
        'ink-faint': '#8A8376',
        line: 'rgba(33,34,33,0.10)',
        'line-soft': 'rgba(33,34,33,0.06)',
        ok: '#3F7A4E',
        warn: '#C89A2A',
        dq: '#A23D2C',
      },
      fontFamily: {
        display: ['Aileron', 'Helvetica Neue', 'Arial', 'sans-serif'],
        sans: ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        bubble: '0 1px 2px rgba(33,34,33,.06)',
        card: '0 4px 12px rgba(33,34,33,.08)',
        drawer: '0 20px 48px rgba(33,34,33,.15)',
      },
    },
  },
  plugins: [],
};

export default config;
