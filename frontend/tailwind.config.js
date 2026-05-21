/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        surface: '#141414',
        elevated: '#1E1E1E',
        border: '#2A2A2A',
        accent: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        textPrimary: '#F5F5F5',
        textSecondary: '#A3A3A3',
        textMuted: '#525252',
      },
    },
  },
  plugins: [],
};
