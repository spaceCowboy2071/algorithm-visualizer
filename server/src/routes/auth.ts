import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../db';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { signupSchema, loginSchema, googleAuthSchema } from '../validation/schemas';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Rate limiter: 10 requests per 15 minutes per IP on all auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter);

// Google OAuth client (initialized lazily)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helpers ──

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createAndSetRefreshToken(userId: string, res: Response): Promise<void> {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await pool.query(
    'INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [tokenHash, userId, expiresAt]
  );

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
}

// ── POST /api/auth/signup ──

router.post('/signup', async (req: Request, res: Response) => {
  // Validate input
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.issues });
    return;
  }

  const { email, password, displayName } = parsed.data;

  try {
    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    // Hash password and insert user
    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, auth_provider, display_name) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name',
      [email, passwordHash, 'local', displayName || null]
    );

    const user = result.rows[0];

    // Create tokens
    const accessToken = signAccessToken(user.id);
    await createAndSetRefreshToken(user.id, res);

    res.status(201).json({
      token: accessToken,
      user: { id: user.id, email: user.email, displayName: user.display_name },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/auth/login ──

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.issues });
    return;
  }

  const { email, password } = parsed.data;

  try {
    // Find user by email
    const result = await pool.query(
      'SELECT id, email, password_hash, auth_provider, display_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = result.rows[0];

    // Google OAuth users can't log in with password
    if (user.auth_provider === 'google') {
      res.status(401).json({ error: 'This account uses Google sign-in. Please sign in with Google.' });
      return;
    }

    // Compare password
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Create tokens
    const accessToken = signAccessToken(user.id);
    await createAndSetRefreshToken(user.id, res);

    res.json({
      token: accessToken,
      user: { id: user.id, email: user.email, displayName: user.display_name },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/auth/google ──

router.post('/google', async (req: Request, res: Response) => {
  const parsed = googleAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.issues });
    return;
  }

  const { credential } = parsed.data;

  try {
    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      res.status(401).json({ error: 'Invalid Google credential' });
      return;
    }

    const { email, sub: googleId, name } = payload;

    // Check if user exists by google_id (returning Google user)
    let result = await pool.query('SELECT id, email, display_name FROM users WHERE google_id = $1', [googleId]);

    if (result.rows.length === 0) {
      // Check if email exists with a different auth method (email/password user)
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        res.status(409).json({ error: 'An account with this email already exists. Please sign in with email and password.' });
        return;
      }

      // New Google user — create account
      result = await pool.query(
        'INSERT INTO users (email, google_id, auth_provider, display_name) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name',
        [email, googleId, 'google', name || null]
      );
    }

    const user = result.rows[0];

    // Create tokens
    const accessToken = signAccessToken(user.id);
    await createAndSetRefreshToken(user.id, res);

    res.json({
      token: accessToken,
      user: { id: user.id, email: user.email, displayName: user.display_name },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Failed to verify Google credential' });
  }
});

// ── POST /api/auth/refresh ──

router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  const tokenHash = hashToken(refreshToken);

  try {
    // Look up the hashed token
    const result = await pool.query(
      'SELECT id, user_id, expires_at, used FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const storedToken = result.rows[0];

    // Reuse detection: if this token was already used, someone may have stolen it
    // Revoke ALL tokens for this user as a security measure
    if (storedToken.used) {
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [storedToken.user_id]);
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      res.status(401).json({ error: 'Refresh token reuse detected. All sessions revoked.' });
      return;
    }

    // Check expiration
    if (new Date(storedToken.expires_at) < new Date()) {
      await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [storedToken.id]);
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      res.status(401).json({ error: 'Refresh token expired' });
      return;
    }

    // Mark old token as used (for reuse detection)
    await pool.query('UPDATE refresh_tokens SET used = true WHERE id = $1', [storedToken.id]);

    // Load user
    const userResult = await pool.query(
      'SELECT id, email, display_name FROM users WHERE id = $1',
      [storedToken.user_id]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const user = userResult.rows[0];

    // Issue new tokens
    const accessToken = signAccessToken(user.id);
    await createAndSetRefreshToken(user.id, res);

    res.json({
      token: accessToken,
      user: { id: user.id, email: user.email, displayName: user.display_name },
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/auth/me ──

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, display_name, auth_provider, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      authProvider: user.auth_provider,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
