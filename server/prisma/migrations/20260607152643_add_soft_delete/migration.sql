/*
  Warnings:

  - You are about to drop the column `statusChangedAt` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Client` table. All the data in the column will be lost.
  - The `status` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "statusChangedAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'TRIAGEM';

-- DropEnum
DROP TYPE "ClientStatus";
