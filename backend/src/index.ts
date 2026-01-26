// eslint-disable-next-line no-console
console.log('[STARTUP] Beginning server initialization...');

import express from 'express';
import cors from 'cors';
import passport from 'passport';

// eslint-disable-next-line no-console
console.log('[STARTUP] Core imports done');

import { configurePassport } from './config/passport.js';
// eslint-disable-next-line no-console
console.log('[STARTUP] Passport config imported');

import authRoutes from './modules/auth/auth.routes.js';
// eslint-disable-next-line no-console
console.log('[STARTUP] Auth routes imported');

import parameterRoutes from './modules/parameters/parameter.routes.js';
// eslint-disable-next-line no-console
console.log('[STARTUP] Parameter routes imported');

import { createLogger } from './lib/logger.js';
// eslint-disable-next-line no-console
console.log('[STARTUP] Logger imported');

const logger = createLogger('Server');

const app = express();
const PORT = process.env.PORT || 3000;
// eslint-disable-next-line no-console
console.log(`[STARTUP] PORT = ${PORT}`);

// Middleware
app.use(cors());
app.use(express.json());
// eslint-disable-next-line no-console
console.log('[STARTUP] Middleware configured');

// Initialize Passport
configurePassport();
app.use(passport.initialize());
// eslint-disable-next-line no-console
console.log('[STARTUP] Passport initialized');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parameters', parameterRoutes);
// eslint-disable-next-line no-console
console.log('[STARTUP] Routes configured');

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'kitchen48-api',
  });
});

// eslint-disable-next-line no-console
console.log('[STARTUP] Starting server...');

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[STARTUP] Server running on http://localhost:${PORT}`);
  logger.debug(`Server running on http://localhost:${PORT}`);
});
