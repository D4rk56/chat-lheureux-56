/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        title: ['Outfit', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif']
      },
      colors: {
        brand: {
          purple: '#d24de3',
          blue: '#7db1f9'
        }
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
