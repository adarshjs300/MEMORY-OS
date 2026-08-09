/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0f',
          900: '#12121a',
          800: '#1a1a24',
          700: '#242430',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
