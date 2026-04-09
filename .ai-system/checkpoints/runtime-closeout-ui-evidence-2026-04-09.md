# Runtime Closeout UI Evidence Checklist (2026-04-09)

## Goal

Collect authenticated visual evidence for the last open closeout item:

- Sidebar consistency on analytics, wallet, profile, notifications
- Admin visibility of vendor and ad verification evidence
- Global runtime processing indicator during in-memory activity

## Preconditions

1. Run development server from workspace root:
   - npm run dev
2. Use seeded or test accounts with these roles:
   - ADMIN
   - VENDOR
3. Clear browser cache for previous session artifacts if UI appears stale.

## Screenshot Naming Convention

Use this format for all files:

- runtime-closeout-2026-04-09-[role]-[route-or-surface]-[state].png

Examples:

- runtime-closeout-2026-04-09-admin-analytics-sidebar-visible.png
- runtime-closeout-2026-04-09-admin-wallet-loading-state.png
- runtime-closeout-2026-04-09-admin-vendor-detail-doc-preview.png

## Evidence Matrix

### A) Sidebar Consistency Surfaces

1. Route: /analytics (ADMIN)

- Expected:
  - Dashboard shell visible
  - Admin sidebar visible and usable
- Capture:
  - sidebar visible state
- Status: [ ]
- Screenshot:

2. Route: /wallet (ADMIN)

- Expected:
  - Dashboard shell visible
  - No transient Wallet not found before initial load resolves
  - Loading state appears first when resource is bootstrapping
- Capture:
  - initial loading state
  - loaded state
- Status: [ ]
- Screenshot:

3. Route: /profile (ADMIN)

- Expected:
  - Dashboard shell visible
  - Profile page renders within shell
- Capture:
  - sidebar + profile header in same frame
- Status: [ ]
- Screenshot:

4. Route: /notifications (ADMIN)

- Expected:
  - Dashboard shell visible
  - Notification preferences content renders inside shell
- Capture:
  - sidebar + notifications header in same frame
- Status: [ ]
- Screenshot:

5. Desktop Sidebar Scrollability (ADMIN or VENDOR)

- Expected:
  - Desktop sidebar can scroll when nav list exceeds viewport height
- Capture:
  - top of sidebar
  - scrolled sidebar showing lower links
- Status: [ ]
- Screenshot:

### B) Verification Evidence Visibility

6. Route: /operations/vendors/[id] (ADMIN)

- Expected:
  - Verification Documents section displays available docs
  - Labels and View links are visible
- Capture:
  - docs list with labels and view links
- Status: [ ]
- Screenshot:

7. Route: /operations/ads (ADMIN)

- Expected:
  - Ad details modal shows inline creative preview image
  - Payment proof preview image renders when proof URL exists
- Capture:
  - modal with creative preview
  - modal with proof preview
- Status: [ ]
- Screenshot:

### C) Global Runtime Processing Indicator

8. Trigger runtime activity (ADMIN)

- Suggested actions:
  - Open /operations/orders and click Refresh
  - Open /operations/products and click Refresh
- Expected:
  - Global processing toast appears with animated ellipsis
  - Message includes task count when multiple resources are in-flight
- Capture:
  - processing toast visible while request is in-flight
- Status: [ ]
- Screenshot:

## Notes

- Automated checks already passed before this manual pass:
  - lint
  - typecheck
  - route and sidebar audits
  - focused runtime/sidebar/orders tests
- This file is the source of truth for closing the final queue evidence item.
