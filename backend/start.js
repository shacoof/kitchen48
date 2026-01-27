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

// Start a minimal server first to ensure port 3000 is listening
const http = require('http');
const minimalServer = http.createServer((req, res) => {
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'starting', message: 'Backend is loading...' }));
  } else {
    res.writeHead(503);
    res.end('Service starting...');
  }
});

minimalServer.listen(3000, () => {
  console.log('[START.JS] Minimal server listening on port 3000');

  // Now import the main app (which will take over)
  console.log('[START.JS] Importing dist/index.js...');
  import('./dist/index.js')
    .then(() => {
      console.log('[START.JS] Import completed successfully');
      // Close the minimal server - main app has taken over
      minimalServer.close();
    })
    .catch(err => {
      console.error('[START.JS] Failed to import:', err.message);
      console.error('[START.JS] Stack:', err.stack);
      // Keep minimal server running for debugging
    });
});
