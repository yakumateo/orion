import { env } from '../config/env';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// In-process store — lives as long as the process runs.
// In Phase 1b this moves to Redis for multi-session support.
const sessions = new Map<string, ChatMessage[]>();

export function getHistory(sessionId: string): ChatMessage[] {
  return sessions.get(sessionId) ?? [];
}

export function addMessage(sessionId: string, message: ChatMessage): void {
  const history = sessions.get(sessionId) ?? [];
  history.push(message);

  // Trim to limit — keeps the context window manageable and costs low
  if (history.length > env.MEMORY_SHORT_TERM_LIMIT * 2) {
    history.splice(0, 2); // remove oldest user+assistant pair
  }

  sessions.set(sessionId, history);
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}
