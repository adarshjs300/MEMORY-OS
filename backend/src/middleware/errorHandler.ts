import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (!err.isOperational || err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack, path: req.originalUrl });
    }
    res.status(err.statusCode).json({
  error: { message: err.message, details: err.details },
});
return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error('Unhandled error', {
    message,
    stack: err instanceof Error ? err.stack : undefined,
    path: req.originalUrl,
  });

  res.status(500).json({
    error: {
      message: env.NODE_ENV === 'production' ? 'Internal server error' : message,
    },
  });
}
