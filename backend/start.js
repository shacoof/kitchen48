#!/usr/bin/env node

// Startup wrapper to ensure stdout is captured
console.log('[START.JS] Node.js is starting...');
console.log('[START.JS] PORT=' + process.env.PORT);
console.log('[START.JS] NODE_ENV=' + process.env.NODE_ENV);
console.log('[START.JS] DATABASE_URL=' + (process.env.DATABASE_URL ? 'set (length=' + process.env.DATABASE_URL.length + ')' : 'NOT SET'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('[START.JS] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[START.JS] Unhandled rejection at:', promise, 'reason:', reason);
});

// Import and run the main app
console.log('[START.JS] Importing dist/index.js...');
import('./dist/index.js')
  .then(() => {
    console.log('[START.JS] Import completed successfully');
  })
  .catch(err => {
    console.error('[START.JS] Failed to import:', err.message);
    console.error('[START.JS] Stack:', err.stack);
    process.exit(1);
  });
