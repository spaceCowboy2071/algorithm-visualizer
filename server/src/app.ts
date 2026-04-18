import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pool } from './db';
import authRoutes from './routes/auth';
import progressRoutes from './routes/progress';
import sketchesRoutes from './routes/sketches';

const app = express();

// Trust proxies (CloudFront/ALB) so express-rate-limit reads the real client IP
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/sketches', sketchesRoutes);

// Health check — proves Express can talk to PostgreSQL
app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].now,
      commit: process.env.COMMIT_SHA || 'dev',
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
    });
  }
});

export default app;
