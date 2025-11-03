/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#0B1A0B',
        surface: '#112412',
        surface2: '#143015',
        brand: '#46C93A',
        brand2: '#7DE36A',
        accent: '#2F5D26',
        on: '#E8F5E9',
      },
      fontFamily: {
        sans: ['Saira','ui-sans-serif','system-ui'],
        display: ['Saira','sans-serif'],
        mono: ['Source Code Pro','monospace'],
      },
      boxShadow: {
        card: '0 12px 28px rgba(0,0,0,.35)',
      },
      borderRadius: { '2xl': '1.25rem' },
    },
  },
  plugins: [],
}
