# Admin Users Page - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module provides admin user management for Kitchen48:

1. **User List**
   - Display all users in a Tabulator grid
   - Show key user fields (email, name, nickname, userType, etc.)
   - Filter and sort capabilities

2. **Inline Editing**
   - Edit user fields directly in the grid
   - Auto-save on cell change
   - Validation with error feedback

3. **User Fields**
   - Email (read-only - cannot change)
   - First Name, Last Name
   - Nickname
   - User Type (regular/admin)
   - Email Verified status
   - Created At (read-only)

---

## Directory Structure

```
frontend/src/components/AdminLandingPage/UsersPage/
├── CLAUDE.md       # This file
├── index.tsx       # Page wrapper
└── UsersGrid.tsx   # Tabulator data grid
```

---

## API Integration

### Endpoints Used
```typescript
// Fetch all users
GET /api/admin/users
Headers: Authorization: Bearer <token>

// Update user
PUT /api/admin/users/:id
Body: { firstName, lastName, nickname, userType, emailVerified }
```

---

## Tabulator Pattern

Follows the same pattern as ParametersPage:
- Dynamic module loading
- Container with explicit height
- Uses same CSS theme (tabulator-theme.css)
- Inline editing with auto-save

---

## Column Configuration

| Column | Field | Editable | Filter |
|--------|-------|----------|--------|
| Email | email | No | Yes |
| First Name | firstName | Yes | Yes |
| Last Name | lastName | Yes | Yes |
| Nickname | nickname | Yes | Yes |
| User Type | userType | Yes (dropdown) | Yes |
| Verified | emailVerified | Yes (checkbox) | Yes |
| Created | createdAt | No | No |

---

## Implementation Date

2026-01-30
