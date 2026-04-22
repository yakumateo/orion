import 'dotenv/config';
import express from 'express';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDB, disconnectDB } from './database/prisma.client';
import { chatRouter } from './api/routes/chat.routes';
import { memoryRouter } from './api/routes/memory.routes';
import { errorHandler } from './api/middleware/error-handler';

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/chat', chatRouter);
app.use('/api/memory', memoryRouter);

// ─── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(`Orion API running`, { port: env.PORT, env: env.NODE_ENV });
  });

  // Graceful shutdown — close DB and server cleanly on exit
  const shutdown = async () => {
    logger.info('Shutting down...');
    server.close();
    await disconnectDB();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  logger.error('Failed to start', { error: err });
  process.exit(1);
});
