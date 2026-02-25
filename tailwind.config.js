/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6D28D9', // Purple 700
          light: '#7C3AED',   // Purple 600
          dark: '#5B21B6',    // Purple 800
          gradient: {
            start: '#6D28D9',
            end: '#4F46E5',   // Indigo 600
          }
        },
        secondary: {
          DEFAULT: '#4F46E5', // Indigo 600
          light: '#6366F1',   // Indigo 500
        },
        background: {
          DEFAULT: '#05070D', // Rich Black
          layer1: '#0B0F19',
          layer2: '#111827',  // Gray 900
        },
        accent: {
          glow: 'rgba(109, 40, 217, 0.25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'], // Need to add this font import
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #6D28D9, #4F46E5)',
        'primary-gradient-intense': 'linear-gradient(135deg, #7C3AED, #6366F1)',
        'glass-card': 'linear-gradient(180deg, rgba(17, 24, 39, 0.6) 0%, rgba(17, 24, 39, 0.4) 100%)',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(109, 40, 217, 0.25)',
        'glow-hover': '0 8px 25px rgba(109, 40, 217, 0.35)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
