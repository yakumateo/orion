import { GoogleGenAI, Type } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { buildSystemPrompt } from './context-builder';
import { ORION_TOOLS, executeTool, ToolInput } from './tool-router';
import { getHistory, addMessage, ChatMessage } from '../memory/short-term';

// ─── Provider abstraction ────────────────────────────────────────────────────

interface AIResponse {
  text: string;
  toolCalls: Array<{ id: string; name: string; input: ToolInput }>;
  stopReason: 'end_turn' | 'tool_use';
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Gemini adapter ──────────────────────────────────────────────────────────

const geminiClient = env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
  : null;

// Convert our tool definitions to Gemini format
const geminiTools = [{
  functionDeclarations: ORION_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: Type.OBJECT,
      properties: Object.fromEntries(
        Object.entries(
          (tool.input_schema as { properties: Record<string, { type: string; description?: string }> }).properties,
        ).map(([key, val]) => [
          key,
          { type: Type.STRING, description: val.description ?? '' },
        ]),
      ),
      required: (tool.input_schema as unknown as { required: string[] }).required ?? [],
    },
  })),
}];

async function callGemini(
  systemPrompt: string,
  history: AIMessage[],
): Promise<AIResponse> {
  if (!geminiClient) throw new Error('Gemini client not initialized');

  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await geminiClient.models.generateContent({
    model: env.GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: systemPrompt,
      tools: geminiTools,
    },
  });

  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];

  const toolCalls: AIResponse['toolCalls'] = [];
  let text = '';

  for (const part of parts) {
    if (part.text) text += part.text;
    if (part.functionCall) {
      toolCalls.push({
        id: part.functionCall.name ?? 'unknown',
        name: part.functionCall.name ?? '',
        input: (part.functionCall.args ?? {}) as ToolInput,
      });
    }
  }

  return {
    text,
    toolCalls,
    stopReason: toolCalls.length > 0 ? 'tool_use' : 'end_turn',
  };
}

// ─── Anthropic adapter ───────────────────────────────────────────────────────

const anthropicClient = env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  : null;

async function callAnthropic(
  systemPrompt: string,
  history: AIMessage[],
): Promise<AIResponse> {
  if (!anthropicClient) throw new Error('Anthropic client not initialized');

  const response = await anthropicClient.messages.create({
    model: env.CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    tools: ORION_TOOLS,
    messages: history,
  });

  const toolCalls: AIResponse['toolCalls'] = [];
  let text = '';

  for (const block of response.content) {
    if (block.type === 'text') text += block.text;
    if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        name: block.name,
        input: block.input as ToolInput,
      });
    }
  }

  return {
    text,
    toolCalls,
    stopReason: response.stop_reason === 'tool_use' ? 'tool_use' : 'end_turn',
  };
}

// ─── Provider selector ───────────────────────────────────────────────────────

async function callAI(systemPrompt: string, history: AIMessage[]): Promise<AIResponse> {
  if (env.AI_PROVIDER === 'gemini') return callGemini(systemPrompt, history);
  return callAnthropic(systemPrompt, history);
}

// ─── Main orchestrator ───────────────────────────────────────────────────────

export async function chat(sessionId: string, userMessage: string): Promise<string> {
  addMessage(sessionId, { role: 'user', content: userMessage });

  const systemPrompt = await buildSystemPrompt();
  const history: ChatMessage[] = getHistory(sessionId);

  logger.debug('Sending to AI', { provider: env.AI_PROVIDER, sessionId, messages: history.length });

  try {
    let response = await callAI(systemPrompt, history);

    while (response.stopReason === 'tool_use' && response.toolCalls.length > 0) {
      const toolCall = response.toolCalls[0];
      const toolResult = await executeTool(toolCall.name, toolCall.input);
      logger.info('Tool executed', { tool: toolCall.name, result: toolResult });

      const historyWithTool: ChatMessage[] = [
        ...history,
        { role: 'assistant', content: response.text || `[usando herramienta: ${toolCall.name}]` },
        { role: 'user', content: `Resultado de ${toolCall.name}: ${toolResult}` },
      ];

      response = await callAI(systemPrompt, historyWithTool);
    }

    const assistantMessage = response.text || 'No pude procesar eso.';
    addMessage(sessionId, { role: 'assistant', content: assistantMessage });
    return assistantMessage;

  } catch (error: unknown) {
    // Gemini quota exhausted — devuelve 503 en lugar de 500
    const isQuotaError =
      error instanceof Error && error.message.includes('RESOURCE_EXHAUSTED');

    if (isQuotaError) {
      logger.warn('AI provider quota exhausted', { sessionId, provider: env.AI_PROVIDER });
      const serviceError = Object.assign(
        new Error('El agente está temporalmente ocupado. Intenta en 30 segundos.'),
        { statusCode: 503 },
      );
      throw serviceError;
    }

    // Cualquier otro error — re-throw para que errorHandler lo capture
    throw error;
  }
}