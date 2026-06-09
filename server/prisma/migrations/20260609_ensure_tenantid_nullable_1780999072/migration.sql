-- Garantir que tenantId existe em Client (nullable primeiro)
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Garantir que tenantId existe em TimelineEvent (nullable)
ALTER TABLE "TimelineEvent" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Preencher tenantId para registros antigos
UPDATE "Client" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "TimelineEvent" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;

-- Agora fazer NOT NULL e adicionar constraint
ALTER TABLE "Client" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "TimelineEvent" ALTER COLUMN "tenantId" SET NOT NULL;

-- Foreign keys
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_tenantId_fkey";
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

ALTER TABLE "TimelineEvent" DROP CONSTRAINT IF EXISTS "TimelineEvent_tenantId_fkey";
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

-- Índices
CREATE INDEX IF NOT EXISTS "Client_tenantId_idx" ON "Client"("tenantId");
CREATE INDEX IF NOT EXISTS "TimelineEvent_tenantId_idx" ON "TimelineEvent"("tenantId");
