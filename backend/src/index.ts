import { createApp } from './app';
import { env } from './config/env';
import { checkDbConnection, pool } from './db/pool';
import { logger } from './utils/logger';

async function main() {
  const dbOk = await checkDbConnection();
  if (!dbOk) {
    logger.error('Could not connect to the database on startup. Check DATABASE_URL and that Postgres is running.');
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Digital Memory OS API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await pool.end();
      logger.info('Shutdown complete.');
      process.exit(0);
    });
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Fatal error during startup', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
