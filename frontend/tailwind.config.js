/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b0c10',
        surface: '#131520',
        'surface-hover': '#1c1f2e',
        border: '#232738',
        primary: {
          DEFAULT: '#ccff00',
          hover: '#b5e600',
        },
        accent: '#00f0ff',
        'red-card': '#ff2a5f',
        'yellow-card': '#ffd600',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
