import { CreateFinanceEntryInput, FinanceEntry, WeeklyFinanceSummary } from './finance.types';
import * as financeRepository from './finance.repository';

export async function recordExpense(
  input: Omit<CreateFinanceEntryInput, 'type'>,
): Promise<FinanceEntry> {
  return financeRepository.createFinanceEntry({ ...input, type: 'expense' });
}

export async function recordIncome(
  input: Omit<CreateFinanceEntryInput, 'type'>,
): Promise<FinanceEntry> {
  return financeRepository.createFinanceEntry({ ...input, type: 'income' });
}

export async function getWeeklySummary(currency?: string): Promise<WeeklyFinanceSummary> {
  return financeRepository.getWeeklySummary(currency);
}

export function formatSummaryForAgent(summary: WeeklyFinanceSummary): string {
  const categories = Object.entries(summary.byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => `  - ${cat}: ${summary.currency} ${amount.toFixed(2)}`)
    .join('\n');

  return [
    `Resumen semanal (${summary.currency}):`,
    `  Gastos totales: ${summary.totalExpenses.toFixed(2)}`,
    `  Ingresos totales: ${summary.totalIncome.toFixed(2)}`,
    `  Por categoría:\n${categories}`,
  ].join('\n');
}
