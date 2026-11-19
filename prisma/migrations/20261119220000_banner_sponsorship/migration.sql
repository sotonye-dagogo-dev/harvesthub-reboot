-- Top-strip advertising rules: sponsored flag, image vs branded design, premium top placement.
-- Additive only (equivalent to `npx prisma db push` for this schema change).
CREATE TYPE "BannerDisplayStyle" AS ENUM ('IMAGE', 'DESIGNED');

ALTER TABLE "banners"
  ADD COLUMN IF NOT EXISTS "isSponsored" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "displayStyle" "BannerDisplayStyle" NOT NULL DEFAULT 'IMAGE',
  ADD COLUMN IF NOT EXISTS "premiumTopPlacement" BOOLEAN NOT NULL DEFAULT false;
