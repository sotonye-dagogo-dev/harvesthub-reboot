# app/(operations)/operations/dashboard/page.tsx

## Purpose

Role-scoped operational dashboard for admin/vendor users.

## Responsibilities

- Load live KPI values and render quick-action cards.
- Handle loading/error/empty states safely.
- Route actions to canonical operations surfaces.

## Inputs

- Domain endpoints for products/orders/users/ads/notifications based on role.
- Navigation config and policy constraints.

## Outputs

- KPI cards with role-safe counts and actionable links.

## Risks

- Count mismatches can occur when API payload shapes drift.
- Placeholder-only cards are considered regression for operations readiness.
