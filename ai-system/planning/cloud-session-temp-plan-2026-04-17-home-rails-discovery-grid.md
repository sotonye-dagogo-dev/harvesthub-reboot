# Cloud Session Temp Plan — Home Rails + Discovery Grid/Pagination + Mobile Footer Grid

Date: 2026-04-17  
Scope: UI layout parity only (no API/data-contract changes)

---

## Scope Lock

Implement only:

1. Home page product/vendor card sections as horizontal rails.
2. Dedicated discovery pages (`/products`, category query exploration, `/vendors`) as gridded displays with pagination.
3. Footer quick links mobile-first gridded presentation.
4. Validation and `ai-system` documentation sync for this slice.

Do not:

- change API response contracts,
- refactor unrelated components,
- alter business logic for search/filter semantics beyond pagination reset safety.

---

## Execution Slices

- [ ] Slice 1: Home card rails
  - Files: `app/components/HomeContent.tsx`
  - Convert all home product-card sections and the popular-vendor section from grid layouts to horizontal scroll rails with fixed card widths.

- [ ] Slice 2: Dedicated discovery grid + pagination parity
  - Files: `components/features/ProductsContent.tsx`, `app/vendors/VendorsContent.tsx`
  - Keep product discovery page on grid+pagination behavior.
  - Add vendor discovery pagination while preserving grid and active filters.
  - Reset vendor pagination index when filter/search changes.

- [ ] Slice 3: Footer mobile quick-link grid
  - Files: `components/layout/Footer.tsx`
  - Render footer quick links in a mobile-appropriate grid while keeping larger-breakpoint readability.

- [ ] Slice 4: Validation + docs closure
  - Run `npm run lint`, `npm run build`, and focused/touched tests as practical.
  - Update:
    - `ai-system/planning/task-queue.md`
    - `ai-system/checkpoints/session-log.md`
    - `ai-system/summaries/dev-history.md`
    - `ai-system/memory/project-decisions.md` (if a reusable policy/contract decision is introduced)

---

## Validation Gates

Required:

1. Lint passes.
2. Build passes (known pre-existing sitemap warnings allowed if unchanged).
3. Focused/touched tests run with outcomes recorded; pre-existing unrelated failures must be explicitly noted.

---

## One-Pass Kickoff Prompt (Copy/Paste)

Read in this exact order:
1. `ai-system/protocols/entry-protocol.md`
2. `ai-system/planning/task-queue.md`
3. `ai-system/planning/project-plan.md`
4. `ai-system/system-architecture.md`
5. `ai-system/design-system.md`
6. `ai-system/repair-system.md`
7. `ai-system/project-context.md`
8. `ai-system/memory/project-decisions.md`
9. `ai-system/planning/cloud-session-temp-plan-2026-04-17-home-rails-discovery-grid.md`

TASK: Execute this temp plan in one pass.

Rules:
- Scope lock: implement only the slices listed in this temp plan.
- Non-breaking lock: preserve public contracts and existing API payload shapes.
- Config-driven lock: avoid hardcoded behavior where config contracts already exist.
- Modularity lock: keep changes localized to home/vendors/footer listing containers.
- UX lock: verify mobile + desktop behavior for rails, grids, and pagination.
- Do not stop at analysis; implement, validate, and document in one run.

Completion output must include:
1. Completed checklist by slice
2. Files changed by slice
3. Validation summary
4. Blockers (if any) with file context
5. Documentation sync summary for required `ai-system` files
