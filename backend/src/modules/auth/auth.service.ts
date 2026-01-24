/**
 * Auth Service
 * Business logic for authentication
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../core/database/prisma.js';
import { emailService } from '../../services/email.service.js';
import { env } from '../../config/env.js';
import type { RegisterInput, LoginInput, AuthUser, AuthResponse, JwtPayload } from './auth.types.js';

const SALT_ROUNDS = 12;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

class AuthService {
  /**
   * Register a new user with email and password
   */
  async register(input: RegisterInput): Promise<{ success: boolean; error?: string }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      return { success: false, error: 'Email already registered' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        phoneCountry: input.phoneCountry,
        description: input.description,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail({
      to: user.email,
      firstName: user.firstName || 'User',
      verificationToken,
    });

    if (!emailResult.success) {
      console.warn(`Failed to send verification email to ${user.email}: ${emailResult.error}`);
      // Don't fail registration if email fails - user can request resend
    }

    return { success: true };
  }

  /**
   * Login with email and password
   */
  async login(input: LoginInput): Promise<{ success: boolean; data?: AuthResponse; error?: string }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Check if user has a password (might be OAuth-only user)
    if (!user.passwordHash) {
      return { success: false, error: 'Please login with your social account' };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return { success: false, error: 'Please verify your email before logging in' };
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    return {
      success: true,
      data: {
        user: this.sanitizeUser(user),
        token,
      },
    };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return { success: false, error: 'Invalid verification token' };
    }

    // Check if token has expired
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return { success: false, error: 'Verification token has expired' };
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { success: true };
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<{ success: boolean; error?: string }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      return { success: true };
    }

    if (user.emailVerified) {
      return { success: false, error: 'Email is already verified' };
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail({
      to: user.email,
      firstName: user.firstName || 'User',
      verificationToken,
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error };
    }

    return { success: true };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  /**
   * Generate JWT token
   */
  generateToken(userId: string, email: string): string {
    const payload: JwtPayload = { userId, email };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as string,
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Sanitize user object for response (remove sensitive fields)
   */
  private sanitizeUser(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    emailVerified: boolean;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
    };
  }
}

export const authService = new AuthService();
export default authService;
