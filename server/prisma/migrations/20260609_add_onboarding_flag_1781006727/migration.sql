-- Add hasSeenOnboarding column to Tenant table
ALTER TABLE "Tenant" ADD COLUMN "hasSeenOnboarding" BOOLEAN NOT NULL DEFAULT false;
