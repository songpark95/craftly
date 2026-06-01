import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: "#FAF6F1",
          card: "#FFFFFF",
          wood: "#8B6F47",
          "wood-light": "#C4A87C",
          "wood-pale": "#F0E6D6",
          dark: "#2A2118",
          gray: "#7D7068",
        },
        sage: {
          DEFAULT: "#6B9E7A",
          deep: "#4A7C59",
          light: "#E8F2EC",
        },
        sun: {
          DEFAULT: "#D4A843",
          bright: "#F0C850",
          light: "#FDF6E0",
        },
        craft: {
          purple: "#8B7AB8",
          "purple-deep": "#6B5A9E",
          "purple-light": "#F0ECF8",
          rose: "#C47B7B",
          "rose-light": "#FDF0EC",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Nunito", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(42,33,24,0.05)",
        lifted: "0 4px 20px rgba(42,33,24,0.08)",
        glow: "0 4px 16px rgba(107,158,122,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
