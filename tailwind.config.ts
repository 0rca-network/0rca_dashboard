import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neon Dark Theme Colors
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-hover": "rgb(var(--color-surface-hover) / <alpha-value>)",
        
        // CTA Colors
        "cta-primary": "rgb(var(--color-cta-primary) / <alpha-value>)",
        "cta-primary-hover": "rgb(var(--color-cta-primary-hover) / <alpha-value>)",
        "cta-text": "rgb(var(--color-cta-text) / <alpha-value>)",
        
        // Accent Colors
        "accent-secondary": "rgb(var(--color-accent-secondary) / <alpha-value>)",
        "accent-tertiary": "rgb(var(--color-accent-tertiary) / <alpha-value>)",
        
        // Text Colors
        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        
        // Borders
        border: "rgb(var(--color-border) / <alpha-value>)",
        "border-accent": "rgb(var(--color-border-accent) / <alpha-value>)",
        
        // Status Colors
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
        info: "rgb(var(--color-info) / <alpha-value>)",
      },
      boxShadow: {
        "glow-cyan": "var(--shadow-glow-cyan)",
        "glow-lime": "var(--shadow-glow-lime)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
