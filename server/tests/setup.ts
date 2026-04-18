import { beforeEach } from 'vitest';
import { pool } from '../src/db';

// Clean slate before every test — wipe all rows from all tables
beforeEach(async () => {
  await pool.query('TRUNCATE users, progress, refresh_tokens, sketches CASCADE');
});

// Drain the connection pool when the process exits (after all test files finish).
// Using 'beforeExit' avoids the "pool.end() called too early between files" problem
// that would happen if we used afterAll (which fires per-file).
let poolEnded = false;
process.on('beforeExit', async () => {
  if (!poolEnded) {
    poolEnded = true;
    await pool.end();
  }
});
