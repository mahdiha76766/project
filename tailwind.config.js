/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#fbf7f0',
          100: '#f4efe6',
          200: '#e7dcc8',
          300: '#d3c2a3'
        },
        ink: {
          700: '#14352b',
          800: '#0c241c',
          900: '#07160f',
          950: '#04110b'
        },
        gold: {
          200: '#e6d3ad',
          400: '#c4a574',
          500: '#b08a4d',
          600: '#8d6b38'
        },
        brand: {
          50: '#e8f4ee',
          100: '#d3eadc',
          200: '#a8d4bc',
          300: '#74b794',
          400: '#3d956c',
          500: '#1a7a4c',
          600: '#14633d',
          700: '#0e4d30',
          800: '#0c3d26',
          900: '#07160f'
        },
        accent: {
          50: '#eef6f2',
          100: '#d9ebe2',
          200: '#b4d5c5',
          400: '#4d8f6e',
          500: '#1a7a4c',
          600: '#14633d'
        },
        surface: {
          0: '#fffcf7',
          50: '#f4efe6',
          100: '#eee8dc',
          200: '#e1d6c3',
          300: '#c9b99a',
          400: '#8b7d66',
          500: '#5f5648',
          600: '#46514c',
          700: '#33403a',
          800: '#1f2b26',
          900: '#12261c'
        }
      },
      boxShadow: {
        soft: '0 10px 40px -24px rgba(7, 22, 15, 0.45)',
        card: '0 18px 50px -28px rgba(7, 22, 15, 0.4)',
        'card-hover': '0 24px 60px -24px rgba(7, 22, 15, 0.5)',
        header: '0 1px 0 rgba(176, 138, 77, 0.18)'
      },
      borderRadius: {
        '4xl': '2rem'
      },
      maxWidth: {
        container: '76rem'
      },
      fontSize: {
        display: ['clamp(2.4rem, 6vw, 4.8rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }]
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease both',
        drift: 'drift 18s ease-in-out infinite',
        marquee: 'marquee 32s linear infinite'
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(12px,-18px,0)' }
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(50%)' }
        }
      }
    }
  },
  plugins: []
};
