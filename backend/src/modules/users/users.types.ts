/**
 * Users Module Types
 */

import { z } from 'zod';

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Preprocess helper: Convert empty strings to null
 * This is needed because Tabulator's input editor returns "" when a field is cleared,
 * but our validation expects null for empty optional fields.
 */
const emptyStringToNull = (val: unknown) => (val === '' ? null : val);

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Nickname validation: 3-30 chars, starts with letter, alphanumeric + underscore
 */
export const nicknameSchema = z
  .string()
  .min(3, 'Nickname must be at least 3 characters')
  .max(30, 'Nickname must be at most 30 characters')
  .regex(/^[a-z][a-z0-9_]{2,29}$/, 'Nickname must start with a letter and contain only lowercase letters, numbers, and underscores');

/**
 * Update own profile schema
 * Uses preprocess to convert empty strings to null for consistency
 */
export const updateProfileSchema = z.object({
  nickname: z.preprocess(emptyStringToNull, nicknameSchema.optional()),
  firstName: z.preprocess(emptyStringToNull, z.string().min(1).optional()),
  lastName: z.preprocess(emptyStringToNull, z.string().min(1).optional()),
  phone: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  phoneCountry: z.preprocess(emptyStringToNull, z.string().length(2).optional().nullable()),
  description: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  videoLanguage: z.string().min(2).max(5).optional(),
  interfaceLanguage: z.string().min(2).max(5).optional(),
});

/**
 * Admin update user schema
 * Uses preprocess to convert empty strings to null (Tabulator sends "" for cleared fields)
 */
export const adminUpdateUserSchema = z.object({
  nickname: z.preprocess(emptyStringToNull, nicknameSchema.optional().nullable()),
  firstName: z.preprocess(emptyStringToNull, z.string().min(1).optional().nullable()),
  lastName: z.preprocess(emptyStringToNull, z.string().min(1).optional().nullable()),
  phone: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  phoneCountry: z.preprocess(emptyStringToNull, z.string().length(2).optional().nullable()),
  description: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  emailVerified: z.boolean().optional(),
  userType: z.enum(['regular', 'admin']).optional(),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

/**
 * Public user profile (visible to anyone)
 */
export interface PublicUserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  profilePicture: string | null;
  description: string | null;
}

/**
 * Full user profile (visible to owner/admin)
 */
export interface FullUserProfile extends PublicUserProfile {
  email: string;
  phone: string | null;
  phoneCountry: string | null;
  emailVerified: boolean;
  userType: 'regular' | 'admin';
  videoLanguage: string;
  interfaceLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Admin user list item
 */
export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  profilePicture: string | null;
  emailVerified: boolean;
  userType: 'regular' | 'admin';
  videoLanguage: string;
  interfaceLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}
