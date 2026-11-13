/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        // Single brand palette used across the app
        brand: {
          50: "#ecfdf6",
          100: "#d1fae9",
          200: "#a7f3d6",
          300: "#6ee7bd",
          400: "#34d39f",
          500: "#10b985",
          600: "#05966c",
          700: "#04785a",
          800: "#065f49",
          900: "#064e3d",
          950: "#022c23",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgb(16 24 40 / 0.04), 0 1px 3px rgb(16 24 40 / 0.06)",
      },
      keyframes: {
        "slide-in": { from: { transform: "translateY(8px)", opacity: 0 }, to: { transform: "translateY(0)", opacity: 1 } },
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      animation: {
        "slide-in": "slide-in 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
};
