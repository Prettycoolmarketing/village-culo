/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:    '#C86A43',
        secondary:  '#5E6B4A',
        accent:     '#D6A94D',
        background: '#F8F5F0',
        surface:    '#FFFFFF',
        charcoal:   '#2D2A26',
        muted:      '#7A7570',
        border:     '#E8E2D9',
        stories:     '#C86A43',
        ideas:       '#5E6B4A',
        mercato:     '#D6A94D',
        mapcolor:    '#7A9B76',
        noticeboard: '#B85C3A',
        founders:    '#A8532E',
        piazza:      '#8C6850',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl:    '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(45,42,38,0.07), 0 1px 2px rgba(45,42,38,0.05)',
        md:   '0 4px 12px rgba(45,42,38,0.08), 0 2px 4px rgba(45,42,38,0.05)',
        lg:   '0 10px 30px rgba(45,42,38,0.10), 0 4px 8px rgba(45,42,38,0.05)',
      },
      keyframes: {
        'slide-up-fade': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up-fade': 'slide-up-fade 0.25s ease-out both',
      },
    },
  },
  plugins: [],
}

