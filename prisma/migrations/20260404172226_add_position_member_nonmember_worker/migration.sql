-- CreateEnum
CREATE TYPE "AdApplicationStatus" AS ENUM ('PENDING', 'PENDING_PAYMENT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AdPaymentMethod" AS ENUM ('BANK_TRANSFER', 'CARD', 'USSD');

-- CreateEnum
CREATE TYPE "AdDurationType" AS ENUM ('HOURLY', 'DAILY');

-- CreateEnum
CREATE TYPE "PublicContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- DropIndex
DROP INDEX "users_registrationSequence_key";

-- CreateTable
CREATE TABLE "ad_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "companyName" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "position" "BannerPosition" NOT NULL DEFAULT 'TOP',
    "theme" "BannerTheme" NOT NULL DEFAULT 'BUSINESS',
    "requestedStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedEnd" TIMESTAMP(3),
    "status" "AdApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "AdPaymentMethod" DEFAULT 'BANK_TRANSFER',
    "amountPaid" DOUBLE PRECISION,
    "proofOfTransferUrl" TEXT,
    "durationType" "AdDurationType" DEFAULT 'DAILY',
    "durationValue" INTEGER DEFAULT 1,
    "activeUntil" TIMESTAMP(3),
    "reviewComment" TEXT,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_rate_config" (
    "id" TEXT NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_rate_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_delivery_logs" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "lastError" TEXT,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_content" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "status" "PublicContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_applications_userId_idx" ON "ad_applications"("userId");

-- CreateIndex
CREATE INDEX "ad_applications_status_idx" ON "ad_applications"("status");

-- CreateIndex
CREATE INDEX "email_delivery_logs_status_nextRetryAt_idx" ON "email_delivery_logs"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "email_delivery_logs_createdAt_idx" ON "email_delivery_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "public_content_slug_key" ON "public_content"("slug");

-- CreateIndex
CREATE INDEX "public_content_slug_idx" ON "public_content"("slug");

-- AddForeignKey
ALTER TABLE "ad_applications" ADD CONSTRAINT "ad_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_applications" ADD CONSTRAINT "ad_applications_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
