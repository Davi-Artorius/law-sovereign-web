-- Remove foreign key constraints
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_tenantId_fkey";
ALTER TABLE "TimelineEvent" DROP CONSTRAINT IF EXISTS "TimelineEvent_tenantId_fkey";
ALTER TABLE "TimelineEvent" DROP CONSTRAINT IF EXISTS "TimelineEvent_clientId_fkey";
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_tenantId_fkey";

-- Indexes já existem, mantém para performance
