import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        "ds-bg-100": "var(--ds-background-100)",
        "ds-bg-200": "var(--ds-background-200)",
        "ds-bg-300": "var(--ds-background-300)",
        "ds-gray": {
          100: "var(--ds-gray-100)",
          200: "var(--ds-gray-200)",
          300: "var(--ds-gray-300)",
          400: "var(--ds-gray-400)",
          500: "var(--ds-gray-500)",
          600: "var(--ds-gray-600)",
          700: "var(--ds-gray-700)",
          800: "var(--ds-gray-800)",
          900: "var(--ds-gray-900)",
          1000: "var(--ds-gray-1000)",
        },
        "ds-accent": {
          blue: "var(--ds-accent-blue)",
          green: "var(--ds-accent-green)",
          red: "var(--ds-accent-red)",
          amber: "var(--ds-accent-amber)",
        },
        "ds-border": "var(--ds-border)",
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
