/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: "#F0B429", dark: "#C88F00", light: "#FFD666" },
        panel: { DEFAULT: "#0F172A", light: "#1E293B", border: "#334155" },
        ink:   { DEFAULT: "#070D17", mid: "#0D1929" },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        serif: ["'Georgia'", "serif"],
        mono:  ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
