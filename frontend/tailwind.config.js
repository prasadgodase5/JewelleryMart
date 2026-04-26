/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dbe5ff', 500: '#4f46e5', 600: '#4338ca', 700: '#3730a3'
        }
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Trebuchet MS', 'Nunito', 'sans-serif']
      }
    }
  },
  plugins: []
};
