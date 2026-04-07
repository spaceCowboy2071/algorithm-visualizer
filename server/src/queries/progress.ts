import { pool } from '../db';
import { ProgressUpdateInput } from '../validation/schemas';

export async function getAllProgress(userId: string) {
  const result = await pool.query(
    'SELECT * FROM progress WHERE user_id = $1 ORDER BY problem_id',
    [userId]
  );
  return result.rows;
}

export async function getProgressByProblem(userId: string, problemId: number) {
  const result = await pool.query(
    'SELECT * FROM progress WHERE user_id = $1 AND problem_id = $2',
    [userId, problemId]
  );
  return result.rows[0] || null;
}

export async function upsertProgress(userId: string, problemId: number, data: ProgressUpdateInput) {
  const result = await pool.query(
    `INSERT INTO progress (user_id, problem_id, status, solved_independently, solved_in_20_min,
       confidence, attempt_count, last_attempted, time_complexity, space_complexity,
       notes, saved_code_js, saved_code_python)
     VALUES ($1, $2, COALESCE($3, 'not_started'), COALESCE($4, false), COALESCE($5, false),
       COALESCE($6, 0), COALESCE($7, 0), NOW(), $8, $9, $10, $11, $12)
     ON CONFLICT (user_id, problem_id)
     DO UPDATE SET
       status = COALESCE($3, progress.status),
       solved_independently = COALESCE($4, progress.solved_independently),
       solved_in_20_min = COALESCE($5, progress.solved_in_20_min),
       confidence = COALESCE($6, progress.confidence),
       attempt_count = COALESCE($7, progress.attempt_count),
       last_attempted = NOW(),
       time_complexity = COALESCE($8, progress.time_complexity),
       space_complexity = COALESCE($9, progress.space_complexity),
       notes = COALESCE($10, progress.notes),
       saved_code_js = COALESCE($11, progress.saved_code_js),
       saved_code_python = COALESCE($12, progress.saved_code_python)
     RETURNING *`,
    [
      userId,
      problemId,
      data.status ?? null,
      data.solvedIndependently ?? null,
      data.solvedIn20Min ?? null,
      data.confidence ?? null,
      data.attemptCount ?? null,
      data.timeComplexity ?? null,
      data.spaceComplexity ?? null,
      data.notes ?? null,
      data.savedCodeJs ?? null,
      data.savedCodePython ?? null,
    ]
  );
  return result.rows[0];
}

export async function getDashboardStats(userId: string) {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'solved')::int AS solved,
       COUNT(*) FILTER (WHERE status = 'studied')::int AS studied,
       COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
       COUNT(*) FILTER (WHERE status = 'review')::int AS review,
       COUNT(*) FILTER (WHERE status = 'not_started')::int AS not_started,
       COUNT(*) FILTER (WHERE solved_independently = true)::int AS solved_independently,
       COUNT(*) FILTER (WHERE solved_in_20_min = true)::int AS solved_in_20_min,
       ROUND(COALESCE(AVG(confidence) FILTER (WHERE confidence > 0), 0), 1)::float AS avg_confidence
     FROM progress
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
}
