import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export default function globalSetup() {
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  console.log('\n🌱 Running E2E seed...');
  try {
    execSync('npx tsx ../e2e/fixtures/seed.ts', {
      cwd: resolve(rootDir, 'backend'),
      stdio: 'inherit',
    });
  } catch {
    console.error('❌ E2E seed failed — tests may fail due to missing data.');
  }
}
