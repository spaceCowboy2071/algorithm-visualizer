import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import { pool } from '../src/db';
import { request, createTestUser, extractRefreshCookie } from './helpers';

// Mock Google OAuth — vi.hoisted() ensures the mock variable is hoisted
// alongside vi.mock(), so it's available when the mock factory runs.
// Must use a class (not arrow function) so it can be called with `new`.
const { mockVerifyIdToken } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn().mockResolvedValue({
    getPayload: () => ({
      email: 'google@example.com',
      sub: 'google-id-123',
      name: 'Google User',
    }),
  }),
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: class MockOAuth2Client {
    verifyIdToken = mockVerifyIdToken;
  },
}));

// ─── POST /api/auth/signup ───

describe('POST /api/auth/signup', () => {
  it('returns 201 with token and user on valid signup', async () => {
    const res = await request.post('/api/auth/signup').send({
      email: 'new@example.com',
      password: 'password123',
      displayName: 'New User',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      email: 'new@example.com',
      displayName: 'New User',
    });
    expect(res.body.user).toHaveProperty('id');
  });

  it('sets httpOnly refreshToken cookie', async () => {
    const res = await request.post('/api/auth/signup').send({
      email: 'cookie@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    const cookies = res.headers['set-cookie'] as string[];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('Path=/api/auth/refresh');
  });

  it('returns 409 when email already exists', async () => {
    await createTestUser({ email: 'taken@example.com' });

    const res = await request.post('/api/auth/signup').send({
      email: 'taken@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request.post('/api/auth/signup').send({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 for password shorter than 8 characters', async () => {
    const res = await request.post('/api/auth/signup').send({
      email: 'short@example.com',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request.post('/api/auth/signup').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

// ─── POST /api/auth/login ───

describe('POST /api/auth/login', () => {
  it('returns 200 with token and user on correct credentials', async () => {
    await createTestUser({ email: 'login@example.com', password: 'password123' });

    const res = await request.post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('sets refreshToken cookie on login', async () => {
    await createTestUser({ email: 'logincookie@example.com', password: 'password123' });

    const res = await request.post('/api/auth/login').send({
      email: 'logincookie@example.com',
      password: 'password123',
    });

    const cookies = res.headers['set-cookie'] as string[];
    const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    await createTestUser({ email: 'wrongpw@example.com', password: 'password123' });

    const res = await request.post('/api/auth/login').send({
      email: 'wrongpw@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('returns 401 for Google user trying password login', async () => {
    // Insert a Google OAuth user directly
    await pool.query(
      "INSERT INTO users (email, google_id, auth_provider, display_name) VALUES ($1, $2, $3, $4)",
      ['googleuser@example.com', 'google-id-456', 'google', 'Google Person']
    );

    const res = await request.post('/api/auth/login').send({
      email: 'googleuser@example.com',
      password: 'anypassword1',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Google sign-in');
  });
});

// ─── POST /api/auth/google ───

describe('POST /api/auth/google', () => {
  it('creates a new Google user and returns token', async () => {
    const res = await request.post('/api/auth/google').send({
      credential: 'fake-google-token',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('google@example.com');
    expect(res.body.user.displayName).toBe('Google User');
  });

  it('returns existing Google user on repeat sign-in', async () => {
    // First sign-in creates the user
    await request.post('/api/auth/google').send({ credential: 'fake-google-token' });

    // Second sign-in returns the same user
    const res = await request.post('/api/auth/google').send({ credential: 'fake-google-token' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('google@example.com');

    // Verify only one user exists
    const count = await pool.query("SELECT COUNT(*) FROM users WHERE email = 'google@example.com'");
    expect(parseInt(count.rows[0].count)).toBe(1);
  });

  it('returns 409 when email collides with local user', async () => {
    // Create a local user with the same email the Google mock returns
    await createTestUser({ email: 'google@example.com' });

    const res = await request.post('/api/auth/google').send({
      credential: 'fake-google-token',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('returns 401 when Google verification fails', async () => {
    // Override the mock for this single test to throw
    mockVerifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

    const res = await request.post('/api/auth/google').send({
      credential: 'invalid-token',
    });

    expect(res.status).toBe(401);
  });

  it('returns 400 for missing credential field', async () => {
    const res = await request.post('/api/auth/google').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

// ─── POST /api/auth/refresh ───

describe('POST /api/auth/refresh', () => {
  it('returns 200 with new access token on valid refresh', async () => {
    const { cookies } = await createTestUser();
    const refreshCookie = extractRefreshCookie(cookies);

    const res = await request
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email');
  });

  it('sets a NEW refreshToken cookie on rotation', async () => {
    const { cookies } = await createTestUser();
    const originalCookie = extractRefreshCookie(cookies);

    const res = await request
      .post('/api/auth/refresh')
      .set('Cookie', originalCookie);

    const newCookies = res.headers['set-cookie'] as string[];
    const newRefreshCookie = extractRefreshCookie(newCookies);
    expect(newRefreshCookie).not.toBe(originalCookie);
  });

  it('returns 401 on reuse detection and revokes all sessions', async () => {
    const { cookies, user } = await createTestUser();
    const originalCookie = extractRefreshCookie(cookies);

    // First refresh — rotates the token, marks the original as used
    await request
      .post('/api/auth/refresh')
      .set('Cookie', originalCookie);

    // Second refresh with the ORIGINAL cookie — reuse detected
    const res = await request
      .post('/api/auth/refresh')
      .set('Cookie', originalCookie);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('reuse detected');

    // Verify ALL tokens for this user are deleted
    const tokens = await pool.query(
      'SELECT COUNT(*) FROM refresh_tokens WHERE user_id = $1',
      [user.id]
    );
    expect(parseInt(tokens.rows[0].count)).toBe(0);
  });

  it('returns 401 when no cookie is present', async () => {
    const res = await request.post('/api/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('No refresh token');
  });

  it('returns 401 for expired refresh token', async () => {
    const { user } = await createTestUser();

    // Insert an expired token directly into the DB
    const fakeToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(fakeToken).digest('hex');
    const expiredDate = new Date(Date.now() - 1000); // 1 second ago

    await pool.query(
      'INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
      [tokenHash, user.id, expiredDate]
    );

    const res = await request
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${fakeToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('expired');
  });
});

// ─── GET /api/auth/me ───

describe('GET /api/auth/me', () => {
  it('returns 200 with user profile when authenticated', async () => {
    const { token } = await createTestUser({ email: 'me@example.com', displayName: 'Me' });

    const res = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
    expect(res.body.displayName).toBe('Me');
    expect(res.body.authProvider).toBe('local');
    expect(res.body).toHaveProperty('createdAt');
  });

  it('returns 401 without Authorization header', async () => {
    const res = await request.get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('No token');
  });

  it('returns 401 with invalid token', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', 'Bearer fake.invalid.token');

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid');
  });
});
