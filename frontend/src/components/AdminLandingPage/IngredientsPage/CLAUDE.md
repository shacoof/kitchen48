# Admin Ingredients Page - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module provides admin management for master ingredients:

1. **Ingredients List**
   - Display all master ingredients in a Tabulator grid
   - Show key fields (name, category, description, active status)
   - Filter and sort capabilities

2. **Inline Editing**
   - Edit fields directly in the grid
   - Auto-save on cell change
   - Validation with error feedback

3. **CRUD Operations**
   - Add new ingredients
   - Edit existing ingredients
   - Delete ingredients
   - Refresh data

---

## Directory Structure

```
frontend/src/components/AdminLandingPage/IngredientsPage/
├── CLAUDE.md            # This file
├── index.tsx            # Page wrapper
└── IngredientsGrid.tsx  # Tabulator data grid
```

---

## API Integration

### Endpoints Used
```typescript
// Fetch all ingredients
GET /api/ingredients
Headers: Authorization: Bearer <token>

// Create ingredient
POST /api/ingredients
Body: { name, category?, description?, isActive? }

// Update ingredient
PUT /api/ingredients/:id
Body: { name?, category?, description?, isActive? }

// Delete ingredient
DELETE /api/ingredients/:id
```

---

## Tabulator Pattern

Follows the same pattern as ParametersPage and UsersPage:
- Dynamic module loading
- Container with explicit height
- Uses shared CSS theme (tabulator-theme.css)
- Inline editing with auto-save via `on('cellEdited')` method

---

## Column Configuration

| Column | Field | Editable | Filter |
|--------|-------|----------|--------|
| Name | name | Yes | Yes |
| Category | category | Yes | Yes |
| Description | description | Yes | Yes |
| Active | isActive | Yes (checkbox) | Yes |
| Actions | - | Delete button | No |

---

## Implementation Date

2026-01-30
