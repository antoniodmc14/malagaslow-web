/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./es/*.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Gilroy", "sans-serif"],
      },
      colors: {
        brand: "#307EFF",
      },
      letterSpacing: {
        tightest: "-0.06em",
      },
    },
  },
  plugins: [],
};
