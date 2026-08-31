import { describe, expect, it } from 'vitest'
import { MitBudgetDB } from '../schema'
import { seedDefaultCategories, listCategories } from './categoryRepository'
import { createRootYear } from './yearRepository'
import { createEntry, listEntriesForYear } from './entryRepository'
import { createNewYear } from './newYearRepository'

function freshDb(): MitBudgetDB {
  return new MitBudgetDB(`test-newyear-${Math.random().toString(36).slice(2)}`)
}

describe('13) copying a budget year does not link copied entries', () => {
  it('editing the source entry after copying leaves the copy unchanged, and vice versa', async () => {
    const db = freshDb()
    await seedDefaultCategories(db)
    const categories = await listCategories(db)
    const incomeCategory = categories.find((c) => c.name === 'Løn')!

    const year1 = await createRootYear(db, 2026, 1000, '2026-01-01')
    const original = await createEntry(db, {
      yearId: year1.id,
      type: 'income',
      categoryId: incomeCategory.id,
      name: 'Løn',
      amount: 5000,
      frequency: 'monthly',
      startMonth: 1,
      endMonth: 12,
      months: [],
      note: '',
      active: true,
    })

    const year2 = await createNewYear(db, {
      sourceYearId: year1.id,
      newYearNumber: 2027,
      includeOneTimeEntryIds: new Set(),
      startEmpty: false,
    })

    const copiedEntries = await listEntriesForYear(db, year2.id)
    expect(copiedEntries).toHaveLength(1)
    const copy = copiedEntries[0]!
    expect(copy.id).not.toBe(original.id)
    expect(copy.copiedFromEntryId).toBe(original.id)

    // Editing the original afterwards must not affect the copy.
    await db.entries.put({ ...original, amount: 9999, updatedAt: new Date().toISOString() })
    const copyAfter = await db.entries.get(copy.id)
    expect(copyAfter?.amount).toBe(5000)

    // And editing the copy must not affect the original.
    await db.entries.put({ ...copy, amount: 1, updatedAt: new Date().toISOString() })
    const originalAfter = await db.entries.get(original.id)
    expect(originalAfter?.amount).toBe(9999)
  })

  it('only active one-time entries explicitly selected are copied, recurring entries always are', async () => {
    const db = freshDb()
    await seedDefaultCategories(db)
    const categories = await listCategories(db)
    const expenseCategory = categories.find((c) => c.name === 'Diverse')!

    const year1 = await createRootYear(db, 2026, 0, '2026-01-01')
    const recurring = await createEntry(db, {
      yearId: year1.id,
      type: 'expense',
      categoryId: expenseCategory.id,
      name: 'Fast udgift',
      amount: 100,
      frequency: 'monthly',
      startMonth: 1,
      endMonth: 12,
      months: [],
      note: '',
      active: true,
    })
    const oneTimeIncluded = await createEntry(db, {
      yearId: year1.id,
      type: 'expense',
      categoryId: expenseCategory.id,
      name: 'Skal kopieres',
      amount: 200,
      frequency: 'oneTime',
      startMonth: 1,
      endMonth: 12,
      months: [5],
      note: '',
      active: true,
    })
    await createEntry(db, {
      yearId: year1.id,
      type: 'expense',
      categoryId: expenseCategory.id,
      name: 'Skal ikke kopieres',
      amount: 300,
      frequency: 'oneTime',
      startMonth: 1,
      endMonth: 12,
      months: [8],
      note: '',
      active: true,
    })

    const year2 = await createNewYear(db, {
      sourceYearId: year1.id,
      newYearNumber: 2027,
      includeOneTimeEntryIds: new Set([oneTimeIncluded.id]),
      startEmpty: false,
    })

    const copied = await listEntriesForYear(db, year2.id)
    const names = copied.map((e) => e.name).sort()
    expect(names).toEqual(['Fast udgift', 'Skal kopieres'])
    void recurring
  })

  it('starting empty copies no entries', async () => {
    const db = freshDb()
    const year1 = await createRootYear(db, 2026, 0, '2026-01-01')
    const year2 = await createNewYear(db, {
      sourceYearId: year1.id,
      newYearNumber: 2027,
      includeOneTimeEntryIds: new Set(),
      startEmpty: true,
    })
    const entries = await listEntriesForYear(db, year2.id)
    expect(entries).toHaveLength(0)
    expect(year2.previousYearId).toBe(year1.id)
  })
})
