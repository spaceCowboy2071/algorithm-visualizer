import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { progressUpdateSchema } from '../validation/schemas';
import {
  getAllProgress,
  getProgressByProblem,
  upsertProgress,
  getDashboardStats,
} from '../queries/progress';

const router = Router();

// All progress routes require authentication
router.use(authenticate);

// ── Helpers ──

function formatProgress(row: Record<string, unknown>) {
  return {
    id: row.id,
    problemId: row.problem_id,
    status: row.status,
    solvedIndependently: row.solved_independently,
    solvedIn20Min: row.solved_in_20_min,
    confidence: row.confidence,
    attemptCount: row.attempt_count,
    lastAttempted: row.last_attempted,
    timeComplexity: row.time_complexity,
    spaceComplexity: row.space_complexity,
    notes: row.notes,
    savedCodeJs: row.saved_code_js,
    savedCodePython: row.saved_code_python,
  };
}

// ── GET /api/progress/dashboard ──
// Must be defined BEFORE /:problemId so Express doesn't treat "dashboard" as a problemId
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const stats = await getDashboardStats(req.userId!);
    res.json({
      total: stats.total,
      solved: stats.solved,
      studied: stats.studied,
      inProgress: stats.in_progress,
      review: stats.review,
      notStarted: stats.not_started,
      solvedIndependently: stats.solved_independently,
      solvedIn20Min: stats.solved_in_20_min,
      avgConfidence: stats.avg_confidence,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/progress ──
router.get('/', async (req: Request, res: Response) => {
  try {
    const rows = await getAllProgress(req.userId!);
    res.json(rows.map(formatProgress));
  } catch (err) {
    console.error('Get all progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/progress/:problemId ──
router.get('/:problemId', async (req: Request, res: Response) => {
  const problemId = parseInt(req.params.problemId as string, 10);
  if (isNaN(problemId) || problemId < 1) {
    res.status(400).json({ error: 'Invalid problem ID' });
    return;
  }

  try {
    const row = await getProgressByProblem(req.userId!, problemId);
    if (!row) {
      res.json(null);
      return;
    }
    res.json(formatProgress(row));
  } catch (err) {
    console.error('Get problem progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api/progress/:problemId ──
router.put('/:problemId', async (req: Request, res: Response) => {
  const problemId = parseInt(req.params.problemId as string, 10);
  if (isNaN(problemId) || problemId < 1) {
    res.status(400).json({ error: 'Invalid problem ID' });
    return;
  }

  const parsed = progressUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.issues });
    return;
  }

  try {
    const row = await upsertProgress(req.userId!, problemId, parsed.data);
    res.json(formatProgress(row));
  } catch (err) {
    console.error('Upsert progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
