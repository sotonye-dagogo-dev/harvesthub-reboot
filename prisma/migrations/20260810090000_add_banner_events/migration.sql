-- CreateEnum
CREATE TYPE "BannerEventType" AS ENUM ('IMPRESSION', 'CLICK', 'CONVERSION');

-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "conversionCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "banner_events" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "type" "BannerEventType" NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "source" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banner_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banner_events_bannerId_type_occurredAt_idx" ON "banner_events"("bannerId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "banner_events_bannerId_type_visitorId_idx" ON "banner_events"("bannerId", "type", "visitorId");

-- CreateIndex
CREATE INDEX "banner_events_bannerId_type_userId_idx" ON "banner_events"("bannerId", "type", "userId");

-- CreateIndex
CREATE INDEX "banner_events_occurredAt_idx" ON "banner_events"("occurredAt");

-- AddForeignKey
ALTER TABLE "banner_events" ADD CONSTRAINT "banner_events_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "banners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
