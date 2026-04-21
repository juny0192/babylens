/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f8f7',
          100: '#C1DDD8',
          200: '#aecfcc',
          400: '#9EC4C5',
          500: '#84b5b7',
          600: '#6aa2a4',
        },
        peach: {
          50:  '#fdf8f5',
          100: '#F0E4DC',
          200: '#e5d0c4',
        },
        blush: {
          50:  '#fdf5f5',
          100: '#F9C2C2',
          200: '#f4a8a8',
        },
      },
    },
  },
  plugins: [],
}
