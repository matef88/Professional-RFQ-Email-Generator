# 🎨 Theme & Design Guide

Guide for developers who want to customize the visual design of AutoMail V2.

---

## Overview

AutoMail uses **CSS Custom Properties (Variables)** for theming. All colors, fonts, and spacing are defined in `:root` in [`src/styles.css`](../src/styles.css).

---

## Quick Theme Change

Open [`src/styles.css`](../src/styles.css) and find the `:root` section at the top:

```css
:root {
  /* Background Colors */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  
  /* Text Colors */
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  /* Accent Colors */
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  
  /* ... more variables ... */
}
```

Change these values to instantly update the entire app's appearance.

---

## Color Variables Reference

### Background Colors

| Variable | Default | Usage |
|----------|---------|-------|
| `--bg-primary` | `#0f172a` | Main background |
| `--bg-secondary` | `#1e293b` | Cards, panels |
| `--bg-tertiary` | `#334155` | Inputs, hover states |
| `--bg-hover` | `#475569` | Hover backgrounds |
| `--bg-input` | `#1e293b` | Input fields |

### Text Colors

| Variable | Default | Usage |
|----------|---------|-------|
| `--text-primary` | `#f1f5f9` | Main text |
| `--text-secondary` | `#94a3b8` | Secondary text |
| `--text-muted` | `#64748b` | Muted/disabled text |
| `--text-inverse` | `#0f172a` | Text on accent background |

### Accent Colors

| Variable | Default | Usage |
|----------|---------|-------|
| `--accent` | `#3b82f6` | Primary accent (buttons, links) |
| `--accent-hover` | `#2563eb` | Accent hover state |
| `--accent-light` | `#3b82f620` | Accent with transparency |

### Status Colors

| Variable | Default | Usage |
|----------|---------|-------|
| `--success` | `#10b981` | Success states |
| `--warning` | `#f59e0b` | Warning states |
| `--error` | `#ef4444` | Error states |
| `--info` | `#3b82f6` | Info states |

### Border Colors

| Variable | Default | Usage |
|----------|---------|-------|
| `--border-color` | `#334155` | Default borders |
| `--border-light` | `#475569` | Lighter borders |
| `--border-focus` | `#3b82f6` | Focus ring color |

---

## Pre-Built Themes

### Light Theme

```css
:root {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --bg-hover: #e2e8f0;
  --bg-input: #ffffff;
  
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-inverse: #ffffff;
  
  --border-color: #e2e8f0;
  --border-light: #cbd5e1;
  --border-focus: #3b82f6;
  
  --accent: #3b82f6;
  --accent-hover: #2563eb;
}
```

### Midnight Blue Theme

```css
:root {
  --bg-primary: #0c1929;
  --bg-secondary: #162032;
  --bg-tertiary: #1e3a5f;
  --bg-hover: #2d4a6f;
  --bg-input: #162032;
  
  --text-primary: #e0f2fe;
  --text-secondary: #7dd3fc;
  --text-muted: #38bdf8;
  
  --accent: #38bdf8;
  --accent-hover: #0ea5e9;
}
```

### Forest Green Theme

```css
:root {
  --bg-primary: #0f1f17;
  --bg-secondary: #1a2f23;
  --bg-tertiary: #2d4a3a;
  --bg-hover: #3d5f4d;
  --bg-input: #1a2f23;
  
  --text-primary: #ecfdf5;
  --text-secondary: #6ee7b7;
  --text-muted: #34d399;
  
  --accent: #10b981;
  --accent-hover: #059669;
}
```

### Purple Theme

```css
:root {
  --bg-primary: #1a1025;
  --bg-secondary: #2d1f3d;
  --bg-tertiary: #4a3560;
  --bg-hover: #5d4a73;
  --bg-input: #2d1f3d;
  
  --text-primary: #f3e8ff;
  --text-secondary: #c4b5fd;
  --text-muted: #a78bfa;
  
  --accent: #8b5cf6;
  --accent-hover: #7c3aed;
}
```

---

## Typography

### Font Family

Default: System fonts for native feel

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
               'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', 
               'Roboto Mono', monospace;
}
```

To use a custom font:

```css
/* Add Google Fonts in public/index.html <head> */
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

/* Then in styles.css */
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### Font Sizes

```css
:root {
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
}
```

---

## Spacing

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
}
```

---

## Border Radius

```css
:root {
  --radius-sm: 0.25rem;  /* 4px - small elements */
  --radius-md: 0.5rem;   /* 8px - buttons, inputs */
  --radius-lg: 0.75rem;  /* 12px - cards */
  --radius-xl: 1rem;     /* 16px - large cards */
  --radius-full: 9999px; /* pills */
}
```

---

## Shadows

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
}
```

---

## Transitions

```css
:root {
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}
```

---

## Component-Specific Styles

### Header

```css
.header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: var(--space-4);
}
```

### Buttons

```css
.btn-primary {
  background: var(--accent);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
}

.btn-primary:hover {
  background: var(--accent-hover);
}
```

### Input Fields

```css
.input {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  padding: var(--space-3);
}

.input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--accent-light);
}
```

### Cards

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}
```

---

## Template Colors

Each email template has its own accent color. These are defined in [`src/config.ts`](../src/config.ts):

```typescript
export const TEMPLATES: TemplateConfig[] = [
  { id: "standard", color: "#d97706", ... },    // Amber
  { id: "urgent", color: "#dc2626", ... },      // Red
  { id: "competitive", color: "#059669", ... }, // Green
  { id: "bulkOrder", color: "#7c3aed", ... },   // Purple
  { id: "followUp", color: "#0891b2", ... },    // Cyan
  { id: "reminder", color: "#ea580c", ... },    // Orange
];
```

To change template colors, edit the `color` property.

---

## Responsive Breakpoints

The app uses these breakpoints:

```css
/* Mobile first approach */

/* Tablet (768px and up) */
@media (min-width: 768px) { ... }

/* Desktop (1024px and up) */
@media (min-width: 1024px) { ... }

/* Large Desktop (1280px and up) */
@media (min-width: 1280px) { ... }
```

---

## Creating a Custom Theme

### Step 1: Define Your Colors

Choose a color palette. Tools like [coolors.co](https://coolors.co) can help.

### Step 2: Update CSS Variables

Edit `:root` in `styles.css`:

```css
:root {
  /* Your custom colors */
  --bg-primary: #your-color;
  --bg-secondary: #your-color;
  /* ... etc */
}
```

### Step 3: Test Thoroughly

Check all screens:
- Compose form
- Email preview
- History panel
- Links panel
- All templates

### Step 4: Verify Contrast

Ensure text is readable:
- Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Minimum ratio: 4.5:1 for normal text

---

## Dark Mode Support (Future)

The app currently uses a dark theme by default. To add light/dark mode toggle:

1. Add a `data-theme` attribute to `<html>`
2. Create alternate variable sets:

```css
:root {
  /* Dark theme (default) */
  --bg-primary: #0f172a;
}

:root[data-theme="light"] {
  /* Light theme */
  --bg-primary: #f8fafc;
}
```

3. Add a toggle button in the header
4. Store preference in localStorage

---

## Best Practices

### ✅ Do

- Use CSS variables for all colors
- Test with real content
- Ensure sufficient contrast
- Keep consistent spacing
- Test on multiple screen sizes

### ❌ Don't

- Hardcode colors in components
- Use too many different colors
- Ignore accessibility
- Change structure CSS unless necessary

---

## Troubleshooting

### Changes not appearing?

1. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
2. Check for CSS syntax errors
3. Verify the correct file is being loaded

### Colors look different than expected?

- Check for color mixing with transparency
- Verify hex codes are correct
- Consider monitor color calibration

### Layout breaking?

- Don't modify structural CSS unless necessary
- Use browser DevTools to debug
- Check for conflicting styles

---

## Need Help?

- 📖 [Customization Guide](CUSTOMIZATION.md) — Company details
- 📖 [Structure Guide](STRUCTURE.md) — Codebase overview
- 🐛 Report issues on GitHub
