-- AlterTable
ALTER TABLE "commerce_lifecycle_configs"
ADD COLUMN "withdrawalSettlementHoldHours" INTEGER NOT NULL DEFAULT 72;
