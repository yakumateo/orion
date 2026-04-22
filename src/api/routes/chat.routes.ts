import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { chat } from '../../agent/orchestrator';
import { getHistory, clearSession } from '../../memory/short-term';
import { asyncHandler } from '../middleware/error-handler';
import { chatRequestSchema } from '../middleware/validator';

export const chatRouter = Router();

chatRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { message, sessionId } = chatRequestSchema.parse(req.body);
    const resolvedSessionId = sessionId ?? randomUUID();

    const response = await chat(resolvedSessionId, message);

    res.json({
      sessionId: resolvedSessionId,
      message: response,
      timestamp: new Date().toISOString(),
    });
  }),
);

chatRouter.get(
  '/:sessionId/history',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = String(req.params['sessionId']);
    const history = getHistory(sessionId);

    res.json({ sessionId, messages: history, count: history.length });
  }),
);

chatRouter.delete(
  '/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = String(req.params['sessionId']);
    clearSession(sessionId);

    res.json({ message: 'Session cleared', sessionId });
  }),
);
