/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf9ea',
          100: '#faf0c4',
          200: '#f5df89',
          300: '#efc94c',
          400: '#e8b923',
          500: '#d4a017',
          600: '#b88110',
          700: '#92611d',
          800: '#794d1e',
          900: '#67401e'
        },
        ink: {
          900: '#0a0a0a',
          800: '#121212',
          700: '#1a1a1a',
          600: '#222222',
          500: '#2c2c2c',
          400: '#3d3d3d'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Poppins"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(212, 160, 23, 0.35)',
        'card': '0 10px 30px -10px rgba(0,0,0,0.4)'
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        }
      }
    }
  },
  plugins: []
};
