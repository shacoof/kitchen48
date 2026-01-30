# Ingredients Module (Backend) - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module manages the master ingredients catalog:

1. **Master Ingredients Catalog**
   - Reference list of all known ingredients
   - Used for autocomplete, standardization, and recipe creation
   - Distinct from `RecipeIngredient` which stores per-recipe amounts

2. **Admin Management**
   - CRUD operations for ingredients
   - Admin-only access for management endpoints
   - Category grouping support

---

## Directory Structure

```
backend/src/modules/ingredients/
├── CLAUDE.md               # This file
├── ingredient.routes.ts    # Express routes
├── ingredient.service.ts   # Business logic
└── ingredient.types.ts     # Zod schemas & TypeScript types
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/ingredients` | Admin | List all master ingredients |
| GET | `/api/ingredients/categories` | Admin | List unique categories |
| GET | `/api/ingredients/:id` | Admin | Get single ingredient |
| POST | `/api/ingredients` | Admin | Create ingredient |
| PUT | `/api/ingredients/:id` | Admin | Update ingredient |
| DELETE | `/api/ingredients/:id` | Admin | Delete ingredient |

---

## Data Model

```prisma
model MasterIngredient {
  id          String   @id @default(cuid())
  name        String   @unique           # Lowercase, unique
  category    String?                    # Optional grouping
  description String?                    # Optional notes
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("master_ingredients")
}
```

**Note:** This is separate from `RecipeIngredient` which stores per-recipe amounts:

```prisma
model RecipeIngredient {
  id       String  @id @default(cuid())
  name     String
  amount   String?  # e.g., "2 cups"
  order    Int
  recipeId String
  recipe   Recipe

  @@map("recipe_ingredients")
}
```

---

## Patterns & Conventions

### Name Normalization
- All ingredient names are stored lowercase
- Names are trimmed of whitespace
- Uniqueness enforced at database level

### Seeding
- Initial data from `misc/ingredients.txt` (1000+ ingredients)
- Seed script uses upsert to avoid duplicates
- Run: `cd backend && npm run db:seed`

---

## Known Issues & TODOs

- [ ] Add search endpoint for autocomplete
- [ ] Add bulk import/export
- [ ] Link to RecipeIngredient for standardization
- [ ] Add nutrition data fields
- [ ] Add allergen tags

---

## Implementation Date

2026-01-30
