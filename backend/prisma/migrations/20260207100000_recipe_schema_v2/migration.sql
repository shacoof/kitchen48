-- Recipe Schema V2: Enhancements for recipe-hld.md
-- Renames, new fields, type changes, measurement system support

-- ============================================================================
-- 1. Rename "steps" table to "recipe_steps"
-- ============================================================================
ALTER TABLE "steps" RENAME TO "recipe_steps";

-- Update the unique index name (Prisma expects specific names)
ALTER INDEX "steps_pkey" RENAME TO "recipe_steps_pkey";
ALTER INDEX "steps_recipe_id_slug_key" RENAME TO "recipe_steps_recipe_id_slug_key";

-- Update foreign key constraint names on step_ingredients
ALTER TABLE "step_ingredients" DROP CONSTRAINT "step_ingredients_step_id_fkey";
ALTER TABLE "step_ingredients" ADD CONSTRAINT "step_ingredients_step_id_fkey"
  FOREIGN KEY ("step_id") REFERENCES "recipe_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- 2. Add "title" column to recipe_steps
-- ============================================================================
ALTER TABLE "recipe_steps" ADD COLUMN "title" TEXT;

-- ============================================================================
-- 3. Rename work_time → prep_time, work_time_unit → prep_time_unit on recipe_steps
-- ============================================================================
ALTER TABLE "recipe_steps" RENAME COLUMN "work_time" TO "prep_time";
ALTER TABLE "recipe_steps" RENAME COLUMN "work_time_unit" TO "prep_time_unit";

-- ============================================================================
-- 4. Change step_ingredients.amount (String) → quantity (Decimal) + unit (String)
-- ============================================================================
-- Add new columns
ALTER TABLE "step_ingredients" ADD COLUMN "quantity" DECIMAL(10,3);
ALTER TABLE "step_ingredients" ADD COLUMN "unit" TEXT;

-- Migrate existing data: try to parse amount like "2 cups" into quantity + unit
-- This is best-effort; complex amounts stay as-is (null quantity)
UPDATE "step_ingredients"
SET
  quantity = CASE
    WHEN "amount" ~ '^\d+(\.\d+)?'
    THEN CAST(SUBSTRING("amount" FROM '^\d+(\.\d+)?') AS DECIMAL(10,3))
    ELSE NULL
  END,
  unit = CASE
    WHEN "amount" ~ '^\d+(\.\d+)?\s+(.+)$'
    THEN TRIM(SUBSTRING("amount" FROM '^\d+(\.\d+)?\s+(.+)$'))
    ELSE NULL
  END
WHERE "amount" IS NOT NULL;

-- Drop old amount column
ALTER TABLE "step_ingredients" DROP COLUMN "amount";

-- ============================================================================
-- 5. Add measurement & classification fields to recipes
-- ============================================================================
ALTER TABLE "recipes" ADD COLUMN "measurement_system" TEXT;
ALTER TABLE "recipes" ADD COLUMN "difficulty" TEXT;
ALTER TABLE "recipes" ADD COLUMN "cuisine" TEXT;
ALTER TABLE "recipes" ADD COLUMN "meal_type" TEXT;

-- ============================================================================
-- 6. Add measurement_system to users (with default)
-- ============================================================================
ALTER TABLE "users" ADD COLUMN "measurement_system" TEXT NOT NULL DEFAULT 'metric';

-- ============================================================================
-- 7. Create recipe_dietary_tags junction table
-- ============================================================================
CREATE TABLE "recipe_dietary_tags" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "recipe_dietary_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recipe_dietary_tags_recipe_id_tag_key" ON "recipe_dietary_tags"("recipe_id", "tag");

ALTER TABLE "recipe_dietary_tags" ADD CONSTRAINT "recipe_dietary_tags_recipe_id_fkey"
  FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- 8. Drop old recipe_ingredients table (ingredients now only at step level)
-- ============================================================================
DROP TABLE IF EXISTS "recipe_ingredients";
