// Web stub — returns mock data for preview purposes.
// The real implementation uses expo-sqlite (native only).

export type {
  Recipe, Step, StepIngredient, RecipeWithSteps, StepWithIngredients,
  CreateRecipeInput, UpdateRecipeInput, CreateStepInput, UpdateStepInput,
  CreateIngredientInput,
} from './recipes-db';

import type { Recipe, RecipeWithSteps } from './recipes-db';

export async function listRecipes(_search?: string): Promise<Recipe[]> {
  return [];
}

export async function getRecipeById(_id: string): Promise<RecipeWithSteps | null> {
  return null;
}

export async function createRecipe(): Promise<string> {
  return 'web-stub';
}

export async function updateRecipe(): Promise<void> {}
export async function deleteRecipe(): Promise<void> {}
export async function createStep(): Promise<string> { return 'web-stub'; }
export async function updateStep(): Promise<void> {}
export async function deleteStep(): Promise<void> {}
export async function createIngredient(): Promise<string> { return 'web-stub'; }
export async function updateIngredient(): Promise<void> {}
export async function deleteIngredient(): Promise<void> {}
export async function setDietaryTags(): Promise<void> {}
export async function getRecipeCount(): Promise<number> { return 0; }
