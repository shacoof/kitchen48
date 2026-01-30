# Database Versioning & Migration Guide

## Overview

Kitchen48 uses a versioned migration system to safely manage database changes in production.

**Key Principle:** Database changes are planned during development, reviewed before implementation, and executed safely during deployment.

## Version Tracking

### version.json

Located at project root, tracks component versions:

```json
{
  "application": "kitchen48",
  "version": "1.1.0",
  "components": {
    "frontend": "1.1.0",
    "backend": "1.1.0",
    "database": "1.1.0"
  }
}
```

**Rules:**
- Increment database version when schema or data changes
- All versions should match after a successful deployment
- Version format: `MAJOR.MINOR.PATCH`

## Types of Database Changes

### 1. Schema Changes (Prisma Migrations)

For structural changes: new tables, columns, indexes, constraints.

**Process:**
1. Modify `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Migration file created in `backend/prisma/migrations/`
4. Commit migration file to git
5. In production: `npx prisma migrate deploy` (runs automatically in deploy script)

**Tracking:** `_prisma_migrations` table (managed by Prisma)

### 2. Data Migrations (One-time Scripts)

For data changes: generating values, seeding new data, transforming existing data.

**Process:**
1. Create script in `backend/prisma/data-migrations/`
2. Name: `{version}_{description}.ts` (e.g., `1.1.0_generate_user_nicknames.ts`)
3. Commit to git
4. In production: `npm run migrate:data` (runs automatically in deploy script)

**Tracking:** `data_migrations` table

### 3. Seed Data (Reference Data)

For initial/reference data that should exist in all environments.

**Process:**
1. Add to `backend/prisma/seed.ts`
2. Use `upsert` for idempotency
3. Run with `npx prisma db seed`

**Note:** Seed script can be run multiple times safely.

## Development Workflow

### When Adding a Feature That Requires Database Changes

1. **Plan Phase (MANDATORY)**

   Before writing code, document in your plan:
   ```markdown
   ## Database Changes Required

   ### Schema Changes
   - [ ] New table: `table_name`
   - [ ] New column: `table.column_name` (type, nullable, default)
   - [ ] New index: `table.column`

   ### Data Migrations
   - [ ] Generate nicknames for existing users
   - [ ] Seed new parameter values

   ### Risks
   - [ ] Backwards compatible: Yes/No
   - [ ] Requires downtime: Yes/No
   - [ ] Data loss risk: None/Low/High

   ### Rollback Plan
   - [ ] How to revert if deployment fails
   ```

2. **Implementation Phase**

   a. **Create schema migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_nickname_column
   ```

   b. **Create data migration (if needed):**
   ```typescript
   // backend/prisma/data-migrations/1.1.0_generate_user_nicknames.ts
   export const version = '1.1.0';
   export const description = 'Generate nicknames for existing users';

   export async function run(): Promise<void> {
     // Migration logic
   }
   ```

   c. **Update version.json:**
   ```json
   {
     "components": {
       "database": "1.1.0"
     }
   }
   ```

3. **Testing Phase**

   Test the full migration locally:
   ```bash
   # Reset local DB to production-like state
   npx prisma migrate reset

   # Run all migrations
   npx prisma migrate deploy
   npm run migrate:data

   # Verify data
   npx prisma studio
   ```

4. **Code Review**

   Reviewer checks:
   - [ ] Migration is backwards compatible (or downtime is planned)
   - [ ] Data migration is idempotent (safe to run twice)
   - [ ] No destructive operations without explicit approval
   - [ ] Rollback plan documented
   - [ ] Version numbers updated

## Deployment Process

The deploy script (`scripts/deploy.sh`) runs:

1. `validate_local_build` - Catches TypeScript errors before cloud build
2. `deploy_app` - Deploys code to Cloud Run
3. `run_migrations` - Runs database migrations:
   - `npx prisma migrate deploy` (schema)
   - `npm run migrate:data` (data)

## Safety Rules

### NEVER Do (Without Explicit Approval)

- `DROP TABLE`
- `DELETE FROM table` (without WHERE)
- `TRUNCATE TABLE`
- `prisma migrate reset`
- `prisma db push --force-reset`
- Remove columns with existing data
- Change column types that lose data

### ALWAYS Do

- Use transactions for multi-step changes
- Test migrations on a copy of production data
- Have a rollback plan
- Make migrations idempotent when possible
- Document what the migration does and why

## Checking Migration Status

### View Pending Migrations

```bash
cd backend
npx prisma migrate status
```

### View Executed Data Migrations

```sql
SELECT * FROM data_migrations ORDER BY executed_at DESC;
```

### View Version Info

```bash
cat version.json
```

## Rollback Procedures

### Rolling Back Schema Changes

Prisma doesn't auto-rollback. Options:

1. **Create a new migration** that reverts the change
2. **Restore from backup** (for critical issues)

### Rolling Back Data Migrations

Data migrations should be written to be reversible. Include in comments:

```typescript
/**
 * ROLLBACK PROCEDURE:
 * UPDATE users SET nickname = NULL WHERE nickname IS NOT NULL;
 */
```

## Emergency Procedures

### Production Database is Broken

1. **Don't panic** - Cloud SQL has automated backups
2. Check Cloud SQL console for backup list
3. Restore to a point-in-time before the issue
4. Roll back the deployed code to previous version

### Migration Failed Mid-Way

1. Check `data_migrations` table for failed status
2. Fix the issue in the migration script
3. Delete the failed record: `DELETE FROM data_migrations WHERE script_name = '...' AND success = false`
4. Re-run: `npm run migrate:data`
