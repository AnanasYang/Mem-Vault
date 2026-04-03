/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'l0': '#3b82f6',
        'l1': '#10b981',
        'l2': '#f59e0b',
        'l3': '#8b5cf6',
        'l4': '#ef4444',
      },
    },
  },
  plugins: [],
}
