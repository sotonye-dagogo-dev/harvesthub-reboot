-- CreateTable
CREATE TABLE "commerce_lifecycle_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "autoConfirmEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoConfirmHours" INTEGER NOT NULL DEFAULT 48,
    "refundWindowHours" INTEGER NOT NULL DEFAULT 72,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_lifecycle_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commerce_lifecycle_configs_key_key" ON "commerce_lifecycle_configs"("key");
