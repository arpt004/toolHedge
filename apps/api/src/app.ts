import cors from 'cors';
import express from 'express';
import { config } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { categoryRouter } from './modules/routes/category.routes';
import { compareRouter } from './modules/routes/compare.routes';
import { softwareRouter } from './modules/routes/software.routes';

export const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.get('/health', async (_req, res) => {
  if (config.dataSource === 'json') {
    res.json({ status: 'ok', dataSource: 'json' });
    return;
  }
  try {
    const { prisma } = await import('./lib/prisma.js');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', dataSource: 'db', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', dataSource: 'db', database: 'disconnected' });
  }
});
app.use('/api/v1/software', softwareRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/compare', compareRouter);
app.use(notFoundHandler);
app.use(errorHandler);
