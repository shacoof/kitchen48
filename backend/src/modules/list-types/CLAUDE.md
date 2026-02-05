# List Types Module - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module implements configurable dropdown lists (List of Values) for Kitchen48:

1. **List Types** - Categories of values (e.g., "ingredient_categories", "measurement_units")
2. **List Values** - Individual values within each type (e.g., "Vegetables", "Fruits")

---

## Directory Structure

```
backend/src/modules/list-types/
├── CLAUDE.md              # This file
├── listType.types.ts      # TypeScript types and Zod validation schemas
├── listType.service.ts    # Business logic for list types and values
├── listType.controller.ts # Request handlers
└── listType.routes.ts     # Express routes
```

---

## API Endpoints

### List Types

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/list-types` | Admin | Get all list types (with value count) |
| POST | `/api/list-types` | Admin | Create a new list type |
| GET | `/api/list-types/:id` | Admin | Get a single list type |
| PUT | `/api/list-types/:id` | Admin | Update a list type |
| DELETE | `/api/list-types/:id` | Admin | Delete a list type (cascades values) |

### List Values

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/list-types/:listTypeId/values` | Admin | Get all values for a list type |
| POST | `/api/list-types/:listTypeId/values` | Admin | Create a new list value |
| PUT | `/api/list-types/:listTypeId/values/:valueId` | Admin | Update a list value |
| DELETE | `/api/list-types/:listTypeId/values/:valueId` | Admin | Delete a list value |

### Public API (for consuming values in dropdowns)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/list-values?type={typeName}` | Yes | Get active values for a list type by name |

---

## Patterns & Conventions

1. **Admin-only Access**: All management endpoints require admin authentication
2. **Cascade Delete**: Deleting a list type cascades to delete all its values
3. **Unique Constraints**:
   - List type `name` must be unique
   - `(listTypeId, value)` combination must be unique
4. **Sort Order**: Values are returned ordered by `sortOrder` ascending

---

## Request/Response Examples

### Create List Type

```http
POST /api/list-types
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "ingredient_categories",
  "description": "Categories for organizing ingredients"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "cuid...",
    "name": "ingredient_categories",
    "description": "Categories for organizing ingredients",
    "isActive": true,
    "createdAt": "2026-01-31T...",
    "updatedAt": "2026-01-31T..."
  }
}
```

### Create List Value

```http
POST /api/list-types/:listTypeId/values
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "value": "VEGETABLES",
  "label": "Vegetables",
  "description": "Fresh and frozen vegetables",
  "sortOrder": 1
}
```

### Get Active Values (Public)

```http
GET /api/list-values?type=ingredient_categories
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": [
    { "value": "VEGETABLES", "label": "Vegetables", "sortOrder": 1 },
    { "value": "FRUITS", "label": "Fruits", "sortOrder": 2 }
  ]
}
```

---

## Implementation Notes

### 2026-01-31 - Initial Implementation

- Based on yeshplan4 list-types implementation
- Simplified for Kitchen48 (no multi-tenancy, no i18n)
- Uses `requireAdmin` middleware for access control
- Uses central logger (`createLogger`) per CLAUDE.md guidelines

---
