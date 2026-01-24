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

---

## Project Structure

- **frontend/**: React + Vite application (builds to nginx container)
- **backend/**: Node.js + Express API server
- Both services use npm workspaces from the root

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