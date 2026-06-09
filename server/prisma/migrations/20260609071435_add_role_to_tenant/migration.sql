-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "isEncaminhado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';
