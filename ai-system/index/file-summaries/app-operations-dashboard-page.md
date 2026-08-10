# app/(operations)/operations/dashboard/page.tsx

## Purpose

Role-scoped operational dashboard for admin/vendor users.

## Responsibilities

- Load live KPI values and render quick-action cards.
- Handle loading/error/empty states safely.
- Route actions to canonical operations surfaces.
- Admin-only: render banner performance metric cards (impressions/clicks over the last 30 days) and an "Ad & Banner Analytics" quick action pointing at the banner analytics surface.

## Inputs

- Domain endpoints for products/orders/users/ads/notifications based on role.
- `app/api/operations/dashboard/route.ts` aggregates banner impression/click totals for admins via `Banner` counters.
- Navigation config and policy constraints.

## Outputs

- KPI cards with role-safe counts and actionable links.

## Risks

- Count mismatches can occur when API payload shapes drift.
- Placeholder-only cards are considered regression for operations readiness.
