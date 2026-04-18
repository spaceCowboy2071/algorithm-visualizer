import { describe, it, expect, beforeEach } from 'vitest';
import { request, createTestUser } from './helpers';

let token: string;

// Every test gets a fresh user (tables are truncated by setup.ts beforeEach)
beforeEach(async () => {
  const result = await createTestUser();
  token = result.token;
});

function authGet(path: string) {
  return request.get(path).set('Authorization', `Bearer ${token}`);
}
function authPut(path: string) {
  return request.put(path).set('Authorization', `Bearer ${token}`);
}
function authDelete(path: string) {
  return request.delete(path).set('Authorization', `Bearer ${token}`);
}

// Baseline valid request body — tests override fields as needed
const validSketchBody = {
  strokes: [
    { tool: 'pencil', color: '#000000', size: 'md', points: [[10, 20], [12, 22]] },
  ],
  canvasWidth: 800,
  canvasHeight: 600,
};

const EMPTY_STROKE_DATA = { strokes: [], canvasWidth: 0, canvasHeight: 0 };

// ─── GET /api/sketches/:problemId ───

describe('GET /api/sketches/:problemId', () => {
  it('returns 200 with empty default when no sketch exists', async () => {
    const res = await authGet('/api/sketches/1');

    expect(res.status).toBe(200);
    expect(res.body.problemId).toBe(1);
    expect(res.body.strokeData).toEqual(EMPTY_STROKE_DATA);
    expect(res.body.updatedAt).toBeNull();
  });

  it('returns 200 with saved sketch data after PUT', async () => {
    await authPut('/api/sketches/5').send(validSketchBody);

    const res = await authGet('/api/sketches/5');

    expect(res.status).toBe(200);
    expect(res.body.problemId).toBe(5);
    expect(res.body.strokeData).toEqual(validSketchBody);
    expect(res.body.id).toBeTruthy();
    expect(res.body.updatedAt).toBeTruthy();
  });

  it('isolates sketches per user (user B cannot see user A sketch)', async () => {
    // user A saves a sketch
    const userA = await createTestUser({ email: 'a@example.com' });
    await request.put('/api/sketches/1')
      .set('Authorization', `Bearer ${userA.token}`)
      .send(validSketchBody);

    // user B (token from beforeEach) requests same problemId — should see empty default
    const res = await authGet('/api/sketches/1');

    expect(res.status).toBe(200);
    expect(res.body.strokeData).toEqual(EMPTY_STROKE_DATA);
  });

  it('returns 400 for invalid problem ID (zero)', async () => {
    const res = await authGet('/api/sketches/0');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid problem ID');
  });

  it('returns 400 for non-numeric problem ID', async () => {
    const res = await authGet('/api/sketches/abc');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid problem ID');
  });

  it('returns 401 without token', async () => {
    const res = await request.get('/api/sketches/1');

    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/sketches/:problemId ───

describe('PUT /api/sketches/:problemId', () => {
  it('creates a new sketch row', async () => {
    const res = await authPut('/api/sketches/1').send(validSketchBody);

    expect(res.status).toBe(200);
    expect(res.body.problemId).toBe(1);
    expect(res.body.strokeData).toEqual(validSketchBody);
    expect(res.body.id).toBeTruthy();
    expect(res.body.updatedAt).toBeTruthy();
  });

  it('updates an existing sketch (overwrites whole blob)', async () => {
    await authPut('/api/sketches/1').send(validSketchBody);

    const newBody = {
      strokes: [
        { tool: 'brush', color: '#ff0000', size: 'lg', points: [[5, 5]] },
        { tool: 'rect', color: '#0000ff', size: 'sm', startX: 10, startY: 10, endX: 50, endY: 50 },
      ],
      canvasWidth: 1024,
      canvasHeight: 768,
    };
    const res = await authPut('/api/sketches/1').send(newBody);

    expect(res.status).toBe(200);
    expect(res.body.strokeData).toEqual(newBody);
  });

  it('does not duplicate rows on repeated PUT (upsert behavior)', async () => {
    await authPut('/api/sketches/1').send(validSketchBody);
    await authPut('/api/sketches/1').send({ ...validSketchBody, canvasWidth: 999 });

    // GET reflects the latest write — uniqueness enforced at DB level via UNIQUE(user_id, problem_id)
    const res = await authGet('/api/sketches/1');
    expect(res.body.strokeData.canvasWidth).toBe(999);
  });

  it('returns 400 for invalid problem ID', async () => {
    const res = await authPut('/api/sketches/0').send(validSketchBody);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid problem ID');
  });

  it('returns 400 when body is missing required fields', async () => {
    const res = await authPut('/api/sketches/1').send({ strokes: [] });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 when strokes is not an array (envelope validation)', async () => {
    const res = await authPut('/api/sketches/1').send({
      strokes: 'oops',
      canvasWidth: 800,
      canvasHeight: 600,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 when stroke array exceeds bloat cap (>2000)', async () => {
    const res = await authPut('/api/sketches/1').send({
      strokes: new Array(2001).fill({ tool: 'pencil' }),
      canvasWidth: 800,
      canvasHeight: 600,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 when canvas dimensions exceed cap', async () => {
    const res = await authPut('/api/sketches/1').send({
      strokes: [],
      canvasWidth: 99999,
      canvasHeight: 600,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 401 without token', async () => {
    const res = await request.put('/api/sketches/1').send(validSketchBody);

    expect(res.status).toBe(401);
  });
});

// ─── DELETE /api/sketches/:problemId ───

describe('DELETE /api/sketches/:problemId', () => {
  it('returns 204 and removes the sketch', async () => {
    await authPut('/api/sketches/1').send(validSketchBody);

    const deleteRes = await authDelete('/api/sketches/1');
    expect(deleteRes.status).toBe(204);

    // After delete, GET should return the empty default
    const getRes = await authGet('/api/sketches/1');
    expect(getRes.status).toBe(200);
    expect(getRes.body.strokeData).toEqual(EMPTY_STROKE_DATA);
    expect(getRes.body.updatedAt).toBeNull();
  });

  it('returns 204 when no sketch exists (idempotent)', async () => {
    const res = await authDelete('/api/sketches/999');

    expect(res.status).toBe(204);
  });

  it('does not affect other users sketches', async () => {
    // user A saves a sketch
    const userA = await createTestUser({ email: 'a@example.com' });
    await request.put('/api/sketches/1')
      .set('Authorization', `Bearer ${userA.token}`)
      .send(validSketchBody);

    // user B (token from beforeEach) deletes their own (non-existent) sketch
    const deleteRes = await authDelete('/api/sketches/1');
    expect(deleteRes.status).toBe(204);

    // user A should still see their sketch
    const getRes = await request.get('/api/sketches/1')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(getRes.body.strokeData).toEqual(validSketchBody);
  });

  it('returns 400 for invalid problem ID', async () => {
    const res = await authDelete('/api/sketches/0');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid problem ID');
  });

  it('returns 401 without token', async () => {
    const res = await request.delete('/api/sketches/1');

    expect(res.status).toBe(401);
  });
});
