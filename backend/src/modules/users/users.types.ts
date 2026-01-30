/**
 * Users Module Types
 */

import { z } from 'zod';

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
 */
export const updateProfileSchema = z.object({
  nickname: nicknameSchema.optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  phoneCountry: z.string().length(2).optional().nullable(),
  description: z.string().optional().nullable(),
});

/**
 * Admin update user schema
 */
export const adminUpdateUserSchema = z.object({
  nickname: nicknameSchema.optional().nullable(),
  firstName: z.string().min(1).optional().nullable(),
  lastName: z.string().min(1).optional().nullable(),
  phone: z.string().optional().nullable(),
  phoneCountry: z.string().length(2).optional().nullable(),
  description: z.string().optional().nullable(),
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
  createdAt: Date;
  updatedAt: Date;
}
