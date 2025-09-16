/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'glow': '0 0 15px rgba(194, 190, 186, 0.3)',
      },
      colors: {
        'dark-blue': '#192135',
        'platinum': '#C2BEBA',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
      },
    },
  },
  plugins: [],
}