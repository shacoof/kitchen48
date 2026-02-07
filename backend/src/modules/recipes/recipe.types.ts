/**
 * Recipe Types
 * Zod schemas and TypeScript types for recipes, steps, and ingredients
 */

import { z } from 'zod';
import type { Decimal } from '@prisma/client/runtime/library';
import type { TimeUnit } from '@prisma/client';

// Helper to convert empty strings to null
const emptyStringToNull = (val: unknown) => (val === '' ? null : val);

// Time unit enum for validation
const timeUnitSchema = z.enum(['SECONDS', 'MINUTES', 'HOURS', 'DAYS']);

// Step ingredient schemas
export const createStepIngredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required').max(100),
  quantity: z.preprocess(emptyStringToNull, z.number().positive().optional().nullable()),
  unit: z.preprocess(emptyStringToNull, z.string().max(20).optional().nullable()),
  order: z.number().int().min(0).optional().default(0),
  masterIngredientId: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
});

export const updateStepIngredientSchema = createStepIngredientSchema.partial();

// Step schemas
export const createStepSchema = z.object({
  slug: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
      .optional()
      .nullable()
  ),
  title: z.preprocess(emptyStringToNull, z.string().max(100).optional().nullable()),
  instruction: z.string().min(1, 'Step instruction is required'),
  order: z.number().int().min(0),
  duration: z.preprocess(emptyStringToNull, z.number().int().positive().optional().nullable()),
  videoUrl: z.preprocess(emptyStringToNull, z.string().url().optional().nullable()),
  prepTime: z.preprocess(emptyStringToNull, z.number().int().positive().optional().nullable()),
  prepTimeUnit: z.preprocess(emptyStringToNull, timeUnitSchema.optional().nullable()),
  waitTime: z.preprocess(emptyStringToNull, z.number().int().positive().optional().nullable()),
  waitTimeUnit: z.preprocess(emptyStringToNull, timeUnitSchema.optional().nullable()),
  ingredients: z.array(createStepIngredientSchema).optional().default([]),
});

export const updateStepSchema = createStepSchema.partial().extend({
  id: z.string().optional(), // For identifying existing steps during update
});

// Recipe schemas
export const createRecipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(80),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  prepTime: z.preprocess(emptyStringToNull, z.number().int().positive().optional().nullable()),
  cookTime: z.preprocess(emptyStringToNull, z.number().int().positive().optional().nullable()),
  servings: z.preprocess(emptyStringToNull, z.number().int().positive().optional().nullable()),
  imageUrl: z.preprocess(emptyStringToNull, z.string().url().optional().nullable()),
  videoUrl: z.preprocess(emptyStringToNull, z.string().url().optional().nullable()),
  isPublished: z.boolean().optional().default(false),
  // New classification fields
  measurementSystem: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  difficulty: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  cuisine: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  mealType: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  dietaryTags: z.array(z.string()).optional().default([]),
  steps: z.array(createStepSchema).optional().default([]),
});

export const updateRecipeSchema = createRecipeSchema.partial();

// Query schemas
export const recipeQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  authorId: z.string().optional(),
  isPublished: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

// Types derived from schemas
export type CreateStepIngredientInput = z.infer<typeof createStepIngredientSchema>;
export type UpdateStepIngredientInput = z.infer<typeof updateStepIngredientSchema>;
export type CreateStepInput = z.infer<typeof createStepSchema>;
export type UpdateStepInput = z.infer<typeof updateStepSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type RecipeQueryInput = z.infer<typeof recipeQuerySchema>;

// Full types (from database)
export interface StepIngredient {
  id: string;
  name: string;
  quantity: Decimal | null;
  unit: string | null;
  order: number;
  stepId: string;
  masterIngredientId: string | null;
}

export interface RecipeStep {
  id: string;
  slug: string | null;
  title: string | null;
  instruction: string;
  order: number;
  duration: number | null;
  videoUrl: string | null;
  prepTime: number | null;
  prepTimeUnit: TimeUnit | null;
  waitTime: number | null;
  waitTimeUnit: TimeUnit | null;
  recipeId: string;
  ingredients: StepIngredient[];
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  imageUrl: string | null;
  videoUrl: string | null;
  isPublished: boolean;
  measurementSystem: string | null;
  difficulty: string | null;
  cuisine: string | null;
  mealType: string | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author?: {
    id: string;
    nickname: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
  };
  steps: RecipeStep[];
  dietaryTags?: Array<{ id: string; tag: string }>;
}

export interface RecipeListItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  createdAt: Date;
  author: {
    id: string;
    nickname: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  _count: {
    steps: number;
  };
}
