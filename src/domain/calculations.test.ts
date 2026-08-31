import { describe, expect, it } from 'vitest'
import {
  buildYearMonthBalances,
  freeAmount,
  monthTotals,
  variance,
  weeklyFromMonthly,
} from './calculations'
import type { BalanceAdjustment, BudgetEntry, EntryOverride, MonthlyClosure } from './types'

function entry(overrides: Partial<BudgetEntry>): BudgetEntry {
  return {
    id: 'e1',
    yearId: 'y1',
    type: 'expense',
    categoryId: 'c1',
    name: 'Test',
    amount: 100,
    frequency: 'monthly',
    startMonth: 1,
    endMonth: 12,
    months: [],
    note: '',
    active: true,
    copiedFromEntryId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('monthTotals / freeAmount', () => {
  it('1) income minus expenses minus savings', () => {
    const entries = [
      entry({ id: 'inc', type: 'income', amount: 5000 }),
      entry({ id: 'exp', type: 'expense', amount: 2000 }),
      entry({ id: 'sav', type: 'saving', amount: 500 }),
    ]
    const totals = monthTotals(entries, [], 3)
    expect(totals).toEqual({ income: 5000, expense: 2000, saving: 500 })
    expect(freeAmount(totals)).toBe(2500)
  })

  it('18) zero income, zero expenses, negative free amount', () => {
    const entries = [entry({ id: 'sav', type: 'saving', amount: 200 })]
    const totals = monthTotals(entries, [], 1)
    expect(freeAmount(totals)).toBe(-200)
    expect(weeklyFromMonthly(freeAmount(totals))).toBeCloseTo((-200 * 12) / 52, 1)
  })
})

describe('expected closing balance (2) and variance (3)', () => {
  it('computes expected closing balance from opening + totals', () => {
    const entries = [
      entry({ id: 'inc', type: 'income', amount: 5000 }),
      entry({ id: 'exp', type: 'expense', amount: 3000 }),
      entry({ id: 'sav', type: 'saving', amount: 500 }),
    ]
    const balances = buildYearMonthBalances(1000, entries, [], [], [])
    expect(balances[0]?.expectedClosingBalance).toBe(1000 + 5000 - 3000 - 500)
  })

  it('positive variance means better than budgeted', () => {
    expect(variance(1600, 1500)).toBe(100)
  })

  it('negative variance means worse than budgeted', () => {
    expect(variance(1400, 1500)).toBe(-100)
  })
})

describe('4) balance adjustments in both directions', () => {
  it('applies "in" as positive and "out" as negative to the expected balance', () => {
    const adjustments: BalanceAdjustment[] = [
      {
        id: 'a1',
        yearId: 'y1',
        month: 1,
        description: 'Overført ind',
        amount: 300,
        direction: 'in',
        date: '2026-01-05',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'a2',
        yearId: 'y1',
        month: 1,
        description: 'Overført ud',
        amount: 100,
        direction: 'out',
        date: '2026-01-06',
        createdAt: '',
        updatedAt: '',
      },
    ]
    const balances = buildYearMonthBalances(0, [], [], [], adjustments)
    expect(balances[0]?.adjustmentsTotal).toBe(200)
    expect(balances[0]?.adjustedExpectedClosingBalance).toBe(200)
  })
})

describe('5) actual closing balance carries into the next month', () => {
  it('uses the closed actual balance as next month opening balance', () => {
    const entries = [entry({ id: 'inc', type: 'income', amount: 1000 })]
    const closures: MonthlyClosure[] = [
      {
        id: 'c1',
        yearId: 'y1',
        month: 1,
        closed: true,
        actualBalance: 5000,
        balanceDate: '2026-01-31',
        note: '',
        createdAt: '',
        updatedAt: '',
      },
    ]
    const balances = buildYearMonthBalances(0, entries, [], closures, [])
    expect(balances[0]?.actualClosingBalance).toBe(5000)
    expect(balances[1]?.openingBalance).toBe(5000)
  })
})

describe('6) forecast recalculation after an actual balance is entered', () => {
  it('unclosed months use the running expected forecast as opening', () => {
    const entries = [entry({ id: 'exp', type: 'expense', amount: 100 })]
    const before = buildYearMonthBalances(1000, entries, [], [], [])
    expect(before[1]?.openingBalance).toBe(900)

    const closures: MonthlyClosure[] = [
      {
        id: 'c1',
        yearId: 'y1',
        month: 1,
        closed: true,
        actualBalance: 700,
        balanceDate: '2026-01-31',
        note: '',
        createdAt: '',
        updatedAt: '',
      },
    ]
    const after = buildYearMonthBalances(1000, entries, [], closures, [])
    expect(after[1]?.openingBalance).toBe(700)
    expect(after[2]?.openingBalance).toBe(600)
  })
})

describe('7) editing an earlier actual balance recalculates dependents', () => {
  it('changing month 1 actual balance changes month 2 and 3 forecasts', () => {
    const entries = [entry({ id: 'exp', type: 'expense', amount: 100 })]
    const closuresA: MonthlyClosure[] = [
      {
        id: 'c1',
        yearId: 'y1',
        month: 1,
        closed: true,
        actualBalance: 700,
        balanceDate: '2026-01-31',
        note: '',
        createdAt: '',
        updatedAt: '',
      },
    ]
    const resultA = buildYearMonthBalances(1000, entries, [], closuresA, [])
    const closuresB = [{ ...closuresA[0]!, actualBalance: 900 }]
    const resultB = buildYearMonthBalances(1000, entries, [], closuresB, [])
    expect(resultA[2]?.openingBalance).toBe(600)
    expect(resultB[2]?.openingBalance).toBe(800)
  })
})

describe('8) forecast across December and January', () => {
  it('December actual balance feeds January opening within the same buildYearMonthBalances call', () => {
    const entries = [entry({ id: 'exp', type: 'expense', amount: 50 })]
    const closures: MonthlyClosure[] = Array.from({ length: 11 }, (_, i) => ({
      id: `c${i + 1}`,
      yearId: 'y1',
      month: i + 1,
      closed: true,
      actualBalance: 1000 - (i + 1) * 50,
      balanceDate: '2026',
      note: '',
      createdAt: '',
      updatedAt: '',
    }))
    const balances = buildYearMonthBalances(1000, entries, [], closures, [])
    // December (month 12) has no closure, so it's a forecast off November's actual.
    expect(balances[11]?.openingBalance).toBe(balances[10]?.actualClosingBalance)
  })
})

describe('11) recurring, quarterly and annual entries', () => {
  it('monthly recurs every month in range', () => {
    const entries = [
      entry({ id: 'e1', frequency: 'monthly', startMonth: 3, endMonth: 5, amount: 100 }),
    ]
    for (const m of [1, 2, 6]) expect(monthTotals(entries, [], m).expense).toBe(0)
    for (const m of [3, 4, 5]) expect(monthTotals(entries, [], m).expense).toBe(100)
  })

  it('quarterly occurs only in its selected months', () => {
    const entries = [
      entry({ id: 'e1', frequency: 'quarterly', months: [3, 6, 9, 12], amount: 250 }),
    ]
    expect(monthTotals(entries, [], 3).expense).toBe(250)
    expect(monthTotals(entries, [], 4).expense).toBe(0)
  })

  it('yearly occurs only once', () => {
    const entries = [entry({ id: 'e1', frequency: 'yearly', months: [11], amount: 1200 })]
    const totalOccurrences = Array.from(
      { length: 12 },
      (_, i) => monthTotals(entries, [], i + 1).expense,
    )
    expect(totalOccurrences.filter((v) => v > 0)).toEqual([1200])
  })
})

describe('12) one-time entries are not unintentionally repeated', () => {
  it('oneTime occurs in exactly its one month', () => {
    const entries = [entry({ id: 'e1', frequency: 'oneTime', months: [7], amount: 999 })]
    const occurrences = Array.from(
      { length: 12 },
      (_, i) => monthTotals(entries, [], i + 1).expense,
    )
    expect(occurrences).toEqual([0, 0, 0, 0, 0, 0, 999, 0, 0, 0, 0, 0])
  })
})

describe('17) Danish amount handling', () => {
  it('rounds to 2 decimals and sums correctly', () => {
    const entries = [entry({ id: 'e1', amount: 33.335 })]
    // amount stored as-is; monthTotals rounds the summed result.
    expect(monthTotals(entries, [], 1).expense).toBeCloseTo(33.34, 2)
  })
})

describe('EntryOverride application', () => {
  it('a "this month only" override changes the amount for just that month', () => {
    const entries = [entry({ id: 'e1', amount: 100 })]
    const overrides: EntryOverride[] = [
      {
        id: 'o1',
        entryId: 'e1',
        month: 3,
        skip: false,
        amountOverride: 250,
        nameOverride: null,
        createdAt: '',
        updatedAt: '',
      },
    ]
    expect(monthTotals(entries, overrides, 3).expense).toBe(250)
    expect(monthTotals(entries, overrides, 4).expense).toBe(100)
  })

  it('a skip override removes the occurrence for that month only', () => {
    const entries = [entry({ id: 'e1', amount: 100 })]
    const overrides: EntryOverride[] = [
      {
        id: 'o1',
        entryId: 'e1',
        month: 3,
        skip: true,
        amountOverride: null,
        nameOverride: null,
        createdAt: '',
        updatedAt: '',
      },
    ]
    expect(monthTotals(entries, overrides, 3).expense).toBe(0)
    expect(monthTotals(entries, overrides, 4).expense).toBe(100)
  })
})
