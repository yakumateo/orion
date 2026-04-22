import { Router, Request, Response } from 'express';
import { getWeeklySummary, formatSummaryForAgent } from '../../domains/finance/finance.service';
import { asyncHandler } from '../middleware/error-handler';

export const financeRouter = Router();

financeRouter.get(
  '/summary',
  asyncHandler(async (_req: Request, res: Response) => {
    const summary = await getWeeklySummary();
    res.json(summary);
  }),
);
