/**
 * Statistics Types
 * TypeScript types and Zod schemas for statistics tracking
 */

import { z } from 'zod';

// ============================================================================
// Event Types
// ============================================================================

export const StatEventTypes = {
  // User events
  USER_LOGIN: 'user.login',
  USER_REGISTER: 'user.register',
  USER_LOGOUT: 'user.logout',
  // Recipe events (for future use)
  RECIPE_VIEW: 'recipe.view',
  RECIPE_CREATE: 'recipe.create',
  RECIPE_EDIT: 'recipe.edit',
  RECIPE_DELETE: 'recipe.delete',
  // Video events (for future use)
  VIDEO_PLAY: 'video.play',
  VIDEO_COMPLETE: 'video.complete',
} as const;

export type StatEventType = typeof StatEventTypes[keyof typeof StatEventTypes];

// ============================================================================
// Device Types
// ============================================================================

export const DeviceTypes = {
  BROWSER: 'browser',
  MOBILE_APP: 'mobile_app',
  TABLET: 'tablet',
} as const;

export type DeviceType = typeof DeviceTypes[keyof typeof DeviceTypes];

// ============================================================================
// Zod Schemas
// ============================================================================

export const trackEventSchema = z.object({
  eventType: z.string().min(1),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;

export const getStatsQuerySchema = z.object({
  eventType: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  entityType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
});

export type GetStatsQuery = z.infer<typeof getStatsQuerySchema>;

// ============================================================================
// Response Types
// ============================================================================

export interface StatEventRecord {
  id: string;
  eventType: string;
  userId: string | null;
  sessionId: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  createdAt: Date;
  user?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  session?: {
    deviceType: string;
    userAgent: string | null;
  } | null;
}

export interface SessionRecord {
  id: string;
  userId: string | null;
  deviceType: string;
  userAgent: string | null;
  ipAddress: string | null;
  startedAt: Date;
  lastActiveAt: Date;
  user?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  _count?: {
    events: number;
  };
}

// ============================================================================
// Request Context
// ============================================================================

export interface RequestContext {
  userId?: string;
  sessionId?: string;
  deviceType: DeviceType;
  userAgent?: string;
  ipAddress?: string;
}
