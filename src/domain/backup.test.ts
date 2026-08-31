import { describe, expect, it } from 'vitest'
import { mergeBackupData, previewBackup, validateBackupFile, type BackupData } from './backup'
import { defaultSettings } from '../db/repositories/settingsRepository'

function emptyData(): BackupData {
  return {
    settings: defaultSettings(),
    years: [],
    categories: [],
    entries: [],
    overrides: [],
    closures: [],
    adjustments: [],
  }
}

describe('validateBackupFile', () => {
  it('rejects a non-object', () => {
    const result = validateBackupFile('hello')
    expect(result.ok).toBe(false)
  })

  it('rejects a file missing the app id', () => {
    const result = validateBackupFile({ schemaVersion: 1 })
    expect(result.ok).toBe(false)
  })

  it('rejects a newer schema version than this app understands', () => {
    const result = validateBackupFile({
      app: 'Mit Budget',
      schemaVersion: 999,
      exportedAt: '2026-01-01T00:00:00.000Z',
      settings: {},
      years: [],
      categories: [],
      entries: [],
      overrides: [],
      closures: [],
      adjustments: [],
    })
    expect(result.ok).toBe(false)
  })

  it('accepts a well-formed backup file', () => {
    const data = emptyData()
    const result = validateBackupFile({
      app: 'Mit Budget',
      schemaVersion: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      ...data,
    })
    expect(result.ok).toBe(true)
  })
})

describe('previewBackup', () => {
  it('summarizes years and counts', () => {
    const data = emptyData()
    const file = {
      app: 'Mit Budget' as const,
      schemaVersion: 1,
      exportedAt: '2026-03-01T00:00:00.000Z',
      ...data,
      years: [
        {
          id: 'y2',
          year: 2027,
          previousYearId: null,
          openingBalanceMode: 'manual' as const,
          manualOpeningBalance: 0,
          manualOpeningBalanceDate: '',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'y1',
          year: 2026,
          previousYearId: null,
          openingBalanceMode: 'manual' as const,
          manualOpeningBalance: 0,
          manualOpeningBalanceDate: '',
          createdAt: '',
          updatedAt: '',
        },
      ],
      entries: [
        {
          id: 'e1',
          yearId: 'y1',
          type: 'income' as const,
          categoryId: 'c1',
          name: 'Løn',
          amount: 100,
          frequency: 'monthly' as const,
          startMonth: 1,
          endMonth: 12,
          months: [],
          note: '',
          active: true,
          copiedFromEntryId: null,
          createdAt: '',
          updatedAt: '',
        },
      ],
    }
    const preview = previewBackup(file)
    expect(preview.years).toEqual([2026, 2027])
    expect(preview.entryCount).toBe(1)
  })
})

describe('16) merge import does not create duplicates', () => {
  it('an id present in both keeps a single row, imported wins', () => {
    const existing = emptyData()
    existing.categories = [
      {
        id: 'c1',
        type: 'income',
        name: 'Løn',
        order: 0,
        active: true,
        isDefault: true,
        createdAt: '',
        updatedAt: '',
      },
    ]
    const imported = emptyData()
    imported.categories = [
      {
        id: 'c1',
        type: 'income',
        name: 'Løn (opdateret)',
        order: 0,
        active: true,
        isDefault: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'c2',
        type: 'expense',
        name: 'Ny kategori',
        order: 1,
        active: true,
        isDefault: false,
        createdAt: '',
        updatedAt: '',
      },
    ]
    const merged = mergeBackupData(existing, imported)
    expect(merged.categories).toHaveLength(2)
    expect(merged.categories.find((c) => c.id === 'c1')?.name).toBe('Løn (opdateret)')
  })
})
