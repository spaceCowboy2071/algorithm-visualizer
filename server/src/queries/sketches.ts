import { pool } from '../db';
import { SketchUpdateInput } from '../validation/schemas';

export async function getSketch(userId: string, problemId: number) {
  const result = await pool.query(
    'SELECT * FROM sketches WHERE user_id = $1 AND problem_id = $2',
    [userId, problemId]
  );
  return result.rows[0] || null;
}

export async function upsertSketch(userId: string, problemId: number, data: SketchUpdateInput) {
  const result = await pool.query(
    `INSERT INTO sketches (user_id, problem_id, stroke_data, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, problem_id)
     DO UPDATE SET
       stroke_data = $3,
       updated_at = NOW()
     RETURNING *`,
    [userId, problemId, data]
  );
  return result.rows[0];
}

export async function deleteSketch(userId: string, problemId: number) {
  const result = await pool.query(
    'DELETE FROM sketches WHERE user_id = $1 AND problem_id = $2',
    [userId, problemId]
  );
  return result.rowCount ?? 0;
}
