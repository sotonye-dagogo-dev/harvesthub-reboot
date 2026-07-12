# Commerce Hardening Evidence — 2026-04-14 (Pass 3)

## Scope Covered

- Track C closure evidence: operations settings persistence audit map + read-only runtime-default controls alignment.
- Track D closure evidence: deterministic wallet reconciliation after deposit/withdraw and order/refund lifecycle actions.
- Validation closure evidence: payment smoke paths (`wallet-insufficient`, `paystack-not-found`, `verified-success`) and touched-scope regression pack.

## Implemented Contracts

- Wallet deterministic sync:
  - Added `lib/utils/walletSync.ts` custom-event contract.
  - `app/wallet/page.tsx` now forces `refresh(true)` on mount and subscribes to wallet sync events.
  - `app/orders/[id]/page.tsx` now emits wallet sync events on lifecycle actions that can impact wallet balances.
- Settings control audit alignment:
  - `app/(operations)/operations/settings/page.tsx` keeps editable controls only for persisted contracts.
  - Runtime-default controls (`minOrderAmount`, `maxBookingDays`) are now explicitly read-only.
- Payment smoke coverage:
  - Added `app/api/orders/__tests__/route.payment-smoke.test.ts` for the three required paths.

## Validation Commands

1. Focused regression + smoke suites:

```bash
npx vitest run "app/api/orders/__tests__/route.payment-smoke.test.ts" "app/wallet/__tests__/page.role-parity.test.tsx" "app/api/orders/__tests__/group-bulk.route.test.ts" "app/api/orders/__tests__/route.grouping.test.ts" "app/api/admin/commission/__tests__/route.test.ts" "app/api/vendors/me/store-settings/__tests__/route.test.ts" "app/api/notifications/preferences/__tests__/route.test.ts" "app/(operations)/operations/orders/__tests__/page.table-flow.test.tsx" "app/checkout/__tests__/page.error-mapping.test.ts" "app/orders/[id]/__tests__/page.actions.test.tsx"
```

Result:

- Test files: 10 passed
- Tests: 23 passed
- Notes: non-blocking jsdom warning for mocked `fullWidth` prop in wallet test harness

2. Typecheck:

```bash
npx tsc --noEmit
```

Result:

- Passed (no output)

3. Focused lint:

```bash
npx eslint "app/wallet/page.tsx" "app/orders/[id]/page.tsx" "app/(operations)/operations/settings/page.tsx" "app/wallet/__tests__/page.role-parity.test.tsx" "app/api/orders/__tests__/route.payment-smoke.test.ts" "lib/utils/walletSync.ts"
```

Result:

- Passed (no output)

## Evidence Mapping to Queue Items

- End-to-end payment smoke tests:
  - `paystack-not-found`: `route.payment-smoke.test.ts` case 1
  - `wallet-insufficient`: `route.payment-smoke.test.ts` case 2
  - `verified-payment-success`: `route.payment-smoke.test.ts` case 3
- Settings persistence + audit evidence:
  - persisted editable controls covered by commission/vendor/preferences/order grouped tests
  - runtime-default settings no longer editable without persistence
- Wallet balance correctness and reconciliation:
  - role/balance parity tests + wallet sync event regression test
