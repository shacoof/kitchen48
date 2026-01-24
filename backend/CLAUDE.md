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

---
