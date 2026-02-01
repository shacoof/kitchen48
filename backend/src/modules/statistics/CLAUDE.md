# Statistics Module - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Overview

Centralized statistics tracking system for Kitchen48. Provides non-blocking event tracking with queued writes and session/device tracking.

---

## Key Files & Structure

```
backend/src/modules/statistics/
├── CLAUDE.md              # This file
├── statistics.types.ts    # TypeScript types, Zod schemas, event type enum
├── statistics.service.ts  # Core service with queue, track(), flush(), getAll()
├── statistics.routes.ts   # Admin-only API endpoints
└── statistics.middleware.ts # Device detection, session handling
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/statistics` | Admin | List all events (with filters) |
| GET | `/api/admin/statistics/sessions` | Admin | List all sessions |

---

## Event Types

| Event Type | Entity Type | Description |
|------------|-------------|-------------|
| `user.login` | user | User logged in |
| `user.register` | user | New user registered |
| `user.logout` | user | User logged out |

Future event types should follow the pattern: `entity.action`

---

## Usage

### Tracking an Event

```typescript
import { statisticsService } from '../statistics/statistics.service.js';

// Non-blocking - returns immediately
statisticsService.track({
  eventType: 'user.login',
  userId: user.id,
  sessionId: req.sessionId,  // From middleware
  metadata: { source: 'email' }
});
```

### Getting Session from Request

```typescript
import { getOrCreateSession } from '../statistics/statistics.middleware.js';

// In route handler
const session = await getOrCreateSession(req);
```

---

## Architecture

### Queue System

Events are queued in memory and flushed to the database in batches:
- Flush every 5 seconds
- OR when queue reaches 100 events
- Graceful shutdown flushes remaining events

```
track() → Queue (in-memory) → flush() → Database
           │                      │
           └──── non-blocking ────┘
```

### Session Tracking

Sessions are identified by a combination of:
- Session cookie (if available)
- User ID (if authenticated)
- Device fingerprint (User-Agent + IP)

Sessions are updated on each request to track `lastActiveAt`.

### Device Detection

Device types: `browser`, `mobile_app`, `tablet`

Detection is based on User-Agent parsing:
- `Kitchen48-Mobile` header → `mobile_app`
- Tablet patterns → `tablet`
- Everything else → `browser`

---

## Database Models

```prisma
model Session {
  id           String   @id
  userId       String?  @map("user_id")
  deviceType   String   @map("device_type")
  userAgent    String?  @map("user_agent")
  ipAddress    String?  @map("ip_address")
  startedAt    DateTime @map("started_at")
  lastActiveAt DateTime @map("last_active_at")
}

model StatEvent {
  id         String   @id
  eventType  String   @map("event_type")
  userId     String?  @map("user_id")
  sessionId  String?  @map("session_id")
  entityType String?  @map("entity_type")
  entityId   String?  @map("entity_id")
  metadata   Json?
  createdAt  DateTime @map("created_at")
}
```

---

## Patterns & Conventions

1. **Event type naming**: `entity.action` (e.g., `user.login`, `recipe.view`)
2. **Non-blocking tracking**: `track()` never awaits database writes
3. **Batch inserts**: Use `createMany` for queue flush
4. **Admin-only access**: Statistics data is sensitive, admin access only

---

## Adding New Event Types

1. Add to `StatEventType` enum in `statistics.types.ts`
2. Call `statisticsService.track()` at the appropriate location
3. Document in this file under "Event Types"

---

## Implementation Date

2026-01-31
