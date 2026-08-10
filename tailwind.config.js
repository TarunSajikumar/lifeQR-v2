/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.html",
    "./app/**/*.js",
    "./website/**/*.html",
    "./website/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          DEFAULT: '#4f46e5',
        },
        emergency: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          DEFAULT: '#e11d48',
        },
        slate: {
          850: '#0f1729',
          925: '#090d16',
          950: '#05070d',
        }
      },
      boxShadow: {
        'bezel-light': '0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02), 0 12px 24px -4px rgba(79,70,229,0.06)',
        'bezel-dark': '0 0 0 1px rgba(255,255,255,0.08), 0 20px 40px -15px rgba(0,0,0,0.7)',
        'glow-primary': '0 0 30px -5px rgba(79,70,229,0.4)',
        'glow-emergency': '0 0 35px -5px rgba(225,29,72,0.45)',
        'inner-highlight': 'inset 0 1px 1px 0 rgba(255,255,255,0.15)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3.5xl': '1.75rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
