-- Fix schema integrity: garante que todas as colunas necessárias existem

-- 1. Ensure Client table has tenantId (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='Client' AND column_name='tenantId'
  ) THEN
    ALTER TABLE "Client" ADD COLUMN "tenantId" TEXT;
  END IF;
END $$;

-- 2. Ensure Client table has deletedAt (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='Client' AND column_name='deletedAt'
  ) THEN
    ALTER TABLE "Client" ADD COLUMN "deletedAt" TIMESTAMP(3);
  END IF;
END $$;

-- 3. Ensure TimelineEvent table has tenantId (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='TimelineEvent' AND column_name='tenantId'
  ) THEN
    ALTER TABLE "TimelineEvent" ADD COLUMN "tenantId" TEXT;
  END IF;
END $$;

-- 4. Ensure Tenant table has role (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='Tenant' AND column_name='role'
  ) THEN
    ALTER TABLE "Tenant" ADD COLUMN "role" TEXT DEFAULT 'USER';
  END IF;
END $$;

-- 5. Ensure AuditLog table exists (idempotent)
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "error" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- 6. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "Client_tenantId_idx" ON "Client"("tenantId");
CREATE INDEX IF NOT EXISTS "Client_deletedAt_idx" ON "Client"("deletedAt");
CREATE INDEX IF NOT EXISTS "TimelineEvent_tenantId_idx" ON "TimelineEvent"("tenantId");
CREATE INDEX IF NOT EXISTS "TimelineEvent_clientId_idx" ON "TimelineEvent"("clientId");
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_email_idx" ON "AuditLog"("email");

-- 7. Add foreign key constraints if they don't exist (check via constraint)
DO $$
BEGIN
  -- Client -> Tenant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name='Client_tenantId_fkey'
  ) THEN
    ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" 
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  -- TimelineEvent -> Tenant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name='TimelineEvent_tenantId_fkey'
  ) THEN
    ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  -- AuditLog -> Tenant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name='AuditLog_tenantId_fkey'
  ) THEN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- 8. Populate tenantId for orphaned Client records (if any exist without tenantId)
UPDATE "Client" SET "tenantId" = 'temp-tenant-' || "id" WHERE "tenantId" IS NULL;

-- 9. Make tenantId NOT NULL (safe now because we backfilled)
ALTER TABLE "Client" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "TimelineEvent" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "tenantId" SET NOT NULL;

