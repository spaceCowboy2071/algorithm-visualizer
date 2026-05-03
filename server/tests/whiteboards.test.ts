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

// Baseline valid request body — tests override fields as needed
const validWhiteboardBody = {
  strokes: [
    { tool: 'pencil', color: '#000000', size: 'md', points: [[10, 20], [12, 22]] },
  ],
  canvasWidth: 800,
  canvasHeight: 600,
};

const EMPTY_STROKE_DATA = { strokes: [], canvasWidth: 0, canvasHeight: 0 };

// ─── GET /api/whiteboards ───

describe('GET /api/whiteboards', () => {
  it('returns 200 with empty default when no whiteboard exists', async () => {
    const res = await authGet('/api/whiteboards');

    expect(res.status).toBe(200);
    expect(res.body.strokeData).toEqual(EMPTY_STROKE_DATA);
    expect(res.body.updatedAt).toBeNull();
  });

  it('returns 200 with saved whiteboard data after PUT', async () => {
    await authPut('/api/whiteboards').send(validWhiteboardBody);

    const res = await authGet('/api/whiteboards');

    expect(res.status).toBe(200);
    expect(res.body.strokeData).toEqual(validWhiteboardBody);
    expect(res.body.id).toBeTruthy();
    expect(res.body.updatedAt).toBeTruthy();
  });

  it('isolates whiteboards per user (user B cannot see user A whiteboard)', async () => {
    // user A saves a whiteboard
    const userA = await createTestUser({ email: 'a@example.com' });
    await request.put('/api/whiteboards')
      .set('Authorization', `Bearer ${userA.token}`)
      .send(validWhiteboardBody);

    // user B (token from beforeEach) requests their own — should see empty default
    const res = await authGet('/api/whiteboards');

    expect(res.status).toBe(200);
    expect(res.body.strokeData).toEqual(EMPTY_STROKE_DATA);
  });

  it('returns 401 without token', async () => {
    const res = await request.get('/api/whiteboards');

    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/whiteboards ───

describe('PUT /api/whiteboards', () => {
  it('creates a new whiteboard row', async () => {
    const res = await authPut('/api/whiteboards').send(validWhiteboardBody);

    expect(res.status).toBe(200);
    expect(res.body.strokeData).toEqual(validWhiteboardBody);
    expect(res.body.id).toBeTruthy();
    expect(res.body.updatedAt).toBeTruthy();
  });

  it('updates an existing whiteboard (overwrites whole blob)', async () => {
    await authPut('/api/whiteboards').send(validWhiteboardBody);

    const newBody = {
      strokes: [
        { tool: 'brush', color: '#ff0000', size: 'lg', points: [[5, 5]] },
        { tool: 'rect', color: '#0000ff', size: 'sm', startX: 10, startY: 10, endX: 50, endY: 50 },
      ],
      canvasWidth: 1024,
      canvasHeight: 768,
    };
    const res = await authPut('/api/whiteboards').send(newBody);

    expect(res.status).toBe(200);
    expect(res.body.strokeData).toEqual(newBody);
  });

  it('does not duplicate rows on repeated PUT (upsert behavior)', async () => {
    await authPut('/api/whiteboards').send(validWhiteboardBody);
    await authPut('/api/whiteboards').send({ ...validWhiteboardBody, canvasWidth: 999 });

    // GET reflects the latest write — uniqueness enforced at DB level via UNIQUE(user_id)
    const res = await authGet('/api/whiteboards');
    expect(res.body.strokeData.canvasWidth).toBe(999);
  });

  it('persists the optional name field in the JSONB envelope', async () => {
    const bodyWithName = { ...validWhiteboardBody, name: 'My Practice Board' };
    await authPut('/api/whiteboards').send(bodyWithName);

    const res = await authGet('/api/whiteboards');
    expect(res.body.strokeData.name).toBe('My Practice Board');
  });

  it('returns 400 when body is missing required fields', async () => {
    const res = await authPut('/api/whiteboards').send({ strokes: [] });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 when strokes is not an array (envelope validation)', async () => {
    const res = await authPut('/api/whiteboards').send({
      strokes: 'oops',
      canvasWidth: 800,
      canvasHeight: 600,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 when stroke array exceeds bloat cap (>2000)', async () => {
    const res = await authPut('/api/whiteboards').send({
      strokes: new Array(2001).fill({ tool: 'pencil' }),
      canvasWidth: 800,
      canvasHeight: 600,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 when canvas dimensions exceed cap', async () => {
    const res = await authPut('/api/whiteboards').send({
      strokes: [],
      canvasWidth: 99999,
      canvasHeight: 600,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 401 without token', async () => {
    const res = await request.put('/api/whiteboards').send(validWhiteboardBody);

    expect(res.status).toBe(401);
  });
});
