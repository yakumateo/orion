import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const createPrismaClient = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [{ level: 'query', emit: 'stdout' }, { level: 'error', emit: 'stdout' }]
        : [{ level: 'error', emit: 'stdout' }],
  });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDB(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connected');
}

export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
