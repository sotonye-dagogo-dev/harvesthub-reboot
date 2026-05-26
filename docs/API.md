# HarvestHub API — Reference

Version: 1.0

This document is a concise, developer-focused reference for HarvestHub's server API. It groups endpoints by feature, describes authentication, common request/response formats, error handling, pagination and filtering conventions, and provides examples you can copy-and-run.

**Scope:** This covers the Next.js App Router API routes under `app/api/*` in this repository (auth, products, vendors, orders, cart, payments, wallet, vouchers, notifications, admin, uploads, webhooks, telemetry, etc.). Use this file as the canonical developer doc for backend integration and tests.

---

**Base URL**: Use the same origin as the frontend. In local development: `http://localhost:3000/api` (or the running dev host). All route examples below assume the `/api` base.

**Versioning**: Routes are not versioned in-path. When introducing breaking changes, publish a new minor release and add a versioned prefix (e.g., `/api/v2/...`).

**Authentication**

- **Primary**: session / JWT-based authentication used by routes under `/auth` and protected resources. Typical endpoints: `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/refresh`, `/auth/me`.
- **Header**: `Authorization: Bearer <token>` for token-based flows. Many frontend flows use HTTP-only cookies; both are supported where applicable.
- **Protected routes**: Most write actions and user-specific reads (orders, wallet, cart, notifications, vendor settings) require an authenticated user.

Authentication example (Bearer):

curl -X GET "http://localhost:3000/api/auth/me" -H "Authorization: Bearer $TOKEN"

---

Common request/response rules

- Content-Type: `application/json` unless multipart/form-data for `upload` endpoints.
- Standard API response envelope (used across the codebase):

{
"success": boolean,
"data": object | array | null,
"error": {
"code": string,
"message": string,
"details"?: object
} | null
}

- Use proper HTTP status codes: 200/201 for success, 204 for no-content, 400 for bad input, 401/403 for auth/authorization, 404 for not found, 409 for conflicts, 422 for validation errors, 500 for server errors.

Error example:

HTTP 400
{
"success": false,
"error": { "code": "ValidationError", "message": "Missing field: email" }
}

---

Pagination, filtering, sorting

- Common query parameters for list endpoints:
  - `page` (number, default 1)
  - `limit` (number, default 20)
  - `q` (free-text query)
  - `sort` (field or -field for descending)
  - filter-specific params (e.g., `category`, `vendorId`, `minPrice`, `maxPrice`)
- Response for paginated endpoints usually includes meta:

{
"data": [...],
"meta": { "page": 1, "limit": 20, "total": 345 }
}

---

Authentication & user management endpoints (common)

- `POST /api/auth/register`
  - body: `{ email, password, name? }`
  - response: 201 created, `data.user` and possibly `data.token`

- `POST /api/auth/login`
  - body: `{ email, password }`
  - response: 200, `data.token` and `data.user`

- `POST /api/auth/refresh`
  - body or cookie-based refresh; returns new access token

- `POST /api/auth/logout`
  - invalidates session or revokes refresh token

- `GET /api/auth/me`
  - returns the authenticated user object

- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
  - password reset flows; follow tokens and secure links sent by email

---

Product catalog

- `GET /api/products` — list products (supports `page`, `limit`, `q`, `category`, `vendorId`, `sort`)
- `GET /api/products/trending`, `/api/products/featured`, `/api/products/new-arrivals`, `/api/products/deals` — curated lists
- `GET /api/products/search` — advanced search endpoint (faceted)
- `GET /api/products/:id` — single product details (in codebase path uses `[id]/route.ts`)
- `GET /api/products/:id/related` — related products
- `GET /api/products/:id/reviews` — reviews for a product

Product model (representative)

- `id`: string
- `name`: string
- `slug`: string
- `description`: string
- `price`: number (minor currency unit or float depending on integration)
- `currency`: string
- `images`: string[] (URLs)
- `vendorId`: string
- `stock`: number
- `createdAt`, `updatedAt`

Example: Get product

curl "http://localhost:3000/api/products/123"

---

Cart & checkout

- `GET /api/cart` — get current cart (authenticated or session-based)
- `POST /api/cart/items` — add item: `{ productId, quantity, options? }`
- `PUT /api/cart/items/:id` — update item quantity
- `DELETE /api/cart/items/:id` — remove item
- `POST /api/cart/clear` — clear cart (route exists at `app/api/cart/clear/route.ts`)

Orders

- `POST /api/orders` — create an order (checkout)
- `GET /api/orders` — list user orders
- `GET /api/orders/:id` — order details
- `POST /api/orders/:id/status` — update status (operations/admin flows)

Payments

- `POST /api/payments/initialize` — begin payment (gateway-specific payload)
- `POST /api/payments/verify` — verify a payment (gateway webhook or verify route)
- `POST /api/payments/webhook` — receive gateway webhooks (`/api/payments/webhook/route.ts` exists)
- `GET /api/payments/config` — client-side config for payment providers

Wallet

- `GET /api/wallet/balance` — user's balance
- `POST /api/wallet/deposit-request` — create deposit request
- `POST /api/wallet/deposit` — provider deposit webhook/confirmation
- `POST /api/wallet/withdraw` — withdraw request flow (`/api/wallet/withdraw/route.ts`)

Vouchers

- `POST /api/vouchers/validate` — validate code
- `POST /api/vouchers/redeem` — apply voucher to an order
- `GET /api/vouchers/my` — user's vouchers

Notifications & Push

- `GET /api/notifications` — list notifications
- `POST /api/notifications/read-all` — mark all read
- `POST /api/push/subscribe` & `POST /api/push/unsubscribe` — push subscription management

Reviews & Ratings

- `GET /api/reviews` — list
- `POST /api/reviews` — create
- `GET /api/reviews/:id` — single

Vendors & Admin

- Vendor storefronts and content: `/api/vendors`, `/api/vendors/:id`, `/api/vendors/:id/products`, `/api/vendors/:id/content`
- Vendor analytics: `/api/vendors/:id/analytics`
- Admin routes under `/api/admin/*` for voucher, commerce config, vendor content moderation, and milestones. Administrative endpoints require elevated roles.

Ads & Promotions

- `GET /api/ads/active`, `GET /api/ads/:id`, `POST /api/ads/apply`, `GET /api/ads/my-ads`, `POST /api/ads/:id/renew`

Uploads

- `POST /api/upload` — file uploads (multipart/form-data). Returns a hosted URL and metadata.

Webhooks

- `POST /api/paystack-webhook` — Paystack webhook receiver
- `POST /api/payments/webhook` — generic payment gateway webhook

Telemetry & Bug reports

- `POST /api/telemetry/off-platform-contact` — telemetry contact events
- `POST /api/bug-reports` — user-submitted bug reports

Rate limiting & security

- Sensitive endpoints should be rate limited (per IP and per user) and monitored for abuse. Webhook endpoints validate provider signatures.

Testing & local development

- Many routes include tests under `app/api/*/__tests__` — run the project's test runner (Vitest) to exercise API handlers.
- When running locally with Next.js dev server (`next dev`), use `curl` or Postman against `http://localhost:3000/api/...`.

Examples

- Create product (admin):

curl -X POST "http://localhost:3000/api/products" \
 -H "Authorization: Bearer $ADMIN_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"name":"Fresh Mango","price":1999,"currency":"NGN","vendorId":"v_123","stock":100}'

- Add to cart:

curl -X POST "http://localhost:3000/api/cart/items" \
 -H "Content-Type: application/json" \
 -d '{"productId":"123","quantity":2}'

---

Integration notes & best practices

- Use `id` path segments as opaque identifiers (do not infer structure). When calling endpoints that accept arrays of IDs, prefer a JSON body.
- For idempotent webhook handling, verify provider signature and store processed event IDs to avoid double-processing.
- Validate and sanitize all user-provided data. Convert money amounts to integer minor-units (kobo/cents) if integrating with payment providers.
- When returning lists of resources, avoid embedding large nested relations unnecessarily — provide links or separate endpoints for heavy relations (e.g., `vendor` or `product.images`).

Appendix: Useful routes (scoped list)

- Auth: `/api/auth/*`
- Products: `/api/products/*`
- Cart: `/api/cart/*`
- Orders: `/api/orders/*`
- Payments: `/api/payments/*`, `/api/paystack-webhook`
- Wallet: `/api/wallet/*`
- Vouchers: `/api/vouchers/*`
- Vendors: `/api/vendors/*`
- Notifications: `/api/notifications/*`
- Upload: `/api/upload`
- Admin: `/api/admin/*`

---

If you want, I can:

- generate a machine-readable OpenAPI spec (YAML/JSON) based on these routes
- extract route-specific request/response shapes by scanning `app/api` handler files
- add example Postman/HTTPie collection for quick manual testing

File: [docs/API.md](docs/API.md)
