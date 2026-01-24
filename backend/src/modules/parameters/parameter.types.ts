/**
 * Parameter Types
 * TypeScript types and Zod validation schemas for parameters
 */

import { z } from 'zod';
import type { DataType, OwnerType } from '@prisma/client';

// Re-export Prisma enums for convenience
export type { DataType, OwnerType };

// Zod schemas for validation
export const createParameterSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.string().optional(),
  dataType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE', 'COLOR', 'ARRAY']).default('STRING'),
  ownerType: z.enum(['SYSTEM', 'ORGANIZATION', 'USER']).default('SYSTEM'),
  ownerId: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  isEncrypted: z.boolean().default(false),
  defaultValue: z.string().optional(),
  validationRules: z.string().optional(),
});

export const updateParameterSchema = z.object({
  key: z.string().min(1).max(255).optional(),
  value: z.string().optional(),
  dataType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE', 'COLOR', 'ARRAY']).optional(),
  ownerType: z.enum(['SYSTEM', 'ORGANIZATION', 'USER']).optional(),
  ownerId: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  isEncrypted: z.boolean().optional(),
  defaultValue: z.string().optional(),
  validationRules: z.string().optional(),
});

// TypeScript types
export type CreateParameterInput = z.infer<typeof createParameterSchema>;
export type UpdateParameterInput = z.infer<typeof updateParameterSchema>;

export interface Parameter {
  id: string;
  key: string;
  value: string | null;
  dataType: DataType;
  ownerType: OwnerType;
  ownerId: string | null;
  category: string | null;
  description: string | null;
  isEncrypted: boolean;
  defaultValue: string | null;
  validationRules: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
