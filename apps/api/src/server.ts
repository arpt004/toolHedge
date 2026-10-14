import { app } from './app';
import { config } from './config/env';

const server = app.listen(config.port, () => console.log(`Toolhedge API listening on http://localhost:${config.port}`));

let shuttingDown = false;
const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; shutting down gracefully`);
  server.close(async () => {
    if (config.dataSource === 'db') {
      const { prisma } = await import('./lib/prisma.js');
      await prisma.$disconnect();
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
