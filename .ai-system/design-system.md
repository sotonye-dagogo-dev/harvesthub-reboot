# Design System

> **Overview:** MyHarvestHub uses a hybrid design system combining Ant Design components with Tailwind CSS utilities. This approach enables rapid UI development while enforcing consistent spacing, typography, and color usage.

---

## Core Visual Identity

- **Primary Brand Color**: Neon Purple — `#9333ea` (Tailwind `purple-600`)
- **Accent Colors**:
  - Purple-700: `#7e22ce`
  - Purple-500: `#a855f7`
  - Purple-400: `#c084fc`
  - Purple-300: `#d8b4fe`
- **Semantic Colors**:
  - Success: `#22c55e` (green-500)
  - Warning: `#f59e0b` (amber-500)
  - Error: `#ef4444` (red-500)
  - Info: `#3b82f6` (blue-500)

---

## Foundations

- **Typography**: Uses Geist Sans via `geist/font` in `app/layout.tsx`.
- **Spacing**: Tailwind spacing scale (4, 8, 12, 16, 24, 32) is the default. Prefer spacing utilities (`p-4`, `gap-5`) over custom margins.
- **Responsiveness**: Mobile-first; use Tailwind breakpoints (`sm`, `md`, `lg`) for layout shifts.

---

## Component Guidelines

- Prefer Ant Design components for form controls, tables, modals, and layout primitives.
- Customize Ant Design theme via `lib/theme/antd-theme.ts` and `app/providers.tsx`.
- Use Tailwind utilities for layout, spacing, and minor overrides.
- Keep components small and composable; extract UI primitives into `components/ui/`.

---

## UX Patterns

- **Empty states**: Always include a user-friendly empty state component (e.g., `EmptyProducts`, `EmptyOrders`).
- **Loading states**: Use skeletons or spinners for async data.
- **Error handling**: Display clear error messages and retry actions.
- **Accessibility**: Use semantic HTML, aria labels, and keyboard-friendly components.

---

## Design Tokens

- Stored in Tailwind config (`tailwind.config.ts`) and Ant Design theme config.
- Avoid hardcoding colors; use Tailwind tokens (e.g., `bg-purple-600`, `text-gray-900`).
