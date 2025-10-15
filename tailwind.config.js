/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{html,js}",
    "./app/**/*.html",
    "./app/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'navy': '#0f172a',
        'primary': '#1e40af',
        'accent': '#3b82f6',
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
