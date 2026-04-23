import Anthropic from '@anthropic-ai/sdk';
import * as financeService from '../domains/finance/finance.service';
import { logger } from '../config/logger';

export const ORION_TOOLS: Anthropic.Tool[] = [
  {
    name: 'record_expense',
    description: 'Registra un gasto del usuario. Úsalo cuando mencione haber gastado dinero.',
    input_schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Monto del gasto' },
        category: {
          type: 'string',
          description: 'Categoría: alimentación, transporte, entretenimiento, salud, educación, otro',
        },
        description: { type: 'string', description: 'Descripción breve, máximo 4 palabras' },
        currency: { type: 'string', description: 'Siempre usar PEN', default: 'PEN' },
        date: { type: 'string', description: 'Fecha ISO 8601 (YYYY-MM-DD). Si el usuario dice "ayer", calcula la fecha correcta.' },
      },
      required: ['amount', 'category', 'description'],
    },
  },
  {
    name: 'record_income',
    description: 'Registra un ingreso del usuario.',
    input_schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Monto del ingreso' },
        category: { type: 'string', description: 'Categoría: sueldo, freelance, otro' },
        description: { type: 'string', description: 'Descripción breve' },
        currency: { type: 'string', default: 'PEN' },
        date: { type: 'string', description: 'Fecha ISO 8601 (YYYY-MM-DD)' },
      },
      required: ['amount', 'category', 'description'],
    },
  },
  {
    name: 'get_weekly_finance_summary',
    description: 'Obtiene el resumen financiero de los últimos 7 días.',
    input_schema: {
      type: 'object',
      properties: {
        currency: { type: 'string', default: 'PEN' },
      },
      required: [],
    },
  },
];

export interface ToolInput {
  amount?: number;
  category?: string;
  description?: string;
  currency?: string;
  date?: string;
}

export async function executeTool(name: string, input: ToolInput): Promise<string> {
  logger.debug('Executing tool', { name, input });

  switch (name) {
    case 'record_expense': {
      const entry = await financeService.recordExpense({
        amount: input.amount!,
        category: input.category!,
        description: input.description!,
        currency: input.currency ?? 'PEN',
        date: input.date ? new Date(input.date) : undefined,
      });
      return `Gasto registrado: ${entry.currency} ${entry.amount} en ${entry.category} — "${entry.description}" (${entry.date.toISOString().split('T')[0]})`;
    }

    case 'record_income': {
      const entry = await financeService.recordIncome({
        amount: input.amount!,
        category: input.category!,
        description: input.description!,
        currency: input.currency ?? 'PEN',
        date: input.date ? new Date(input.date) : undefined,
      });
      return `Ingreso registrado: ${entry.currency} ${entry.amount} — "${entry.description}" (${entry.date.toISOString().split('T')[0]})`;
    }

    case 'get_weekly_finance_summary': {
      const summary = await financeService.getWeeklySummary(input.currency);
      return financeService.formatSummaryForAgent(summary);
    }

    default:
      logger.warn('Unknown tool called', { name });
      return `Herramienta desconocida: ${name}`;
  }
}
