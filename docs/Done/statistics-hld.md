# Statistics Module - High-Level Design

## Overview

Centralized statistics tracking system for Kitchen48. Tracks user activity, session information, and application events with non-blocking writes and queued batch inserts.

---

## Requirements

### Core Requirements
1. **Login history** - Track each login with user, device, and timestamp
2. **Recipe interactions** - Track views, plays, and other interactions (future)
3. **Session tracking** - Group events by user session
4. **Device detection** - Track device type (browser, mobile app, tablet)
5. **Centralized storage** - All statistics in one place for easy querying

### Non-Functional Requirements
- **Non-blocking** - Statistics tracking should never slow down user requests
- **Queued writes** - Batch database writes for performance
- **Admin-only access** - Statistics data is sensitive, admin access only

---

## Architecture

### Queue System

```
┌─────────────────────────────────────────────────────────────┐
│  Application Code                                           │
│  statisticsService.track({ type: 'user.login', ... })       │
└─────────────────┬───────────────────────────────────────────┘
                  │ (non-blocking, immediate return)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  In-Memory Queue (Array)                                    │
│  [event1, event2, event3, ...]                              │
└─────────────────┬───────────────────────────────────────────┘
                  │ (flush every 5s OR when 100 events)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Database: stat_events table                                │
│  createMany({ data: [...events] })                          │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Sessions table
CREATE TABLE sessions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  device_type VARCHAR NOT NULL,  -- 'browser', 'mobile_app', 'tablet'
  user_agent TEXT,
  ip_address VARCHAR,
  started_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

-- Statistics events table
CREATE TABLE stat_events (
  id VARCHAR PRIMARY KEY,
  event_type VARCHAR NOT NULL,   -- e.g., 'user.login', 'recipe.view'
  user_id VARCHAR REFERENCES users(id),
  session_id VARCHAR REFERENCES sessions(id),
  entity_type VARCHAR,           -- e.g., 'recipe', 'user'
  entity_id VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stat_events_type ON stat_events(event_type);
CREATE INDEX idx_stat_events_user ON stat_events(user_id);
CREATE INDEX idx_stat_events_session ON stat_events(session_id);
CREATE INDEX idx_stat_events_created ON stat_events(created_at);
```

---

## Event Types

### Currently Implemented

| Event Type | Entity Type | Description |
|------------|-------------|-------------|
| `user.login` | user | User logged in (email or OAuth) |
| `user.register` | user | New user registered |

### Future Event Types

| Event Type | Entity Type | Description |
|------------|-------------|-------------|
| `user.logout` | user | User logged out |
| `recipe.view` | recipe | Recipe page viewed |
| `recipe.create` | recipe | Recipe created |
| `recipe.edit` | recipe | Recipe edited |
| `recipe.delete` | recipe | Recipe deleted |
| `video.play` | video | Video started playing |
| `video.complete` | video | Video watched to completion |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/statistics` | Admin | List all events (with filters) |
| GET | `/api/admin/statistics/sessions` | Admin | List all sessions |
| GET | `/api/admin/statistics/event-types` | Admin | Get unique event types |

### Query Parameters for GET /api/admin/statistics

| Parameter | Type | Description |
|-----------|------|-------------|
| `eventType` | string | Filter by event type |
| `userId` | string | Filter by user ID |
| `sessionId` | string | Filter by session ID |
| `entityType` | string | Filter by entity type |
| `startDate` | string | Filter events after this date |
| `endDate` | string | Filter events before this date |
| `limit` | number | Max results (default: 100, max: 1000) |
| `offset` | number | Pagination offset |

---

## Usage

### Tracking Events

```typescript
import { statisticsService } from '../statistics/statistics.service.js';
import { StatEventTypes } from '../statistics/statistics.types.js';

// Track a login event
statisticsService.track({
  eventType: StatEventTypes.USER_LOGIN,
  userId: user.id,
  entityType: 'user',
  entityId: user.id,
  metadata: {
    deviceType: 'browser',
    loginMethod: 'email',
  },
});
```

### Device Detection

```typescript
const userAgent = req.headers['user-agent'];
const deviceType = statisticsService.detectDeviceType(userAgent);
// Returns: 'browser' | 'mobile_app' | 'tablet'
```

---

## Admin Dashboard

The Statistics page in the admin portal provides:
- Read-only Tabulator grid with all events
- Column filters for searching
- Sorting by any column
- Color-coded event types for quick scanning
- Device type icons
- Total event count

---

## Implementation Date

2026-01-31
