# Cloud Session Temporary Execution Plan (2026-04-17)

> Purpose: Execute one uninterrupted cloud session for homepage layout parity, campus-aware search expansion, voucher/coupon restoration, trending/deals foundation, product detail enrichment, and reusable data-table overflow standardization.

---

## Operation Snapshot

This handoff packages planning completed locally:

- Feature spec in `ai-system/planning/project-plan.md`:
  - `Feature Spec - Home/Discovery/Voucher Restoration + Deals Foundation + Product Detail Expansion + Table Standardization (Planned 2026-04-17)`
- Queue block in `ai-system/planning/task-queue.md`:
  - `Cloud Session Execution Queue (2026-04-17) — Home Layout + Campus Search + Voucher Restoration + Trending/Deals + Product Detail + DataTable Standardization`

Execution target for cloud session: implement all slices in one pass, validate each slice, and fully sync `ai-system` artifacts.

---

## Read Order (Mandatory)

1. `ai-system/protocols/entry-protocol.md`
2. `ai-system/planning/task-queue.md`
3. `ai-system/planning/project-plan.md`
4. `ai-system/system-architecture.md`
5. `ai-system/design-system.md`
6. `ai-system/repair-system.md`
7. `ai-system/project-context.md`
8. `ai-system/memory/project-decisions.md`
9. This file

---

## Locked Constraints

- Scope lock: implement only the 2026-04-17 queue block listed in this plan.
- Non-breaking lock: preserve existing API contracts and route behavior unless compatibility guards are explicitly included.
- ACID lock: voucher validation/redeem/application logic must remain transaction-safe and race-safe.
- Config-driven lock: trending/deals scoring and timing behavior must be configuration-backed rather than hardcoded constants.
- Modularity lock: consolidate shared logic (voucher service/search filters/table behavior) instead of duplicating across pages/routes.
- UX lock: desktop/mobile responsiveness must be verified for sidebar rail, product grids, checkout voucher UX, and data tables.
- Documentation lock: queue + checkpoint + dev history updates are mandatory before completion.

---

## Feature Objective

Stabilize high-visibility commerce flows by aligning home/ad/product layout behavior with expected responsive contracts, expanding search to campus-aware discovery, restoring voucher/coupon lifecycle completeness (checkout apply + user visibility + admin CRUD), confirming a safe configurable trending algorithm with deals-ready foundations, enriching product detail trust context, and eliminating table overflow via reusable data-table standardization.

---

## Execution Slices (Run In Order, No Planning Stop)

### Slice 0 - Bootstrap + Baseline

Deliverables:

- Verify all required `ai-system` files and this plan are readable.
- Audit current diff and keep strict scope lock.
- Run baseline checks for touched areas.

Validation:

- `npx tsc --noEmit`

Docs:

- Add kickoff/baseline note to `ai-system/checkpoints/session-log.md`.

### Slice 1 - Home Sidebar Bound + Product Card Grid Parity

Deliverables:

- Ensure desktop sidebar rail is not visually longer/taller than hero region in the split layout.
- Reduce sidebar ad tile footprint where needed while preserving responsive usability.
- Fix affected product list/card wrappers so cards render as expected multi-column grids (no single-card full-width regression).

Validation:

- Focused home/products layout tests and/or touched UI suites.

Docs:

- Update queue + checkpoint with layout contract completion notes.

### Slice 2 - Campus-Aware Search Expansion

Deliverables:

- Extend products/discovery search contract to include campus index/filter matching.
- Update UI/query-state plumbing to support campus-aware filtering/search persistence.
- Keep search suggestions and canonical discovery routes backward-compatible.

Validation:

- Focused API and discovery-state tests for campus filtering/search.

Docs:

- Update queue + checkpoint + architecture flow notes for campus search.

### Slice 3 - Voucher/Coupon End-to-End Restoration

Deliverables:

- Reuse existing voucher artifacts where present before adding new components/routes.
- Restore checkout voucher/coupon input and apply/remove UX with recalculated totals.
- Restore authenticated voucher visibility page (available/used/history context).
- Restore admin voucher CRUD management page using reusable patterns.
- Enforce transactional redemption safety (limit checks + usage increment + redemption record linkage atomically).

Validation:

- Focused tests for voucher validate/redeem/apply behavior, per-user/global limits, and admin CRUD.

Docs:

- Update queue + checkpoint + architecture/repair/decision docs for voucher lifecycle updates.

### Slice 4 - Trending Algorithm Confirmation + Deals Foundation

Deliverables:

- Confirm and codify trending score contract inputs.
- Move scoring/window behavior into configuration-backed contract.
- Add home deals foundation sourced from trending products with active discount/promotion windows.

Validation:

- Focused tests for trending ordering and deals eligibility time windows.

Docs:

- Update queue + checkpoint + architecture notes for trending/deals flow.

### Slice 5 - Product Detail Enrichment

Deliverables:

- Add summarized vendor stats/information section(s) on product detail.
- Add delivery policy/trust context section(s) with safe fallbacks.
- Improve related/similar products section relevance and structure.

Validation:

- Focused product detail rendering/data fallback tests.

Docs:

- Update queue + checkpoint with product detail contract changes.

### Slice 6 - Operations Table Standardization + Overflow Fixes

Deliverables:

- Inventory operations pages using non-reusable table implementations (including banners/users and similar pages).
- Migrate to main reusable data-table component/wrapper with overflow-safe defaults.
- Preserve page-specific sorting/filtering/actions while removing viewport overflow regressions.

Validation:

- Focused operations table interaction + overflow containment tests.

Docs:

- Update queue + checkpoint + architecture notes for table standardization pattern.

### Slice Final - Quality Gate + Documentation Closure

Deliverables:

- Complete all queue items or mark blockers with exact evidence.

Validation (required):

- `npm run lint`
- `npx tsc --noEmit`
- `npm test -- [touched suites]`

Docs (required):

- `ai-system/planning/task-queue.md`
- `ai-system/checkpoints/session-log.md`
- `ai-system/summaries/dev-history.md`
- `ai-system/system-architecture.md` (if changed)
- `ai-system/memory/project-decisions.md` (if changed)
- `ai-system/repair-system.md` (if changed)

---

## Definition of Done

- [ ] 2026-04-17 queue block complete (or explicitly blocked with file-level evidence).
- [ ] Sidebar/hero and product-card layout behavior match expected responsive contracts.
- [ ] Campus-aware search works end-to-end in API + discovery UI.
- [ ] Voucher/coupon flow is operational across checkout, user history, and admin CRUD with transactional safety.
- [ ] Trending algorithm contract is confirmed and deals foundation is in place.
- [ ] Product detail page includes enriched vendor/policy/related-product sections.
- [ ] Operations tables use reusable overflow-safe table contract without regressions.
- [ ] Validation gates pass and `ai-system` documentation is synchronized.

---

## Cloud Kickoff Prompt (Copy/Paste)

```text
Execute command: cloud-session-single-pass.md
TempPlan: ai-system/planning/cloud-session-temp-plan-2026-04-17-home-search-vouchers-deals-product-table.md
Directive: Keep strict scope to home/sidebar/card layout parity, campus search indexing, voucher/coupon restoration (ACID-safe), trending+deals foundation, product detail enrichment, and reusable table overflow fixes.
```

## Command Invocation (Requested Format)

```text
Execute command: cloud-session-single-pass.md
TempPath: /home/runner/work/harvesthub-reboot/harvesthub-reboot/ai-system/planning/cloud-session-temp-plan-2026-04-17-home-search-vouchers-deals-product-table.md
```
