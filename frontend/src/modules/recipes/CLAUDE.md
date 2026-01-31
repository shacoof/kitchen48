# Recipes Module (Frontend) - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module provides the frontend implementation for recipe viewing and creation:

1. **View Recipes** - Display recipes with semantic URLs (/:nickname/:recipeSlug)
2. **View Steps** - Navigate through individual recipe steps
3. **Create/Edit Recipes** - Form for creating and editing recipes with multi-step support
4. **Ingredient Management** - Per-step ingredients with autocomplete from master list

---

## Directory Structure

```
frontend/src/modules/recipes/
├── CLAUDE.md                       # This file
├── services/
│   └── recipes.api.ts              # API service for all recipe operations
├── pages/
│   ├── RecipePage.tsx              # Full recipe view (/:nickname/:recipeSlug)
│   ├── RecipeStepPage.tsx          # Single step view (/:nickname/:recipeSlug/:stepSlug)
│   └── CreateRecipePage.tsx        # Create/edit recipe form
└── components/
    └── (future components)
```

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/:nickname/:recipeSlug` | RecipePage | View full recipe with all steps |
| `/:nickname/:recipeSlug/:stepSlug` | RecipeStepPage | View single step with navigation |
| `/recipes/new` | CreateRecipePage | Create new recipe |
| `/recipes/:id/edit` | CreateRecipePage | Edit existing recipe |

---

## API Service

The `recipes.api.ts` service provides:

```typescript
// List/search recipes
recipesApi.getRecipes(params)

// Get recipe by ID or semantic URL
recipesApi.getRecipeById(id)
recipesApi.getRecipeBySemanticUrl(nickname, recipeSlug)

// Get step by semantic URL
recipesApi.getStepBySemanticUrl(nickname, recipeSlug, stepSlug)

// Get user's recipes
recipesApi.getUserRecipes(nickname)

// CRUD operations
recipesApi.createRecipe(data)
recipesApi.updateRecipe(id, data)
recipesApi.deleteRecipe(id)

// Step management
recipesApi.addStep(recipeId, data)
recipesApi.updateStep(recipeId, stepId, data)
recipesApi.deleteStep(recipeId, stepId)

// Autocomplete
recipesApi.searchIngredients(query)

// Utility
recipesApi.generateSlug(title)
```

---

## Component Patterns

### RecipePage
- Fetches recipe by semantic URL from route params
- Displays recipe header with image, title, author, metadata
- Lists all steps with ingredients
- Links to individual step pages

### RecipeStepPage
- Fetches single step data
- Displays step with full detail
- Navigation controls (prev/next, step dots)
- Sticky footer for navigation

### CreateRecipePage
- Multi-section form (basic info + steps)
- Dynamic step addition/removal
- Per-step ingredient management
- Auto-generates slug from title
- Supports both create and edit modes

---

## Styling Conventions

- Uses Tailwind CSS classes
- Uses project color variables (bg-primary, text-accent-orange, etc.)
- Material Symbols icons via `<span className="material-symbols-outlined">`
- Rounded cards with shadow: `bg-white rounded-xl shadow-md p-6`

---

## Known Issues & TODOs

- [ ] Add image upload integration (currently URL only)
- [ ] Add video upload/embed support
- [ ] Add ingredient autocomplete from master list
- [ ] Add drag-and-drop step reordering
- [ ] Add recipe duplication feature
- [ ] Add recipe delete confirmation modal

---

## Implementation Date

2026-01-31
