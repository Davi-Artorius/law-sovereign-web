-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('TRIAGEM', 'PROPOSTA', 'CONTRATO', 'ATIVO', 'DESFECHO', 'ENCAMINHADO', 'INATIVO');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "status_temp" "ClientStatus";
UPDATE "Client" SET "status_temp" = CAST(UPPER(COALESCE("status", 'TRIAGEM')) AS "ClientStatus");
ALTER TABLE "Client" DROP COLUMN "status";
ALTER TABLE "Client" RENAME COLUMN "status_temp" TO "status";
ALTER TABLE "Client" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "status" SET DEFAULT 'TRIAGEM';
