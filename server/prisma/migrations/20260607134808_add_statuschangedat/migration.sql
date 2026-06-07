/*
  Warnings:

  - You are about to drop the column `isEncaminhado` on the `Client` table. All the data in the column will be lost.
  - The `status` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('TRIAGEM', 'PROPOSTA', 'CONTRATO', 'ATIVO', 'DESFECHO', 'ENCAMINHADO', 'INATIVO');

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "isEncaminhado",
ADD COLUMN     "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ClientStatus" NOT NULL DEFAULT 'TRIAGEM';
