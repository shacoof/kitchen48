# List Types Module (Frontend) - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

Admin interface for managing configurable dropdown lists (List of Values) in Kitchen48.

---

## Directory Structure

```
frontend/src/modules/list-types/
├── CLAUDE.md                           # This file
└── components/
    ├── ListTypeManagement.tsx          # Master-detail coordinator
    ├── ListTypesGrid.tsx               # Tabulator grid for list types
    └── ListValuesGrid.tsx              # Tabulator grid for list values
```

---

## Components

### ListTypeManagement

Master-detail view coordinator:
- Renders ListTypesGrid (top, 200px)
- Renders ListValuesGrid (bottom, 400px)
- Manages selected list type state
- Auto-selects first list type on load

### ListTypesGrid

Tabulator grid for list types:
- Columns: Actions, Select (radio), Name, Description, Active, Value Count
- Inline editing with save-on-blur
- Add/Delete/Refresh buttons
- Radio button selection for master-detail

### ListValuesGrid

Tabulator grid for list values:
- Shows values for selected list type
- Columns: Actions, Value, Label, Description, Sort Order, Active
- Inline editing with save-on-blur
- Add/Delete/Refresh buttons
- Conditional rendering based on selection

---

## API Integration

| Endpoint | Used By |
|----------|---------|
| GET /api/list-types | ListTypesGrid (load) |
| POST /api/list-types | ListTypesGrid (add) |
| PUT /api/list-types/:id | ListTypesGrid (edit) |
| DELETE /api/list-types/:id | ListTypesGrid (delete) |
| GET /api/list-types/:id/values | ListValuesGrid (load) |
| POST /api/list-types/:id/values | ListValuesGrid (add) |
| PUT /api/list-types/:id/values/:valueId | ListValuesGrid (edit) |
| DELETE /api/list-types/:id/values/:valueId | ListValuesGrid (delete) |

---

## Patterns & Conventions

1. **Tabulator Event Handlers**: Use `table.on('cellEdited', handler)` method, not options object
2. **Empty String Handling**: Backend handles `""` → `null` conversion
3. **Auth Token**: Get from `localStorage.getItem('token')`
4. **Error Display**: Use `alert()` for now (toast system to be added later)

---

## Implementation Notes

### 2026-01-31 - Initial Implementation

- Based on yeshplan4 list-types components
- Simplified for Kitchen48 (no i18n, simpler auth)
- Uses Tabulator 6.x with inline editing
- Admin-only access (requires admin login)

---
