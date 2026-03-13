/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        card: "#0B1120",
        primary: "#6366F1",
        secondary: "#A855F7",
        textPrimary: "#E5E7EB",
        textSecondary: "#9CA3AF",
        border: "#1F2937",
      },
    },
  },
  plugins: [],
};

