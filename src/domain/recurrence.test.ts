import { describe, expect, it } from 'vitest'
import { entryMonths, splitEntryFromMonth } from './recurrence'
import type { BudgetEntry } from './types'

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
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('entryMonths', () => {
  it('monthly spans startMonth..endMonth inclusive', () => {
    expect(entryMonths(entry({ startMonth: 4, endMonth: 6 }))).toEqual([4, 5, 6])
  })

  it('specificMonths sorts the given months', () => {
    expect(entryMonths(entry({ frequency: 'specificMonths', months: [9, 2, 5] }))).toEqual([
      2, 5, 9,
    ])
  })
})

describe('splitEntryFromMonth ("denne og kommende måneder")', () => {
  it('splits a monthly entry into before/from at the given month', () => {
    const e = entry({ startMonth: 1, endMonth: 12 })
    const result = splitEntryFromMonth(e, 6)
    expect(result).not.toBeNull()
    expect(result!.before.endMonth).toBe(5)
    expect(result!.from.startMonth).toBe(6)
    expect(result!.from.endMonth).toBe(12)
  })

  it('returns null when there is nothing before the split month', () => {
    const e = entry({ startMonth: 1, endMonth: 12 })
    expect(splitEntryFromMonth(e, 1)).toBeNull()
  })

  it('splits specificMonths by partitioning the months array', () => {
    const e = entry({ frequency: 'specificMonths', months: [1, 4, 7, 10] })
    const result = splitEntryFromMonth(e, 7)
    expect(result!.before.months).toEqual([1, 4])
    expect(result!.from.months).toEqual([7, 10])
  })
})
