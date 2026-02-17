/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Acid Yellow Industrial Theme Colors */
        acid: {
          DEFAULT: "#d4ff00",
          dark: "#a3c400",
          darker: "#859e00",
          glow: "rgba(212, 255, 0, 0.15)",
        },
        golden: {
          DEFAULT: "#ca8a04",
          dark: "#a16207",
          darker: "#854d0e",
        },
        industrial: {
          black: "#0a0a0a",
          dark: "#141414",
          elevated: "#1a1a1a",
          border: "#262626",
          light: "#fafafa",
          white: "#ffffff",
        },
      },
      borderRadius: {
        /* Industrial sharp corners */
        lg: "var(--radius)",        /* 2px */
        md: "var(--radius)",        /* 2px - same for industrial */
        sm: "var(--radius)",        /* 2px - same for industrial */
        industrial: "2px",
        none: "0px",
      },
      spacing: {
        'safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
        'mobile-nav': 'var(--mobile-nav-total)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}