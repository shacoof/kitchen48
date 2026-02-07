-- RenameForeignKey
ALTER TABLE "recipe_steps" RENAME CONSTRAINT "steps_recipe_id_fkey" TO "recipe_steps_recipe_id_fkey";

-- Enable pg_trgm extension for fuzzy/trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN trigram index on master_ingredients.name for fast similarity search
CREATE INDEX IF NOT EXISTS "master_ingredients_name_trgm_idx"
  ON "master_ingredients" USING GIN ("name" gin_trgm_ops);
