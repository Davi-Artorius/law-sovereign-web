-- Garantir integridade da coluna tenantId em Client
DO $$
BEGIN
  -- Se tenantId é NOT NULL mas há registros NULL, preencher com default
  IF EXISTS (
    SELECT 1 FROM "Client" WHERE "tenantId" IS NULL LIMIT 1
  ) THEN
    UPDATE "Client" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
  END IF;
END $$;

-- Garantir que tenantId é NOT NULL (se não estiver)
ALTER TABLE "Client" ALTER COLUMN "tenantId" SET NOT NULL;

-- Garantir índice em tenantId
CREATE INDEX IF NOT EXISTS "Client_tenantId_idx" ON "Client"("tenantId");

-- Garantir índice em deletedAt
CREATE INDEX IF NOT EXISTS "Client_deletedAt_idx" ON "Client"("deletedAt");

-- Garantir que outras colunas têm defaults apropriados
ALTER TABLE "Client" ALTER COLUMN "status" SET DEFAULT 'TRIAGEM';
ALTER TABLE "Client" ALTER COLUMN "isPaperLead" SET DEFAULT false;
ALTER TABLE "Client" ALTER COLUMN "isEncaminhado" SET DEFAULT false;
