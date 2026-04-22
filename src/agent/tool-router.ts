import Anthropic from '@anthropic-ai/sdk';
import * as financeService from '../domains/finance/finance.service';
import { logger } from '../config/logger';

// These are the tools Claude can decide to call.
// Each tool maps to a domain service.
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
        description: { type: 'string', description: 'Descripción breve del gasto' },
        currency: { type: 'string', description: 'Moneda, por defecto PEN', default: 'PEN' },
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
        description: { type: 'string', description: 'Descripción del ingreso' },
        currency: { type: 'string', default: 'PEN' },
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
}

// Execute the tool Claude decided to call and return a string result
export async function executeTool(name: string, input: ToolInput): Promise<string> {
  logger.debug('Executing tool', { name, input });

  switch (name) {
    case 'record_expense': {
      const entry = await financeService.recordExpense({
        amount: input.amount!,
        category: input.category!,
        description: input.description!,
        currency: input.currency,
      });
      return `Gasto registrado: ${entry.currency} ${entry.amount} en ${entry.category} — "${entry.description}"`;
    }

    case 'record_income': {
      const entry = await financeService.recordIncome({
        amount: input.amount!,
        category: input.category!,
        description: input.description!,
        currency: input.currency,
      });
      return `Ingreso registrado: ${entry.currency} ${entry.amount} — "${entry.description}"`;
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
