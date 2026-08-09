import { Pool, type PoolConfig, type QueryResultRow } from 'pg';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  // Unexpected errors on idle clients — log and keep the process alive;
  // pg will remove the dead client from the pool automatically.
  logger.error('Unexpected error on idle Postgres client', { error: err.message });
});

/**
 * Thin query helper. Prefer this over grabbing a raw client for single
 * statements — it returns the connection to the pool automatically.
 */
export async function query<T extends 
QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (duration > 200) {
    logger.warn('Slow query', { text, duration, rows: result.rowCount });
  }
  return result;
}

/**
 * Run a set of statements inside a transaction. Rolls back automatically
 * on any thrown error and always releases the client.
 */
export async function withTransaction<T>(
  fn: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    logger.error('Database connection check failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
