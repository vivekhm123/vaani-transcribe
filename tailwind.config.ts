import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0E0F13",
        surface: "#171922",
        surface2: "#1F222D",
        border: "#2A2E3A",
        accent: "#5B8CFF",
        accent2: "#39C6A6",
        muted: "#9AA1B1",
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
