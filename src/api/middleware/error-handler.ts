import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../config/logger';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors — bad input from client
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const message = statusCode < 500 ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
  }

  res.status(statusCode).json({ error: message });
}

// Wrap async route handlers to avoid try/catch in every route
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
