/**
 * Statistics Service
 * Business logic for event tracking with queued writes
 */

import { prisma } from '../../core/database/prisma.js';
import { Prisma } from '@prisma/client';
import { createLogger } from '../../lib/logger.js';
import type {
  TrackEventInput,
  GetStatsQuery,
  StatEventRecord,
  SessionRecord,
  DeviceType,
  RequestContext,
} from './statistics.types.js';
import { DeviceTypes } from './statistics.types.js';

const logger = createLogger('StatisticsService');

// Queue configuration
const FLUSH_INTERVAL_MS = 5000; // 5 seconds
const MAX_QUEUE_SIZE = 100;

// In-memory queue for events
interface QueuedEvent extends TrackEventInput {
  createdAt: Date;
}

class StatisticsService {
  private eventQueue: QueuedEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor() {
    this.startFlushTimer();
    this.setupGracefulShutdown();
  }

  /**
   * Start the periodic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        logger.error(`Failed to flush event queue: ${err.message}`);
      });
    }, FLUSH_INTERVAL_MS);
  }

  /**
   * Setup graceful shutdown to flush remaining events
   */
  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      logger.debug('Shutting down statistics service, flushing remaining events...');

      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }

      await this.flush();
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

  /**
   * Track an event (non-blocking)
   * Adds event to queue and returns immediately
   */
  track(event: TrackEventInput): void {
    if (this.isShuttingDown) {
      logger.warning('Cannot track event during shutdown');
      return;
    }

    const queuedEvent: QueuedEvent = {
      ...event,
      createdAt: new Date(),
    };

    this.eventQueue.push(queuedEvent);
    logger.debug(`Event queued: ${event.eventType} (queue size: ${this.eventQueue.length})`);

    // Flush immediately if queue is full
    if (this.eventQueue.length >= MAX_QUEUE_SIZE) {
      this.flush().catch((err) => {
        logger.error(`Failed to flush full queue: ${err.message}`);
      });
    }
  }

  /**
   * Flush queued events to database
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await prisma.statEvent.createMany({
        data: eventsToFlush.map((event) => ({
          eventType: event.eventType,
          userId: event.userId || null,
          sessionId: event.sessionId || null,
          entityType: event.entityType || null,
          entityId: event.entityId || null,
          metadata: (event.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
          createdAt: event.createdAt,
        })),
      });

      logger.debug(`Flushed ${eventsToFlush.length} events to database`);
    } catch (error) {
      // Re-queue failed events
      this.eventQueue = [...eventsToFlush, ...this.eventQueue];
      throw error;
    }
  }

  /**
   * Get all events with optional filters (for admin dashboard)
   */
  async getAll(query: GetStatsQuery): Promise<{ events: StatEventRecord[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (query.eventType) {
      where.eventType = query.eventType;
    }
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.sessionId) {
      where.sessionId = query.sessionId;
    }
    if (query.entityType) {
      where.entityType = query.entityType;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(query.startDate);
      }
      if (query.endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(query.endDate);
      }
    }

    const [events, total] = await Promise.all([
      prisma.statEvent.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          session: {
            select: {
              deviceType: true,
              userAgent: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.statEvent.count({ where }),
    ]);

    return { events, total };
  }

  /**
   * Get all sessions (for admin dashboard)
   */
  async getSessions(limit = 100, offset = 0): Promise<{ sessions: SessionRecord[]; total: number }> {
    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              events: true,
            },
          },
        },
        orderBy: { lastActiveAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.session.count(),
    ]);

    return { sessions, total };
  }

  /**
   * Get or create a session for a request
   */
  async getOrCreateSession(context: RequestContext): Promise<string> {
    // Try to find existing session by user ID (if authenticated)
    if (context.userId) {
      const existingSession = await prisma.session.findFirst({
        where: {
          userId: context.userId,
          deviceType: context.deviceType,
          // Session is still active if last activity was within 30 minutes
          lastActiveAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000),
          },
        },
        orderBy: { lastActiveAt: 'desc' },
      });

      if (existingSession) {
        // Update last active time
        await prisma.session.update({
          where: { id: existingSession.id },
          data: { lastActiveAt: new Date() },
        });
        return existingSession.id;
      }
    }

    // Create new session
    const session = await prisma.session.create({
      data: {
        userId: context.userId || null,
        deviceType: context.deviceType,
        userAgent: context.userAgent || null,
        ipAddress: context.ipAddress || null,
      },
    });

    logger.debug(`Created new session: ${session.id} (device: ${context.deviceType})`);
    return session.id;
  }

  /**
   * Update session with user ID (after login)
   */
  async updateSessionUser(sessionId: string, userId: string): Promise<void> {
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { userId, lastActiveAt: new Date() },
      });
    } catch (error) {
      logger.warning(`Failed to update session user: ${error}`);
    }
  }

  /**
   * Get unique event types for filter dropdown
   */
  async getEventTypes(): Promise<string[]> {
    const result = await prisma.statEvent.findMany({
      select: { eventType: true },
      distinct: ['eventType'],
      orderBy: { eventType: 'asc' },
    });

    return result.map((r) => r.eventType);
  }

  /**
   * Detect device type from User-Agent
   */
  detectDeviceType(userAgent?: string): DeviceType {
    if (!userAgent) return DeviceTypes.BROWSER;

    // Check for mobile app (custom header we'll set in the app)
    if (userAgent.includes('Kitchen48-Mobile')) {
      return DeviceTypes.MOBILE_APP;
    }

    // Check for tablet
    if (/iPad|Android.*Tablet|Tablet/i.test(userAgent)) {
      return DeviceTypes.TABLET;
    }

    // Default to browser (includes mobile browsers)
    return DeviceTypes.BROWSER;
  }
}

export const statisticsService = new StatisticsService();
export default statisticsService;
