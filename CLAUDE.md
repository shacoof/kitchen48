# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Database

- **PostgreSQL 16** via Docker (local) or Cloud SQL (production)
- **Prisma ORM** for type-safe database access
- Schema: `backend/prisma/schema.prisma`
- Local port: **5433** (to avoid conflicts with other projects)

### Database Commands

```bash
# Start database (auto-runs with npm run dev)
npm run db:start

# Stop database
npm run db:stop

# View database logs
npm run db:logs

# Run migrations (development)
cd backend && npm run db:migrate

# Deploy migrations (production)
cd backend && npm run db:migrate:deploy

# View data in browser (Prisma Studio)
cd backend && npm run db:studio

# Check migration status
cd backend && npm run db:status
```

### pgAdmin (Database GUI)

```bash
# Start pgAdmin
docker compose up -d pgadmin
```

- **URL:** http://localhost:5051
- **Email:** `admin@kitchen48.com`
- **Password:** `admin123`

**Server connection settings:**
- Host: `postgres` (container name)
- Port: `5432`
- Database: `kitchen48_dev`
- Username: `kitchen48_user`
- Password: `kitchen48_dev_password`

### Database Connection

```typescript
// ALWAYS import from the singleton
import { prisma } from '@/core/database/prisma';

// Use it directly
const users = await prisma.user.findMany();
```

### Database Naming Conventions

**Rule:** All database columns use `snake_case`, TypeScript fields use `camelCase`.

Prisma's `@map()` directive handles the translation:

```prisma
model User {
  firstName String? @map("first_name")  // DB column: first_name
  createdAt DateTime @map("created_at") // DB column: created_at
}
```

**Guidelines:**
- Always add `@map("snake_case_name")` for multi-word fields
- Table names use `@@map("plural_snake_case")` (e.g., `@@map("users")`)
- Foreign keys: `userId` maps to `user_id`
- Timestamps: `createdAt` maps to `created_at`
- Booleans: `isPublished` maps to `is_published`

---

## Project Structure

- **frontend/**: React + Vite application
- **backend/**: Node.js + Express API server
- Both services use npm workspaces from the root

### Production Architecture (BFF - Backend-for-Frontend)

```
┌─────────────────────────────────────────────────────────────┐
│              Cloud Run (kitchen48-app)                       │
│                  www.kitchen48.com                           │
├─────────────────────────────────────────────────────────────┤
│  nginx (port 8080)                                          │
│  ├── /*        → /usr/share/nginx/html (React SPA)          │
│  └── /api/*    → localhost:3000 (Node.js backend)           │
│                         │                                    │
│                   Node.js Express                            │
│                    (port 3000)                               │
└─────────────────────────────────────────────────────────────┘
                         │
                   ┌─────┴─────┐
                   │ Cloud SQL │
                   │ PostgreSQL│
                   └───────────┘
```

**Key Files:**
- `Dockerfile` - Combined multi-stage build (frontend + backend)
- `nginx.conf` - nginx config with `/api/*` proxy
- `supervisord.conf` - Process manager for nginx + Node.js

---

## Module Structure & Documentation

### Convention

Each feature/module in this project should:
1. Have its own dedicated directory
2. Include a `CLAUDE.md` file documenting that module

### Directory Structure

```
frontend/
├── CLAUDE.md                    # Frontend-level documentation
└── src/
    └── modules/
        └── [module-name]/       # e.g., auth, recipes, users
            ├── CLAUDE.md        # Module-specific documentation
            ├── components/      # React components
            ├── hooks/           # Custom hooks
            ├── pages/           # Page components (routes)
            └── services/        # API calls

backend/
├── CLAUDE.md                    # Backend-level documentation
└── src/
    ├── config/                  # App configuration (env, passport, etc.)
    ├── core/                    # Core utilities (database, etc.)
    ├── lib/                     # Shared libraries (logger, etc.)
    └── modules/
        └── [module-name]/       # e.g., auth, parameters, recipes
            ├── CLAUDE.md        # Module-specific documentation
            ├── [module].routes.ts
            ├── [module].controller.ts
            ├── [module].service.ts
            ├── [module].middleware.ts (if needed)
            └── [module].types.ts
```

### Module CLAUDE.md Template

Each module's `CLAUDE.md` should include:

```markdown
# [Module Name] - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

[What this module does, user-facing features]

---

## Directory Structure

[Tree view of files in this module]

---

## API Endpoints (backend modules)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| ...    | ...      | ...  | ...         |

---

## Patterns & Conventions

[Module-specific patterns, naming conventions, etc.]

---

## Known Issues & TODOs

- [ ] [Pending items]

---

## Implementation Date

[YYYY-MM-DD]
```

### Existing Module Documentation

| Module | Location | CLAUDE.md |
|--------|----------|-----------|
| Auth (Backend) | `backend/src/modules/auth/` | ✅ Exists |
| Auth (Frontend) | `frontend/src/modules/auth/` | ✅ Exists |
| Parameters | `backend/src/modules/parameters/` | ✅ Exists |
| Landing Page | `frontend/src/components/LandingPage/` | ✅ Exists |
| Admin Portal | `frontend/src/components/AdminLandingPage/` | ✅ Exists |

### When to Create a New Module

Create a new module directory when:
- Adding a new feature area (e.g., recipes, orders, notifications)
- The feature has 3+ related files (routes, service, components)
- The feature has its own API endpoints

**Always create the module's CLAUDE.md first** to document requirements before implementing.

---

## ⚠️ CENTRAL LOGGING - MANDATORY ⚠️

**NEVER use `console.log`, `console.warn`, or `console.error` in this codebase.**

Always use the central logging system instead:

### Backend Usage
```typescript
import { createLogger } from '../lib/logger.js';

const logger = createLogger('ServiceName');

logger.debug('Debug message');           // For development info
logger.warning('Warning message');       // For concerning situations
logger.error('Error message');           // For errors
logger.object('Description', data);      // For logging objects
logger.timing('Operation', startTime);   // For performance timing
```

### Frontend Usage
```typescript
import { createLogger } from '../lib/logger';

const logger = createLogger('ComponentName');

logger.debug('Component mounted');
logger.error('API call failed');
```

### Why This Matters
- **Consistent format**: All logs have caller ID, timestamp, severity icons
- **File logging**: Backend logs written to `logs/YYYY-MM-DD.log`
- **Configurable**: Console level controlled via database parameter
- **Searchable**: Caller names make logs easy to filter

### Database Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| `system.logging.console.minLevel` | `error` | Console filter (debug/warning/error) |
| `system.logging.timezone` | `Asia/Jerusalem` | Timestamp timezone |

### Log Output Format
```
🔍 DEBUG [2026-01-24 15:30:45] AuthService: User login attempt
⚠️  WARN [2026-01-24 15:30:46] EmailService: Rate limit approaching
❌ ERROR [2026-01-24 15:30:47] AuthController: Registration failed
```

---

## Application URLs

### Development (Local)

| Service | URL | Description |
|---------|-----|-------------|
| Frontend (Public) | http://localhost:5173 | Public landing page |
| Frontend (Admin) | http://localhost:5173/?subdomain=admin | Admin portal (use query param for testing) |
| Backend API | http://localhost:3000 | Express API server |
| API Health Check | http://localhost:3000/api/health | Backend health endpoint |
| Prisma Studio | http://localhost:5555 | Database GUI (run `cd backend && npm run db:studio`) |
| pgAdmin | http://localhost:5051 | PostgreSQL admin GUI |

### Production

| Service | URL | Description |
|---------|-----|-------------|
| Application | https://www.kitchen48.com | Single service (frontend + API) |
| Admin Portal | https://www.kitchen48.com/?subdomain=admin | Admin dashboard (requires admin login) |
| API | https://www.kitchen48.com/api/* | API endpoints (same domain, no CORS) |

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login (returns JWT + userType) |
| POST | `/api/auth/verify-email` | No | Verify email with token |
| POST | `/api/auth/resend-verification` | No | Resend verification email |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/auth/google` | No | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | No | Google OAuth callback |

### Default Admin Credentials

| Field | Value |
|-------|-------|
| Email | shacoof@gmail.com |
| Password | k48shacoof |
| User Type | admin |

---

## Development Commands

```bash
# Install dependencies
npm install

# Run both frontend and backend in dev mode (auto-starts database)
npm run dev

# Run individually
npm run dev:frontend   # Vite dev server (port 5173)
npm run dev:backend    # tsx watch mode (port 3000)
```

---

## Build Commands

```bash
# Build all
npm run build

# Build individually
npm run build:frontend
npm run build:backend
```

---

## Google Cloud Deployment

### Prerequisites
- Google Cloud SDK installed (`gcloud`)
- Authenticated: `gcloud auth login`
- Project set: `gcloud config set project PROJECT_ID`

### Build and Deploy to Cloud Run

```bash
# Deploy combined app (recommended - single service)
gcloud run deploy kitchen48-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

**Note:** The combined architecture deploys frontend + backend in a single container.
nginx serves static files and proxies `/api/*` to the Node.js backend.

### Manual Docker Build and Push (Artifact Registry)

```bash
# Configure Docker for Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build combined image
docker build -t us-central1-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/kitchen48-app:latest .

# Push image
docker push us-central1-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/kitchen48-app:latest

# Deploy from image
gcloud run deploy kitchen48-app \
  --image us-central1-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/kitchen48-app:latest \
  --region us-central1 \
  --allow-unauthenticated
```

### Cloud SQL (Production Database)

Kitchen48 uses Cloud SQL PostgreSQL for production.

| Environment | Database | Access |
|-------------|----------|--------|
| Local dev | Docker PostgreSQL (port 5433) | localhost only |
| Production | Cloud SQL `kitchen48-db` | Cloud Run only |

### Domain Mapping

```bash
# List current mappings
gcloud beta run domain-mappings list --region=us-central1

# Create mapping for combined app
gcloud beta run domain-mappings create \
  --service=kitchen48-app \
  --domain=www.kitchen48.com \
  --region=us-central1

# Delete old mapping (if migrating)
gcloud beta run domain-mappings delete \
  --domain=www.kitchen48.com \
  --region=us-central1 --quiet
```

### Clean Up Old Services (After Migration)

```bash
# Delete old separate services
gcloud run services delete kitchen48-frontend --region=us-central1 --quiet
gcloud run services delete kitchen48-backend --region=us-central1 --quiet
```

### One-Click Deployment

Deploy the entire application with a single command:

```bash
./scripts/deploy.sh
```

**Setup:**

1. Copy the example env file and fill in your secrets:
   ```bash
   cp scripts/.env.production.example scripts/.env.production
   # Edit scripts/.env.production with your values
   ```

2. Run the deployment:
   ```bash
   ./scripts/deploy.sh
   ```

**Required secrets in `.env.production`:**
- `GCP_PROJECT_ID` - Your Google Cloud project ID
- `DB_PASSWORD` - Database password (min 8 chars)
- `JWT_SECRET` - JWT signing key (min 32 chars)
- `EMAIL_SERVER_*` - Gmail SMTP configuration
- `FRONTEND_DOMAIN` - Custom domain (e.g., `www.kitchen48.com`)

**Command options:**
```bash
./scripts/deploy.sh                    # Full deployment
./scripts/deploy.sh --skip-db          # Skip Cloud SQL (use existing)
./scripts/deploy.sh --env-file FILE    # Use custom env file
./scripts/deploy.sh --help             # Show help
```

**What it does:**
1. Checks prerequisites (gcloud CLI, authentication)
2. Enables required GCP APIs
3. Creates/updates Cloud SQL instance and database
4. Stores secrets in Secret Manager
5. Deploys combined app (`kitchen48-app`) to Cloud Run
6. Tests deployment and outputs URLs

**Architecture:** Single Cloud Run service with nginx + Node.js (BFF pattern)

**Service Name:** `kitchen48-app` (replaces old `kitchen48-frontend` + `kitchen48-backend`)

---

# ⚠️ MANDATORY WORKFLOW CHECKLIST - READ BEFORE EVERY TASK ⚠️

**STOP. Before making ANY code changes, complete this checklist. NO EXCEPTIONS.**

## Pre-Work Checklist (BEFORE touching any code)

- [ ] **Create pre-edit commit**
  ```bash
  git add -A
  git commit -m "Before [task description]"
  ```
## During Work

- [ ] **Commit after each logical unit**
  - Don't batch unrelated changes
  - Write descriptive commit messages

---

**THIS CHECKLIST IS MANDATORY. Following it prevents:**
- ❌ Data loss from missing pre-edit commits
- ❌ Repeated bugs from undocumented lessons
- ❌ Lost context from missing implementation plans
- ❌ Merge conflicts from batched changes
- ❌ Guideline violations from skipping reviews

**NO SHORTCUTS. NO EXCEPTIONS. EVERY TIME.**

---

## DATABASE SAFETY RULES

### FORBIDDEN Commands (NEVER execute these)

```bash
# These DESTROY data - NEVER run them
npx prisma migrate reset
npx prisma db push --force-reset
DROP DATABASE
DROP TABLE
TRUNCATE
DELETE FROM table_name  # (without WHERE clause)
```

### SAFE Commands (approved for use)

```bash
# Create new migration (preserves data)
npx prisma migrate dev --name descriptive_name

# Check migration status
npx prisma migrate status

# Apply migrations to production
npx prisma migrate deploy

# Regenerate client after schema changes
npx prisma generate

# View data (read-only)
npx prisma studio
```

### Migration Checklist

**Before ANY schema change:**
- [ ] Database backed up (`./scripts/backup-database.sh`)
- [ ] Schema changes documented in commit message
- [ ] Rollback procedure identified

**After migration:**
- [ ] Verify data integrity
- [ ] Test affected queries

### Database Connection Rules

**ALWAYS use the singleton:**
```typescript
import { prisma } from '@/core/database/prisma';
const users = await prisma.user.findMany();
```

**NEVER create new instances:**
```typescript
// WRONG - creates connection leak
const prisma = new PrismaClient();
```

### Backup & Restore

```bash
# Backup (safe, always allowed)
./scripts/backup-database.sh my-backup-name

# Restore (requires confirmation, use carefully)
./scripts/restore-database.sh backups/my-backup.dump
```

---

## DEV TO PRODUCTION DATABASE SYNC

**CRITICAL: Never manually modify production database. Always use scripts.**

### Overview

| Change Type | Dev Action | Production Deployment |
|-------------|------------|----------------------|
| New table (schema) | Prisma migration | `npx prisma migrate deploy` |
| New column | Prisma migration | `npx prisma migrate deploy` |
| Seed data (initial) | `backend/prisma/seed.ts` | Run seed script once after deploy |
| Add data to existing table | Create SQL script | Run SQL script via Cloud SQL |

### Rule 1: Schema Changes (New Tables/Columns)

Schema changes are handled automatically by Prisma migrations.

**Development:**
```bash
# 1. Edit backend/prisma/schema.prisma
# 2. Create migration
cd backend && npx prisma migrate dev --name add_table_name
```

**Production:**
```bash
# Migrations are applied during deployment
cd backend && npx prisma migrate deploy
```

**Checklist:**
- [ ] Migration file created in `backend/prisma/migrations/`
- [ ] Migration committed to git
- [ ] Production deploy runs `migrate deploy`

### Rule 2: Seed Data (Initial/Reference Data)

Seed data goes in `backend/prisma/seed.ts`. This runs once to populate reference data.

**Development:**
```bash
cd backend && npx prisma db seed
```

**Production:**
```bash
# Run seed after first deployment or when adding new seed data
cd backend && npx prisma db seed
```

**Guidelines:**
- Use `upsert` to make seed scripts idempotent (safe to run multiple times)
- Seed data should be reference/config data, not user data
- Document what the seed adds in comments

**Example idempotent seed:**
```typescript
// backend/prisma/seed.ts
await prisma.parameter.upsert({
  where: { key: 'system.timezone' },
  update: {},  // Don't overwrite if exists
  create: {
    key: 'system.timezone',
    value: 'Asia/Jerusalem',
    dataType: 'STRING',
  },
});
```

### Rule 3: Insert Data to Existing Tables (Non-Seed)

For data that needs to be added to production but isn't seed data:

**MANDATORY: Create a SQL script file**

Location: `backend/prisma/scripts/`

**Naming convention:** `YYYY-MM-DD_description.sql`

**Example:**
```sql
-- backend/prisma/scripts/2026-01-25_add_new_parameters.sql
-- Description: Add new system parameters for feature X
-- Author: [name]
-- Run on production: [date]

-- ALWAYS use INSERT ... ON CONFLICT for safety
INSERT INTO parameters (key, value, data_type, description, is_active, created_at, updated_at)
VALUES
  ('feature.x.enabled', 'true', 'BOOLEAN', 'Enable feature X', true, NOW(), NOW()),
  ('feature.x.limit', '100', 'NUMBER', 'Feature X rate limit', true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;  -- Skip if already exists
```

**Running on production (Cloud SQL):**
```bash
# Connect to Cloud SQL and run script
gcloud sql connect kitchen48-db --user=kitchen48_user --database=kitchen48_prod < backend/prisma/scripts/2026-01-25_add_new_parameters.sql
```

**Checklist:**
- [ ] SQL script created in `backend/prisma/scripts/`
- [ ] Script uses `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE` for safety
- [ ] Script committed to git before running on production
- [ ] Script has header comment with description, author, date
- [ ] After running on production, add comment with execution date

### Rule 4: Deleting or Modifying Production Data

**FORBIDDEN without explicit approval:**
- DELETE statements
- UPDATE statements that modify user data
- DROP statements

**If absolutely necessary:**
1. Create a backup first: `./scripts/backup-database.sh before-deletion`
2. Create SQL script with exact WHERE clause
3. Test on dev database first
4. Get explicit user approval
5. Run on production with transaction:

```sql
-- backend/prisma/scripts/2026-01-25_remove_old_data.sql
BEGIN;

-- Show what will be deleted (dry run)
SELECT * FROM table_name WHERE condition;

-- Uncomment to actually delete after verifying
-- DELETE FROM table_name WHERE condition;

COMMIT;
```

### Summary: Dev to Production Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    SCHEMA CHANGES                           │
│  1. Edit schema.prisma                                      │
│  2. npx prisma migrate dev --name description               │
│  3. Commit migration file                                   │
│  4. Deploy: npx prisma migrate deploy                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SEED DATA                                │
│  1. Edit backend/prisma/seed.ts                             │
│  2. Use upsert (idempotent)                                 │
│  3. Test: npx prisma db seed                                │
│  4. Deploy: npx prisma db seed                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    INSERT DATA                              │
│  1. Create: backend/prisma/scripts/YYYY-MM-DD_desc.sql      │
│  2. Use INSERT ... ON CONFLICT                              │
│  3. Commit script to git                                    │
│  4. Run on production via Cloud SQL                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Tabulator Best Practices

Kitchen48 uses [Tabulator](https://tabulator.info/) for data grids.

**Full documentation: [`doc/tabulator.md`](doc/tabulator.md)**

### Critical Rules (Quick Reference)

1. **Use `on()` for event handlers** - Do NOT put callbacks like `cellEdited` in options object:
   ```typescript
   // CORRECT
   const table = new Tabulator(element, options);
   table.on('cellEdited', handler);  // Use on() method

   // WRONG - may not fire!
   const options = { cellEdited: handler };
   ```

2. **Handle empty strings in backend** - Tabulator sends `""` when fields are cleared:
   ```typescript
   const emptyStringToNull = (val: unknown) => (val === '' ? null : val);
   z.preprocess(emptyStringToNull, z.string().min(1).optional().nullable())
   ```

3. **Use `string` sorter for dates** - Avoid `datetime` sorter (requires luxon.js)

4. **Container must have explicit height** - Include `minWidth: 0` for flex containers

---