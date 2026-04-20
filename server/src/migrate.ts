import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Pool } from 'pg';

const MIGRATIONS_DIR = resolve(__dirname, '../migrations');

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const applied = new Set(
      (await pool.query<{ filename: string }>('SELECT filename FROM schema_migrations')).rows.map(
        (r) => r.filename,
      ),
    );

    const onDisk = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pending = onDisk.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log(`No pending migrations (${applied.size} already applied)`);
      return;
    }

    console.log(`Applying ${pending.length} migration(s):`);

    for (const file of pending) {
      const sql = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
      } finally {
        client.release();
      }
    }

    console.log('All migrations applied successfully');
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
