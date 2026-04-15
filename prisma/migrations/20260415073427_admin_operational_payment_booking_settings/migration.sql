-- AlterTable
ALTER TABLE "commerce_lifecycle_configs" ADD COLUMN     "maxBookingAdvanceDays" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "minOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 500,
ADD COLUMN     "paymentsEnabled" BOOLEAN NOT NULL DEFAULT true;
