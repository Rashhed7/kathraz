/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm cream surfaces, espresso text, muted antique-brass accent.
        obsidian: '#FAF7F0',
        charcoal: '#F1EBDD',
        'charcoal-light': '#E9E1CF',
        card: '#FFFFFF',
        ivory: '#2B2118',
        muted: '#8A7D6B',
        gold: '#9C7A3C',
        'gold-light': '#7E6330',
        'gold-dark': '#B9995A',
        bronze: '#8A6D45',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
