/**
 * Ingredient Types
 * Zod schemas and TypeScript types for master ingredients
 */

import { z } from 'zod';

// Helper to convert empty strings to null
const emptyStringToNull = (val: unknown) => (val === '' ? null : val);

// Create ingredient schema
export const createIngredientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category: z.preprocess(emptyStringToNull, z.string().max(50).optional().nullable()),
  description: z.preprocess(emptyStringToNull, z.string().max(500).optional().nullable()),
  isActive: z.boolean().optional().default(true),
});

// Update ingredient schema
export const updateIngredientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.preprocess(emptyStringToNull, z.string().max(50).optional().nullable()),
  description: z.preprocess(emptyStringToNull, z.string().max(500).optional().nullable()),
  isActive: z.boolean().optional(),
});

// Types derived from schemas
export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;

// Full ingredient type (from database)
export interface MasterIngredient {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
