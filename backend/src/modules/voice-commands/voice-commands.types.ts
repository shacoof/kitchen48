/**
 * Voice Commands Module Types
 */

import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

export const createVoiceCommandSchema = z.object({
  command: z.string().min(1).max(50),
  keywords: z.array(z.string().min(1)).min(1),
  icon: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateVoiceCommandSchema = z.object({
  command: z.string().min(1).max(50).optional(),
  keywords: z.array(z.string().min(1)).min(1).optional(),
  icon: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const upsertTranslationSchema = z.object({
  language: z.string().min(2).max(5),
  displayKeyword: z.string().min(1),
  description: z.string().min(1),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type CreateVoiceCommandInput = z.infer<typeof createVoiceCommandSchema>;
export type UpdateVoiceCommandInput = z.infer<typeof updateVoiceCommandSchema>;
export type UpsertTranslationInput = z.infer<typeof upsertTranslationSchema>;

export interface VoiceCommandTranslation {
  id: string;
  language: string;
  displayKeyword: string;
  description: string;
}

export interface VoiceCommand {
  id: string;
  command: string;
  keywords: string[];
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  translations: VoiceCommandTranslation[];
  createdAt: Date;
  updatedAt: Date;
}
