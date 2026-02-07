# List of Values (LOV) Feature - Requirements Document

## Overview

This document defines the requirements for implementing a **List of Values (LOV)** feature in Kitchen48, based on the implementation patterns from yeshplan4. The LOV feature provides a mechanism for managing configurable dropdown lists that can be used throughout the application.

---

## 1. Business Requirements

### 1.1 Purpose

The List of Values feature allows administrators to:
- Define **list types** (categories of values, e.g., "Ingredient Categories", "Measurement Units", "Cuisine Types")
- Manage **list values** within each type (e.g., for "Cuisine Types": Italian, Mexican, Asian, etc.)
- Use these values as dropdown options throughout the application

### 1.2 Use Cases in Kitchen48

| List Type | Example Values | Used In |
|-----------|----------------|---------|
| Ingredient Categories | Vegetables, Fruits, Dairy, Meat, Spices | Ingredient management |
| Measurement Units | grams, ml, cups, tablespoons, pieces | Recipe ingredients |
| Cuisine Types | Italian, Mexican, Asian, Mediterranean | Recipe categorization |
| Difficulty Levels | Easy, Medium, Hard, Expert | Recipe metadata |
| Dietary Restrictions | Vegan, Vegetarian, Gluten-Free, Dairy-Free | Recipe filtering |
| Recipe Status | Draft, Published, Archived | Recipe workflow |

### 1.3 Benefits

1. **Centralized Management**: All dropdown values managed in one place
2. **Consistency**: Same values used across the application
3. **Flexibility**: Admins can add/modify values without code changes
4. **Internationalization Ready**: Values can be extended for multi-language support

---

## 2. Data Model

### 2.1 Database Schema

```prisma
model ListType {
  id          String      @id @default(cuid())
  name        String      @unique
  description String?
  isActive    Boolean     @default(true) @map("is_active")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  values      ListValue[]

  @@map("list_types")
}

model ListValue {
  id          String   @id @default(cuid())
  listTypeId  String   @map("list_type_id")
  value       String   // Internal code/key (e.g., "VEGETABLE")
  label       String   // Display text (e.g., "Vegetable")
  description String?
  sortOrder   Int      @default(0) @map("sort_order")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  listType    ListType @relation(fields: [listTypeId], references: [id], onDelete: Cascade)

  @@unique([listTypeId, value])
  @@map("list_values")
}
```

### 2.2 Field Descriptions

#### ListType
| Field | Type | Description |
|-------|------|-------------|
| id | CUID | Unique identifier |
| name | String | Unique name for the list type (e.g., "ingredient_categories") |
| description | String? | Optional description of the list type |
| isActive | Boolean | Whether the list type is active |
| values | ListValue[] | Related list values |

#### ListValue
| Field | Type | Description |
|-------|------|-------------|
| id | CUID | Unique identifier |
| listTypeId | String | Foreign key to ListType |
| value | String | Internal code/key (used in code, stored in DB) |
| label | String | Display text (shown to users) |
| description | String? | Optional description/help text |
| sortOrder | Int | Order for display (0 = first) |
| isActive | Boolean | Whether the value is active |

### 2.3 Constraints

- `ListType.name` must be unique
- `(listTypeId, value)` combination must be unique (no duplicate values within a list type)
- Deleting a ListType cascades to delete all its ListValues

---

## 3. API Endpoints

### 3.1 List Types API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/list-types` | Admin | Get all list types (with value count) |
| POST | `/api/list-types` | Admin | Create a new list type |
| PUT | `/api/list-types/:id` | Admin | Update a list type |
| DELETE | `/api/list-types/:id` | Admin | Delete a list type (cascades values) |

### 3.2 List Values API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/list-types/:listTypeId/values` | Admin | Get all values for a list type |
| POST | `/api/list-types/:listTypeId/values` | Admin | Create a new list value |
| PUT | `/api/list-types/:listTypeId/values/:valueId` | Admin | Update a list value |
| DELETE | `/api/list-types/:listTypeId/values/:valueId` | Admin | Delete a list value |

### 3.3 Public API (for dropdown consumption)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/list-values?type={typeName}` | Yes | Get active values for a list type by name |

### 3.4 Response Formats

**GET /api/list-types**
```json
{
  "success": true,
  "listTypes": [
    {
      "id": "cuid...",
      "name": "ingredient_categories",
      "description": "Categories for ingredients",
      "isActive": true,
      "createdAt": "2026-01-31T...",
      "updatedAt": "2026-01-31T...",
      "_count": {
        "values": 5
      }
    }
  ]
}
```

**GET /api/list-types/:id/values**
```json
{
  "success": true,
  "listValues": [
    {
      "id": "cuid...",
      "listTypeId": "cuid...",
      "value": "VEGETABLES",
      "label": "Vegetables",
      "description": "Fresh and frozen vegetables",
      "sortOrder": 1,
      "isActive": true
    }
  ]
}
```

---

## 4. Frontend Components

### 4.1 Component Structure

```
frontend/src/modules/list-types/
├── CLAUDE.md
├── components/
│   ├── ListTypeManagement.tsx    # Master-detail coordinator
│   ├── ListTypesGrid.tsx         # Master grid for list types
│   └── ListValuesGrid.tsx        # Detail grid for values
├── hooks/
│   └── useListValues.ts          # Hook for consuming list values
└── services/
    └── listTypeService.ts        # API calls
```

### 4.2 ListTypeManagement Component

**Purpose**: Master-detail view for managing list types and their values.

**Features**:
- Two-grid layout:
  - **Top (200px)**: ListTypesGrid - shows all list types
  - **Bottom (500px)**: ListValuesGrid - shows values for selected list type
- Radio button selection to choose active list type
- Auto-select first list type on load

### 4.3 ListTypesGrid Component

**Features**:
- Tabulator-based grid
- Columns: Actions, Select (radio), Name, Description, Active, Value Count
- Inline editing with save-on-blur
- Add/Delete/Refresh/Download CSV buttons
- Header filters for searching

### 4.4 ListValuesGrid Component

**Features**:
- Tabulator-based grid (conditional on list type selection)
- Columns: Actions, Value, Label, Description, Sort Order, Active
- Inline editing with save-on-blur
- Add/Delete/Refresh/Download CSV buttons
- Header filters for searching

### 4.5 useListValues Hook (for consumers)

```typescript
/**
 * Hook for fetching list values by type name
 *
 * @param typeName - The name of the list type (e.g., "ingredient_categories")
 * @returns { values, loading, error, refresh }
 */
function useListValues(typeName: string) {
  // Returns active values ordered by sortOrder
  // Cached with SWR for performance
}
```

---

## 5. Admin UI Integration

### 5.1 Menu Location

Add to admin navigation under Settings:
- Path: `/admin/settings/list-types`
- Label: "List of Values" or "Lookup Tables"
- Icon: List or Database icon

### 5.2 Access Control

- **Required Role**: Admin only
- Regular users cannot access the management interface
- Regular users can only consume values via hooks

---

## 6. Implementation Guidelines

### 6.1 Kitchen48 Compliance Checklist

- [ ] **Logging**: Use `createLogger('ListTypesController')` - never `console.log`
- [ ] **Database naming**: `camelCase` in TypeScript, `snake_case` in DB via `@map()`
- [ ] **Prisma singleton**: Import from `@/core/database/prisma`
- [ ] **Module structure**: Create `CLAUDE.md` in the module directory
- [ ] **No forbidden DB commands**: Never use `migrate reset`, `db push --force-reset`
- [ ] **Tabulator best practices**: Use `on()` for event handlers, handle empty strings

### 6.2 Patterns from yeshplan4 to Adapt

| yeshplan4 Pattern | Kitchen48 Equivalent |
|-------------------|---------------------|
| `getFilteredPrisma(userId)` | Direct Prisma (single-tenant for now) |
| `permissionService.hasPermission()` | `requireAdmin` middleware |
| `useTranslation()` | Skip for now (English only) |
| `getTranslationsForUser()` | Skip for now (English only) |

### 6.3 Differences from yeshplan4

1. **No Multi-Tenancy**: Kitchen48 is currently single-tenant, so no organization filtering needed
2. **No i18n**: English-only for now, no translation hooks
3. **Simpler Auth**: Use existing `requireAdmin` middleware instead of permission service
4. **Express.js**: Use Express routes instead of Next.js API routes

---

## 7. Seed Data

### 7.1 Initial List Types

Create these list types with seed data:

```typescript
const seedListTypes = [
  {
    name: 'ingredient_categories',
    description: 'Categories for organizing ingredients',
    values: [
      { value: 'VEGETABLES', label: 'Vegetables', sortOrder: 1 },
      { value: 'FRUITS', label: 'Fruits', sortOrder: 2 },
      { value: 'DAIRY', label: 'Dairy', sortOrder: 3 },
      { value: 'MEAT', label: 'Meat & Poultry', sortOrder: 4 },
      { value: 'SEAFOOD', label: 'Seafood', sortOrder: 5 },
      { value: 'GRAINS', label: 'Grains & Pasta', sortOrder: 6 },
      { value: 'SPICES', label: 'Spices & Herbs', sortOrder: 7 },
      { value: 'OILS', label: 'Oils & Fats', sortOrder: 8 },
      { value: 'CONDIMENTS', label: 'Condiments & Sauces', sortOrder: 9 },
      { value: 'OTHER', label: 'Other', sortOrder: 99 },
    ]
  },
  {
    name: 'measurement_units',
    description: 'Units of measurement for recipe ingredients',
    values: [
      { value: 'G', label: 'grams', sortOrder: 1 },
      { value: 'KG', label: 'kilograms', sortOrder: 2 },
      { value: 'ML', label: 'milliliters', sortOrder: 3 },
      { value: 'L', label: 'liters', sortOrder: 4 },
      { value: 'TSP', label: 'teaspoon', sortOrder: 5 },
      { value: 'TBSP', label: 'tablespoon', sortOrder: 6 },
      { value: 'CUP', label: 'cup', sortOrder: 7 },
      { value: 'PCS', label: 'pieces', sortOrder: 8 },
      { value: 'PINCH', label: 'pinch', sortOrder: 9 },
    ]
  },
  {
    name: 'cuisine_types',
    description: 'Types of cuisine for recipe categorization',
    values: [
      { value: 'ITALIAN', label: 'Italian', sortOrder: 1 },
      { value: 'MEXICAN', label: 'Mexican', sortOrder: 2 },
      { value: 'ASIAN', label: 'Asian', sortOrder: 3 },
      { value: 'MEDITERRANEAN', label: 'Mediterranean', sortOrder: 4 },
      { value: 'AMERICAN', label: 'American', sortOrder: 5 },
      { value: 'FRENCH', label: 'French', sortOrder: 6 },
      { value: 'INDIAN', label: 'Indian', sortOrder: 7 },
      { value: 'MIDDLE_EASTERN', label: 'Middle Eastern', sortOrder: 8 },
      { value: 'OTHER', label: 'Other', sortOrder: 99 },
    ]
  },
  {
    name: 'difficulty_levels',
    description: 'Recipe difficulty levels',
    values: [
      { value: 'EASY', label: 'Easy', sortOrder: 1 },
      { value: 'MEDIUM', label: 'Medium', sortOrder: 2 },
      { value: 'HARD', label: 'Hard', sortOrder: 3 },
      { value: 'EXPERT', label: 'Expert', sortOrder: 4 },
    ]
  }
];
```

---

## 8. Testing Approach

### 8.1 Backend Tests

1. **API Tests**:
   - CRUD operations for list types
   - CRUD operations for list values
   - Cascade delete behavior
   - Unique constraint validation
   - Authorization checks

### 8.2 Frontend Tests

1. **Component Tests**:
   - Grid rendering
   - Selection behavior
   - Inline editing
   - Add/Delete operations

### 8.3 Integration Tests

1. **End-to-End**:
   - Full CRUD workflow through UI
   - Consuming values in dropdowns

---

## 9. Future Enhancements

### 9.1 Phase 2 Considerations

1. **Multi-Language Labels**: Add `translations` relation for i18n
2. **Value Dependencies**: Values that depend on other values
3. **Custom Validation**: Per-list-type validation rules
4. **Import/Export**: Bulk import from CSV/JSON
5. **Usage Tracking**: Track where each list type is used

### 9.2 Integration Points

When implementing recipes and ingredients, use list values for:
- Ingredient category dropdown (linked to master ingredients)
- Measurement unit dropdown (linked to recipe ingredients)
- Cuisine type dropdown (linked to recipes)
- Difficulty dropdown (linked to recipes)

---

## 10. Implementation Priority

### High Priority (MVP)
1. Database schema (ListType, ListValue)
2. Backend API (CRUD for both)
3. Admin UI (ListTypeManagement component)
4. Seed data for initial list types

### Medium Priority
1. useListValues hook for consumers
2. Integration with existing dropdowns

### Lower Priority
1. CSV import/export
2. Usage analytics

---

## References

- **Source Implementation**: yeshplan4 (`/home/owner/yeshplan4/src/features/list-types/`)
- **Prisma Schema**: yeshplan4 (`/home/owner/yeshplan4/prisma/schema.prisma` lines 227-253)
- **API Routes**: yeshplan4 (`/home/owner/yeshplan4/src/app/api/list-types/`)

---

*Document created: 2026-01-31*
*Based on: yeshplan4 list-types implementation*
