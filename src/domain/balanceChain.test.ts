import { describe, expect, it } from 'vitest'
import { resolveYearChain, type YearData } from './balanceChain'
import type { BudgetEntry, BudgetYear, MonthlyClosure } from './types'

function year(overrides: Partial<BudgetYear>): BudgetYear {
  return {
    id: 'y1',
    year: 2026,
    previousYearId: null,
    openingBalanceMode: 'manual',
    manualOpeningBalance: 0,
    manualOpeningBalanceDate: '2026-01-01',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function incomeEntry(yearId: string, amount: number): BudgetEntry {
  return {
    id: `inc-${yearId}`,
    yearId,
    type: 'income',
    categoryId: 'c1',
    name: 'Løn',
    amount,
    frequency: 'monthly',
    startMonth: 1,
    endMonth: 12,
    months: [],
    note: '',
    active: true,
    copiedFromEntryId: null,
    createdAt: '',
    updatedAt: '',
  }
}

describe('9) dynamic next-year opening balance', () => {
  it('uses the December forecast when December is not closed', () => {
    const y1 = year({
      id: 'y1',
      year: 2026,
      openingBalanceMode: 'manual',
      manualOpeningBalance: 1000,
    })
    const y2 = year({ id: 'y2', year: 2027, previousYearId: 'y1', openingBalanceMode: 'auto' })
    const data: YearData[] = [
      { year: y1, entries: [incomeEntry('y1', 100)], overrides: [], closures: [], adjustments: [] },
      { year: y2, entries: [], overrides: [], closures: [], adjustments: [] },
    ]
    const [r1, r2] = resolveYearChain(data)
    expect(r2?.openingBalanceLabel).toBe('Forventet åbningsbalance')
    expect(r2?.openingBalance).toBe(r1?.months[11]?.adjustedExpectedClosingBalance)
  })

  it('uses the actual December balance once December is closed', () => {
    const y1 = year({
      id: 'y1',
      year: 2026,
      openingBalanceMode: 'manual',
      manualOpeningBalance: 1000,
    })
    const y2 = year({ id: 'y2', year: 2027, previousYearId: 'y1', openingBalanceMode: 'auto' })
    const closures: MonthlyClosure[] = [
      {
        id: 'c-dec',
        yearId: 'y1',
        month: 12,
        closed: true,
        actualBalance: 5000,
        balanceDate: '2026-12-31',
        note: '',
        createdAt: '',
        updatedAt: '',
      },
    ]
    const data: YearData[] = [
      { year: y1, entries: [incomeEntry('y1', 100)], overrides: [], closures, adjustments: [] },
      { year: y2, entries: [], overrides: [], closures: [], adjustments: [] },
    ]
    const [, r2] = resolveYearChain(data)
    expect(r2?.openingBalanceLabel).toBe('Faktisk åbningsbalance')
    expect(r2?.openingBalance).toBe(5000)
  })
})

describe('10) manual override and restoration of automatic opening balance', () => {
  it('a manual override ignores the previous year entirely', () => {
    const y1 = year({
      id: 'y1',
      year: 2026,
      openingBalanceMode: 'manual',
      manualOpeningBalance: 1000,
    })
    const y2 = year({
      id: 'y2',
      year: 2027,
      previousYearId: 'y1',
      openingBalanceMode: 'manual',
      manualOpeningBalance: 42,
    })
    const data: YearData[] = [
      { year: y1, entries: [], overrides: [], closures: [], adjustments: [] },
      { year: y2, entries: [], overrides: [], closures: [], adjustments: [] },
    ]
    const [, r2] = resolveYearChain(data)
    expect(r2?.openingBalanceLabel).toBe('Manuel åbningsbalance')
    expect(r2?.openingBalance).toBe(42)
  })

  it('restoring auto mode re-derives the opening balance from the previous year', () => {
    const y1 = year({
      id: 'y1',
      year: 2026,
      openingBalanceMode: 'manual',
      manualOpeningBalance: 1000,
    })
    const y2Manual = year({
      id: 'y2',
      year: 2027,
      previousYearId: 'y1',
      openingBalanceMode: 'manual',
      manualOpeningBalance: 42,
    })
    const y2Auto = { ...y2Manual, openingBalanceMode: 'auto' as const }
    const baseData = { entries: [], overrides: [], closures: [], adjustments: [] }
    const [, manualResult] = resolveYearChain([
      { year: y1, ...baseData },
      { year: y2Manual, ...baseData },
    ])
    const [, autoResult] = resolveYearChain([
      { year: y1, ...baseData },
      { year: y2Auto, ...baseData },
    ])
    expect(manualResult?.openingBalance).toBe(42)
    expect(autoResult?.openingBalance).not.toBe(42)
    expect(autoResult?.openingBalance).toBe(1000)
  })
})
