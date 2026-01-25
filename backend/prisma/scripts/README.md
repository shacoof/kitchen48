# Production SQL Scripts

This directory contains SQL scripts for data changes that need to be applied to production.

## When to Use

- Adding new data to existing tables (that isn't seed data)
- One-time data corrections
- Data migrations that can't be handled by Prisma migrations

## Naming Convention

```
YYYY-MM-DD_description.sql
```

Example: `2026-01-25_add_new_parameters.sql`

## Script Template

```sql
-- backend/prisma/scripts/YYYY-MM-DD_description.sql
-- Description: [What this script does]
-- Author: [Your name]
-- Created: [Date]
-- Run on production: [Date when executed, fill after running]

-- ALWAYS use INSERT ... ON CONFLICT for safety (idempotent)
INSERT INTO table_name (column1, column2)
VALUES ('value1', 'value2')
ON CONFLICT (unique_column) DO NOTHING;
```

## Running on Production

```bash
# Via Cloud SQL
gcloud sql connect kitchen48-db --user=kitchen48_user --database=kitchen48_prod < backend/prisma/scripts/YYYY-MM-DD_description.sql
```

## Rules

1. ALWAYS commit scripts to git BEFORE running on production
2. ALWAYS use `ON CONFLICT` clauses for INSERT statements
3. NEVER use DELETE or UPDATE without explicit WHERE clause
4. ALWAYS add execution date comment after running
5. Test on dev database first
