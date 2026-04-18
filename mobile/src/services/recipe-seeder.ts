import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { getDatabase } from '../db/database';
import {
  createRecipe,
  updateRecipe,
  createStep,
  createIngredient,
  setDietaryTags,
} from '../db/recipes-db';
import { ensureRecipeDir } from './media-storage';
import { createLogger } from '../lib/logger';
import { SEED_RECIPES, SEED_SCHEMA_VERSION, type SeedRecipe } from '../seed/seed-recipes';

const logger = createLogger('RecipeSeeder');

const SEED_FLAG_KEY = 'seed_recipes_loaded_version';

async function readSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

async function writeSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

async function copyAssetToRecipeDir(
  recipeId: string,
  assetModule: number,
  filename: string
): Promise<string | null> {
  try {
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();
    const sourceUri = asset.localUri ?? asset.uri;
    if (!sourceUri) return null;

    const dir = await ensureRecipeDir(recipeId);
    const dest = new File(dir, filename);
    if (dest.exists) dest.delete();
    const source = new File(sourceUri);
    source.copy(dest);
    return dest.uri;
  } catch (err) {
    logger.warning(`Failed to copy seed asset: ${String(err)}`);
    return null;
  }
}

async function seedOne(recipe: SeedRecipe): Promise<void> {
  const recipeId = await createRecipe({
    title: recipe.title,
    description: recipe.description ?? undefined,
    servings: recipe.servings ?? undefined,
    measurementSystem: recipe.measurementSystem,
    difficulty: recipe.difficulty ?? undefined,
    cuisine: recipe.cuisine ?? undefined,
    mealType: recipe.mealType ?? undefined,
  });

  if (recipe.dietaryTags.length > 0) {
    await setDietaryTags(recipeId, recipe.dietaryTags);
  }

  let heroPath: string | null = null;
  if (recipe.heroImageAsset != null) {
    heroPath = await copyAssetToRecipeDir(recipeId, recipe.heroImageAsset, 'hero.jpg');
  }

  await updateRecipe(recipeId, {
    heroImagePath: heroPath,
    isPublished: recipe.isPublished,
  });

  for (const step of recipe.steps) {
    const stepId = await createStep({
      recipeId,
      title: step.title ?? undefined,
      instruction: step.instruction ?? undefined,
      sortOrder: step.order,
      prepTime: step.prepTime ?? undefined,
      prepTimeUnit: step.prepTimeUnit,
      waitTime: step.waitTime ?? undefined,
      waitTimeUnit: step.waitTimeUnit,
    });

    for (let i = 0; i < step.ingredients.length; i++) {
      const ing = step.ingredients[i];
      await createIngredient({
        stepId,
        name: ing.name,
        quantity: ing.quantity ?? undefined,
        unit: ing.unit ?? undefined,
        sortOrder: i,
      });
    }
  }
}

export async function seedRecipesIfNeeded(): Promise<void> {
  const start = Date.now();
  const loadedVersion = await readSetting(SEED_FLAG_KEY);
  if (loadedVersion === String(SEED_SCHEMA_VERSION)) {
    return;
  }

  logger.debug(`Seeding ${SEED_RECIPES.length} starter recipes...`);
  let succeeded = 0;
  for (const recipe of SEED_RECIPES) {
    try {
      await seedOne(recipe);
      succeeded++;
    } catch (err) {
      logger.error(`Failed to seed "${recipe.title}": ${String(err)}`);
    }
  }

  await writeSetting(SEED_FLAG_KEY, String(SEED_SCHEMA_VERSION));
  logger.timing(`Seeded ${succeeded}/${SEED_RECIPES.length} recipes`, start);
}
