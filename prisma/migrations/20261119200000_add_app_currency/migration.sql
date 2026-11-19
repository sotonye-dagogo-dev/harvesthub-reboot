-- Phase 2: in-app currency (Harvest Coins). Additive only.

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'APP_CURRENCY';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'CURRENCY_CONVERSION';

-- CreateEnum
CREATE TYPE "CoinTransactionType" AS ENUM ('CONVERSION', 'PAYMENT', 'REFUND', 'REWARD', 'REWARD_REVERSAL', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN IF NOT EXISTS "coinBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "commerce_lifecycle_configs"
  ADD COLUMN IF NOT EXISTS "appCurrencyEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "appCurrencyName" TEXT NOT NULL DEFAULT 'Harvest Coins',
  ADD COLUMN IF NOT EXISTS "appCurrencySymbol" TEXT NOT NULL DEFAULT 'HC',
  ADD COLUMN IF NOT EXISTS "appCurrencyNairaPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "appCurrencyMinConversion" DOUBLE PRECISION NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS "appCurrencyMaxConversion" DOUBLE PRECISION NOT NULL DEFAULT 500000,
  ADD COLUMN IF NOT EXISTS "appCurrencyCheckoutEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "coin_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "CoinTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "nairaValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coin_transactions_reference_key" ON "coin_transactions"("reference");
CREATE INDEX "coin_transactions_walletId_idx" ON "coin_transactions"("walletId");
CREATE INDEX "coin_transactions_type_idx" ON "coin_transactions"("type");
CREATE INDEX "coin_transactions_orderId_idx" ON "coin_transactions"("orderId");
CREATE INDEX "coin_transactions_createdAt_idx" ON "coin_transactions"("createdAt");

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
