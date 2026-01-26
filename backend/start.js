#!/usr/bin/env node

// Startup wrapper to ensure stdout is captured
console.log('[START.JS] Node.js is starting...');
console.log('[START.JS] PORT=' + process.env.PORT);
console.log('[START.JS] NODE_ENV=' + process.env.NODE_ENV);
console.log('[START.JS] DATABASE_URL=' + (process.env.DATABASE_URL ? 'set' : 'NOT SET'));

// Import and run the main app
import('./dist/index.js').catch(err => {
  console.error('[START.JS] Failed to start:', err);
  process.exit(1);
});
