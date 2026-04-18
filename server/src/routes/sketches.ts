import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { sketchUpdateSchema } from '../validation/schemas';
import { getSketch, upsertSketch, deleteSketch } from '../queries/sketches';

const router = Router();

router.use(authenticate);

const EMPTY_SKETCH = { strokes: [], canvasWidth: 0, canvasHeight: 0 };

function formatSketch(row: Record<string, unknown>) {
  return {
    id: row.id,
    problemId: row.problem_id,
    strokeData: row.stroke_data,
    updatedAt: row.updated_at,
  };
}

// ── GET /api/sketches/:problemId ──
// Returns the saved sketch, or an empty default if the user has none yet.
// The canvas always needs to render something; collapsing "no row" and "blank
// canvas" into one response simplifies the frontend.
router.get('/:problemId', async (req: Request, res: Response) => {
  const problemId = parseInt(req.params.problemId as string, 10);
  if (isNaN(problemId) || problemId < 1) {
    res.status(400).json({ error: 'Invalid problem ID' });
    return;
  }

  try {
    const row = await getSketch(req.userId!, problemId);
    if (!row) {
      res.json({ problemId, strokeData: EMPTY_SKETCH, updatedAt: null });
      return;
    }
    res.json(formatSketch(row));
  } catch (err) {
    console.error('Get sketch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api/sketches/:problemId ──
router.put('/:problemId', async (req: Request, res: Response) => {
  const problemId = parseInt(req.params.problemId as string, 10);
  if (isNaN(problemId) || problemId < 1) {
    res.status(400).json({ error: 'Invalid problem ID' });
    return;
  }

  const parsed = sketchUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.issues });
    return;
  }

  try {
    const row = await upsertSketch(req.userId!, problemId, parsed.data);
    res.json(formatSketch(row));
  } catch (err) {
    console.error('Upsert sketch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /api/sketches/:problemId ──
// Idempotent: returns 204 whether or not a row existed.
router.delete('/:problemId', async (req: Request, res: Response) => {
  const problemId = parseInt(req.params.problemId as string, 10);
  if (isNaN(problemId) || problemId < 1) {
    res.status(400).json({ error: 'Invalid problem ID' });
    return;
  }

  try {
    await deleteSketch(req.userId!, problemId);
    res.status(204).end();
  } catch (err) {
    console.error('Delete sketch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
