# Theme & Design System

This file contains the complete design system, CSS variables, and Tailwind configuration.

## Design Philosophy

- **Theme**: Dark/Light mode with CSS variables
- **Color System**: HSL-based semantic colors
- **Spacing**: Tailwind defaults + custom safe area values
- **Typography**: System font stack
- **Border Radius**: Consistent `--radius` variable

---

## Tailwind Configuration (`tailwind.config.js`)

```js
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        'safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
        'mobile-nav': 'var(--mobile-nav-total)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

---

## CSS Variables (`src/index.css`)

### Light Mode (Default)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
```

### Dark Mode

```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 217.2 91.2% 8%;
  --card-foreground: 210 40% 98%;
  --popover: 217.2 91.2% 8%;
  --popover-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 220 13% 46%;
  --ring: 217.2 91.2% 59.8%;
}
```

### Mobile & PWA Variables

```css
:root {
  /* Safe area CSS variables */
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-right: env(safe-area-inset-right);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);

  /* Mobile navigation dimensions */
  --mobile-nav-height: 60px;
  --mobile-nav-padding: 12px;
  --mobile-nav-total: calc(var(--mobile-nav-height) + max(env(safe-area-inset-bottom, 0px), var(--mobile-nav-padding)));

  /* Header safe area dimensions */
  --header-safe-area-top: env(safe-area-inset-top, 0px);
  --header-base-padding: 8px;
  --header-total-padding: calc(var(--header-safe-area-top) + var(--header-base-padding));
}
```

---

## Typography

### Font Stack

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

### Text Sizes (Tailwind defaults)

| Class | Size |
|-------|------|
| `text-xs` | 12px |
| `text-sm` | 14px |
| `text-base` | 16px |
| `text-lg` | 18px |
| `text-xl` | 20px |
| `text-2xl` | 24px |

### Text Colors

| Class | Usage |
|-------|-------|
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary/subdued text |
| `text-primary` | Accent/link text |
| `text-destructive` | Error/danger text |

---

## Color Palette (Rendered)

### Light Mode
| Variable | HSL | Approximate Color |
|----------|-----|-------------------|
| `--background` | 0 0% 100% | White |
| `--foreground` | 222.2 84% 4.9% | Near Black |
| `--primary` | 221.2 83.2% 53.3% | Blue (#3b82f6) |
| `--secondary` | 210 40% 96.1% | Light Gray |
| `--muted` | 210 40% 96.1% | Light Gray |
| `--border` | 214.3 31.8% 91.4% | Light Gray Border |
| `--destructive` | 0 84.2% 60.2% | Red |

### Dark Mode
| Variable | HSL | Approximate Color |
|----------|-----|-------------------|
| `--background` | 222.2 84% 4.9% | Near Black |
| `--foreground` | 210 40% 98% | White |
| `--card` | 217.2 91.2% 8% | Dark Blue-Gray |
| `--primary` | 217.2 91.2% 59.8% | Light Blue |
| `--secondary` | 217.2 32.6% 17.5% | Dark Gray |
| `--border` | 217.2 32.6% 17.5% | Dark Gray Border |

---

## Accent Colors

Beyond the semantic colors, the app uses direct Tailwind colors:

```css
/* Primary accent - Blue */
text-blue-600 dark:text-blue-400
bg-blue-600 dark:bg-blue-500
hover:bg-blue-700 dark:hover:bg-blue-600

/* Gray scale */
text-gray-600 dark:text-gray-400
bg-gray-100 dark:bg-gray-800
border-gray-200 dark:border-gray-700

/* Status colors */
text-green-600 dark:text-green-400  /* Success */
text-yellow-600 dark:text-yellow-400  /* Warning */
text-red-600 dark:text-red-400  /* Error */
```

---

## Transitions

```css
/* Default transition */
button, a, input, textarea, select {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Color transitions for theme switching */
body, div, section {
  transition: background-color 200ms ease-in-out, 
              border-color 200ms ease-in-out,
              color 200ms ease-in-out;
}

/* Sidebar transition */
.sidebar-transition {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
              opacity 300ms ease-in-out;
}
```

---

## Scrollbar Styles

```css
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground)) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.dark .scrollbar-thin {
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}
```

---

## Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Default | 0px+ | Mobile first |
| `sm:` | 640px+ | Small tablets |
| `md:` | 768px+ | Tablets (mobile nav hides) |
| `lg:` | 1024px+ | Desktop |
| `xl:` | 1280px+ | Large desktop |
| `2xl:` | 1536px+ | Extra large |

**Key Breakpoint**: `768px` - This is where mobile/desktop layout switches.
