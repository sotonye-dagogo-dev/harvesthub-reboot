-- AlterTable
ALTER TABLE "commerce_lifecycle_configs" ADD COLUMN     "commissionDefaultRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
ADD COLUMN     "commissionPremiumRate" DOUBLE PRECISION NOT NULL DEFAULT 0.03;
