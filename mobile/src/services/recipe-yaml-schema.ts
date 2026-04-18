import { z } from 'zod';

export const YAML_SCHEMA_VERSION = '1.0';

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
});

const stepSchema = z.object({
  order: z.number().int().min(0),
  title: z.string().nullable().optional(),
  instruction: z.string().nullable().optional(),
  prepTime: z.number().nullable().optional(),
  prepTimeUnit: z.string().nullable().optional(),
  waitTime: z.number().nullable().optional(),
  waitTimeUnit: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  video: z.string().nullable().optional(),
  ingredients: z.array(ingredientSchema).optional().default([]),
});

export const recipeYamlSchema = z.object({
  version: z.string(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  servings: z.number().nullable().optional(),
  measurementSystem: z.string().optional().default('metric'),
  difficulty: z.string().nullable().optional(),
  cuisine: z.string().nullable().optional(),
  mealType: z.string().nullable().optional(),
  dietaryTags: z.array(z.string()).optional().default([]),
  heroImage: z.string().nullable().optional(),
  introVideo: z.string().nullable().optional(),
  steps: z.array(stepSchema).min(0).default([]),
});

export type RecipeYaml = z.infer<typeof recipeYamlSchema>;
export type StepYaml = z.infer<typeof stepSchema>;
export type IngredientYaml = z.infer<typeof ingredientSchema>;
