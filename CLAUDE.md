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

- **frontend/**: React + Vite application (builds to nginx container)
- **backend/**: Node.js + Express API server
- Both services use npm workspaces from the root

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
| Public Site | https://www.kitchen48.com | Public landing page for users |
| Admin Portal | https://admin.kitchen48.com | Admin dashboard (requires admin login) |
| Backend API | https://api.kitchen48.com | Production API server |

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
# Deploy frontend
gcloud run deploy kitchen48-frontend \
  --source ./frontend \
  --region us-central1 \
  --allow-unauthenticated

# Deploy backend
gcloud run deploy kitchen48-backend \
  --source ./backend \
  --region us-central1 \
  --allow-unauthenticated
```

### Manual Docker Build and Push (Artifact Registry)

```bash
# Configure Docker for Artifact Registry
gcloud auth configure-docker REGION-docker.pkg.dev

# Build images
docker build -t REGION-docker.pkg.dev/PROJECT_ID/REPO/kitchen48-frontend:latest ./frontend
docker build -t REGION-docker.pkg.dev/PROJECT_ID/REPO/kitchen48-backend:latest ./backend

# Push images
docker push REGION-docker.pkg.dev/PROJECT_ID/REPO/kitchen48-frontend:latest
docker push REGION-docker.pkg.dev/PROJECT_ID/REPO/kitchen48-backend:latest

# Deploy from image
gcloud run deploy kitchen48-frontend \
  --image REGION-docker.pkg.dev/PROJECT_ID/REPO/kitchen48-frontend:latest \
  --region us-central1 \
  --allow-unauthenticated

gcloud run deploy kitchen48-backend \
  --image REGION-docker.pkg.dev/PROJECT_ID/REPO/kitchen48-backend:latest \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Variables
Set environment variables during deployment:
```bash
gcloud run deploy SERVICE_NAME \
  --set-env-vars "KEY1=value1,KEY2=value2"
```

### Cloud SQL (Production Database)

Kitchen48 uses Cloud SQL PostgreSQL for production with private-only access.

**Deploy database:**
```bash
./scripts/deploy-cloud-sql.sh
```

This script will:
1. Create a Cloud SQL PostgreSQL 16 instance (no public IP)
2. Create the `kitchen48_prod` database
3. Create the `kitchen48_user` with your password
4. Store the password in Secret Manager

**Deploy backend with Cloud SQL:**
```bash
# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe kitchen48-db --format="value(connectionName)")

# Deploy with Cloud SQL connector
gcloud run deploy kitchen48-backend \
  --source ./backend \
  --region us-central1 \
  --add-cloudsql-instances=$CONNECTION_NAME \
  --set-env-vars="DATABASE_URL=postgresql://kitchen48_user:\$DB_PASSWORD@localhost/kitchen48_prod?host=/cloudsql/$CONNECTION_NAME" \
  --set-secrets="DB_PASSWORD=kitchen48-db-password:latest" \
  --allow-unauthenticated
```

**Database environments:**

| Environment | Database | Access |
|-------------|----------|--------|
| Local dev | Docker PostgreSQL (port 5433) | localhost only |
| Production | Cloud SQL `kitchen48-db` | Cloud Run only (private IP) |

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

## Tabulator Best Practices

Kitchen48 uses [Tabulator](https://tabulator.info/) for data grids. Follow these patterns for consistency.

### Installation

```bash
cd frontend && npm install tabulator-tables
```

### Dynamic Loading Pattern

Always load Tabulator dynamically to avoid SSR/build issues:

```typescript
import { useEffect, useRef, useState } from 'react';

const [tabulatorLoaded, setTabulatorLoaded] = useState(false);
const tableRef = useRef<HTMLDivElement>(null);
const tabulatorRef = useRef<any>(null);

// Step 1: Load module dynamically
useEffect(() => {
  import('tabulator-tables')
    .then((module) => {
      (window as any).TabulatorModule = module.TabulatorFull;
      setTabulatorLoaded(true);
    });
}, []);

// Step 2: Initialize after load
useEffect(() => {
  if (!tabulatorLoaded || !tableRef.current || tabulatorRef.current) return;

  const Tabulator = (window as any).TabulatorModule;
  tabulatorRef.current = new Tabulator(tableRef.current, {
    height: "100%",
    layout: "fitData",
    columns: [/* ... */],
  });
}, [tabulatorLoaded]);
```

### Container Sizing (CRITICAL)

Proper container sizing is essential for scrolling:

```tsx
<div style={{
  height: '500px',
  minHeight: 0,      // CRITICAL for vertical scroll in flex
  minWidth: 0,       // CRITICAL for horizontal scroll
  overflow: 'hidden' // prevent double scrollbars
}}>
  <div ref={tableRef} style={{ height: '100%', width: '100%' }}></div>
</div>
```

### Column Configuration

```typescript
const columns = [
  {
    title: 'Key',
    field: 'key',
    editor: 'input',                    // Inline editing
    validator: ['required', 'minLength:1'],
    headerFilter: 'input',              // Filter in header
    sorter: 'string',
    width: 150,
  },
  {
    title: 'Data Type',
    field: 'dataType',
    editor: 'list',
    editorParams: {
      values: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE', 'COLOR']
    },
    headerFilter: 'list',
    headerFilterParams: {
      values: { '': 'All', 'STRING': 'String', 'NUMBER': 'Number' }
    },
  },
  {
    title: 'Active',
    field: 'isActive',
    editor: 'tickCross',                // Boolean checkbox
    formatter: 'tickCross',
    hozAlign: 'center',
  }
];
```

### Custom Editor Pattern

For complex editors (e.g., color picker):

```typescript
editor: function(cell, onRendered, success, cancel) {
  const container = document.createElement('div');
  const input = document.createElement('input');
  input.type = 'text';
  input.value = cell.getValue() || '';

  input.addEventListener('blur', () => {
    if (validateValue(input.value)) {
      success(input.value);  // Save value
    } else {
      cancel();              // Discard changes
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') success(input.value);
    if (e.key === 'Escape') cancel();
  });

  onRendered(() => input.focus());  // Auto-focus when editor opens

  container.appendChild(input);
  return container;
}
```

### Data Loading Pattern

```typescript
const loadData = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/parameters', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'  // Always get fresh data
  });

  if (!response.ok) throw new Error('Failed to load');

  const data = await response.json();
  tabulatorRef.current?.setData(data);
};
```

### Inline Editing with Auto-Save

```typescript
const tableOptions = {
  columns: columns,
  cellEdited: function(cell) {
    const row = cell.getRow();
    const data = row.getData();

    // Send update to API
    handleUpdate(data).catch(() => {
      loadData();  // Reload on error (rollback)
    });
  }
};
```

### Theme Styling

Create a `tabulator-theme.css` using CSS variables only (no hardcoded colors):

```css
/* DO: Use CSS variables */
.tabulator {
  background-color: var(--bg-primary) !important;
  color: var(--text-primary) !important;
}

.tabulator .tabulator-header {
  background-color: var(--bg-secondary) !important;
  border-bottom: 1px solid var(--border-color) !important;
}

.tabulator .tabulator-row:hover {
  background-color: var(--bg-hover) !important;
}

/* DON'T: Hardcode colors */
/* ❌ background-color: #ffffff; */
```

### Common Tabulator Options

```typescript
const tableOptions = {
  height: "100%",
  layout: "fitData",           // or "fitColumns", "fitDataFill"
  responsiveLayout: "collapse",
  pagination: true,
  paginationSize: 20,
  movableColumns: true,
  resizableColumns: true,
  placeholder: "No Data Available",

  // Callbacks
  dataLoaded: () => console.log('Data loaded'),
  cellEdited: (cell) => handleCellEdit(cell),
  rowClick: (e, row) => handleRowClick(row),
};
```

### TypeScript Support

```typescript
import type { TabulatorFull, ColumnDefinition } from 'tabulator-tables';

// Declare module on window
declare global {
  interface Window {
    TabulatorModule: typeof TabulatorFull;
  }
}

// Type your columns
const columns: ColumnDefinition[] = [
  { title: 'Name', field: 'name', sorter: 'string' },
];
```

---