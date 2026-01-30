#!/usr/bin/env npx tsx
/**
 * Data Migration Runner
 *
 * Runs pending data migrations in order.
 * Each migration runs only once - tracked in data_migrations table.
 *
 * Usage:
 *   npx tsx scripts/run-data-migrations.ts
 *   npm run migrate:data
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const MIGRATIONS_DIR = path.join(__dirname, '../prisma/data-migrations');

interface Migration {
  version: string;
  description: string;
  run: () => Promise<void>;
}

async function ensureMigrationTableExists(): Promise<void> {
  // The table is created by Prisma schema migration
  // This is just a safety check
  try {
    await prisma.$queryRaw`SELECT 1 FROM data_migrations LIMIT 1`;
  } catch {
    console.log('Warning: data_migrations table does not exist.');
    console.log('Run "npx prisma migrate deploy" first to create the schema.');
    process.exit(1);
  }
}

async function getExecutedMigrations(): Promise<Set<string>> {
  const executed = await prisma.dataMigration.findMany({
    where: { success: true },
    select: { scriptName: true }
  });
  return new Set(executed.map(m => m.scriptName));
}

async function getPendingMigrations(): Promise<string[]> {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts') && f !== 'index.ts')
    .sort(); // Alphabetical sort ensures version order (1.0.0 < 1.1.0 < 1.10.0)

  const executed = await getExecutedMigrations();

  return files.filter(f => !executed.has(f));
}

async function runMigration(filename: string): Promise<void> {
  const filepath = path.join(MIGRATIONS_DIR, filename);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running migration: ${filename}`);
  console.log('='.repeat(60));

  let migration: Migration;

  try {
    migration = await import(filepath);
  } catch (error) {
    console.error(`Failed to load migration ${filename}:`, error);
    throw error;
  }

  if (typeof migration.run !== 'function') {
    throw new Error(`Migration ${filename} does not export a 'run' function`);
  }

  const startTime = Date.now();

  try {
    // Record migration start
    await prisma.dataMigration.create({
      data: {
        scriptName: filename,
        version: migration.version || 'unknown',
        description: migration.description || null,
        executedBy: 'deploy-script',
        success: false // Will update to true on success
      }
    });

    // Run the migration
    await migration.run();

    // Mark as successful
    await prisma.dataMigration.update({
      where: { scriptName: filename },
      data: { success: true }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ Migration ${filename} completed in ${duration}s`);

  } catch (error) {
    // Record failure
    await prisma.dataMigration.update({
      where: { scriptName: filename },
      data: {
        success: false,
        errorLog: error instanceof Error ? error.message : String(error)
      }
    });

    console.error(`✗ Migration ${filename} failed:`, error);
    throw error;
  }
}

async function main(): Promise<void> {
  console.log('Data Migration Runner');
  console.log('=====================\n');

  await ensureMigrationTableExists();

  const pending = await getPendingMigrations();

  if (pending.length === 0) {
    console.log('No pending migrations. Database is up to date.');
    return;
  }

  console.log(`Found ${pending.length} pending migration(s):`);
  pending.forEach(f => console.log(`  - ${f}`));

  for (const filename of pending) {
    await runMigration(filename);
  }

  console.log('\n' + '='.repeat(60));
  console.log('All migrations completed successfully!');
  console.log('='.repeat(60));
}

main()
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
