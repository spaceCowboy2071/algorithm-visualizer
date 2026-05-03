import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { whiteboardUpdateSchema } from '../validation/schemas';
import { getWhiteboard, upsertWhiteboard } from '../queries/whiteboards';

const router = Router();

router.use(authenticate);

const EMPTY_WHITEBOARD = { strokes: [], canvasWidth: 0, canvasHeight: 0 };

function formatWhiteboard(row: Record<string, unknown>) {
  return {
    id: row.id,
    strokeData: row.stroke_data,
    updatedAt: row.updated_at,
  };
}

// ── GET /api/whiteboards ──
// Returns the saved whiteboard, or an empty default if the user has none yet.
// Same "no missing case" contract as sketches — the canvas always has data to render.
router.get('/', async (req: Request, res: Response) => {
  try {
    const row = await getWhiteboard(req.userId!);
    if (!row) {
      res.json({ strokeData: EMPTY_WHITEBOARD, updatedAt: null });
      return;
    }
    res.json(formatWhiteboard(row));
  } catch (err) {
    console.error('Get whiteboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api/whiteboards ──
router.put('/', async (req: Request, res: Response) => {
  const parsed = whiteboardUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.issues });
    return;
  }

  try {
    const row = await upsertWhiteboard(req.userId!, parsed.data);
    res.json(formatWhiteboard(row));
  } catch (err) {
    console.error('Upsert whiteboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
