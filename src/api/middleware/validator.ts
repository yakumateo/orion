import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000),
  sessionId: z.string().min(1).optional(),
});

export const memoryRequestSchema = z.object({
  type: z.enum(['goal', 'preference', 'fact', 'pattern']),
  content: z.string().min(1).max(500),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type MemoryRequest = z.infer<typeof memoryRequestSchema>;
