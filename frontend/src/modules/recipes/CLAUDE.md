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
- [x] ~~Add ingredient autocomplete from master list~~ (fixed 2026-02-07)
- [x] ~~Use LOV-backed dropdown for measurement units~~ (fixed 2026-02-07)
- [ ] Add drag-and-drop step reordering
- [ ] Add recipe duplication feature
- [ ] Add recipe delete confirmation modal

## Fixes Applied

### 2026-02-07: Ingredient unit dropdown + autocomplete in CreateRecipePage
- **Bug**: Ingredient unit was a free-text input; ingredient name had no autocomplete
- **Root Cause**: CreateRecipePage was not wired to useListValues hook or searchIngredients API
- **Fix**: Unit field now uses `<select>` populated from "Measurement Units" LOV. Ingredient name has debounced autocomplete from master_ingredients table with dropdown UI. masterIngredientId is tracked and submitted.

### 2026-02-07: Play mode font size commands ("bigger"/"smaller")
- **Feature**: Added "bigger"/"smaller" voice commands and hint buttons to increase/decrease instruction and ingredient text size
- **Implementation**: `fontScale` state (0.8–1.6, step 0.1) applied via inline `fontSize` style on instruction `<p>` and ingredient names
- **Wake lock**: Already implemented (lines 160-184) — uses `navigator.wakeLock.request('screen')` with visibility change re-acquisition

### 2026-02-07: Play mode help button and "help" voice command
- **Feature**: Added help button (?) in voice control bar that opens an overlay listing all available voice commands with icons and descriptions
- **Voice command**: Saying "help" (or "עזרה" in Hebrew) opens the help overlay AND reads all commands aloud via TTS
- **i18n**: All 11 command descriptions translated (EN + HE) with keyword and description keys

### 2026-02-07: Play mode voice commands, stale ingredients, exit button
- **Bug A**: Voice commands "read instructions" / "read ingredients" not recognized
- **Fix A**: Added keywords to `VOICE_COMMANDS` map; updated hint buttons to show new commands
- **Bug B**: Moving to a step without ingredients showed previous step's ingredient list
- **Fix B**: Added `key={activeStep.id}` to ingredient panel; always render panel, show empty state message when no ingredients
- **Bug C**: No visible way to exit play mode back to recipe details
- **Fix C**: Added exit button (X) in sidebar header (desktop) and voice bar (mobile); added "exit" voice command; Escape key already worked

### 2026-02-07: Smart fuzzy ingredient search with pg_trgm
- **Bug**: Ingredient search only did simple substring matching — couldn't handle typos or word-order swaps
- **Root Cause**: Backend `searchIngredients()` used Prisma `contains` (ILIKE) which requires exact substring
- **Fix**: Enabled PostgreSQL `pg_trgm` extension, added GIN trigram index on `master_ingredients.name`. Search now uses `similarity()` for fuzzy matching plus `ILIKE ALL(array)` for multi-word any-order matching. "vanila extract" and "extract vanilla" both find "vanilla extract".
- **Migration**: `20260207124315_add_pg_trgm_fuzzy_ingredient_search`

### 2026-02-07: Unit dropdown width, keyboard nav, ingredient save on update
- **Bug A**: Unit dropdown too narrow (`w-24`) — "tablespoon" gets cut off
- **Fix A**: Widened unit `<select>` from `w-24` to `w-32`
- **Bug B**: Keyboard navigation not working in ingredient autocomplete dropdown
- **Fix B**: Added `acHighlight` state and `onKeyDown` handler (ArrowUp/Down/Enter/Escape) with visual highlight
- **Bug C**: Ingredients not saved when updating an existing recipe
- **Root Cause C**: Backend `recipe.service.ts` `update()` method ignored `steps` array entirely
- **Fix C**: Added delete-and-recreate logic for steps/ingredients in `update()` (safe due to Prisma cascade deletes)

### 2026-02-07: iPad/iOS voice commands not working
- **Bug**: Voice commands appeared active (green mic, "listening") but never responded to speech on iPad
- **Root Cause**: All iPad browsers use WebKit. Safari's `webkitSpeechRecognition` with `continuous: true` is unreliable — stops after one utterance, and auto-restart in `onend` fails silently because iOS blocks non-user-gesture `.start()` calls
- **Fix**: Detect iOS via user agent; use `continuous: false` (single-shot mode) on iOS; restart recognition with 300ms delay in `onend`; track retry count to avoid infinite silent restarts (stops after 5 retries); handle `not-allowed` error to detect permission denial

### 2026-02-14: Recipe-level prep/cook time now calculated from steps
- **Bug**: CreateRecipePage had manual input fields for recipe `prepTime` and `cookTime` that were disconnected from step-level times
- **Root Cause**: No link between recipe-level and step-level times; manual entry was redundant
- **Fix**: Removed manual inputs. Added `useMemo` that computes totals from step data in real-time using shared `toMinutes()` and `formatTotalTime()` from `utils/time.ts`. Display is read-only with smart formatting (minutes/hours/days). Backend now auto-computes on save.
- **Shared utility**: Extracted `toMinutes()` and `formatTotalTime()` to `frontend/src/utils/time.ts`. RecipePage now imports from there instead of defining locally. `formatTotalTime()` extended to handle days (>24h).

### 2026-02-07: Main navigation menu not visible on mobile
- **Bug**: Main nav bar (Explore, Recipes, Chefs, Community) hidden on screens < 768px with no alternative
- **Root Cause**: `Header.tsx` nav used `hidden md:flex` with no hamburger menu or mobile drawer
- **Fix**: Added hamburger button (visible below `md` breakpoint) that toggles a mobile nav dropdown with icons for all navigation items. Reuses existing i18n translation keys.

---

## Implementation Date

2026-01-31
