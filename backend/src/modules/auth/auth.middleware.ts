/**
 * Auth Middleware
 * JWT authentication middleware for protected routes
 */

import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { prisma } from '../../core/database/prisma.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * Require authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Authorization header missing',
      });
      return;
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: 'Invalid authorization header format',
      });
      return;
    }

    const token = parts[1];

    // Verify token
    const payload = authService.verifyToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Attach user info to request
    req.userId = payload.userId;
    req.userEmail = payload.email;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
}

/**
 * Optional authentication middleware
 * If token is present and valid, attaches user info
 * If token is missing or invalid, continues without error
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = parts[1];
    const payload = authService.verifyToken(token);

    if (payload) {
      req.userId = payload.userId;
      req.userEmail = payload.email;
    }

    next();
  } catch {
    // Silently continue without authentication
    next();
  }
}

/**
 * Require admin middleware
 * Must be used after requireAuth middleware
 * Checks if the authenticated user has admin role
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { userType: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    if (user.userType !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authorization error',
    });
  }
}
