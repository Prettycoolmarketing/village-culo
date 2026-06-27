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
        cloud:      '#4A7FA5',   /* CULO cloud blue — Mediterranean sea */
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
        '4xl': '2.5rem',
      },
      boxShadow: {
        card:   '0 1px 3px rgba(45,42,38,0.06), 0 4px 16px rgba(45,42,38,0.06)',
        'card-hover': '0 4px 20px rgba(45,42,38,0.10), 0 1px 4px rgba(45,42,38,0.06)',
        md:     '0 4px 16px rgba(45,42,38,0.08), 0 2px 4px rgba(45,42,38,0.04)',
        lg:     '0 12px 40px rgba(45,42,38,0.10), 0 4px 8px rgba(45,42,38,0.04)',
        search: '0 2px 12px rgba(45,42,38,0.08), 0 1px 3px rgba(45,42,38,0.06)',
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
    },
  },
  plugins: [],
}

