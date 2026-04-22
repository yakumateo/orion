export type FinanceEntryType = 'expense' | 'income';

export interface CreateFinanceEntryInput {
  amount: number;
  currency?: string;
  type: FinanceEntryType;
  category: string;
  description: string;
  date?: Date;
}

export interface FinanceEntry {
  id: string;
  amount: number;
  currency: string;
  type: FinanceEntryType;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
}

export interface WeeklyFinanceSummary {
  totalExpenses: number;
  totalIncome: number;
  byCategory: Record<string, number>;
  currency: string;
}
