# Design System

> **Metadata**
> - last-updated-by: ai-system v3 upgrade (2026-08-13)
> - last-verified-against-code: 2026-08-13
> - staleness-policy: re-verify if UI components or styling dependencies change

> **Overview:** MyHarvestHub’s design system combines a clean, purple-first brand identity with Ant Design components and Tailwind CSS utility styling. It defines visual tokens, component patterns, and UX rules to keep the UI consistent and accessible.

---

## Visual Language

> **Section summary:** Core visual identity — colours, typography, spacing.

### Colour Palette

| Token        | Value                        | Usage                         |
| ------------ | ---------------------------- | ----------------------------- |
| primary      | `#9333ea`                    | Primary buttons, links, CTAs  |
| accent       | `#a855f7`                    | Hover states, highlights      |
| dark         | `#7e22ce`                    | Headers, bold emphasis        |
| background   | `#ffffff` / `#0b0b1d` (dark) | Page background               |
| surface      | `#f8fafc` / `#0f172a` (dark) | Cards, panels                 |
| text-primary | `#0f172a` / `#f8fafc` (dark) | Main body text                |
| text-muted   | `#6b7280` / `#cbd5e1` (dark) | Labels, captions              |
| danger       | `#ef4444`                    | Errors, destructive actions   |
| success      | `#22c55e`                    | Confirmations, success states |

### Typography

| Style     | Font           | Size     | Weight |
| --------- | -------------- | -------- | ------ |
| Heading 1 | Geist Sans     | 2.25rem  | 700    |
| Heading 2 | Geist Sans     | 1.875rem | 600    |
| Body      | Geist Sans     | 1rem     | 400    |
| Caption   | Geist Sans     | 0.875rem | 400    |
| Code      | Menlo / Monaco | 0.875rem | 400    |

### Spacing Scale

- Base unit: 4px
- Common space tokens: 4, 8, 12, 16, 20, 24, 32, 40, 48

---

## Component Patterns

> **Section summary:** Standard UI components used across the project. New components should follow these patterns before inventing new ones.

### Buttons

- **Primary**: Solid purple background (`bg-purple-600`), white text, slight shadow, hover darken.
- **Secondary**: Outline (purple border) with transparent fill, hover background `purple-50`.
- **Destructive**: Red background (`bg-red-500`) with white text.
- **Disabled**: Low opacity, non-interactive cursor.

### Forms

- Use Ant Design `Form` and `Input` components for structure and validation.
- Display validation feedback via `Form.Item` `help` and `validateStatus` props.
- Place error messages below the field and keep them concise.
- Use `Formik`-like patterns with server actions / Zod validation.

### Navigation

- Primary navigation is top header in buyer experience.
- Vendor and admin use sidebar navigation with icons and collapsed states.
- Use Ant Design `Menu` and `Layout.Sider` for side navigation.

### Cards / Containers

- Use rounded corners (`rounded-xl`) and subtle shadows (`shadow-sm`) for cards.
- Use `bg-white` / `dark:bg-slate-900` for card backgrounds.
- Keep card content vertically spaced with consistent padding.

### Modals / Dialogs

- Use Ant Design `Modal` for confirmations and forms.
- Keep modals focused: only one action primary, secondary cancel.
- Provide clear titles and close buttons.

---

## UX Principles

> **Section summary:** Guiding rules for how the interface should feel and behave.

1. Always show loading or skeleton UI for async actions.
2. Use clear, actionable error messages and offer a retry path.
3. Ensure multi-step signup form does not drop fields between stages; submit the merged state object from the last step.
4. Require confirmation for destructive actions (delete, cancel order).
5. Mobile-first design: ensure all pages work at 320px width.
6. Keep interactions consistent across buyer/vendor/admin experiences.

---

## Responsive Breakpoints

| Breakpoint | Value  | Target       |
| ---------- | ------ | ------------ |
| sm         | 640px  | Mobile       |
| md         | 768px  | Tablet       |
| lg         | 1024px | Desktop      |
| xl         | 1280px | Wide screens |

---

## Accessibility Requirements

> **Section summary:** Minimum accessibility standards to follow.

- All interactive elements must have keyboard focus states.
- Colour contrast must meet WCAG AA (4.5:1 for text).
- Images must have meaningful alt text.
- Forms must have associated labels (Ant Design `label` prop or `label` element).
- Avoid relying solely on color to convey meaning.

---

## Reference Library

External design languages — competitor, inspiration, or reference sites — pulled into `design-references/<name>/DESIGN.md` (Tier 4, read when explicitly relevant). The `generate-design-md` command creates them.

These are **inputs to be reconciled**, never the project's source of truth. The token tables in this file remain the single source of truth per engineering principles §5. Promotion from a reference into the project's real tokens is a human decision, not an agent write.

See `design-references/README.md` for the folder contract.

---

## Design Asset Viewer (dev-only entry point)

A human-facing route to browse design assets — HTML mocks, images, PDFs — without those assets touching the app's real route table when deployed. This is a dev tool, not an agent workflow, and it is itself governed by the engineering principles like any other page.

**Hard rules (not conventions):**
- Mounted at a distinct, configurable base path (e.g. `/__design/*`) on its own router/middleware branch — never nested under app routes.
- **Gated:** only mountable when the env flag is set (e.g. `ENABLE_DESIGN_VIEWER=true`), defaulting off. **Never enabled in a production build regardless of the flag** — this is a hard rule, not a convention.
- Reads a config manifest (engineering principles §1) listing which local folders/paths it is allowed to serve — never an open filesystem browser.
- No hardcoded asset lists in code.

**Rendering by type:**
- HTML → sandboxed iframe
- Images → `<img>`
- PDF → render pages; where text/structure extraction is needed, use the classify-then-extract approach from the `pdf-html-asset-inspection` skill (detect text vs scanned, extract with position awareness, convert to Markdown) via a small internal utility or thin wrapper.

**Extraction backend decision:** chooses between the two registered extraction candidates (see `tools/registry.md` → PDF-extraction-tooling rows; approach documented in `tools/integrations/`) based on the project stack; the choice is documented in `memory/project-decisions.md`.

**Where it lives:** see also the `system-architecture.md` configuration points (the `ENABLE_DESIGN_VIEWER` flag) and the viewer's security isolation note for the deployment platform.
