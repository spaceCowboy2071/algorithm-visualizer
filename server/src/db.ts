import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL');
    client.release();
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
  }
}
