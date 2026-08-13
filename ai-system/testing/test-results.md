# Test Results

> **Overview:** Latest test run results. Updated by agents after running the self-heal loop or test suite. Gives a quick snapshot of current project health.

---

## Last Run

**Date:** 2026-08-13
**Run by:** opencode-agent

**Results:**
| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| Build | ✅ (next build, exit 0) | 0 | 0 |
| Typecheck | ✅ (npx tsc --noEmit) | 0 | 0 |
| Lint | ✅ (next lint on touched files) | 0 | 0 |
| Vitest (full) | 430 | 67 | 12 |
| VerificationDocs.test.tsx | 8 | 0 | 0 |
| uploadHelpers.test.ts | 3 | 0 | 0 |
| cloudinary.test.ts | 3 | 0 | 0 |
| swNoResponseGuard.test.tsx | 4 | 0 | 0 |

**Overall Status:** Build + typecheck + lint passing; new-feature tests pass.

## Active Failures

Full-suite vitest failures are pre-existing/environmental and unrelated to the 2026-08-13 changes
(all 67 fail identically on the clean base commit `b597cd1`):

| Test file | Error | Status | Assigned To |
| --------- | ----- | ------ | ----------- |
| lib/__tests__/api/auth.api.test.ts | fetch failed / ECONNREFUSED ::1:3000 (needs live dev server) | Pre-existing | — |
| lib/__tests__/api/products.api.test.ts | fetch failed / ECONNREFUSED ::1:3000 (needs live dev server) | Pre-existing | — |
| lib/__tests__/api/cart-order-flow.api.test.ts | fetch failed / ECONNREFUSED ::1:3000 | Pre-existing | — |
| lib/__tests__/jwt.utils.test.ts | TypeError: payload must be an instance of Uint8Array | Pre-existing | — |
| lib/__tests__/auth.schemas.test.ts, misc.schemas.test.ts, product.schemas.test.ts, order.schemas.test.ts | AssertionError | Pre-existing | — |
| lib/__tests__/navigation.test.ts | AssertionError | Pre-existing | — |
| app/signup/__tests__/layout.test.tsx, app/(auth)/__tests__/layout.test.tsx | signup-footer/auth-footer not found (test asserts footer; layout intentionally omits it) | Pre-existing | — |
| components/ui/__tests__/PhoneInput.test.tsx | duplicate "Country code" | Pre-existing | — |
| components/__tests__/FilterSidebar.test.tsx, Header.notifications-badge.test.tsx, OrderCard.test.tsx, app/orders/__tests__/orders-page.admin.test.tsx, app/products/[id]/__tests__/page.fallbacks.test.tsx | pre-existing UI/assertion failures | Pre-existing | — |

## History

| Date       | Passed | Failed | Notes                                          |
| ---------- | ------ | ------ | ---------------------------------------------- |
| 2026-08-13 | 430    | 67     | Upload retention + replace + verification-docs status overlay; fixed pre-existing test-file type errors (tsc clean) |
| 2026-08-13 | 420    | 67     | Signup button/toast feedback + verification-docs upload overlay + no-response guard |
| 2026-03-25 | n/a    | n/a    | Added Prisma reconnect wrapper for banners API |

---

## Active Failures

| Test        | Error           | Status                             | Assigned To |
| ----------- | --------------- | ---------------------------------- | ----------- |
| [test name] | [error message] | [Investigating / Fixed / Wont Fix] | [agent/dev] |

---

## History

| Date   | Passed | Failed | Notes   |
| ------ | ------ | ------ | ------- |
| [date] | [n]    | [n]    | [notes] |
