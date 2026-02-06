/**
 * List Types - Types & Validation
 * Zod schemas for list type and list value operations
 */

import { z } from 'zod';

// Helper to convert empty strings to null (Tabulator sends "" for cleared fields)
const emptyStringToNull = (val: unknown) => (val === '' ? null : val);

// ============================================================================
// List Type Schemas
// ============================================================================

export const createListTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.preprocess(emptyStringToNull, z.string().max(1000).nullable().optional()),
  isActive: z.boolean().optional().default(true),
});

export const updateListTypeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.preprocess(emptyStringToNull, z.string().max(1000).nullable().optional()),
  isActive: z.boolean().optional(),
});

// ============================================================================
// List Value Schemas
// ============================================================================

export const createListValueSchema = z.object({
  value: z.string().min(1, 'Value code is required').max(100),
  label: z.string().min(1, 'Label is required').max(255),
  description: z.preprocess(emptyStringToNull, z.string().max(1000).nullable().optional()),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateListValueSchema = z.object({
  value: z.string().min(1).max(100).optional(),
  label: z.string().min(1).max(255).optional(),
  description: z.preprocess(emptyStringToNull, z.string().max(1000).nullable().optional()),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// Types
// ============================================================================

export type CreateListTypeInput = z.infer<typeof createListTypeSchema>;
export type UpdateListTypeInput = z.infer<typeof updateListTypeSchema>;
export type CreateListValueInput = z.infer<typeof createListValueSchema>;
export type UpdateListValueInput = z.infer<typeof updateListValueSchema>;

// Response types
export interface ListTypeWithCount {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    values: number;
  };
}

export interface ListValueResponse {
  id: string;
  listTypeId: string;
  value: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Public API response (simplified for dropdowns)
export interface ListValueOption {
  value: string;
  label: string;
  sortOrder: number;
}

// ============================================================================
// List Value Translation Schemas
// ============================================================================

export const createTranslationSchema = z.object({
  language: z.string().min(2, 'Language code is required').max(5),
  label: z.string().min(1, 'Label is required').max(255),
  description: z.preprocess(emptyStringToNull, z.string().max(1000).nullable().optional()),
});

export const updateTranslationSchema = z.object({
  label: z.string().min(1).max(255).optional(),
  description: z.preprocess(emptyStringToNull, z.string().max(1000).nullable().optional()),
});

export const upsertTranslationsSchema = z.array(
  z.object({
    language: z.string().min(2).max(5),
    label: z.string().min(1).max(255),
    description: z.preprocess(emptyStringToNull, z.string().max(1000).nullable().optional()),
  })
);

export type CreateTranslationInput = z.infer<typeof createTranslationSchema>;
export type UpdateTranslationInput = z.infer<typeof updateTranslationSchema>;
export type UpsertTranslationsInput = z.infer<typeof upsertTranslationsSchema>;

export interface TranslationResponse {
  id: string;
  listValueId: string;
  language: string;
  label: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Public API response with translations
export interface ListValueOptionTranslated {
  value: string;
  label: string;
  sortOrder: number;
  translations: Record<string, string>;
}
