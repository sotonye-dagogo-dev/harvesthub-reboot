# Project Context

> **Overview:** MyHarvestHub is an e-commerce marketplace built for the Nigerian market, with a focus on Lagos-based vendors and church communities. It provides role-based experiences for buyers, vendors, and admins, enabling product browsing, order management, wallet payments, and promotional campaigns.

---

## Project Purpose

> **Section summary:** What this project does and why it exists.

MyHarvestHub exists to enable trusted commerce within faith-based communities by giving vendors a platform to sell products and buyers a seamless shopping experience. It emphasizes Nigerian payment flows, church pickup logistics, and vendor storefront management.

---

## Target Users

> **Section summary:** Who uses this system and what they need from it.

| User Type | Needs                                                         | Key Interactions                                                          |
| --------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Buyer     | Discover products, make purchases, track orders, use wallet   | Browse products, add to cart, checkout, track orders, manage wallet       |
| Vendor    | List products, manage inventory, fulfill orders, view sales   | Create/modify products, view orders, manage store settings, see analytics |
| Admin     | Manage vendors/users, moderate content, view platform metrics | Approve vendors, moderate banners, run reports, manage settings           |

---

## Business Constraints

> **Section summary:** Non-negotiable requirements that affect how we build.

- Must support Nigerian market conventions (NGN currency, +234 phone format, Lagos zones)
- Must be mobile-first; target users often on low-bandwidth/older devices
- Must maintain strict TypeScript typing and defensive null handling
- Must support incremental migration from mock backend to real database (Prisma/Postgres)

---

## Current Project Phase

> **Section summary:** Where the project stands right now in its development lifecycle.

Phase: Active Development (Foundation + Core Features)

Active sprint focus: Stabilize core auth flows, checkout/order pipeline, and role-based routing while keeping the mock backend reliable for iterative development.

---

## Tech Decisions Already Made

> **Section summary:** Decisions that are locked in and should not be revisited unless explicitly flagged.

| Decision                       | Reason                                                                    |
| ------------------------------ | ------------------------------------------------------------------------- |
| Next.js App Router (Next 15)   | Supports Server Components, routing conventions, and modern metadata APIs |
| TypeScript strict mode         | Prevents runtime bugs and makes refactors safer                           |
| Tailwind + Ant Design          | Combines rapid layout with polished UI components                         |
| Mock backend in `lib/data`     | Enables fast iteration before full database migration                     |
| JWT auth with httpOnly cookies | Secure session handling across server and client                          |

---

## Out of Scope

> **Section summary:** Things we are explicitly not building in this project.

- Full production payment integration (Paystack/Flutterwave) is deferred until core order flow is stable.
- PWA offline support is deferred to later phases.
- Mobile apps (React Native) are not in scope for the current repo.

---

## External Integrations

> **Section summary:** Third-party services and APIs this project connects to.

| Service                      | Purpose                                       | Auth Method    |
| ---------------------------- | --------------------------------------------- | -------------- |
| Resend                       | Transactional emails (welcome, order updates) | API key        |
| Cloudinary                   | Image storage & transformations               | API key/secret |
| Upstash Redis                | Caching / pubsub (optional)                   | REST token     |
| Prisma Accelerate / Postgres | Persistent data storage (future)              | DATABASE_URL   |
| Web Push                     | Push notifications                            | VAPID keys     |
