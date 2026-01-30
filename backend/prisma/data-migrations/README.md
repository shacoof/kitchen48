# Data Migrations

This directory contains one-time data migration scripts that run during deployment.

## How It Works

1. **Schema changes** are handled by Prisma migrations (`prisma migrate deploy`)
2. **Data changes** (seeds, transformations) are handled by scripts in this directory
3. Each script runs **only once** - tracked in the `data_migrations` table

## Naming Convention

```
{version}_{description}.ts
```

Examples:
- `1.1.0_generate_user_nicknames.ts`
- `1.2.0_seed_new_parameters.ts`
- `1.2.1_fix_invalid_emails.ts`

## Creating a New Migration

1. **During development**, when you need a data change:

```typescript
// backend/prisma/data-migrations/1.2.0_your_migration.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const version = '1.2.0';
export const description = 'What this migration does';

export async function run(): Promise<void> {
  // Your migration logic here
  // Use transactions for safety:
  await prisma.$transaction(async (tx) => {
    // ... your changes
  });
}

// For local testing only - remove before commit
// run().then(() => process.exit(0)).catch(console.error);
```

2. **Update version.json** with the new database version

3. **Document in your PR** what this migration does

## Safety Rules

- **NEVER** delete data without explicit approval
- **ALWAYS** use transactions for multi-step changes
- **ALWAYS** test locally first with a database backup
- **ALWAYS** make migrations idempotent when possible (safe to run twice)
- **LOG** what you're changing for audit purposes

## Running Migrations

Migrations run automatically during deployment via:
```bash
npm run migrate:data
```

To run manually (development only):
```bash
cd backend
DATABASE_URL="..." npm run migrate:data
```

## Checking Status

View executed migrations:
```sql
SELECT * FROM data_migrations ORDER BY executed_at DESC;
```
