# app/(operations)/operations/products/page.tsx

## Purpose

Vendor/admin product-management workspace under canonical operations namespace.

## Responsibilities

- Render role-aware products table/grid and editing surfaces.
- Support create/edit/delete product mutations through API calls.
- Keep vendor scope ownership checks aligned with backend policies.
- Use upload-first image handling (managed upload flow) instead of manual image URL inputs.

## Inputs

- Auth/role context from current user session.
- Product APIs under `app/api/products/*` and related operations helpers.

## Outputs

- CRUD UI state updates, success/error notifications, and refreshed product lists.

## Risks

- Any reintroduction of free-form image URL fields violates governed upload policy.
- Sidebar/navigation links must continue pointing to `/operations/products`.
