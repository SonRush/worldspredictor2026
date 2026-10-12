/** @type {import('tailwindcss').Config} */
// Colors are CSS variables (RGB channels) so the light/dark themes live in styles.css.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.ts'],
  theme: {
    extend: {
      colors: {
        hex: {
          950: v('hex-950'),
          900: v('hex-900'),
          850: v('hex-850'),
          800: v('hex-800'),
          700: v('hex-700'),
          600: v('hex-600'),
          500: v('hex-500'),
        },
        gold: {
          100: v('gold-100'),
          300: v('gold-300'),
          400: v('gold-400'),
          500: v('gold-500'),
          700: v('gold-700'),
        },
        cyan: {
          neon: v('cyan-neon'),
          deep: v('cyan-deep'),
          light: v('cyan-light'),
        },
        win: v('cyan-neon'),
        loss: v('loss'),
      },
      fontFamily: {
        display: ['Beaufort', 'Cinzel', 'Georgia', 'serif'],
        sans: ['Spiegel', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 12px rgb(var(--cyan-neon) / 0.45)',
        gold: '0 0 10px rgb(var(--gold-300) / 0.35)',
      },
    },
  },
  plugins: [],
};
