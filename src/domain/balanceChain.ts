import { buildYearMonthBalances } from './calculations'
import type {
  BalanceAdjustment,
  BudgetEntry,
  BudgetYear,
  EntryOverride,
  MonthBalance,
  MonthlyClosure,
} from './types'

export interface YearData {
  year: BudgetYear
  entries: BudgetEntry[]
  overrides: EntryOverride[]
  closures: MonthlyClosure[]
  adjustments: BalanceAdjustment[]
}

export interface ResolvedYear {
  year: BudgetYear
  /** Label to show the user: whether this opening balance is a forecast or a settled fact. */
  openingBalanceLabel:
    'Forventet åbningsbalance' | 'Faktisk åbningsbalance' | 'Manuel åbningsbalance'
  openingBalance: number
  months: MonthBalance[]
}

/**
 * Resolves a year's opening balance and full month chain. `previous`, if
 * given, must already be resolved (its December figures feed this year).
 */
export function resolveYear(data: YearData, previous: ResolvedYear | null): ResolvedYear {
  const { year } = data
  let openingBalance: number
  let label: ResolvedYear['openingBalanceLabel']

  if (year.openingBalanceMode === 'manual' || !previous) {
    openingBalance = year.manualOpeningBalance
    label = 'Manuel åbningsbalance'
  } else {
    const december = previous.months[11]
    if (december && december.closed && december.actualClosingBalance !== null) {
      openingBalance = december.actualClosingBalance
      label = 'Faktisk åbningsbalance'
    } else {
      openingBalance = december ? december.adjustedExpectedClosingBalance : previous.openingBalance
      label = 'Forventet åbningsbalance'
    }
  }

  const months = buildYearMonthBalances(
    openingBalance,
    data.entries,
    data.overrides,
    data.closures,
    data.adjustments,
  )

  return { year, openingBalanceLabel: label, openingBalance, months }
}

/** Resolves a chain of years in chronological order (each may depend on the previous). */
export function resolveYearChain(dataInOrder: YearData[]): ResolvedYear[] {
  const resolved: ResolvedYear[] = []
  let previous: ResolvedYear | null = null
  for (const data of dataInOrder) {
    const r = resolveYear(data, previous)
    resolved.push(r)
    previous = r
  }
  return resolved
}
