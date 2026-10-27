import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "var(--bg-obsidian)",
        charcoal: "var(--bg-charcoal)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        gold: {
          DEFAULT: "var(--gold-champagne)",
          bright: "var(--gold-bright)",
          muted: "var(--gold-muted)"
        },
        burgundy: {
          DEFAULT: "var(--burgundy-accent)",
          bright: "var(--burgundy-highlight)"
        },
        cream: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)"
        }
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
