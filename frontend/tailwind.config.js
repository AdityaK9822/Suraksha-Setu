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
    },
  },
  plugins: [],
}
