/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
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
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.safe-area-inset-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-area-inset-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.line-clamp-1': {
          'overflow': 'hidden',
          'display': '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1',
        },
        '.line-clamp-2': {
          'overflow': 'hidden',
          'display': '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2',
        },
        '.line-clamp-3': {
          'overflow': 'hidden',
          'display': '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};