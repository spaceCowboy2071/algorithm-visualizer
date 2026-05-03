import { pool } from '../db';
import { WhiteboardUpdateInput } from '../validation/schemas';

export async function getWhiteboard(userId: string) {
  const result = await pool.query(
    'SELECT * FROM whiteboards WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

export async function upsertWhiteboard(userId: string, data: WhiteboardUpdateInput) {
  const result = await pool.query(
    `INSERT INTO whiteboards (user_id, stroke_data, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       stroke_data = $2,
       updated_at = NOW()
     RETURNING *`,
    [userId, data]
  );
  return result.rows[0];
}
