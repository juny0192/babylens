/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef3f2',
          100: '#fde8e7',
          200: '#fbd5d3',
          400: '#f4726d',
          500: '#ed5e58',
          600: '#d94d47',
        },
      },
    },
  },
  plugins: [],
}
