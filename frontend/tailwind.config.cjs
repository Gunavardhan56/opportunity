/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        card: "#FFFFFF",
        primary: "#6366F1",
        secondary: "#8B5CF6",
        textPrimary: "#0F172A",
        textSecondary: "#475569",
        border: "#E2E8F0",
      },
    },
  },
  plugins: [],
};

