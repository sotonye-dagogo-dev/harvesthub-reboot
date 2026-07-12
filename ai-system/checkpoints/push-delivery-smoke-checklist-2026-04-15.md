# Push Delivery E2E Smoke Checklist (2026-04-15)

## Scope

Validate push notification delivery reliability for order lifecycle events after the reliability hardening pass.

## Preconditions

- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` are configured.
- [ ] Service worker is registered in browser (`navigator.serviceWorker.ready` resolves).
- [ ] Authenticated user has push enabled from notifications preferences.
- [ ] `/api/push/health` returns `exists=true` for active browser endpoint.

## Automated Baseline (Completed in this session)

- [x] Notification preferences + push health contract tests pass.
- [x] Notification context sync timing tests pass.
- [x] Notification dispatch path includes push failure diagnostics logs.

## Manual Browser Smoke Steps

### Device A (buyer session)

- [ ] Open `/notifications/settings` and click `Run Push Health Check`.
- [ ] Confirm health card shows:
  - [ ] Permission `granted`
  - [ ] Service worker ready `yes`
  - [ ] Browser subscription `yes`
  - [ ] Backend sync `yes`

### Device B (vendor/admin session)

- [ ] Trigger buyer-facing order lifecycle events that dispatch notifications:
  - [ ] `ORDER_CONFIRMED`
  - [ ] `ORDER_READY`
  - [ ] `DELIVERY_UPDATE` or `ORDER_DELIVERED`

### Delivery Verification

- [ ] Device A receives browser push for each lifecycle event while app tab is in background.
- [ ] Device A notification click opens the expected app route.
- [ ] Inbox unread count increments without manual full-page refresh.
- [ ] Header/sidebar unread badge reflects new count.

## Failure Triage

- [ ] Check server logs for `[Notifications] Push delivery failures detected` warnings.
- [ ] Re-run `/api/push/health` to confirm endpoint persistence drift.
- [ ] If subscription drift is detected, toggle push off/on and re-run health check.

## Exit Criteria

- [ ] All three lifecycle events deliver push successfully.
- [ ] Inbox unread count and nav badges remain consistent after each event.
- [ ] No unreconciled push health drift after final event.
