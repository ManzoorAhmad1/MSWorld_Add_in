/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    // Include Rizzui components
    "./node_modules/rizzui/dist/**/*.{js,mjs}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
        'source': ['Source Sans Pro', 'sans-serif'],
      },
      colors: {
        'primary': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'success': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'danger': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-custom': 'pulse-custom 2s infinite',
      },
      keyframes: {
        'pulse-custom': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        }
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 15px rgba(0, 0, 0, 0.1)',
        'primary': '0 2px 4px rgba(59, 130, 246, 0.2)',
        'success': '0 2px 4px rgba(16, 185, 129, 0.2)',
        'danger': '0 2px 4px rgba(239, 68, 68, 0.2)',
      }
    },
  },
  plugins: [],
}

