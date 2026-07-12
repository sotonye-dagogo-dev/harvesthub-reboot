# app/api/users/me/change-email/route.ts

## Purpose

Secure email-change request/status flow for authenticated users.

## Responsibilities

- Validate requested new email and conflict/rate-limit conditions.
- Issue and store pending email-change verification token state.
- Expose status endpoint for profile UI lifecycle feedback.

## Inputs

- Authenticated user identity.
- New email payload from profile security settings.

## Outputs

- Pending verification state and user-facing status responses for request/retry checks.

## Risks

- Prematurely mutating verified-email state can lock users out before verification completion.
- Token lifecycle must remain aligned with `/verify-email` handling and session-clear semantics.
