/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      colors: {
        navy:  '#1b2a4a',
        teal:  { DEFAULT: '#1a7a7e', light: '#25a9ae' },
        gold:  '#c9922a',
        lms:   { bg: '#f8f6f1', cream: '#ede9df' },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    function({ addBase }) {
      addBase({ 'html': { direction: 'rtl' } })
    },
  ],
}
