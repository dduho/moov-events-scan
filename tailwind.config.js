/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        void:   { DEFAULT: '#06060c', deep: '#020204', raised: '#0f0f1c' },
        accent: { DEFAULT: '#ff7a1a', dim: '#c85a00', glow: '#ffb066' },
        violet: { DEFAULT: '#8b5cf6', glow: '#c4b5fd' },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
        future:  ['Orbitron', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(255, 122, 26, 0.35)',
      },
    },
  },
  plugins: [],
}
