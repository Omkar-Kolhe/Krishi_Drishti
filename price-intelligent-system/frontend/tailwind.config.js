/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        krishi: {
          dark: '#0A3A2A',
          bg: '#F8F9FA',
        }
      }
    },
  },
  plugins: [],
}
