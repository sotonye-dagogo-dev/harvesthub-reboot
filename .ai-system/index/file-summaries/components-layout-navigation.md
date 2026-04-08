# components/layout/Header.tsx and components/layout/Sidebar.tsx

## Purpose

Primary route discoverability surfaces for public and operations experiences.

## Responsibilities

- Show role-aware navigation links and active-state styling.
- Route orders links by role (`/orders` vs `/operations/orders`).
- Keep operations sidebar links aligned with canonical `/operations/*` routes.

## Inputs

- Auth role context and route policy/navigation helpers.

## Outputs

- Visible, role-safe entry points for domain pages.

## Risks

- Incorrect link targets can break scope separation and create dead links.
- Any sidebar link-shape refactor must keep route-audit parser compatibility in `scripts/auditSidebarRoutes.ts`.
