# DESIGN.md — Service Listing + Order Room (conformance reference)

> **Metadata**
>
> - source: local repo markup — `app/_styles/globals.css`, `tailwind.config.ts`, `ai-system/design-system.md`, `app/signup/layout.tsx`, `app/signup/components/StageTracker.tsx`, `app/checkout/page.tsx`, `components/ui/StatusTag.tsx`, `app/orders/[id]/page.tsx`
> - pulled-date: 2026-09-29
> - last-verified-against-code: 2026-09-29
> - staleness-policy: re-pull when the token layer in `app/_styles/globals.css` or the shared primitives in `components/ui/` change
> - produced-by: `commands/generate-design-md.md` (invoked from `plan-feature.md` for the services feature)

> **Overview:** Conformance reference for the planned **service listing wizard** and **service order room**. It captures the *existing* project design language those two surfaces must match, so implementation does not invent a second visual system. This is an **input to be reconciled**, not the project's source of truth — the token tables in `design-system.md` and the Tier 1/2 tokens in `app/_styles/globals.css` remain authoritative.

---

## Palette

Extracted from `app/_styles/globals.css` — Tier 1 palette → Tier 2 semantic aliases. Components must reference **only** Tier 2 semantic tokens (the file's own instruction: *"Components should reference ONLY these tokens. Light/dark switching happens here."*).

| Token | Value | Usage (as observed in markup) |
|-------|-------|-------------------------------|
| `--ds-brand-primary` | `purple-600` (`#9333ea`) | Primary buttons, active step chip, progress bar start |
| `--ds-brand-primary-hover` / `-active` | `purple-700` / `purple-800` | Button hover / pressed |
| `--ds-brand-accent` | `purple-400` | Progress bar gradient end (`from-ds-brand-primary to-ds-brand-accent`) |
| `--ds-brand-subtle` | `purple-100` | Completed step chip background |
| `--ds-brand-surface` | `purple-50` | Notice/banner background (checkout service notice: `bg-ds-brand-surface` + `border-ds-border-brand`) |
| `--ds-text-primary` | `black` (dark: `neutral-200`) | Headings, step title |
| `--ds-text-secondary` | `neutral-600` | Step counter, supporting copy |
| `--ds-text-tertiary` | `neutral-500` | Eyebrow/uppercase labels |
| `--ds-surface-base` | `white` (dark: `neutral-950`) | Cards, panels, page body |
| `--ds-surface-sunken` | `neutral-50` | Pending step chip, inset wells |
| `--ds-border-base` | `neutral-200` | Card/panel borders, progress track |
| `--ds-border-brand` | `purple-600` | Emphasised/active notice border |
| `--ds-status-success` / `-bg` / `-text` | `green-500` / `green-50` / `green-600` | Delivered / approved / funds-released states |
| `--ds-status-error` / `-bg` / `-text` | `red-500` / `red-50` / `red-600` | Countdown < 12 h warning, LATE flag, destructive actions |
| `--ds-status-warning` / `-bg` / `-text` | `amber-500` / `amber-50` / `amber-600` | Awaiting-requirements / in-review states |
| `--ds-status-info` / `-bg` / `-text` | `blue-500` / `blue-50` / `blue-600` | In-progress, informational notices |

Dark mode: all Tier 2 tokens are re-declared under a dark block in the same file — surfaces flip to `neutral-950`/`neutral-900`, brand flips to `purple-500`. No component should hardcode hex or `purple-*` utilities; dark mode is free only when the semantic token is used.

## Typography

| Style | Font | Size | Weight | Usage as observed |
|-------|------|------|--------|-------------------|
| Page heading | Geist Sans | `text-3xl` (1.875rem) | 700 (`font-bold`) | Signup section heading, order page titles |
| Card heading | Geist Sans | `text-base`/`text-lg` | 600 | Card titles, step title |
| Body | Geist Sans | `text-sm` (0.875rem) | 400 | Descriptions, notice copy |
| Eyebrow | Geist Sans | `text-xs` (0.75rem) | 500–600, `uppercase tracking-[0.2em]` | Section kickers |
| Micro/label | Geist Sans | `text-[11px]` | 500 | Step chips, table meta |
| Code/numeric | Menlo/Monaco | `0.875rem` | 400 | IDs, references |

## Spacing & shape

- Base unit **4px**; working scale 4, 8, 12, 16, 20, 24, 32, 40, 48 (from `design-system.md`).
- Card padding: `p-4 sm:p-6`; page gutters: `px-5 md:px-10 lg:px-12`.
- Radius tokens (`tailwind.config.ts`): `rounded-ds-xs` 4 / `ds-sm` 6 / `ds-md` 8 / `ds-lg` 12 / `ds-xl` 16 / `ds-full`.
- Shadow tokens: `shadow-ds-xs` … `shadow-ds-xl`, plus `shadow-ds-elevated`.
- Z tokens: `z-ds-base/raised/dropdown/sticky/header/overlay/modal/toast` (0→70).

## Component Patterns

- **Card / panel:** `rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-4 shadow-ds-sm sm:p-6`.
- **Notice / banner (service-relevant):** `border-ds-border-brand bg-ds-brand-surface p-4` inside an `mb-6` block, with a leading icon + two lines of copy (eyebrow `font-semibold`, then `text-sm` detail). Used today by the checkout "Service Bookings Included" banner — the order room's requirement-gate and late-delivery notices should reuse this exact shape.
- **Step tracker (`StageTracker`):** card wrapper → row with Back button (`rounded-ds-sm border border-ds-border-base px-2 py-1 text-xs`) + `Step n of m` + current-step name → `h-2` progress track (`bg-ds-border-base`) filled with `bg-gradient-to-r from-ds-brand-primary to-ds-brand-accent` → grid of step chips: active `bg-ds-brand-primary text-white`, complete `bg-ds-brand-subtle text-ds-text-primary`, pending `bg-ds-surface-sunken`.
  - **Known defect to fix when generalising:** the chip grid is hardcoded `grid-cols-3` and step labels come from a hardcoded `stageNames` record — a 5-step service wizard needs a `labels[]` prop and a responsive grid (`grid-cols-1 sm:grid-cols-3 lg:grid-cols-5`).
- **Status chip:** `components/ui/StatusTag.tsx` → antd `<Tag>` coloured from a centralised per-domain map (`ORDER_STATUS_COLORS` etc.), `getTagColor()` falls back to `"default"` for unknown values. **New service statuses must be added to `ORDER_STATUS_COLORS`; unknown values already degrade safely.**
- **Forms:** Ant Design `Form`/`Form.Item` with `rules`, `help`/`validateStatus` for errors, labels above fields, errors directly below the field.
- **Buttons:** primary `bg-purple-600` (i.e. brand primary) + white text; secondary outline purple + `purple-50` hover; destructive red; disabled low-opacity.
- **Uploads:** `components/ui/ImageUpload.tsx` picture-card with antd's built-in uploading/done/error overlay — immediate upload on selection, never at submit.
- **Responsive contract:** mobile-first, must work at 320px; desktop-only rails use `hidden md:flex`; content columns collapse via `md:w-3/5 lg:w-1/2`-style splits; card padding tightens `p-4 → sm:p-6`. Breakpoints: sm 640 / md 768 / lg 1024 / xl 1280.
- **Config-driven styling:** every colour/spacing/radius decision above resolves through a `ds-*` semantic token or a Tailwind token alias defined in `tailwind.config.ts` — no raw hex, no component-local palette.

---

## Promotion Candidates (for a human)

- None flagged — every token captured here already originates from the project's own Tier 1/2 token layer, so there is nothing external to promote into `design-system.md`.
- Non-token cleanup candidate (not a promotion): generalise `StageTracker`'s hardcoded `stageNames` + `grid-cols-3` into props so signup and the service wizard share one component.

## Extraction Basis

**Supplied markup** (repo source files) — not rendered output. No browsing tool was used; `tools/registry.md` lists `crawl4ai` as the registered browsing backend, but it was unnecessary because the reference is the codebase itself. Every value above is read directly from `app/_styles/globals.css`, `tailwind.config.ts`, and the named components.
