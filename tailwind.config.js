/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strict two-tone system: white surfaces, black ink.
        // Legacy token names are kept as neutral aliases so existing
        // class names (bg-obsidian, text-ivory, border-gold…) map to
        // black/white/gray — no color anywhere.
        obsidian: '#FFFFFF',
        charcoal: '#F4F4F4',
        'charcoal-light': '#E9E9E9',
        card: '#FFFFFF',
        ivory: '#000000',
        muted: '#6B6B6B',
        gold: '#000000',
        'gold-light': '#3D3D3D',
        'gold-dark': '#3D3D3D',
        bronze: '#3D3D3D',
      },
      fontFamily: {
        // Cinzel is reserved for the KATHRAZ wordmark; everything else is Plus Jakarta Sans
        cinzel: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
