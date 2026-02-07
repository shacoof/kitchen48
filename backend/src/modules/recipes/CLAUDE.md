# Recipes Module - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module implements the recipe management system allowing users to:
- Create, read, update, and delete recipes
- Add steps with ingredients, work time, and wait time
- Access recipes via semantic URLs (/:nickname/:recipe-slug/:step-slug)
- Search master ingredients for autocomplete

---

## Directory Structure

```
recipes/
├── CLAUDE.md              # This file
├── recipe.routes.ts       # API endpoints
├── recipe.service.ts      # Business logic
└── recipe.types.ts        # Zod schemas & types
```

---

## API Endpoints

### Recipe CRUD

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/recipes` | No | List recipes (paginated, filterable) |
| GET | `/api/recipes/:id` | No* | Get recipe by ID |
| POST | `/api/recipes` | Yes | Create new recipe |
| PUT | `/api/recipes/:id` | Yes | Update recipe (owner only) |
| DELETE | `/api/recipes/:id` | Yes | Delete recipe (owner only) |

*Unpublished recipes only visible to author

### Step Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/recipes/:id/steps` | Yes | Add step to recipe |
| PUT | `/api/recipes/:id/steps/:stepId` | Yes | Update step |
| DELETE | `/api/recipes/:id/steps/:stepId` | Yes | Delete step |

### Semantic URL Endpoints (via Users module)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/:nickname/recipes` | No | List user's public recipes |
| GET | `/api/users/:nickname/recipes/:recipeSlug` | No | Get recipe by semantic URL |
| GET | `/api/users/:nickname/recipes/:recipeSlug/:stepSlug` | No | Get specific step |

### Utilities

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/recipes/search-ingredients?q=...` | No | Search master ingredients |

---

## Database Models

### Recipe
- `id` - CUID primary key
- `title` - Recipe name (max 80 chars)
- `slug` - URL-friendly identifier, unique per author
- `description` - Optional full description
- `prepTime`, `cookTime` - In minutes
- `servings` - Number of servings
- `imageUrl` - Recipe picture
- `videoUrl` - Intro video
- `isPublished` - Visibility flag
- `authorId` - FK to User

**Unique constraint:** `[authorId, slug]`

### Step
- `id` - CUID primary key
- `slug` - URL-friendly step name (unique within recipe)
- `instruction` - Step description (mandatory)
- `order` - Step order (0-indexed)
- `duration` - Voice playback timing (seconds)
- `videoUrl` - Short video (up to 1 min)
- `workTime` + `workTimeUnit` - Active work time
- `waitTime` + `waitTimeUnit` - Passive wait time (oven, rising, etc.)

**Unique constraint:** `[recipeId, slug]`

### StepIngredient
- `id` - CUID primary key
- `name` - Ingredient name (from master or custom)
- `amount` - e.g., "2 cups", "1 tbsp"
- `order` - Display order
- `stepId` - FK to Step
- `masterIngredientId` - Optional FK to MasterIngredient

---

## Patterns & Conventions

### Slug Generation
```typescript
// Convert title to URL-friendly slug
const slug = title
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .substring(0, 80);
```

### TimeUnit Enum
Values: `SECONDS`, `MINUTES`, `HOURS`, `DAYS`

### Authorization Pattern
- Create: Authenticated user becomes author
- Read: Published = public, Unpublished = author only
- Update/Delete: Author only

### Error Messages
- `'Recipe not found'` - 404
- `'You can only edit your own recipes'` - 403
- `'You already have a recipe with this URL slug'` - 409

---

## Implementation Notes

### Recipe Creation - 2026-01-31
- Steps and ingredients can be created in single transaction
- Step slug defaults to `step{order+1}` if not provided
- Ingredients can reference master table via `masterIngredientId`

### Semantic URLs - 2026-01-31
- Routes added to users.routes.ts to keep URL structure clean
- Step lookup supports both custom slug and generated `step1`, `step2`, etc.
- Only published recipes are accessible via semantic URLs

---

## Known Issues & TODOs

- [ ] Add recipe image upload integration
- [ ] Add video upload/URL validation
- [ ] Add step reordering endpoint
- [ ] Add bulk step update endpoint
- [ ] Add recipe duplication/fork feature
- [ ] Add recipe versioning

---

## Implementation Date

2026-01-31
