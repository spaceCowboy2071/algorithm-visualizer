import supertest from 'supertest';
import app from '../src/app';

// Supertest wraps the Express app — sends HTTP requests without starting a real server
export const request = supertest(app);

/** Create a user via the signup endpoint and return the token, user, and cookies */
export async function createTestUser(overrides?: {
  email?: string;
  password?: string;
  displayName?: string;
}) {
  const res = await request.post('/api/auth/signup').send({
    email: overrides?.email ?? 'test@example.com',
    password: overrides?.password ?? 'password123',
    displayName: overrides?.displayName ?? 'Test User',
  });
  return {
    token: res.body.token as string,
    user: res.body.user,
    cookies: res.headers['set-cookie'] as string[],
  };
}

/** Extract the refreshToken cookie string from a set-cookie header array */
export function extractRefreshCookie(setCookieHeader: string[]): string {
  const cookie = setCookieHeader.find((c: string) => c.startsWith('refreshToken='));
  if (!cookie) throw new Error('No refreshToken cookie found');
  return cookie.split(';')[0]; // "refreshToken=abc123..."
}
