/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { hedge: { DEFAULT: '#4f7f68', dark: '#315d49', light: '#e8f0eb', pale: '#f5f8f5' } } } },
  plugins: [],
};
