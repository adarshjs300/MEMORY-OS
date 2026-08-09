import { Router } from 'express';
import { checkDbConnection } from '../db/pool';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const dbOk = await checkDbConnection();
  const status = dbOk ? 200 : 503;
  res.status(status).json({
    status: dbOk ? 'ok' : 'degraded',
    database: dbOk ? 'connected' : 'unreachable',
    timestamp: new Date().toISOString(),
  });
});
