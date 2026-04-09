import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

/**
 * Vitest globalSetup — runs once before all test files in a separate context.
 * Creates the algorithmviz_test database (if it doesn't exist) and runs the
 * schema migration. Uses its own pg.Client, NOT the app's pool singleton.
 */
export async function setup() {
  // Connect to the default 'postgres' database to create the test DB
  const adminClient = new Client({
    connectionString: 'postgresql://postgres:dev@localhost:5432/postgres',
  });
  await adminClient.connect();

  const dbCheck = await adminClient.query(
    "SELECT 1 FROM pg_database WHERE datname = 'algorithmviz_test'"
  );
  if (dbCheck.rows.length === 0) {
    await adminClient.query('CREATE DATABASE algorithmviz_test');
    console.log('Created algorithmviz_test database');
  }
  await adminClient.end();

  // Connect to the test DB and run the migration
  const testClient = new Client({
    connectionString: 'postgresql://postgres:dev@localhost:5432/algorithmviz_test',
  });
  await testClient.connect();

  const migrationSQL = fs.readFileSync(
    path.resolve(__dirname, '../migrations/001_init.sql'),
    'utf-8'
  );
  await testClient.query(migrationSQL);
  await testClient.end();
}
