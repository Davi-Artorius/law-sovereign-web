-- FINAL FIX: Reset Client table to working state

-- 1. Remove constraints that might be causing issues
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_tenantId_fkey";

-- 2. Ensure tenantId column exists and is correct type
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- 3. Backfill any NULL tenantId with default
UPDATE "Client" SET "tenantId" = 'unknown-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

-- 4. Make tenantId NOT NULL
ALTER TABLE "Client" ALTER COLUMN "tenantId" SET NOT NULL;

-- 5. Ensure all required columns exist with correct types and defaults
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'TRIAGEM';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "lastAction" TEXT DEFAULT '';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "case" TEXT DEFAULT '';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "area" TEXT DEFAULT '';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "isPaperLead" BOOLEAN DEFAULT false;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "isEncaminhado" BOOLEAN DEFAULT false;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "chanceOfSuccess" INTEGER;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "costOfWaiting" FLOAT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "missingProofs" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS "Client_tenantId_idx" ON "Client"("tenantId");
CREATE INDEX IF NOT EXISTS "Client_deletedAt_idx" ON "Client"("deletedAt");

-- 7. Optional: soft delete any corrupted records by marking with flag
-- This is safe because we use soft delete anyway
