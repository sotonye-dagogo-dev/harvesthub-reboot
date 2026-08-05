# lib/rbac/routeConfig.ts

## Purpose

Route-policy source of truth for role/public access across app pages.

## Responsibilities

- Define allowed roles per route and scope behavior.
- Support canonical path enforcement for operations routes.
- Guard parity between navigation discoverability and access rules.
- Declare public advertising routes (`/advertise`, `/advertise/apply`, `/ad-application`).

## Inputs

- Route path definitions and role constants.

## Outputs

- Policy objects consumed by middleware and route-visibility tests.

## Risks

- Navigation/policy drift can produce dead links or unauthorized route exposure.
- Orders split contract (`/orders` buyer, `/operations/orders` admin/vendor) must remain explicit.
