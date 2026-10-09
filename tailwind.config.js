/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          card: 'var(--bg-card)',
          hover: 'var(--bg-hover)',
          soft: 'var(--bg-soft)',
        },
        border: {
          DEFAULT: 'var(--border)',
          soft: 'var(--border-soft)',
        },
        ink: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          soft: 'var(--text-soft)',
          bright: 'var(--text-bright)',
        },
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
        },
        accent: {
          cyan: 'var(--accent-cyan)',
          green: 'var(--accent-green)',
          orange: 'var(--accent-orange)',
          red: 'var(--accent-red)',
          purple: 'var(--accent-purple)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
