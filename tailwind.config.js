/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'gpu-blue': '#006CE9',
        'gpu-purple': '#7C3AED',
        'gpu-pink': '#EC4899',
      }
    },
  },
  plugins: [],
}