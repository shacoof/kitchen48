/*
  Warnings:

  - Made the column `measurement_system` on table `recipes` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill any remaining NULL values before making column required
UPDATE "recipes" SET "measurement_system" = 'metric' WHERE "measurement_system" IS NULL;

-- AlterTable
ALTER TABLE "recipes" ALTER COLUMN "measurement_system" SET NOT NULL,
ALTER COLUMN "measurement_system" SET DEFAULT 'metric';
