/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        solar: "#f59e0b",
        wind: "#0ea5e9",
        total: "#10b981",
      },
    },
  },
  plugins: [],
};
