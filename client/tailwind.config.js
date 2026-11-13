/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Schibsted Grotesk"', "system-ui", "sans-serif"],
        display: ["Newsreader", "Georgia", "serif"],
      },
      colors: {
        // Warm neutral scale (paper -> ink). Replaces Tailwind's cool slate everywhere.
        slate: {
          50: "#f4f2ec",
          100: "#ebe8df",
          200: "#dfdbcf",
          300: "#ccc7b9",
          400: "#a29d90",
          500: "#79746a",
          600: "#5b574e",
          700: "#3d3b35",
          800: "#2a2926",
          900: "#1c1c1a",
          950: "#121211",
        },
        // Signature orange accent
        brand: {
          50: "#fff3ee",
          100: "#ffe4d8",
          200: "#ffc6af",
          300: "#ffa27f",
          400: "#ff7f53",
          500: "#ff5f2e",
          600: "#ec4a19",
          700: "#c23a12",
          800: "#9a3014",
          900: "#7c2a15",
          950: "#431208",
        },
        // Income / positive (muted sage)
        pos: {
          50: "#eef4ee",
          100: "#d9e8db",
          400: "#7fb08f",
          500: "#4f8a63",
          600: "#3c7350",
          700: "#2f5c40",
        },
        ink: v("ink"),
        paper: v("paper"),
        card: v("card"),
        line: v("line"),
        muted: v("muted"),
      },
      borderRadius: {
        clay: "14px",
        "4xl": "1.75rem",
      },
      boxShadow: {
        // Soft "clay" depth: inner highlight, inner shade, gentle drop
        clay: "inset 1px 1px 2px var(--clay-hi), inset -2px -3px 6px var(--clay-lo), 2px 4px 10px var(--clay-drop)",
        "clay-sm": "inset 1px 1px 1px var(--clay-hi), inset -1px -2px 4px var(--clay-lo), 1px 2px 5px var(--clay-drop)",
        card: "inset 0 1px 0 var(--card-hi), 0 1px 2px rgb(20 19 15 / 0.04), 0 12px 32px -20px rgb(20 19 15 / 0.28)",
        lift: "inset 0 1px 0 var(--card-hi), 0 2px 4px rgb(20 19 15 / 0.05), 0 20px 40px -22px rgb(20 19 15 / 0.35)",
      },
      keyframes: {
        "slide-in": { from: { transform: "translateY(10px)", opacity: 0 }, to: { transform: "translateY(0)", opacity: 1 } },
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        rise: { from: { transform: "translateY(6px)", opacity: 0 }, to: { transform: "translateY(0)", opacity: 1 } },
      },
      animation: {
        "slide-in": "slide-in 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)",
        "fade-in": "fade-in 0.2s ease-out",
        rise: "rise 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
