import { roundMoney, sumMoney } from './money'
import { occurrencesForMonth } from './recurrence'
import type {
  AdjustmentDirection,
  BalanceAdjustment,
  BudgetEntry,
  EntryOverride,
  MonthBalance,
  MonthlyClosure,
} from './types'

export interface MonthTotals {
  income: number
  expense: number
  saving: number
}

export function monthTotals(
  entries: BudgetEntry[],
  overrides: EntryOverride[],
  month: number,
): MonthTotals {
  const occurrences = occurrencesForMonth(entries, overrides, month)
  let income = 0
  let expense = 0
  let saving = 0
  for (const occ of occurrences) {
    if (occ.entry.type === 'income') income += occ.amount
    else if (occ.entry.type === 'expense') expense += occ.amount
    else saving += occ.amount
  }
  return { income: roundMoney(income), expense: roundMoney(expense), saving: roundMoney(saving) }
}

/** Free amount = budgeted income − budgeted expenses − planned savings/investment. */
export function freeAmount(totals: MonthTotals): number {
  return roundMoney(totals.income - totals.expense - totals.saving)
}

/** Approximate weekly amount from a monthly figure: monthly × 12 / 52. */
export function weeklyFromMonthly(monthly: number): number {
  return roundMoney((monthly * 12) / 52)
}

export function expectedClosingBalance(opening: number, totals: MonthTotals): number {
  return roundMoney(opening + totals.income - totals.expense - totals.saving)
}

export function adjustmentSignedAmount(a: BalanceAdjustment): number {
  return a.direction === ('in' as AdjustmentDirection) ? a.amount : -a.amount
}

export function adjustmentsTotalForMonth(adjustments: BalanceAdjustment[], month: number): number {
  return sumMoney(
    adjustments.filter((a) => a.month === month).map((a) => adjustmentSignedAmount(a)),
  )
}

/** actual − adjusted expected. Positive = better than budgeted. */
export function variance(actual: number, adjustedExpected: number): number {
  return roundMoney(actual - adjustedExpected)
}

/**
 * Builds the full 12-month balance chain for a year, given its resolved
 * opening balance (see balanceChain.ts for cross-year resolution).
 */
export function buildYearMonthBalances(
  yearOpeningBalance: number,
  entries: BudgetEntry[],
  overrides: EntryOverride[],
  closures: MonthlyClosure[],
  adjustments: BalanceAdjustment[],
): MonthBalance[] {
  const closureByMonth = new Map(closures.map((c) => [c.month, c]))
  const balances: MonthBalance[] = []
  let opening = yearOpeningBalance

  for (let month = 1; month <= 12; month++) {
    const totals = monthTotals(entries, overrides, month)
    const free = freeAmount(totals)
    const expected = expectedClosingBalance(opening, totals)
    const adjTotal = adjustmentsTotalForMonth(adjustments, month)
    const adjustedExpected = roundMoney(expected + adjTotal)
    const closure = closureByMonth.get(month)
    const isClosed = closure?.closed === true
    const actual = isClosed ? closure.actualBalance : null
    const monthVariance = isClosed && actual !== null ? variance(actual, adjustedExpected) : null

    balances.push({
      month,
      budgetedIncome: totals.income,
      budgetedExpense: totals.expense,
      budgetedSaving: totals.saving,
      freeAmount: free,
      weeklyFreeAmount: weeklyFromMonthly(free),
      openingBalance: opening,
      expectedClosingBalance: expected,
      adjustmentsTotal: adjTotal,
      adjustedExpectedClosingBalance: adjustedExpected,
      actualClosingBalance: actual,
      variance: monthVariance,
      closed: isClosed,
    })

    // Next month's opening balance: actual if closed, otherwise the
    // forecast — this is the "anchor" behaviour required by the spec.
    opening = isClosed && actual !== null ? actual : adjustedExpected
  }

  return balances
}
