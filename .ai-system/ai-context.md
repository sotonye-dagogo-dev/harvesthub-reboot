# AI Context

> **Overview:** MyHarvestHub is a Next.js 15 + TypeScript marketplace platform focused on Nigerian buyers and vendors (especially church communities). This repo is a refactor of the Martgram codebase and includes a mock backend, Prisma schema scaffolding, and a UI built with Ant Design + Tailwind.

## Key Modules & Concepts

- **App Router (Next.js 15)** with route groups: `(auth)`, `(buyer)`, `(vendor)`, and `(admin)`.
- **Mock backend** in `lib/data` + API routes under `app/api/*`.
- **Global types** in `lib/types.ts` and validation schemas in `lib/schemas/` (Zod).
- **Design system**: Ant Design + Tailwind + purple-first theme.
- **State management**: React Context for auth/theme, Zustand for complex client state (cart, wallet).
- **Future migration**: Prisma ORM schema in `prisma/schema.prisma` and seed scripts under `prisma/`.

## How To Use This Context

This document is the first stop for any AI agent working in this repository. Use it to understand the main stack, where to find key boundaries, and what assumptions are already baked into the code.
