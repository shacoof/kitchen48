/* eslint-disable no-console */
/**
 * Kitchen48 Backend Server
 *
 * Starts listening immediately with a minimal health endpoint,
 * then loads the full application asynchronously.
 */

import express from 'express';

const app = express();
// Backend always listens on 3000 - nginx proxies from 8080
const PORT = 3000;

// Start listening immediately with minimal health endpoint
let serverReady = false;

app.get('/api/health', (_req, res) => {
  res.json({
    status: serverReady ? 'ok' : 'starting',
    timestamp: new Date().toISOString(),
    service: 'kitchen48-api',
  });
});

app.listen(PORT, () => {
  console.log(`[STARTUP] Server listening on port ${PORT}`);

  // Now load the rest of the application asynchronously
  loadApplication().catch((err) => {
    console.error('[STARTUP] Failed to load application:', err.message);
    console.error('[STARTUP] Stack:', err.stack);
  });
});

async function loadApplication() {
  console.log('[STARTUP] Loading application modules...');

  // Import dependencies
  const cors = (await import('cors')).default;
  console.log('[STARTUP] cors imported');

  const passport = (await import('passport')).default;
  console.log('[STARTUP] passport imported');

  const { configurePassport } = await import('./config/passport.js');
  console.log('[STARTUP] passport config imported');

  const authRoutes = (await import('./modules/auth/auth.routes.js')).default;
  console.log('[STARTUP] auth routes imported');

  const parameterRoutes = (await import('./modules/parameters/parameter.routes.js')).default;
  console.log('[STARTUP] parameter routes imported');

  const { usersRouter, adminUsersRouter } = await import('./modules/users/users.routes.js');
  console.log('[STARTUP] users routes imported');

  const { uploadRouter } = await import('./modules/upload/upload.routes.js');
  console.log('[STARTUP] upload routes imported');

  const ingredientRoutes = (await import('./modules/ingredients/ingredient.routes.js')).default;
  console.log('[STARTUP] ingredient routes imported');

  const statisticsRoutes = (await import('./modules/statistics/statistics.routes.js')).default;
  console.log('[STARTUP] statistics routes imported');

  const listTypeRoutes = (await import('./modules/list-types/listType.routes.js')).default;
  const { listValuesPublicRouter } = await import('./modules/list-types/listType.routes.js');
  console.log('[STARTUP] list-types routes imported');

  const path = (await import('path')).default;
  console.log('[STARTUP] path module imported');

  const { createLogger } = await import('./lib/logger.js');
  console.log('[STARTUP] logger imported');

  const logger = createLogger('Server');

  // Configure middleware
  app.use(cors());
  app.use(express.json());
  console.log('[STARTUP] Middleware configured');

  // Initialize Passport
  configurePassport();
  app.use(passport.initialize());
  console.log('[STARTUP] Passport initialized');

  // Serve uploaded files
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log('[STARTUP] Static file serving configured for /uploads');

  // Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/parameters', parameterRoutes);
  app.use('/api/users', usersRouter);
  app.use('/api/admin/users', adminUsersRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/ingredients', ingredientRoutes);
  app.use('/api/admin/statistics', statisticsRoutes);
  app.use('/api/list-types', listTypeRoutes);
  app.use('/api/list-values', listValuesPublicRouter);
  console.log('[STARTUP] Routes configured');

  // Mark server as ready
  serverReady = true;
  console.log('[STARTUP] Application fully loaded and ready');
  logger.debug(`Server running on http://localhost:${PORT}`);
}
