/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Famille de police personnalisée
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      // Couleurs personnalisées pour SupChaissac
      colors: {
        // Couleur principale (jaune signature)
        primary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',  // Couleur principale
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
      },

      // Animations personnalisées
      keyframes: {
        blob: {
          '0%, 100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromTop: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        // Mobile modal animations
        slideUpFull: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDownFull: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        // Swipe animations
        swipeLeft: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' },
        },
        swipeRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        enterFromLeft: {
          '0%': { transform: 'translateX(-30%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        enterFromRight: {
          '0%': { transform: 'translateX(30%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        // Touch feedback
        tapFeedback: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
        // Shimmer loading
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Bounce in
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // Pulse glow for FAB
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(234, 179, 8, 0.6)' },
        },
      },
      animation: {
        blob: 'blob 7s infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in-bottom': 'slideInFromBottom 0.3s ease-out',
        'slide-in-top': 'slideInFromTop 0.3s ease-out',
        'slide-in-left': 'slideInFromLeft 0.3s ease-out',
        'slide-in-right': 'slideInFromRight 0.3s ease-out',
        // Mobile animations
        'slide-up-full': 'slideUpFull 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down-full': 'slideDownFull 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'swipe-left': 'swipeLeft 0.25s ease-out',
        'swipe-right': 'swipeRight 0.25s ease-out',
        'enter-left': 'enterFromLeft 0.25s ease-out',
        'enter-right': 'enterFromRight 0.25s ease-out',
        'tap-feedback': 'tapFeedback 0.15s ease-out',
        'shimmer': 'shimmer 1.5s linear infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },

      // Ombres personnalisées
      boxShadow: {
        'yellow-glow': '0 10px 40px -10px rgba(234, 179, 8, 0.25)',
        'yellow-glow-lg': '0 20px 60px -15px rgba(234, 179, 8, 0.35)',
      },
    },
  },
  plugins: [],
}
