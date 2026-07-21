/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
          900: '#0b192c',
        },
        dark: {
          bg: '#070b14',
          card: '#0f172a',
          cardHover: '#1e293b',
          border: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(0, 102, 255, 0.35)',
        'glow-accent': '0 0 25px -5px rgba(168, 85, 247, 0.35)',
      }
    },
  },
  plugins: [],
}
