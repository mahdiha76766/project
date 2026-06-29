/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f7f4',
          100: '#e4efe8',
          200: '#c5dbc8',
          300: '#9fc4ad',
          400: '#6ba082',
          500: '#4a8263',
          600: '#3d6b52',
          700: '#2d4a3a',
          800: '#243d30',
          900: '#1a2e24'
        },
        accent: {
          50: '#fdf6ef',
          100: '#f9ede3',
          200: '#f0d5bc',
          400: '#d4955a',
          500: '#c98546',
          600: '#b87333'
        },
        gold: {
          300: '#f0d5bc',
          400: '#d4955a',
          500: '#c98546',
          600: '#b87333'
        },
        surface: {
          0: '#ffffff',
          50: '#fafaf7',
          100: '#f3f2ee',
          200: '#e5e2dc',
          300: '#d4d0c8',
          400: '#949088',
          500: '#78716c',
          600: '#5c5954',
          700: '#444039',
          800: '#2c2a26',
          900: '#141413'
        }
      },
      boxShadow: {
        soft: '0 2px 10px -1px rgba(120, 113, 108, 0.05), 0 8px 30px -2px rgba(120, 113, 108, 0.04)',
        card: '0 4px 20px -2px rgba(120, 113, 108, 0.06), 0 12px 40px -4px rgba(120, 113, 108, 0.06)',
        'card-hover': '0 12px 30px -4px rgba(120, 113, 108, 0.12), 0 24px 60px -8px rgba(120, 113, 108, 0.14)',
        header: '0 1px 0 rgba(120, 113, 108, 0.06)'
      },
      borderRadius: {
        '4xl': '2rem'
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease both',
        marquee: 'marquee 32s linear infinite'
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
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
