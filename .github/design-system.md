# HarvestHub Design System – Token Reference

> **Version 1.0** — Single source of truth for colours, typography, spacing, shadows, elevation, and radii used across the HarvestHub codebase.

---

## Architecture Overview

The design system uses a **three-tier token architecture** that separates raw colour values from their semantic meaning:

```
┌─────────────────────────────────────────────────────┐
│  TIER 1 — Palette                                   │
│  Raw RGB triplets (immutable primitives)             │
│  e.g. --ds-palette-purple-600: 147 51 234           │
├─────────────────────────────────────────────────────┤
│  TIER 2 — Semantic                                  │
│  Purpose-driven aliases that reference Tier 1       │
│  e.g. --ds-brand-primary: var(--ds-palette-purple-600) │
│  Light ↔ Dark switching happens at this tier        │
├─────────────────────────────────────────────────────┤
│  TIER 3 — Utility (Tailwind)                        │
│  Tailwind classes mapped via dsColor() helper       │
│  e.g. bg-ds-brand-primary  →  var(--ds-brand-primary) │
└─────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `app/_styles/globals.css` | Tier 1 + Tier 2 CSS custom properties |
| `tailwind.config.ts` | Tier 3 Tailwind utility mapping |
| `lib/theme/antd-theme.ts` | Ant Design `ConfigProvider` theme bridge + `DS_PALETTE` hex constants |
| `lib/design-system/index.ts` | Central re-export barrel (palette, z-index, radius, status maps) |

---

## Token Categories

### Brand

| Token | Light | Dark | Tailwind Class |
|-------|-------|------|---------------|
| `--ds-brand-primary` | Purple-600 `#9333ea` | Purple-500 `#a855f7` | `bg-ds-brand-primary`, `text-ds-brand-primary` |
| `--ds-brand-primary-hover` | Purple-700 `#7e22ce` | Purple-600 `#9333ea` | `bg-ds-brand-primary-hover` |
| `--ds-brand-primary-active` | Purple-800 `#6b21a8` | Purple-700 `#7e22ce` | `bg-ds-brand-primary-active` |
| `--ds-brand-primary-light` | Purple-500 `#a855f7` | Purple-400 `#c084fc` | `text-ds-brand-primary-light` |
| `--ds-brand-accent` | Purple-400 `#c084fc` | Purple-300 `#d8b4fe` | `text-ds-brand-accent` |
| `--ds-brand-muted` | Purple-300 `#d8b4fe` | Purple-400 `#c084fc` | `border-ds-brand-muted` |
| `--ds-brand-subtle` | Purple-100 `#f3e8ff` | Purple-900 `#581c87` | `bg-ds-brand-subtle` |
| `--ds-brand-surface` | Purple-50 `#faf5ff` | Purple-950/20 | `bg-ds-brand-surface` |

### Text

| Token | Light | Dark | Tailwind Class |
|-------|-------|------|---------------|
| `--ds-text-primary` | Black | White | `text-ds-text-primary` |
| `--ds-text-secondary` | Neutral-600 | Neutral-400 | `text-ds-text-secondary` |
| `--ds-text-tertiary` | Neutral-500 | Neutral-500 | `text-ds-text-tertiary` |
| `--ds-text-placeholder` | Neutral-400 | Neutral-600 | `text-ds-text-placeholder` |
| `--ds-text-disabled` | Neutral-400 | Neutral-600 | `text-ds-text-disabled` |
| `--ds-text-inverse` | White | Black | `text-ds-text-inverse` |
| `--ds-text-brand` | Purple-600 | Purple-400 | `text-ds-text-brand` |
| `--ds-text-link` | Purple-600 | Purple-400 | `text-ds-text-link` |

### Surfaces

| Token | Light | Dark | Tailwind Class |
|-------|-------|------|---------------|
| `--ds-surface-base` | White | Neutral-900 | `bg-ds-surface-base` |
| `--ds-surface-raised` | White | Neutral-800 | `bg-ds-surface-raised` |
| `--ds-surface-overlay` | White | Neutral-800 | `bg-ds-surface-overlay` |
| `--ds-surface-sunken` | Neutral-50 | Neutral-950 | `bg-ds-surface-sunken` |
| `--ds-surface-disabled` | Neutral-100 | Neutral-800 | `bg-ds-surface-disabled` |

### Borders

| Token | Light | Dark | Tailwind Class |
|-------|-------|------|---------------|
| `--ds-border-base` | Neutral-200 | Neutral-700 | `border-ds-border-base` |
| `--ds-border-strong` | Neutral-300 | Neutral-600 | `border-ds-border-strong` |
| `--ds-border-subtle` | Neutral-100 | Neutral-800 | `border-ds-border-subtle` |
| `--ds-border-brand` | Purple-600 | Purple-500 | `border-ds-border-brand` |
| `--ds-border-focus` | Purple-500 | Purple-400 | `border-ds-border-focus` |

### Status

Each status has four tokens: base, text, background, and border.

| Status | Base | Text | Background | Border |
|--------|------|------|------------|--------|
| Success | `--ds-status-success` | `--ds-status-success-text` | `--ds-status-success-bg` | `--ds-status-success-border` |
| Error | `--ds-status-error` | `--ds-status-error-text` | `--ds-status-error-bg` | `--ds-status-error-border` |
| Warning | `--ds-status-warning` | `--ds-status-warning-text` | `--ds-status-warning-bg` | `--ds-status-warning-border` |
| Info | `--ds-status-info` | `--ds-status-info-text` | `--ds-status-info-bg` | `--ds-status-info-border` |

### Interaction

| Token | Usage | Tailwind Class |
|-------|-------|---------------|
| `--ds-focus-ring` | Focus ring on inputs/buttons | `ring-ds-focus-ring`, `focus:ring-ds-focus-ring` |
| `--ds-rating-fill` | Filled star colour | `text-ds-rating-fill`, `fill-ds-rating-fill` |
| `--ds-rating-empty` | Empty star colour | `text-ds-rating-empty` |

---

## Shadows

Defined as CSS custom properties with `box-shadow` values:

| Token | Tailwind Class | Use Case |
|-------|---------------|----------|
| `--ds-shadow-xs` | `shadow-ds-xs` | Subtle elevation for inputs |
| `--ds-shadow-sm` | `shadow-ds-sm` | Cards, default elevation |
| `--ds-shadow-md` | `shadow-ds-md` | Dropdowns, popovers |
| `--ds-shadow-lg` | `shadow-ds-lg` | Floating elements |
| `--ds-shadow-xl` | `shadow-ds-xl` | Modals, dialogs |
| `--ds-shadow-elevated` | `shadow-ds-elevated` | Ant Design–style elevated card |

---

## Z-Index Scale

| Token | Value | Tailwind Class | Use Case |
|-------|-------|---------------|----------|
| `--ds-z-base` | 0 | `z-ds-base` | Default stacking |
| `--ds-z-raised` | 10 | `z-ds-raised` | Sticky elements within flow |
| `--ds-z-dropdown` | 20 | `z-ds-dropdown` | Dropdown menus |
| `--ds-z-sticky` | 30 | `z-ds-sticky` | Sticky headers |
| `--ds-z-header` | 40 | `z-ds-header` | Main app header |
| `--ds-z-overlay` | 50 | `z-ds-overlay` | Backdrop overlays |
| `--ds-z-modal` | 60 | `z-ds-modal` | Modal dialogs |
| `--ds-z-toast` | 70 | `z-ds-toast` | Toast notifications |

---

## Border Radius

| Token | Value | Tailwind Class |
|-------|-------|---------------|
| `--ds-radius-xs` | 4px | `rounded-ds-xs` |
| `--ds-radius-sm` | 6px | `rounded-ds-sm` |
| `--ds-radius-md` | 8px | `rounded-ds-md` |
| `--ds-radius-lg` | 12px | `rounded-ds-lg` |
| `--ds-radius-xl` | 16px | `rounded-ds-xl` |
| `--ds-radius-full` | 9999px | `rounded-ds-full` |

---

## Usage Guide

### In Tailwind Classes (Recommended)

```tsx
// ✅ Correct — semantic token
<div className="bg-ds-surface-base text-ds-text-primary border-ds-border-base shadow-ds-sm">

// ❌ Wrong — raw utility
<div className="bg-white text-gray-900 border-gray-200 shadow-sm">
```

### In Ant Design Theme

Ant Design is themed via `DS_PALETTE` constants in `lib/theme/antd-theme.ts`:

```ts
import { antdTheme, antdDarkTheme } from '@/lib/theme/antd-theme';

<ConfigProvider theme={isDark ? antdDarkTheme : antdTheme}>
```

### In JavaScript/TypeScript

For runtime colour access (charts, dynamic styles):

```ts
import { DS_PALETTE } from '@/lib/design-system';

// DS_PALETTE.purple[600] → '#9333ea'
// DS_PALETTE.green[500]  → '#22c55e'
```

### Status Color Map

For dynamic status badges:

```ts
import { getStatusColors, statusColorMap } from '@/lib/design-system';

const colors = getStatusColors('delivered');
// → { bg: 'bg-ds-status-success-bg', text: 'text-ds-status-success-text', border: '...', dot: '...' }
```

### Palette Tokens (Gradients & Decorative Use)

When you need specific colour stops for gradients:

```tsx
<div className="bg-gradient-to-br from-ds-brand-primary to-ds-palette-purple-800">
```

---

## Dark Mode

- Dark mode is handled by the `.dark` class on the `<html>` element
- Semantic tokens automatically switch values in `.dark` context
- **You should NOT need `dark:` prefix** for colours that use `ds-*` tokens
- The only exception is gradient stops that need palette-level dark overrides

---

## Adding New Tokens

1. Add the CSS custom property in `globals.css` under the appropriate tier
2. Add the dark mode override in the `.dark` selector
3. Map to Tailwind in `tailwind.config.ts` using `dsColor()`
4. If needed for Ant Design, add to `DS_PALETTE` in `antd-theme.ts`
5. Re-export from `lib/design-system/index.ts` if consumed in JS
6. Update this document

---

## Migration Checklist (for new code)

- [ ] No raw colour classes (`text-gray-500`, `bg-purple-600`, etc.)
- [ ] No `dark:` prefix for colour tokens (unless gradients)
- [ ] Shadows use `shadow-ds-*` scale
- [ ] Z-index uses `z-ds-*` scale
- [ ] Status colours use `ds-status-*` tokens
- [ ] Ant Design components are themed via `ConfigProvider`
