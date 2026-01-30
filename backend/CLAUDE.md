# Backend - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Key Files & Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Database seeding script
├── src/
│   ├── index.ts               # Express app entry point
│   ├── core/
│   │   ├── config/env.ts      # Environment variables
│   │   └── database/prisma.ts # Prisma singleton
│   └── modules/
│       └── auth/
│           ├── auth.routes.ts      # Auth endpoints
│           ├── auth.controller.ts  # Request handlers
│           ├── auth.service.ts     # Business logic
│           ├── auth.middleware.ts  # JWT & admin middleware
│           ├── auth.types.ts       # Zod schemas & types
│           └── passport.ts         # Google OAuth config
```

---

## Patterns & Conventions

### Database Naming
- TypeScript fields: `camelCase` (e.g., `userType`)
- Database columns: `snake_case` via `@map()` (e.g., `user_type`)
- Tables: `snake_case` plural via `@@map()` (e.g., `users`)

### Authentication
- JWT tokens with `jsonwebtoken` library
- Passwords hashed with `bcryptjs` (12 salt rounds)
- Two middleware functions:
  - `requireAuth` - Mandatory authentication
  - `requireAdmin` - Admin-only access (checks `userType === 'admin'`)

### API Response Pattern
```typescript
// Success
res.status(200).json({ data: result });

// Error
res.status(400).json({ error: 'Error message' });
```

---

## Implementation Notes

### User Types - 2026-01-24
- Added `UserType` enum: `regular`, `admin`
- Field: `userType` (TypeScript) → `user_type` (database)
- Default value: `regular`
- Admin middleware: `requireAdmin` checks user type
- Default admin user: `shacoof@gmail.com`

### Parameters Feature - 2026-01-24
- Parameters stored in `parameters` table (Prisma model: `Parameter`)
- Supports data types: STRING, NUMBER, BOOLEAN, JSON, DATE, COLOR
- Owner types: SYSTEM (global), ORGANIZATION, USER
- Unique constraint on `[key, ownerType, ownerId]`
- Admin-only access for CRUD operations

#### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parameters` | List all parameters |
| POST | `/api/parameters` | Create parameter |
| GET | `/api/parameters/:id` | Get single parameter |
| PUT | `/api/parameters/:id` | Update parameter |
| DELETE | `/api/parameters/:id` | Delete parameter |

#### Parameter Model Fields
- `key` - Unique identifier within scope
- `value` - String value (stored as text)
- `dataType` - STRING, NUMBER, BOOLEAN, JSON, DATE, COLOR
- `ownerType` - SYSTEM, ORGANIZATION, USER
- `ownerId` - Owner ID (null for SYSTEM)
- `category` - Optional grouping
- `description` - Optional description
- `isEncrypted` - Flag for sensitive values
- `defaultValue` - Fallback value
- `validationRules` - JSON validation schema

### Central Logging System - 2026-01-24
- Located in `src/lib/logger.ts`
- **NEVER use `console.log/warn/error`** - always use the logger

#### Usage Pattern
```typescript
import { createLogger } from '../lib/logger.js';

class MyService {
  private logger = createLogger('MyService');

  async doSomething() {
    this.logger.debug('Starting operation');
    this.logger.warning('Something concerning');
    this.logger.error('Something failed');
    this.logger.object('Data received', data);
    this.logger.timing('Operation', startTime);
  }
}
```

#### Database Parameters
| Key | Default | Description |
|-----|---------|-------------|
| `system.logging.console.minLevel` | `error` | Console output filter (debug/warning/error) |
| `system.logging.timezone` | `Asia/Jerusalem` | Timestamp timezone |

#### File Output
- Daily logs: `logs/YYYY-MM-DD.log`
- Error-only: `logs/error.log`
- 30-day retention, 50MB max file size
- Files are auto-created and rotated

#### Log Format
```
🔍 DEBUG [2026-01-24 15:30:45] ServiceName: Message
⚠️  WARN [2026-01-24 15:30:46] ServiceName: Warning message
❌ ERROR [2026-01-24 15:30:47] ServiceName: Error message
```

### User Profile Feature - 2026-01-30

Added user profile support with nicknames and profile pictures.

#### New User Model Fields
```prisma
nickname       String?   @unique @map("nickname")
profilePicture String?   @map("profile_picture")
```

#### Nickname Generation Logic
1. Take first letter of firstName + full lastName (lowercase, no spaces/special chars)
2. If collision, append incrementing number (`jsmith`, `jsmith2`, `jsmith3`)
3. Validation: 3-30 chars, alphanumeric + underscore only, lowercase

#### Users Module (`src/modules/users/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/:nickname` | No | Get public profile by nickname |
| GET | `/api/users/me/profile` | Yes | Get own full profile |
| PUT | `/api/users/me/profile` | Yes | Update own profile |

#### Admin Users Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/users/:id` | Admin | Get user by ID |
| PUT | `/api/admin/users/:id` | Admin | Update user |

#### Upload Module (`src/modules/upload/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/profile-picture` | Yes | Upload profile picture |

- Uses `multer` for file handling
- File validation: JPEG, PNG, WebP only, max 5MB
- Storage: `uploads/` directory (dev), configurable for cloud (prod)
- Static serving: `/uploads/:filename`

---
