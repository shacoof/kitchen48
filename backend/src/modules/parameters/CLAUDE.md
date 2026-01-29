# Parameters Module (Backend) - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module implements system configuration parameters:

1. **Parameter Storage**
   - Key-value pairs with metadata
   - Supports multiple data types (STRING, NUMBER, BOOLEAN, JSON, DATE, COLOR)
   - Hierarchical ownership (SYSTEM, ORGANIZATION, USER)

2. **Value Resolution**
   - Hierarchical fallback: USER → ORGANIZATION → SYSTEM
   - Default values if no parameter found

3. **Admin Management**
   - CRUD operations for parameters
   - Admin-only access for management endpoints
   - Category grouping

---

## Directory Structure

```
backend/src/modules/parameters/
├── CLAUDE.md              # This file
├── parameter.routes.ts    # Express routes
├── parameter.service.ts   # Business logic
└── parameter.types.ts     # Zod schemas & TypeScript types
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/parameters` | Admin | List all parameters |
| GET | `/api/parameters/categories` | Admin | List unique categories |
| GET | `/api/parameters/value?key=...` | User | Get parameter value with fallback |
| GET | `/api/parameters/:id` | Admin | Get single parameter |
| POST | `/api/parameters` | Admin | Create parameter |
| PUT | `/api/parameters/:id` | Admin | Update parameter |
| DELETE | `/api/parameters/:id` | Admin | Delete parameter |

---

## Data Model

```prisma
model Parameter {
  id              String      @id @default(cuid())
  key             String
  value           String
  dataType        DataType    @default(STRING)
  ownerType       OwnerType   @default(SYSTEM)
  ownerId         String?
  category        String?
  description     String?
  isActive        Boolean     @default(true)
  isEncrypted     Boolean     @default(false)
  defaultValue    String?
  validationRules Json?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  createdBy       String?
  updatedBy       String?

  @@unique([key, ownerType, ownerId])
}

enum DataType {
  STRING, NUMBER, BOOLEAN, JSON, DATE, COLOR
}

enum OwnerType {
  SYSTEM, ORGANIZATION, USER
}
```

---

## Value Resolution Logic

When fetching a parameter value via `/api/parameters/value`:

```
1. If userId provided → Look for USER-level parameter
2. If not found and organizationId provided → Look for ORGANIZATION-level
3. If not found → Look for SYSTEM-level
4. If not found → Return defaultValue or null
```

---

## Patterns & Conventions

### Logging Parameters
The central logging system uses these parameters:
- `system.logging.console.minLevel` - Console output filter (debug/warning/error)
- `system.logging.timezone` - Timestamp timezone (e.g., `Asia/Jerusalem`)

### Creating New System Parameters
1. Add to seed script: `backend/prisma/seed.ts`
2. Use `upsert` for idempotency
3. Document in this file

---

## Known System Parameters

| Key | Data Type | Default | Description |
|-----|-----------|---------|-------------|
| `system.logging.console.minLevel` | STRING | `error` | Min log level for console |
| `system.logging.timezone` | STRING | `Asia/Jerusalem` | Log timestamp timezone |

---

## Known Issues & TODOs

- [ ] Add parameter caching layer
- [ ] Add bulk import/export
- [ ] Add parameter history/versioning
- [ ] Add encryption for sensitive values
- [ ] Add validation rule enforcement

---

## Implementation Date

2026-01-24
