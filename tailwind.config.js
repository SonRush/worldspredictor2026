/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.ts'],
  theme: {
    extend: {
      colors: {
        hex: {
          950: '#010A13',
          900: '#091428',
          850: '#0A1428',
          800: '#1E2328',
          700: '#1E282D',
          600: '#3C3C41',
          500: '#5B5A56',
        },
        gold: {
          100: '#F0E6D2',
          300: '#C8AA6E',
          400: '#C89B3C',
          500: '#785A28',
          700: '#463714',
        },
        cyan: {
          neon: '#0AC8B9',
          deep: '#005A82',
          light: '#CDFAFA',
        },
        win: '#0AC8B9',
        loss: '#E84057',
      },
      fontFamily: {
        display: ['Beaufort', 'Cinzel', 'Georgia', 'serif'],
        sans: ['Spiegel', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 12px rgba(10, 200, 185, 0.45)',
        gold: '0 0 10px rgba(200, 170, 110, 0.35)',
      },
    },
  },
  plugins: [],
};
