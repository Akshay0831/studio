/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: '#121212',
          panel: '#1e1e1e',
          border: '#333333',
          accent: '#007acc',
          text: '#e0e0e0',
          'text-dim': '#a0a0a0',
        }
      }
    },
  },
  plugins: [],
}
