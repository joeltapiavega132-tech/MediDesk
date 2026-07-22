/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta MediDesk
        navy: {
          DEFAULT: '#0F1B2D',
          50:  '#E8EDF3',
          100: '#C5D1DE',
          200: '#9FB3C8',
          300: '#7894B1',
          400: '#527799',
          500: '#3A5A7C',
          600: '#2C4560',
          700: '#1F3144',
          800: '#152338',
          900: '#0F1B2D',
        },
        teal: {
          DEFAULT: '#0D9488',
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
