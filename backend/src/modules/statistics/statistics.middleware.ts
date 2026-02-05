/**
 * Statistics Middleware
 * Request context extraction for session and device tracking
 */

import { Request, Response, NextFunction } from 'express';
import { statisticsService } from './statistics.service.js';
import type { RequestContext } from './statistics.types.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      statisticsContext?: RequestContext;
    }
  }
}

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string | undefined {
  // Check for forwarded headers (behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
    return ips.split(',')[0].trim();
  }

  // Check for real IP header (nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0];
  }

  // Fall back to connection remote address
  return req.socket?.remoteAddress;
}

/**
 * Middleware to extract statistics context from request
 * Attaches device type, user agent, and IP address to request object
 */
export function extractStatisticsContext(req: Request, _res: Response, next: NextFunction): void {
  const userAgent = req.headers['user-agent'];
  const ipAddress = getClientIp(req);
  const deviceType = statisticsService.detectDeviceType(userAgent);

  req.statisticsContext = {
    userId: req.userId, // Set by auth middleware
    deviceType,
    userAgent,
    ipAddress,
  };

  next();
}

/**
 * Get or create a session for the current request
 * Should be called after auth middleware has set req.userId
 */
export async function getRequestSession(req: Request): Promise<string | undefined> {
  if (!req.statisticsContext) {
    return undefined;
  }

  try {
    const sessionId = await statisticsService.getOrCreateSession({
      ...req.statisticsContext,
      userId: req.userId, // May have been set by auth middleware after extractStatisticsContext
    });
    return sessionId;
  } catch {
    return undefined;
  }
}

/**
 * Helper to track an event from a request handler
 */
export function trackEvent(
  req: Request,
  eventType: string,
  options?: {
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    sessionId?: string;
  }
): void {
  statisticsService.track({
    eventType,
    userId: req.userId,
    sessionId: options?.sessionId,
    entityType: options?.entityType,
    entityId: options?.entityId,
    metadata: {
      ...options?.metadata,
      deviceType: req.statisticsContext?.deviceType,
      ipAddress: req.statisticsContext?.ipAddress,
    },
  });
}
