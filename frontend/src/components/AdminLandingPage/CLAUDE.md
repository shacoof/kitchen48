# Admin Portal Module - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module implements the admin portal for Kitchen48 (admin.kitchen48.com):

1. **Access Control**
   - Only users with `userType === 'admin'` can access
   - Non-admin users see "Access Denied" page
   - Unauthenticated users see login form

2. **Dashboard**
   - Admin overview with quick stats
   - Navigation to admin features

3. **Parameters Management**
   - Tabulator-based data grid
   - Inline editing with auto-save
   - Custom color picker editor

---

## Directory Structure

```
frontend/src/components/AdminLandingPage/
├── CLAUDE.md              # This file
├── index.tsx              # Main component (routes based on auth)
├── Header.tsx             # Admin header with navigation
├── Footer.tsx             # Admin footer
├── LoginForm.tsx          # Admin login form
├── Dashboard.tsx          # Admin dashboard
├── AccessDenied.tsx       # Shown to non-admin users
└── ParametersPage/
    ├── index.tsx          # Parameters page wrapper
    └── ParametersGrid.tsx # Tabulator data grid
```

---

## Access Flow

```
User visits admin.kitchen48.com
         │
         ▼
    Is authenticated?
    ├── NO  → Show LoginForm
    └── YES → Is admin?
              ├── NO  → Show AccessDenied
              └── YES → Show Dashboard/Content
```

---

## Components

### index.tsx (Main Router)
- Checks auth state from `useAuth()`
- Routes to appropriate component based on auth status
- Manages current page state (dashboard, parameters, etc.)

### Header
- Admin navigation bar
- Page switcher (Dashboard, Parameters)
- User menu with logout
- Active page indicator (orange underline)

### LoginForm
- Email/password login
- Calls `authApi.login()`
- Shows error messages

### AccessDenied
- Friendly message for non-admin users
- Link to public site

### Dashboard
- Quick stats cards (placeholder)
- Welcome message
- Quick actions

### ParametersPage / ParametersGrid
- Uses Tabulator for data grid
- Features:
  - Inline editing (click cell to edit)
  - Auto-save on cell change
  - Column sorting and filtering
  - Custom color picker for COLOR type
  - Dark theme styling

---

## Navigation Pattern

```tsx
// In Header.tsx
const [currentPage, setCurrentPage] = useState<'dashboard' | 'parameters'>('dashboard');

// Navigation buttons with active state
<button
  onClick={() => setCurrentPage('parameters')}
  className={currentPage === 'parameters' ? 'border-b-2 border-accent-orange' : ''}
>
  Parameters
</button>
```

---

## Tabulator Usage

See root `CLAUDE.md` for full Tabulator best practices.

Key points:
- Dynamic loading to avoid SSR issues
- Container must have explicit height
- Uses CSS variables for theme consistency
- Custom editor pattern for COLOR type

---

## API Integration

### Parameters API
```typescript
// Fetch all parameters
GET /api/parameters
Headers: Authorization: Bearer <token>

// Update parameter
PUT /api/parameters/:id
Body: { value, dataType, category, ... }
```

---

## Subdomain Routing

- Production: `admin.kitchen48.com` → Admin Portal
- Development: `localhost:5173/?subdomain=admin` (query param)
- Detection: `src/utils/subdomain.ts`

---

## Known Issues & TODOs

- [ ] Add more dashboard widgets (user stats, recipe stats)
- [ ] Add user management page
- [ ] Add recipe moderation page
- [ ] Add audit log viewer
- [ ] Add system health monitoring
- [ ] Improve mobile responsiveness

---

## Implementation Date

2026-01-24
