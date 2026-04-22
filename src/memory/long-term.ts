import { prisma } from '../database/prisma.client';
import { env } from '../config/env';

export type MemoryType = 'goal' | 'preference' | 'fact' | 'pattern';

export interface MemoryFact {
  id: string;
  type: MemoryType;
  content: string;
}

export async function saveFact(type: MemoryType, content: string): Promise<void> {
  await prisma.memory.create({ data: { type, content } });
}

export async function getRelevantFacts(): Promise<MemoryFact[]> {
  const facts = await prisma.memory.findMany({
    orderBy: { updatedAt: 'desc' },
    take: env.MEMORY_LONG_TERM_INJECT_LIMIT,
  });

  return facts.map((f: { id: string; type: string; content: string }) => ({
    id: f.id,
    type: f.type as MemoryType,
    content: f.content,
  }));
}

export async function formatFactsForPrompt(): Promise<string> {
  const facts = await getRelevantFacts();
  if (facts.length === 0) return '';

  const lines = facts.map((f) => `[${f.type.toUpperCase()}] ${f.content}`).join('\n');
  return `\nLo que sé sobre el usuario:\n${lines}`;
}
