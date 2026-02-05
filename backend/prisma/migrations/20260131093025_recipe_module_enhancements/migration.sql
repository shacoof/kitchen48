-- CreateEnum
CREATE TYPE "TimeUnit" AS ENUM ('SECONDS', 'MINUTES', 'HOURS', 'DAYS');

-- AlterTable: Add slug to recipes (with default for existing data)
ALTER TABLE "recipes" ADD COLUMN "slug" TEXT;

-- Update existing recipes with generated slugs from title
UPDATE "recipes" SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("title", '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));

-- Handle any remaining null slugs or duplicates
UPDATE "recipes" SET "slug" = "id" WHERE "slug" IS NULL OR "slug" = '';

-- Make slug NOT NULL after populating
ALTER TABLE "recipes" ALTER COLUMN "slug" SET NOT NULL;

-- Change title to VARCHAR(80)
ALTER TABLE "recipes" ALTER COLUMN "title" SET DATA TYPE VARCHAR(80);

-- AlterTable: Add new fields to steps
ALTER TABLE "steps" ADD COLUMN "slug" TEXT,
ADD COLUMN "video_url" TEXT,
ADD COLUMN "wait_time" INTEGER,
ADD COLUMN "wait_time_unit" "TimeUnit",
ADD COLUMN "work_time" INTEGER,
ADD COLUMN "work_time_unit" "TimeUnit";

-- CreateTable
CREATE TABLE "step_ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "step_id" TEXT NOT NULL,
    "master_ingredient_id" TEXT,

    CONSTRAINT "step_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipes_author_id_slug_key" ON "recipes"("author_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "steps_recipe_id_slug_key" ON "steps"("recipe_id", "slug");

-- AddForeignKey
ALTER TABLE "step_ingredients" ADD CONSTRAINT "step_ingredients_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_ingredients" ADD CONSTRAINT "step_ingredients_master_ingredient_id_fkey" FOREIGN KEY ("master_ingredient_id") REFERENCES "master_ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
