/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7f0',
          100: '#fdeee0',
          200: '#fad9c0',
          300: '#f6c196',
          400: '#f0a06a',
          500: '#eb8847',
          600: '#dc7032',
          700: '#b75528',
          800: '#924526',
          900: '#763a22',
          950: '#5d2c06',
        },
        secondary: {
          50: '#f9f7f4',
          100: '#f4f1eb',
          200: '#e8e0d4',
          300: '#d9ccba',
          400: '#c7b49a',
          500: '#b8a082',
          600: '#ab9073',
          700: '#8f7760',
          800: '#756252',
          900: '#605044',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
};