import express from 'express';
import cors from 'cors';
import { pool } from './db';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check — proves Express can talk to PostgreSQL
app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].now,
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
    });
  }
});

export default app;
