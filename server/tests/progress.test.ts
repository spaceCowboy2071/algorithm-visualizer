import { describe, it, expect, beforeEach } from 'vitest';
import { request, createTestUser } from './helpers';

let token: string;

// Every test gets a fresh user (tables are already truncated by setup.ts beforeEach)
beforeEach(async () => {
  const result = await createTestUser();
  token = result.token;
});

/** Helper to make authenticated requests */
function authGet(path: string) {
  return request.get(path).set('Authorization', `Bearer ${token}`);
}
function authPut(path: string) {
  return request.put(path).set('Authorization', `Bearer ${token}`);
}

// ─── GET /api/progress ───

describe('GET /api/progress', () => {
  it('returns 200 with empty array when no progress exists', async () => {
    const res = await authGet('/api/progress');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 200 with progress data after PUTs', async () => {
    await authPut('/api/progress/1').send({ status: 'solved' });
    await authPut('/api/progress/2').send({ status: 'studied' });

    const res = await authGet('/api/progress');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].problemId).toBe(1);
    expect(res.body[1].problemId).toBe(2);
  });

  it('returns 401 without token', async () => {
    const res = await request.get('/api/progress');

    expect(res.status).toBe(401);
  });
});

// ─── GET /api/progress/:problemId ───

describe('GET /api/progress/:problemId', () => {
  it('returns 200 with data for existing problem', async () => {
    await authPut('/api/progress/10').send({ status: 'solved', confidence: 5 });

    const res = await authGet('/api/progress/10');

    expect(res.status).toBe(200);
    expect(res.body.problemId).toBe(10);
    expect(res.body.status).toBe('solved');
    expect(res.body.confidence).toBe(5);
  });

  it('returns 200 with null for non-existent problem', async () => {
    const res = await authGet('/api/progress/999');

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('returns 400 for invalid problem ID (zero)', async () => {
    const res = await authGet('/api/progress/0');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid problem ID');
  });

  it('returns 400 for invalid problem ID (negative)', async () => {
    const res = await authGet('/api/progress/-1');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid problem ID');
  });

  it('returns 400 for non-numeric problem ID', async () => {
    const res = await authGet('/api/progress/abc');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid problem ID');
  });

  it('returns 401 without token', async () => {
    const res = await request.get('/api/progress/1');

    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/progress/:problemId ───

describe('PUT /api/progress/:problemId', () => {
  it('creates new progress record', async () => {
    const res = await authPut('/api/progress/1').send({
      status: 'solved',
      confidence: 4,
      solvedIndependently: true,
    });

    expect(res.status).toBe(200);
    expect(res.body.problemId).toBe(1);
    expect(res.body.status).toBe('solved');
    expect(res.body.confidence).toBe(4);
    expect(res.body.solvedIndependently).toBe(true);
    expect(res.body.lastAttempted).toBeTruthy();
  });

  it('updates existing progress record', async () => {
    await authPut('/api/progress/1').send({ status: 'in_progress' });

    const res = await authPut('/api/progress/1').send({ status: 'solved' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('solved');
  });

  it('partial update preserves existing fields via COALESCE', async () => {
    // First: set multiple fields
    await authPut('/api/progress/1').send({
      status: 'solved',
      confidence: 5,
      notes: 'First attempt',
      solvedIndependently: true,
    });

    // Second: only update confidence — other fields should be preserved
    const res = await authPut('/api/progress/1').send({
      confidence: 3,
    });

    expect(res.status).toBe(200);
    expect(res.body.confidence).toBe(3);
    expect(res.body.status).toBe('solved');         // preserved
    expect(res.body.notes).toBe('First attempt');    // preserved
    expect(res.body.solvedIndependently).toBe(true); // preserved
  });

  it('returns 400 for invalid problem ID', async () => {
    const res = await authPut('/api/progress/0').send({ status: 'solved' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid problem ID');
  });

  it('returns 400 for Zod validation errors', async () => {
    const res = await authPut('/api/progress/1').send({
      status: 'invalid_status',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 for confidence out of range', async () => {
    const res = await authPut('/api/progress/1').send({
      confidence: 10,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 401 without token', async () => {
    const res = await request.put('/api/progress/1').send({ status: 'solved' });

    expect(res.status).toBe(401);
  });
});

// ─── GET /api/progress/dashboard ───

describe('GET /api/progress/dashboard', () => {
  it('returns 200 with all zeros for user with no progress', async () => {
    const res = await authGet('/api/progress/dashboard');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.solved).toBe(0);
    expect(res.body.studied).toBe(0);
    expect(res.body.inProgress).toBe(0);
    expect(res.body.review).toBe(0);
    expect(res.body.notStarted).toBe(0);
    expect(res.body.solvedIndependently).toBe(0);
    expect(res.body.solvedIn20Min).toBe(0);
  });

  it('returns correct counts after inserting mixed statuses', async () => {
    // Insert progress with various statuses
    await authPut('/api/progress/1').send({ status: 'solved', solvedIndependently: true, solvedIn20Min: true, confidence: 5 });
    await authPut('/api/progress/2').send({ status: 'solved', solvedIndependently: true, confidence: 4 });
    await authPut('/api/progress/3').send({ status: 'studied', confidence: 3 });
    await authPut('/api/progress/4').send({ status: 'in_progress', confidence: 2 });
    await authPut('/api/progress/5').send({ status: 'review', confidence: 1 });
    await authPut('/api/progress/6').send({ status: 'not_started' });

    const res = await authGet('/api/progress/dashboard');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(6);
    expect(res.body.solved).toBe(2);
    expect(res.body.studied).toBe(1);
    expect(res.body.inProgress).toBe(1);
    expect(res.body.review).toBe(1);
    expect(res.body.notStarted).toBe(1);
    expect(res.body.solvedIndependently).toBe(2);
    expect(res.body.solvedIn20Min).toBe(1);
  });

  it('calculates avgConfidence correctly', async () => {
    await authPut('/api/progress/1').send({ status: 'solved', confidence: 5 });
    await authPut('/api/progress/2').send({ status: 'solved', confidence: 3 });

    const res = await authGet('/api/progress/dashboard');

    expect(res.status).toBe(200);
    // AVG(5, 3) = 4.0
    expect(res.body.avgConfidence).toBe(4);
  });

  it('returns 401 without token', async () => {
    const res = await request.get('/api/progress/dashboard');

    expect(res.status).toBe(401);
  });
});
