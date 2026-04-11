import { v4 as uuid } from 'uuid';
import { getDatabase } from './database';
import { createLogger } from '../lib/logger';

const logger = createLogger('RecipesDB');

// --- Types ---

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  servings: number | null;
  measurementSystem: string;
  difficulty: string | null;
  cuisine: string | null;
  mealType: string | null;
  heroImagePath: string | null;
  introVideoPath: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Step {
  id: string;
  recipeId: string;
  title: string | null;
  slug: string | null;
  instruction: string | null;
  sortOrder: number;
  prepTime: number | null;
  prepTimeUnit: string;
  waitTime: number | null;
  waitTimeUnit: string;
  imagePath: string | null;
  videoPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StepIngredient {
  id: string;
  stepId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  sortOrder: number;
}

export interface RecipeWithSteps extends Recipe {
  steps: StepWithIngredients[];
  dietaryTags: string[];
}

export interface StepWithIngredients extends Step {
  ingredients: StepIngredient[];
}

export interface CreateRecipeInput {
  title: string;
  description?: string;
  servings?: number;
  measurementSystem?: string;
  difficulty?: string;
  cuisine?: string;
  mealType?: string;
}

export interface UpdateRecipeInput {
  title?: string;
  description?: string | null;
  servings?: number | null;
  measurementSystem?: string;
  difficulty?: string | null;
  cuisine?: string | null;
  mealType?: string | null;
  heroImagePath?: string | null;
  introVideoPath?: string | null;
  isPublished?: boolean;
}

export interface CreateStepInput {
  recipeId: string;
  title?: string;
  instruction?: string;
  sortOrder: number;
  prepTime?: number;
  prepTimeUnit?: string;
  waitTime?: number;
  waitTimeUnit?: string;
}

export interface UpdateStepInput {
  title?: string | null;
  instruction?: string | null;
  sortOrder?: number;
  prepTime?: number | null;
  prepTimeUnit?: string;
  waitTime?: number | null;
  waitTimeUnit?: string;
  imagePath?: string | null;
  videoPath?: string | null;
}

export interface CreateIngredientInput {
  stepId: string;
  name: string;
  quantity?: number;
  unit?: string;
  sortOrder: number;
}

// --- Helpers ---

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}

function now(): string {
  return new Date().toISOString();
}

interface RecipeRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  servings: number | null;
  measurement_system: string;
  difficulty: string | null;
  cuisine: string | null;
  meal_type: string | null;
  hero_image_path: string | null;
  intro_video_path: string | null;
  is_published: number;
  created_at: string;
  updated_at: string;
}

interface StepRow {
  id: string;
  recipe_id: string;
  title: string | null;
  slug: string | null;
  instruction: string | null;
  sort_order: number;
  prep_time: number | null;
  prep_time_unit: string;
  wait_time: number | null;
  wait_time_unit: string;
  image_path: string | null;
  video_path: string | null;
  created_at: string;
  updated_at: string;
}

interface IngredientRow {
  id: string;
  step_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  sort_order: number;
}

interface TagRow {
  tag: string;
}

function mapRecipeRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    servings: row.servings,
    measurementSystem: row.measurement_system,
    difficulty: row.difficulty,
    cuisine: row.cuisine,
    mealType: row.meal_type,
    heroImagePath: row.hero_image_path,
    introVideoPath: row.intro_video_path,
    isPublished: row.is_published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStepRow(row: StepRow): Step {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    title: row.title,
    slug: row.slug,
    instruction: row.instruction,
    sortOrder: row.sort_order,
    prepTime: row.prep_time,
    prepTimeUnit: row.prep_time_unit,
    waitTime: row.wait_time,
    waitTimeUnit: row.wait_time_unit,
    imagePath: row.image_path,
    videoPath: row.video_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapIngredientRow(row: IngredientRow): StepIngredient {
  return {
    id: row.id,
    stepId: row.step_id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    sortOrder: row.sort_order,
  };
}

// --- Recipe CRUD ---

export async function listRecipes(search?: string): Promise<Recipe[]> {
  const db = await getDatabase();
  let rows: RecipeRow[];
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    rows = await db.getAllAsync<RecipeRow>(
      'SELECT * FROM recipes WHERE title LIKE ? OR description LIKE ? ORDER BY updated_at DESC',
      [term, term]
    );
  } else {
    rows = await db.getAllAsync<RecipeRow>(
      'SELECT * FROM recipes ORDER BY updated_at DESC'
    );
  }
  return rows.map(mapRecipeRow);
}

export async function getRecipeById(id: string): Promise<RecipeWithSteps | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RecipeRow>(
    'SELECT * FROM recipes WHERE id = ?',
    [id]
  );
  if (!row) return null;

  const recipe = mapRecipeRow(row);

  const stepRows = await db.getAllAsync<StepRow>(
    'SELECT * FROM steps WHERE recipe_id = ? ORDER BY sort_order ASC',
    [id]
  );

  const steps: StepWithIngredients[] = [];
  for (const stepRow of stepRows) {
    const step = mapStepRow(stepRow);
    const ingredientRows = await db.getAllAsync<IngredientRow>(
      'SELECT * FROM step_ingredients WHERE step_id = ? ORDER BY sort_order ASC',
      [step.id]
    );
    steps.push({
      ...step,
      ingredients: ingredientRows.map(mapIngredientRow),
    });
  }

  const tagRows = await db.getAllAsync<TagRow>(
    'SELECT tag FROM dietary_tags WHERE recipe_id = ?',
    [id]
  );

  return {
    ...recipe,
    steps,
    dietaryTags: tagRows.map((r) => r.tag),
  };
}

export async function createRecipe(input: CreateRecipeInput): Promise<string> {
  const db = await getDatabase();
  const id = uuid();
  const timestamp = now();
  const slug = generateSlug(input.title);

  await db.runAsync(
    `INSERT INTO recipes (id, title, slug, description, servings, measurement_system, difficulty, cuisine, meal_type, is_published, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      id, input.title, slug, input.description ?? null, input.servings ?? null,
      input.measurementSystem ?? 'metric', input.difficulty ?? null,
      input.cuisine ?? null, input.mealType ?? null, timestamp, timestamp,
    ]
  );

  logger.debug(`Created recipe: ${input.title} (${id})`);
  return id;
}

export async function updateRecipe(id: string, input: UpdateRecipeInput): Promise<void> {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.title !== undefined) {
    sets.push('title = ?', 'slug = ?');
    values.push(input.title, generateSlug(input.title));
  }
  if (input.description !== undefined) { sets.push('description = ?'); values.push(input.description); }
  if (input.servings !== undefined) { sets.push('servings = ?'); values.push(input.servings); }
  if (input.measurementSystem !== undefined) { sets.push('measurement_system = ?'); values.push(input.measurementSystem); }
  if (input.difficulty !== undefined) { sets.push('difficulty = ?'); values.push(input.difficulty); }
  if (input.cuisine !== undefined) { sets.push('cuisine = ?'); values.push(input.cuisine); }
  if (input.mealType !== undefined) { sets.push('meal_type = ?'); values.push(input.mealType); }
  if (input.heroImagePath !== undefined) { sets.push('hero_image_path = ?'); values.push(input.heroImagePath); }
  if (input.introVideoPath !== undefined) { sets.push('intro_video_path = ?'); values.push(input.introVideoPath); }
  if (input.isPublished !== undefined) { sets.push('is_published = ?'); values.push(input.isPublished ? 1 : 0); }

  if (sets.length === 0) return;

  sets.push('updated_at = ?');
  values.push(now());
  values.push(id);

  await db.runAsync(
    `UPDATE recipes SET ${sets.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteRecipe(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recipes WHERE id = ?', [id]);
  logger.debug(`Deleted recipe: ${id}`);
}

// --- Step CRUD ---

export async function createStep(input: CreateStepInput): Promise<string> {
  const db = await getDatabase();
  const id = uuid();
  const timestamp = now();
  const slug = input.title ? generateSlug(input.title) : `step-${input.sortOrder}`;

  await db.runAsync(
    `INSERT INTO steps (id, recipe_id, title, slug, instruction, sort_order, prep_time, prep_time_unit, wait_time, wait_time_unit, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, input.recipeId, input.title ?? null, slug, input.instruction ?? null,
      input.sortOrder, input.prepTime ?? null, input.prepTimeUnit ?? 'MINUTES',
      input.waitTime ?? null, input.waitTimeUnit ?? 'MINUTES', timestamp, timestamp,
    ]
  );

  // Update recipe's updated_at
  await db.runAsync('UPDATE recipes SET updated_at = ? WHERE id = ?', [timestamp, input.recipeId]);

  return id;
}

export async function updateStep(id: string, input: UpdateStepInput): Promise<void> {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.title !== undefined) {
    sets.push('title = ?');
    values.push(input.title);
    if (input.title) {
      sets.push('slug = ?');
      values.push(generateSlug(input.title));
    }
  }
  if (input.instruction !== undefined) { sets.push('instruction = ?'); values.push(input.instruction); }
  if (input.sortOrder !== undefined) { sets.push('sort_order = ?'); values.push(input.sortOrder); }
  if (input.prepTime !== undefined) { sets.push('prep_time = ?'); values.push(input.prepTime); }
  if (input.prepTimeUnit !== undefined) { sets.push('prep_time_unit = ?'); values.push(input.prepTimeUnit); }
  if (input.waitTime !== undefined) { sets.push('wait_time = ?'); values.push(input.waitTime); }
  if (input.waitTimeUnit !== undefined) { sets.push('wait_time_unit = ?'); values.push(input.waitTimeUnit); }
  if (input.imagePath !== undefined) { sets.push('image_path = ?'); values.push(input.imagePath); }
  if (input.videoPath !== undefined) { sets.push('video_path = ?'); values.push(input.videoPath); }

  if (sets.length === 0) return;

  sets.push('updated_at = ?');
  values.push(now());
  values.push(id);

  await db.runAsync(`UPDATE steps SET ${sets.join(', ')} WHERE id = ?`, values);

  // Update parent recipe's updated_at
  const step = await db.getFirstAsync<{ recipe_id: string }>('SELECT recipe_id FROM steps WHERE id = ?', [id]);
  if (step) {
    await db.runAsync('UPDATE recipes SET updated_at = ? WHERE id = ?', [now(), step.recipe_id]);
  }
}

export async function deleteStep(id: string): Promise<void> {
  const db = await getDatabase();
  const step = await db.getFirstAsync<{ recipe_id: string }>('SELECT recipe_id FROM steps WHERE id = ?', [id]);
  await db.runAsync('DELETE FROM steps WHERE id = ?', [id]);
  if (step) {
    await db.runAsync('UPDATE recipes SET updated_at = ? WHERE id = ?', [now(), step.recipe_id]);
  }
}

// --- Ingredient CRUD ---

export async function createIngredient(input: CreateIngredientInput): Promise<string> {
  const db = await getDatabase();
  const id = uuid();

  await db.runAsync(
    `INSERT INTO step_ingredients (id, step_id, name, quantity, unit, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.stepId, input.name, input.quantity ?? null, input.unit ?? null, input.sortOrder]
  );

  return id;
}

export async function updateIngredient(
  id: string,
  input: { name?: string; quantity?: number | null; unit?: string | null; sortOrder?: number }
): Promise<void> {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.name !== undefined) { sets.push('name = ?'); values.push(input.name); }
  if (input.quantity !== undefined) { sets.push('quantity = ?'); values.push(input.quantity); }
  if (input.unit !== undefined) { sets.push('unit = ?'); values.push(input.unit); }
  if (input.sortOrder !== undefined) { sets.push('sort_order = ?'); values.push(input.sortOrder); }

  if (sets.length === 0) return;
  values.push(id);

  await db.runAsync(`UPDATE step_ingredients SET ${sets.join(', ')} WHERE id = ?`, values);
}

export async function deleteIngredient(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM step_ingredients WHERE id = ?', [id]);
}

// --- Dietary Tags ---

export async function setDietaryTags(recipeId: string, tags: string[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM dietary_tags WHERE recipe_id = ?', [recipeId]);
  for (const tag of tags) {
    await db.runAsync(
      'INSERT INTO dietary_tags (id, recipe_id, tag) VALUES (?, ?, ?)',
      [uuid(), recipeId, tag]
    );
  }
}

// --- Hooks helpers ---

export async function getRecipeCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM recipes');
  return row?.count ?? 0;
}
