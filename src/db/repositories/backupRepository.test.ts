import { describe, expect, it } from 'vitest'
import { MitBudgetDB } from '../schema'
import { seedDefaultCategories } from './categoryRepository'
import { createRootYear } from './yearRepository'
import { createEntry } from './entryRepository'
import { exportBackup, importBackup, parseBackupJson, readAllData } from './backupRepository'

function freshDb(): MitBudgetDB {
  return new MitBudgetDB(`test-backup-${Math.random().toString(36).slice(2)}`)
}

async function seedSampleData(db: MitBudgetDB) {
  await seedDefaultCategories(db)
  const year = await createRootYear(db, 2026, 1000, '2026-01-01')
  const categories = await db.categories.toArray()
  await createEntry(db, {
    yearId: year.id,
    type: 'income',
    categoryId: categories.find((c) => c.name === 'Løn')!.id,
    name: 'Løn',
    amount: 5000,
    frequency: 'monthly',
    startMonth: 1,
    endMonth: 12,
    months: [],
    note: '',
    active: true,
  })
  return year
}

describe('14) export/import round trip with no data loss', () => {
  it('re-importing an exported file with replace reproduces identical data', async () => {
    const db = freshDb()
    await seedSampleData(db)
    const exported = await exportBackup(db)

    const db2 = freshDb()
    await importBackup(db2, exported, 'replace')

    const original = await readAllData(db)
    const restored = await readAllData(db2)
    expect(restored.years).toEqual(original.years)
    expect(restored.categories).toEqual(original.categories)
    expect(restored.entries).toEqual(original.entries)
  })
})

describe('15) import failure leaves existing data unchanged', () => {
  it('rejects an invalid file without touching the database', async () => {
    const db = freshDb()
    await seedSampleData(db)
    const before = await readAllData(db)

    const result = parseBackupJson('{ "not": "a backup" }')
    expect(result.ok).toBe(false)

    const after = await readAllData(db)
    expect(after).toEqual(before)
  })

  it('rejects malformed JSON without touching the database', async () => {
    const db = freshDb()
    await seedSampleData(db)
    const before = await readAllData(db)

    const result = parseBackupJson('not json at all {{{')
    expect(result.ok).toBe(false)

    const after = await readAllData(db)
    expect(after).toEqual(before)
  })
})

describe('16) merge import does not duplicate existing records', () => {
  it('merging the same export back in produces no extra rows', async () => {
    const db = freshDb()
    await seedSampleData(db)
    const before = await readAllData(db)
    const exported = await exportBackup(db)

    await importBackup(db, exported, 'merge')

    const after = await readAllData(db)
    expect(after.categories).toHaveLength(before.categories.length)
    expect(after.entries).toHaveLength(before.entries.length)
    expect(after.years).toHaveLength(before.years.length)
  })

  it('merging adds genuinely new records from the file', async () => {
    const db = freshDb()
    const year = await seedSampleData(db)
    const exported = await exportBackup(db)

    const extraCategoryId = 'extra-cat'
    exported.categories.push({
      id: extraCategoryId,
      type: 'expense',
      name: 'Ekstra',
      order: 99,
      active: true,
      isDefault: false,
      createdAt: '',
      updatedAt: '',
    })

    await importBackup(db, exported, 'merge')
    const after = await readAllData(db)
    expect(after.categories.some((c) => c.id === extraCategoryId)).toBe(true)
    void year
  })
})
