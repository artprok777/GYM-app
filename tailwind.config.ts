import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0C0C0E",
        surface: "#161618",
        border: "#2A2A30",
        "text-primary": "#F8F8F8",
        "text-secondary": "#8A8A9A",
        accent: "#F5A623",
        "accent-muted": "rgba(245, 166, 35, 0.12)",
        success: "#4ADE80",
        destructive: "#EF4444",
      },
      fontFamily: {
        display: ["'DM Mono'", "monospace"],
        sans: ["'Geist'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
export default config
