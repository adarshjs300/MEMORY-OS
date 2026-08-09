import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { healthRouter } from './routes/health.routes';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  // Security headers first.
  app.use(helmet());

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(apiLimiter);

  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  app.use('/health', healthRouter);
  app.use('/api/auth', authRouter);

  // Later phases mount here:
  // app.use('/api/memories', memoriesRouter);
  // app.use('/api/search', searchRouter);
  // app.use('/api/chat', chatRouter);
  // app.use('/api/knowledge-graph', knowledgeGraphRouter);
  // app.use('/api/timeline', timelineRouter);
  // app.use('/api/insights', insightsRouter);
  // app.use('/api/projects', projectsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
