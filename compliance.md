# Kitchen48 — Project Compliance Profile

This file defines the mandatory rules, patterns, and constraints for the Kitchen48 project. Every agent in the orchestrator pipeline MUST follow these rules. Violations are blocking issues.

---

## Stack

- **Frontend**: React + Vite (port 5173)
- **Backend**: Node.js + Express (port 3000)
- **Database**: PostgreSQL 16 (Docker local port 5433, Cloud SQL production)
- **ORM**: Prisma (singleton import from `@/core/database/prisma`)
- **Styling**: Database-driven theme tokens as CSS variables
- **Grids**: Tabulator 6
- **i18n**: react-i18next with JSON locale files
- **Languages**: English (en), Hebrew (he) with RTL support
- **Architecture**: BFF — single Cloud Run container, nginx serves frontend, proxies `/api/*` to Express

---

## Project Structure

```
frontend/
  src/
    modules/[module-name]/
      components/    hooks/    pages/    services/
      CLAUDE.md      ← each module must have one
backend/
  src/
    modules/[module-name]/
      [module].routes.ts    [module].controller.ts
      [module].service.ts   [module].types.ts
      CLAUDE.md
```

---

## Mandatory Rules

### 1. Logging
- **USE**: `createLogger('Name')` from `../lib/logger.js` (backend) or `../lib/logger` (frontend)
- **NEVER**: `console.log`, `console.warn`, `console.error`
- Log levels: `debug`, `warning`, `error`, `object`, `timing`

### 2. Internationalization (i18n)
- **USE**: `useTranslation('namespace')` + `t('key.subkey')` from `react-i18next`
- **NEVER**: Hardcoded user-facing strings in any language
- Namespaces: `common`, `auth`, `profile`, `landing`, `admin`
- Translation files: `frontend/src/locales/{lang}/{namespace}.json`
- Always add keys to BOTH `en/` and `he/` locale files
- Dynamic content (LOV values): use `list_value_translations` table

### 3. Database Access
- **USE**: `import { prisma } from '@/core/database/prisma'` (singleton)
- **NEVER**: `new PrismaClient()` (connection leak)
- **Multi-tenancy**: Use `getFilteredPrisma(userId)` for organization-scoped data
- **Naming**: TypeScript `camelCase` → DB `snake_case` via `@map()` / `@@map()`
- **Foreign keys**: `userId` → `@map("user_id")`
- **Timestamps**: `createdAt` → `@map("created_at")`

### 4. Database Safety
- **FORBIDDEN**: `prisma migrate reset`, `db push --force-reset`, `DROP`, `TRUNCATE`, `DELETE FROM` without WHERE
- **SAFE**: `prisma migrate dev --name ...`, `migrate status`, `migrate deploy`, `prisma generate`, `prisma studio`
- New LOV/reference data: use data migrations in `backend/prisma/data-migrations/` (NOT manual SQL or seed.ts)

### 5. Permissions
- Backend: RBAC enforced per route
- Check permissions before protected operations

### 6. Styling
- **USE**: Theme tokens as CSS variables (e.g., `var(--colors-primary)`)
- **NEVER**: Custom CSS color/spacing values
- If a needed token doesn't exist, explain why and request approval

### 7. Tabulator Grids
- **USE**: `table.on('eventName', handler)` for event handlers
- **NEVER**: Put callbacks like `cellEdited` in the options object (they may not fire)
- Handle empty strings in backend: Tabulator sends `""` when fields are cleared → convert to null
- Use `string` sorter for dates (not `datetime` which requires luxon)
- Container must have explicit height; include `minWidth: 0` for flex containers

### 8. Auto-Save Pattern
- **No Save/Cancel buttons** on edit forms — all edits auto-save with debounce
- Create buttons are OK (creation ≠ save)
- Show status indicator: "Saving..." → "All changes saved" (fades 2s) → "Error saving"
- Debounce intervals: text inputs 1000ms, complex forms 1500ms, dropdowns/checkboxes 800ms
- Guard against auto-save firing during initial data load
- Clean up timers on unmount

### 9. Responsive Design
- **Three breakpoints**: Desktop ≥ 1024px, Tablet 768–1023px, Mobile < 768px
- Mobile-first CSS with `min-width` media queries
- Touch targets ≥ 44px on mobile/tablet
- No horizontal scrolling at any viewport
- No fixed pixel widths — use relative units

### 10. Statistics Tracking
- Every new feature must consider trackable user events
- Use `statisticsService.track()` — never write directly to `stat_events`
- Event type format: `entity.action` (e.g., `recipe.view`, `user.login`)
- Non-blocking — tracking failures must not affect user experience

### 11. Module Documentation
- Every module must have a `CLAUDE.md` file documenting: requirements, structure, API endpoints, patterns, known issues
- Update module CLAUDE.md when making changes to that module

### 12. Build & Dependencies
- Run `npm run build` before final commit — must pass with no errors
- Install new packages immediately when adding imports (`npm install <package>`)
- Commit `package-lock.json` with dependency changes

---

## Commit Conventions

- Pre-edit commit before any changes: `git commit -m "Before [task description]"`
- Incremental commits after each logical unit
- Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`

---

## Testing

### Framework
- **Frontend**: Vitest + React Testing Library + jsdom
- **Backend**: Vitest + Supertest
- **E2E**: Playwright (Chromium)

### File Convention: Co-located Tests
Tests live **next to the code they test** — NOT in a separate `__tests__` tree.

```
# Unit/Component tests
src/modules/recipes/components/RecipeCard.tsx
src/modules/recipes/components/RecipeCard.test.tsx     ← same directory

# Integration tests (backend API)
src/modules/auth/auth.routes.ts
src/modules/auth/auth.routes.test.ts                   ← same directory

# E2E tests
e2e/modules/auth/login.spec.ts                         ← tagged @module:auth
e2e/modules/recipes/recipe-crud.spec.ts                ← tagged @module:recipes
```

### 3-Tier Test Commands

| Tier | Command | What it runs | When |
|------|---------|-------------|------|
| **Local** | `npm run test:local` | Only tests for files changed since last commit | During development |
| **Module** | `npm run test:module -w backend -- src/modules/auth` | All tests in a module path | Before pushing branch |
| **Full** | `npm run test:full` | All unit + integration + E2E tests | Before merge to main |

Additional commands:
- `npm run test:frontend` / `npm run test:backend` — run all tests for one workspace
- `npm run test:e2e` — run Playwright E2E tests only
- `npm run test:e2e:ui` — run Playwright with interactive UI

### Test Utilities (in `testing/` at project root)

| File | Purpose |
|------|---------|
| `setup/frontend.ts` | Jest-dom matchers, localStorage mock, i18n mock, matchMedia mock |
| `setup/backend.ts` | Env vars, Prisma mock, logger mock |
| `helpers/render.tsx` | `renderWithProviders()` — wraps components with auth + router providers |
| `helpers/api.ts` | `createTestRouter()` — creates supertest instance for route testing |
| `factories/user.ts` | `createUser()`, `createAdminUser()`, `createRegisterInput()`, `createLoginInput()` |

### Rules
- Every new module must include unit tests for services and components
- Use `vi.mock()` for external dependencies — never hit real APIs or DB in unit tests
- Integration tests use Supertest with mocked Prisma (or test DB for full integration)
- E2E tests tag with `@module:<name>` for module-level filtering
- Test file naming: `{filename}.test.ts` (unit/integration), `{name}.spec.ts` (E2E)

---

## Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Admin Portal | http://localhost:5173/?subdomain=admin |
| Prisma Studio | http://localhost:5555 |
| pgAdmin | http://localhost:5051 |
| Production | https://www.kitchen48.com |
