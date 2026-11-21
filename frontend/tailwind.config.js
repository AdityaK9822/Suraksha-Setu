export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bhuid: {
          green: '#123C32',
          forest: '#1F5B49',
          ivory: '#F5F1E8',
          gold: '#D5B477',
          charcoal: '#252B29',
        },
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      keyframes: {
        scrollLine: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '50%': { transform: 'scaleY(1)', transformOrigin: 'top' },
          '51%': { transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
        },
      },
      animation: {
        'scroll-line': 'scrollLine 1.8s infinite',
      },
    },
  },
  plugins: [],
}
