/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#00FF9C',
          cyan: '#00B8FF',
          orange: '#FF6B35',
        },
        dark: {
          bg: '#0A0A0F',
          card: '#12121A',
          border: '#1E1E2E',
          muted: '#2A2A3E',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 10px rgba(0, 255, 156, 0.3)',
        'neon-cyan': '0 0 10px rgba(0, 184, 255, 0.3)',
        'neon-orange': '0 0 10px rgba(255, 107, 53, 0.3)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 255, 156, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 255, 156, 0.8)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          'from': { textShadow: '0 0 5px #00FF9C, 0 0 10px #00FF9C' },
          'to': { textShadow: '0 0 10px #00FF9C, 0 0 20px #00FF9C, 0 0 30px #00FF9C' },
        }
      }
    },
  },
  plugins: [],
}
