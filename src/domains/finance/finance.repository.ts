import { prisma } from '../../database/prisma.client';
import { CreateFinanceEntryInput, FinanceEntry, WeeklyFinanceSummary } from './finance.types';

export async function createFinanceEntry(
  input: CreateFinanceEntryInput,
): Promise<FinanceEntry> {
  const entry = await prisma.financeEntry.create({
    data: {
      amount: input.amount,
      currency: input.currency ?? 'PEN',
      type: input.type,
      category: input.category,
      description: input.description,
      date: input.date ?? new Date(),
    },
  });

  return {
    ...entry,
    amount: Number(entry.amount),
  };
}

export async function getWeeklySummary(currency = 'PEN'): Promise<WeeklyFinanceSummary> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const entries = await prisma.financeEntry.findMany({
    where: { date: { gte: weekAgo }, currency },
  });

  const summary: WeeklyFinanceSummary = {
    totalExpenses: 0,
    totalIncome: 0,
    byCategory: {},
    currency,
  };

  for (const entry of entries) {
    const amount = Number(entry.amount);
    if (entry.type === 'expense') {
      summary.totalExpenses += amount;
      summary.byCategory[entry.category] =
        (summary.byCategory[entry.category] ?? 0) + amount;
    } else {
      summary.totalIncome += amount;
    }
  }

  return summary;
}
