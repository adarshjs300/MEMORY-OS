/**
 * Minimal, dependency-free migration runner.
 *
 * Usage:
 *   npm run migrate          -> applies all pending *.sql migrations in order
 *   npm run migrate:down     -> rolls back the most recently applied migration
 *
 * Migrations live in src/db/migrations/NNN_name.sql (up) and
 * src/db/migrations/NNN_name.down.sql (down, optional but recommended).
 * Applied migrations are tracked in the schema_migrations table so this
 * is safe to run repeatedly / in CI.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pool } from './pool';
import { logger } from '../utils/logger';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

function listUpMigrations(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
    .sort();
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  return new Set(result.rows.map((r) => r.name));
}

async function runUp(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const all = listUpMigrations();
  const pending = all.filter((name) => !applied.has(name));

  if (pending.length === 0) {
    logger.info('No pending migrations. Database is up to date.');
    return;
  }

  for (const name of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      logger.info(`Applied migration: ${name}`);
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`Migration failed: ${name}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    } finally {
      client.release();
    }
  }
}

async function runDown(): Promise<void> {
  await ensureMigrationsTable();
  const result = await pool.query<{ name: string }>(
    'SELECT name FROM schema_migrations ORDER BY applied_at DESC LIMIT 1'
  );
  const last = result.rows[0];
  if (!last) {
    logger.info('No migrations to roll back.');
    return;
  }

  const downFile = last.name.replace(/\.sql$/, '.down.sql');
  const downPath = path.join(MIGRATIONS_DIR, downFile);
  if (!fs.existsSync(downPath)) {
    throw new Error(`No down migration found for ${last.name} (expected ${downFile})`);
  }

  const sql = fs.readFileSync(downPath, 'utf-8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('DELETE FROM schema_migrations WHERE name = $1', [last.name]);
    await client.query('COMMIT');
    logger.info(`Rolled back migration: ${last.name}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  const direction = process.argv[2] === 'down' ? 'down' : 'up';
  try {
    if (direction === 'down') {
      await runDown();
    } else {
      await runUp();
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  logger.error('Migration run failed', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
