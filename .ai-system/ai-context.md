# AI Context

> **Overview:** MyHarvestHub is a Next.js 15 + TypeScript marketplace platform focused on Nigerian buyers and vendors (especially church communities). The current architecture uses consolidated operations routes (`/operations/*`), a Prisma-first backend data facade, and a UI stack built with Ant Design + Tailwind.

## Key Modules & Concepts

- **App Router (Next.js 15)** with route groups and canonical management namespace: `(auth)` and `(operations)/operations/*` plus shared top-level feature routes.
- **Prisma-first data access** through `lib/data/database.ts` facade + `lib/data/prismaAdapter.ts`, exposed via API routes under `app/api/*`.
- **Global types** in `lib/types.ts` and validation schemas in `lib/schemas/` (Zod).
- **Design system**: Ant Design + Tailwind + purple-first theme.
- **State management**: React Context for auth/theme, Zustand for complex client state (cart, wallet).
- **Data model source**: Prisma schema/migrations in `prisma/`.

## How To Use This Context

This document is the first stop for any AI agent working in this repository. Use it to understand the main stack, where to find key boundaries, and what assumptions are already baked into the code.
