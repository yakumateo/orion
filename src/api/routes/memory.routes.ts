import { Router, Request, Response } from 'express';
import { saveFact, getRelevantFacts } from '../../memory/long-term';
import { asyncHandler } from '../middleware/error-handler';
import { memoryRequestSchema } from '../middleware/validator';

export const memoryRouter = Router();

// GET /api/memory — get all long-term facts
memoryRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const facts = await getRelevantFacts();
    res.json({ facts, count: facts.length });
  }),
);

// POST /api/memory — manually save a fact
memoryRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { type, content } = memoryRequestSchema.parse(req.body);
    await saveFact(type, content);

    res.status(201).json({ message: 'Fact saved', type, content });
  }),
);
