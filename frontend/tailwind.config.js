/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#120E1A",
        surface: "#1C1626",
        "surface-2": "#241B30",
        border: "#34293F",
        primary: "#5B3A73",
        "primary-hover": "#6E4788",
        "primary-light": "#A98FC4",
        gold: "#B8935A",
        "gold-light": "#D1AD7A",
        ink: "#E4DEEA",
        "ink-muted": "#8F8599",
      },
      fontFamily: {
        display: ["Canela", "Fraunces", "Georgia", "serif"],
        sans: ["General Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};