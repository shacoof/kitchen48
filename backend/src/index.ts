import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { configurePassport } from './config/passport.js';
import authRoutes from './modules/auth/auth.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Passport
configurePassport();
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'kitchen48-api',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
