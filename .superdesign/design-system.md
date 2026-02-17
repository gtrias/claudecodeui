# Cloud CLI Design System
## Acid Yellow Industrial — Adaptive Yellow Theme

### Product Context
Cloud CLI is a web-based IDE companion for AI coding assistants (Claude Code, Cursor, Codex). Users interact with:
- **Chat interface** - conversations with AI agents
- **File browser** - navigate and edit code
- **Terminal** - shell access
- **Git panel** - version control
- **Sidebar** - projects & sessions

The aesthetic should feel: **Bold, Energetic, Industrial, Functional, Developer-focused**

---

## Color Palette

### Primary Accent — Adaptive Yellow (Mode-specific)

**Dark Mode — Acid/Lime Yellow**
```css
--yellow-accent: #d4ff00;      /* Primary accent - electric, neon */
--yellow-hover: #e4ff33;       /* Hover state - slightly lighter */
--yellow-active: #bfec00;      /* Active/pressed - slightly darker */
--yellow-subtle-bg: #1a1f00;   /* Subtle background tint */
--yellow-glow: rgba(212, 255, 0, 0.15); /* Focus ring glow */
```

**Light Mode — Golden Yellow**
```css
--yellow-accent: #ca8a04;      /* Primary accent - readable on white */
--yellow-hover: #a16207;       /* Hover state - darker */
--yellow-active: #854d0e;      /* Active/pressed - darkest */
--yellow-fill: #d4ff00;        /* For fills/backgrounds (not text) */
--yellow-subtle-bg: #fef9c3;   /* Subtle background tint */
--yellow-glow: rgba(202, 138, 4, 0.2); /* Focus ring glow */
```

### Neutral Scale — Industrial Gray

**Dark Mode**
```css
--bg-primary: #0a0a0a;         /* Page background - near black */
--bg-secondary: #141414;       /* Sidebar, cards */
--bg-elevated: #1a1a1a;        /* Elevated surfaces, hovers */
--bg-highlight: #262626;       /* Highlighted areas */
--border: #262626;             /* Borders, dividers */
--border-subtle: #1f1f1f;      /* Subtle borders */
--text-primary: #fafafa;       /* Primary text */
--text-secondary: #a3a3a3;     /* Secondary text */
--text-muted: #525252;         /* Muted/disabled text */
```

**Light Mode**
```css
--bg-primary: #fafafa;         /* Page background */
--bg-secondary: #ffffff;       /* Sidebar, cards */
--bg-elevated: #f5f5f5;        /* Elevated surfaces, hovers */
--bg-highlight: #e5e5e5;       /* Highlighted areas */
--border: #e5e5e5;             /* Borders, dividers */
--border-subtle: #f0f0f0;      /* Subtle borders */
--text-primary: #0a0a0a;       /* Primary text */
--text-secondary: #525252;     /* Secondary text */
--text-muted: #a3a3a3;         /* Muted/disabled text */
```

### Semantic Colors
```css
--success: #22c55e;            /* Green - success states */
--warning: #f59e0b;            /* Amber - warnings */
--error: #ef4444;              /* Red - errors, destructive */
--info: #3b82f6;               /* Blue - informational */
```

### Status Colors for AI Providers
```css
--claude: #d4ff00;             /* Yellow - Claude (matches theme) */
--cursor: #00d9ff;             /* Cyan - Cursor */
--codex: #10b981;              /* Green - Codex */
--pi: #8b5cf6;                 /* Purple - Pi */
```

---

## Typography

### Font Stack
```css
/* Primary - System UI (fast, native feel) */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

/* Monospace - for code, terminal */
font-family: "SF Mono", "Fira Code", "Cascadia Code", Consolas, monospace;
```

### Scale
| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 11px | 400 | Badges, meta |
| `text-sm` | 13px | 400 | Secondary text, captions |
| `text-base` | 14px | 400 | Body text, messages |
| `text-lg` | 16px | 500 | Subheadings |
| `text-xl` | 18px | 600 | Section headers |
| `text-2xl` | 24px | 700 | Page titles |

---

## Component Patterns

### Buttons

**Primary Button (Dark Mode)**
```css
.btn-primary {
  background: #d4ff00;
  color: #0a0a0a;              /* Dark text on yellow */
  font-weight: 600;
  border-radius: 6px;
  padding: 8px 16px;
}
.btn-primary:hover { background: #e4ff33; }
.btn-primary:active { background: #bfec00; }
```

**Primary Button (Light Mode)**
```css
.btn-primary {
  background: #ca8a04;
  color: #ffffff;              /* White text on golden yellow */
  font-weight: 600;
}
/* OR use acid yellow with dark text: */
.btn-primary-alt {
  background: #d4ff00;
  color: #0a0a0a;
}
```

**Secondary/Ghost Buttons**
```css
.btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
}
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn-ghost:hover { 
  background: var(--bg-elevated);
  color: var(--yellow-accent);
}
```

### Active/Selected States

**Sidebar Active Item (Dark Mode)**
```css
.sidebar-item-active {
  background: #1a1f00;                    /* Subtle yellow-tinted bg */
  border-left: 2px solid #d4ff00;         /* Acid yellow accent */
  color: #d4ff00;
}
```

**Sidebar Active Item (Light Mode)**
```css
.sidebar-item-active {
  background: #fef9c3;                    /* Soft yellow bg */
  border-left: 2px solid #ca8a04;         /* Golden yellow accent */
  color: #854d0e;                         /* Dark yellow text */
}
```

### Inputs
```css
.input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-secondary);
}

/* Focus state */
.input:focus {
  border-color: var(--yellow-accent);
  box-shadow: 0 0 0 3px var(--yellow-glow);
}
```

### Chat Messages

**User Message (Dark Mode)**
```css
.message-user {
  background: #d4ff00;
  color: #0a0a0a;
  border-radius: 12px 12px 4px 12px;
}
```

**User Message (Light Mode)**
```css
.message-user {
  background: #d4ff00;            /* Acid yellow works as fill */
  color: #0a0a0a;
  border-radius: 12px 12px 4px 12px;
}
```

**AI Message**
```css
.message-ai {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-radius: 12px 12px 12px 4px;
}
```

---

## Spacing & Layout

### Spacing Scale (4px base)
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
```

### Border Radius
```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-full: 9999px;
```

### Layout Dimensions
- **Sidebar width**: 320px (desktop), 85vw (mobile)
- **Collapsed sidebar**: 56px
- **Mobile nav height**: 60px + safe area
- **Input height**: 36px (sm), 40px (default), 44px (lg)

---

## Shadows (Minimal, Industrial)

```css
/* Dark mode */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
--shadow-glow: 0 0 20px rgba(212, 255, 0, 0.1);  /* Subtle yellow glow */

/* Light mode */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
```

---

## Key Visual Principles

1. **Yellow as Hero**: Acid yellow in dark mode, golden yellow in light mode for text/icons
2. **Industrial Neutrals**: Pure blacks and grays, no blue-tinting
3. **High Contrast**: Maximum readability, especially in dark mode
4. **Functional First**: Every visual element serves a purpose
5. **Electric Energy**: The yellow should feel alive, like a highlighter or terminal cursor
6. **Mode-Adaptive**: Colors adapt per mode for optimal contrast and accessibility

---

## Accessibility Notes

- **Dark mode**: Acid yellow (#d4ff00) on black (#0a0a0a) = excellent contrast
- **Light mode**: Golden yellow (#ca8a04) meets WCAG AA for text on white
- **Light mode fills**: Acid yellow (#d4ff00) can be used for backgrounds with dark text
- Always use dark text (#0a0a0a) on acid yellow backgrounds
