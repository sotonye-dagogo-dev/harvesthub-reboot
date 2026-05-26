-- CreateTable
CREATE TABLE "cis_identities" (
    "id" TEXT NOT NULL,
    "cisSubjectId" TEXT NOT NULL,
    "sourcePlatform" TEXT NOT NULL,
    "externalUserId" TEXT,
    "linkedUserId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "displayName" TEXT,
    "role" TEXT,
    "status" TEXT,
    "lastEventType" TEXT NOT NULL,
    "lastEventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cis_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cis_webhook_events" (
    "id" TEXT NOT NULL,
    "identityId" TEXT,
    "eventType" TEXT NOT NULL,
    "sourcePlatform" TEXT NOT NULL,
    "subjectId" TEXT,
    "externalUserId" TEXT,
    "payload" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cis_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cis_identities_linkedUserId_idx" ON "cis_identities"("linkedUserId");

-- CreateIndex
CREATE INDEX "cis_identities_email_idx" ON "cis_identities"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cis_identities_cisSubjectId_sourcePlatform_key" ON "cis_identities"("cisSubjectId", "sourcePlatform");

-- CreateIndex
CREATE UNIQUE INDEX "cis_identities_externalUserId_key" ON "cis_identities"("externalUserId");

-- CreateIndex
CREATE INDEX "cis_webhook_events_identityId_idx" ON "cis_webhook_events"("identityId");

-- CreateIndex
CREATE INDEX "cis_webhook_events_eventType_idx" ON "cis_webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "cis_webhook_events_sourcePlatform_idx" ON "cis_webhook_events"("sourcePlatform");

-- AddForeignKey
ALTER TABLE "cis_identities" ADD CONSTRAINT "cis_identities_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cis_webhook_events" ADD CONSTRAINT "cis_webhook_events_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "cis_identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
