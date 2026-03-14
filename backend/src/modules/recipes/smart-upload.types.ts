/**
 * Smart Upload Types
 * Types for AI-powered recipe extraction from photos
 */

/** Ingredient extracted by AI */
export interface ExtractedIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
}

/** Step extracted by AI */
export interface ExtractedStep {
  instruction: string;
  prepTime: number | null;
  prepTimeUnit: string | null;
  waitTime: number | null;
  waitTimeUnit: string | null;
  ingredients: ExtractedIngredient[];
}

/** Full recipe extraction result from AI */
export interface ExtractedRecipe {
  title: string;
  description: string | null;
  servings: number | null;
  measurementSystem: string | null;
  difficulty: string | null;
  cuisine: string | null;
  mealType: string | null;
  dietaryTags: string[];
  steps: ExtractedStep[];
  warnings: string[];
}

/** Response from smart upload endpoint */
export interface SmartUploadResult {
  recipe: {
    id: string;
    slug: string;
  };
  warnings: string[];
}
