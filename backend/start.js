#!/usr/bin/env node

/**
 * Backend startup script
 * Simply imports the compiled application
 */

const startTime = Date.now();
console.log('[START] Loading backend application...');
console.log('[START] NODE_ENV=' + process.env.NODE_ENV);
console.log('[START] PORT=' + process.env.PORT);
console.log('[START] DATABASE_URL=' + (process.env.DATABASE_URL ? 'set' : 'NOT SET'));
console.log('[START] JWT_SECRET=' + (process.env.JWT_SECRET ? 'set' : 'NOT SET'));
console.log('[START] Starting import at ' + startTime);

// Import the main application
import('./dist/index.js')
  .then(() => {
    const elapsed = Date.now() - startTime;
    console.log('[START] Application imported successfully in ' + elapsed + 'ms');
  })
  .catch((err) => {
    console.error('[START] Failed to import application:', err.message);
    console.error('[START] Stack:', err.stack);
    process.exit(1);
  });
