import type { BudgetEntry } from './types'

export function isRecurring(entry: BudgetEntry): boolean {
  return entry.frequency !== 'oneTime' && entry.frequency !== 'thisMonthOnly'
}

export interface NewYearReview {
  sourceYear: number
  newYear: number
  recurringEntries: BudgetEntry[]
  oneTimeEntries: BudgetEntry[]
  entryCount: number
  expectedOpeningBalance: number
  annualIncome: number
  annualExpense: number
  annualSaving: number
  expectedAnnualClosingBalance: number
}

export function buildNewYearReview(
  sourceYearNumber: number,
  newYearNumber: number,
  entries: BudgetEntry[],
  expectedOpeningBalance: number,
  annualTotals: { income: number; expense: number; saving: number },
): NewYearReview {
  const recurringEntries = entries.filter((e) => isRecurring(e) && e.active)
  const oneTimeEntries = entries.filter((e) => !isRecurring(e) && e.active)
  const closing =
    expectedOpeningBalance + annualTotals.income - annualTotals.expense - annualTotals.saving
  return {
    sourceYear: sourceYearNumber,
    newYear: newYearNumber,
    recurringEntries,
    oneTimeEntries,
    entryCount: recurringEntries.length + oneTimeEntries.length,
    expectedOpeningBalance,
    annualIncome: annualTotals.income,
    annualExpense: annualTotals.expense,
    annualSaving: annualTotals.saving,
    expectedAnnualClosingBalance: closing,
  }
}
