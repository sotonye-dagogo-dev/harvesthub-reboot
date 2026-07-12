# System Architecture

> **Overview:** MyHarvestHub is a full-stack Next.js application that blends server components, API routes, and a mock data layer to simulate a backend. The architecture is designed for incremental migration to a real database while keeping the UI and business logic stable.

---

## High-Level Architecture

- **Frontend (Next.js App Router)**
  - Routes are grouped by user role: `(auth)`, `(buyer)`, `(vendor)`, `(admin)`.
  - Pages are server components by default, with client components only when interactivity or state is required.
  - Global layout and metadata are defined in `app/layout.tsx`.

- **Backend (Mock + API Routes)**
  - `lib/data/mockData.ts` provides seeded test data.
  - `lib/data/database.ts` implements in-memory CRUD operations and enforces referential integrity.
  - API routes under `app/api/*` expose the backend to the frontend and honor JWT auth.
  - Authentication is handled via JWTs stored in httpOnly cookies.

- **Data Layer / Future Migration**
  - Prisma schema lives in `prisma/schema.prisma` (currently used for type generation and planned DB migration).
  - Seed scripts in `prisma/seed.ts` bootstrap the database.

- **State & UX**
  - Auth and theme state are managed by `providers/` (e.g., `AuthProvider`, `ThemeProvider`).
  - Complex client state (cart, wallet) uses Zustand stores in `lib/store/`.

---

## Key Boundaries & Patterns

- **Server Actions** are used for mutations where possible (Next.js App Router patterns).
- **Zod schemas** validate incoming request bodies in `app/api/*` and server actions.
- **UI components** are located under `components/` with a split between `ui/` (generic) and `features/` (domain-specific).
- **Routing protection** is implemented via role-based checks in layouts and server-side guards.

---

## Deployment Considerations

- The current stack targets Vercel-style deployments but is compatible with any Node.js host.
- The mock backend can be replaced with a real Prisma + PostgreSQL backend by swapping the data layer implementation.
- Environment configuration is driven by `.env` files and `process.env` values (see `.env.example`).
