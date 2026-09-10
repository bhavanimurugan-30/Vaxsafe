/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Cold-chain palette: deep glacial teal + clinical slate, one warm
        // amber reserved only for warnings/expiry — not used decoratively.
        glacier: {
          50: '#f0f7f7',
          100: '#dbebec',
          200: '#b7d7d9',
          300: '#8bbdc0',
          400: '#5a9ca0',
          500: '#3d7f84',
          600: '#2f656a',
          700: '#285358',
          800: '#23444a',
          900: '#1c363b',
          950: '#0e1e21',
        },
        frost: '#eef5f6',
        amber: {
          500: '#c17f2a',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
