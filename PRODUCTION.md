# Production Deployment Checklist

This document lists minimal steps and environment variables required to deploy MyHarvestHub in production.

1. Provision infrastructure
   - Postgres database (ensure connection string in `DATABASE_URL`)
   - Redis instance (optional, for caching) — set `REDIS_URL`
   - Cloudinary account for image storage — set `CLOUDINARY_*` vars

2. Environment variables (see `.env.example`)
   - `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `REDIS_URL`
   - `NEXT_PUBLIC_BASE_URL` — public host
   - `USE_PRISMA=true` to enable Prisma adapters

3. Secrets & security
   - Store secrets in your hosting provider's secret store (do NOT commit `.env`)
   - Use secure cookies for auth tokens in production

4. Build & runtime
   - Install dependencies: `npm ci`
   - Generate Prisma client (if using Prisma): `npx prisma generate`
   - Run build: `npm run build`
   - Start: `npm run start` (or use your platform's process manager)

5. Optional: Cloudinary setup
   - Create folders for `product`, `banner`, `vendor` to organize uploads
   - Configure upload presets if needed

6. Migrations & data
   - Apply Prisma migrations: `npx prisma migrate deploy`
   - Seed initial data if required: `node prisma/seed.js` or `ts-node prisma/seed.ts`

7. Monitoring & logging
   - Configure application logs, error reporting, and health checks

8. Post-deploy checks
   - Verify uploads (upload an image and confirm Cloudinary URL returned)
   - Run basic smoke tests for auth, product creation, and file uploads
