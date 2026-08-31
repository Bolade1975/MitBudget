import { describe, expect, it } from 'vitest'
import { MitBudgetDB } from '../schema'
import { seedDefaultCategories } from './categoryRepository'
import { createRootYear } from './yearRepository'
import {
  createEntry,
  editEntryWithScope,
  listEntriesForYear,
  listOverridesForYear,
} from './entryRepository'
import { monthTotals } from '../../domain/calculations'

function freshDb(): MitBudgetDB {
  return new MitBudgetDB(`test-entry-${Math.random().toString(36).slice(2)}`)
}

async function setup(db: MitBudgetDB) {
  await seedDefaultCategories(db)
  const year = await createRootYear(db, 2026, 0, '2026-01-01')
  const categories = await db.categories.toArray()
  const category = categories.find((c) => c.name === 'Telefon')!
  const entry = await createEntry(db, {
    yearId: year.id,
    type: 'expense',
    categoryId: category.id,
    name: 'Telefon',
    amount: 150,
    frequency: 'monthly',
    startMonth: 1,
    endMonth: 12,
    months: [],
    note: '',
    active: true,
  })
  return { year, entry }
}

describe('edit scope: kun denne måned', () => {
  it('changes only the targeted month via an override, other months keep the original amount', async () => {
    const db = freshDb()
    const { year, entry } = await setup(db)

    await editEntryWithScope(db, entry.id, 'thisMonthOnly', { amount: 500 }, 6)

    const entries = await listEntriesForYear(db, year.id)
    const overrides = await listOverridesForYear(db, year.id)
    expect(entries[0]?.amount).toBe(150)
    expect(overrides).toHaveLength(1)
    expect(overrides[0]?.month).toBe(6)
    expect(overrides[0]?.amountOverride).toBe(500)

    expect(monthTotals(entries, overrides, 5).expense).toBe(150)
    expect(monthTotals(entries, overrides, 6).expense).toBe(500)
    expect(monthTotals(entries, overrides, 7).expense).toBe(150)
  })
})

describe('edit scope: denne og kommende måneder', () => {
  it('splits the entry so only fromMonth onward gets the new amount', async () => {
    const db = freshDb()
    const { year, entry } = await setup(db)

    await editEntryWithScope(db, entry.id, 'thisAndFuture', { amount: 200 }, 6)

    const entries = await listEntriesForYear(db, year.id)
    expect(entries).toHaveLength(2)
    const overrides = await listOverridesForYear(db, year.id)

    expect(monthTotals(entries, overrides, 1).expense).toBe(150)
    expect(monthTotals(entries, overrides, 5).expense).toBe(150)
    expect(monthTotals(entries, overrides, 6).expense).toBe(200)
    expect(monthTotals(entries, overrides, 12).expense).toBe(200)
  })
})

describe('edit scope: alle måneder', () => {
  it('changes the amount for every month', async () => {
    const db = freshDb()
    const { year, entry } = await setup(db)

    await editEntryWithScope(db, entry.id, 'all', { amount: 175 }, 6)

    const entries = await listEntriesForYear(db, year.id)
    expect(entries).toHaveLength(1)
    expect(monthTotals(entries, [], 1).expense).toBe(175)
    expect(monthTotals(entries, [], 12).expense).toBe(175)
  })
})
