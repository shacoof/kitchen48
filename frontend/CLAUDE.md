# Frontend - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Key Files & Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── LandingPage/          # Public landing page (www.kitchen48.com)
│   │   │   ├── index.tsx         # Main landing page export
│   │   │   ├── Header.tsx        # Sticky navigation header
│   │   │   ├── RecipeCard.tsx    # Reusable recipe card
│   │   │   ├── YourRecipes.tsx   # Horizontal recipe carousel
│   │   │   ├── ChefCard.tsx      # Chef profile card
│   │   │   ├── MeetOurMasters.tsx # Chefs showcase section
│   │   │   ├── TrendingCard.tsx  # Large trending recipe card
│   │   │   ├── WhatsHot.tsx      # Trending recipes section
│   │   │   ├── Newsletter.tsx    # Email subscription form
│   │   │   └── Footer.tsx        # Site footer
│   │   └── AdminLandingPage/     # Admin portal (admin.kitchen48.com)
│   │       ├── index.tsx         # Main admin page (routes based on auth)
│   │       ├── Header.tsx        # Admin header with logout
│   │       ├── LoginForm.tsx     # Admin login form
│   │       ├── Dashboard.tsx     # Admin dashboard (for admins)
│   │       ├── AccessDenied.tsx  # Shown to non-admin users
│   │       └── Footer.tsx        # Admin footer
│   ├── context/
│   │   └── AuthContext.tsx       # Global auth state (user, isAdmin, login, logout)
│   ├── utils/
│   │   └── subdomain.ts          # Subdomain detection utility
│   ├── index.css                 # Global styles & Tailwind
│   ├── main.tsx                  # App entry point
│   └── App.tsx                   # Root component with subdomain routing
├── tailwind.config.js            # Tailwind theme configuration
└── postcss.config.js             # PostCSS for Tailwind
```

---

## Patterns & Conventions

### Styling
- **Tailwind CSS** for all styling
- Custom theme colors defined in `tailwind.config.js`:
  - `primary`: #2C3E50 (dark blue-gray for backgrounds/nav)
  - `accent-green`: #4CAF50 (success, eco elements)
  - `accent-orange`: #FF5722 (buttons, highlights)
  - `background-light`: #f8fafc
  - `background-dark`: #1a252f
- Fonts: Inter (sans), Playfair Display (display headings)
- Material Symbols Outlined for icons

### Component Organization
- Group related components in folders (e.g., `LandingPage/`)
- Export main component from `index.tsx`
- Each section of a page is its own component

### Image Handling
- Currently using external URLs from Google's image hosting
- Replace with local assets or CDN when deploying to production

---

## Implementation Notes

### Landing Page - 2026-01-24
- Converted from Google Stitch HTML prototype (`misc/style_guide/code.html`)
- Color theme defined in `misc/style_guide/Kithcen48 color theme - Sheet1.csv`
- Design reference screenshot: `misc/style_guide/screen.png`
- Uses placeholder images from Google - need to replace for production
- Newsletter form currently client-side only - needs backend integration

### Subdomain Routing - 2026-01-24
- Two landing pages based on subdomain:
  - `www.kitchen48.com` → Public LandingPage
  - `admin.kitchen48.com` → AdminLandingPage (requires login)
- Subdomain detection: `src/utils/subdomain.ts`
- Dev testing: Use `?subdomain=admin` query param
- Auth context: `src/context/AuthContext.tsx`
- Admin users must have `userType === 'admin'` to access admin portal
- Non-admin users see "Access Denied" page after login

### Parameters Feature - 2026-01-24
- Parameters page accessible via admin top bar menu
- Located in `src/components/AdminLandingPage/ParametersPage/`
- Uses Tabulator for data grid (dynamic loading pattern)
- Grid supports inline editing with auto-save
- Custom color picker editor for COLOR data type
- Theme CSS uses Tailwind CSS variables for dark mode consistency
- API calls to `/api/parameters` with Bearer token auth

#### Admin Navigation Pattern
```tsx
// Header.tsx - currentPage state controls which page is shown
const [currentPage, setCurrentPage] = useState<'dashboard' | 'parameters'>('dashboard');

// Navigation buttons with active state
<button
  onClick={() => setCurrentPage('parameters')}
  className={currentPage === 'parameters' ? 'border-b-2 border-accent-orange' : ''}
>
  Parameters
</button>
```

#### Tabulator Usage
- See root `CLAUDE.md` for Tabulator best practices
- Grid theme in `ParametersPage/tabulator-theme.css`
- Uses CSS variables for dark mode support

### Central Logging System - 2026-01-24
- Located in `src/lib/logger.ts`
- **NEVER use `console.log/warn/error`** - always use the logger
- Console-only output (no file logging in browser)
- Same API as backend for consistency

#### Usage Pattern
```typescript
import { createLogger } from '../lib/logger';

const logger = createLogger('MyComponent');

function MyComponent() {
  logger.debug('Component mounted');
  logger.warning('Something concerning');
  logger.error('Something failed');
  logger.object('API response', data);
}
```

#### Log Format (browser console)
```
🔍 DEBUG [2026-01-24 15:30:45] ComponentName: Message
⚠️  WARN [2026-01-24 15:30:46] ComponentName: Warning message
❌ ERROR [2026-01-24 15:30:47] ComponentName: Error message
```

### Header User Menu - 2026-01-26
- Public landing page header shows auth-aware user menu
- When logged out: "Sign In" button links to `/login`
- When logged in: Shows user name with dropdown menu containing "Sign Out"
- Uses `useAuth()` hook from `context/AuthContext.tsx`
- Dropdown closes when clicking outside (useEffect with document click listener)
- Pattern can be reused for other authenticated UI elements

#### User Menu Pattern
```tsx
import { useAuth } from '../../context/AuthContext';

const { user, isAuthenticated, logout } = useAuth();
const [menuOpen, setMenuOpen] = useState(false);

// Close menu when clicking outside
useEffect(() => {
  const handleClickOutside = () => setMenuOpen(false);
  if (menuOpen) {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }
}, [menuOpen]);

// Render: isAuthenticated ? <UserMenu /> : <SignInButton />
```

---
