/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        terminal: {
          bg: '#0d0d0d',
          surface: '#161616',
          border: '#2a2a2a',
          muted: '#404040',
          dim: '#666666',
          text: '#e8e8e2',
          green: '#7dc87d',
          'green-dim': '#3d6e3d',
          amber: '#e8b84b',
          red: '#e06c6c',
          blue: '#7ab0d4',
          purple: '#b39ddb',
        },
      },
    },
  },
  plugins: [],
}
