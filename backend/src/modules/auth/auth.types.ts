/**
 * Auth Module Types
 */

import { z } from 'zod';

// ============================================================================
// Request Schemas (Zod validation)
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  phoneCountry: z.string().length(2, 'Country code must be 2 characters (e.g., US, IL)').optional(),
  description: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export type UserType = 'regular' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  profilePicture: string | null;
  emailVerified: boolean;
  userType: UserType;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}
