import type { MitBudgetDB } from '../schema'
import {
  buildBackupFile,
  mergeBackupData,
  validateBackupFile,
  type BackupData,
  type BackupFile,
  type ValidationResult,
} from '../../domain/backup'
import { getSettings } from './settingsRepository'
import { withSaveErrorHandling } from './errors'

export async function readAllData(db: MitBudgetDB): Promise<BackupData> {
  const [settings, years, categories, entries, overrides, closures, adjustments] =
    await Promise.all([
      getSettings(db),
      db.years.toArray(),
      db.categories.toArray(),
      db.entries.toArray(),
      db.overrides.toArray(),
      db.closures.toArray(),
      db.adjustments.toArray(),
    ])
  return { settings, years, categories, entries, overrides, closures, adjustments }
}

export async function exportBackup(db: MitBudgetDB): Promise<BackupFile> {
  const data = await readAllData(db)
  return buildBackupFile(data)
}

export function parseBackupJson(text: string): ValidationResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Filen er ikke gyldig JSON og kan ikke læses.' }
  }
  return validateBackupFile(raw)
}

async function writeAllData(db: MitBudgetDB, data: BackupData): Promise<void> {
  await db.transaction(
    'rw',
    [db.settings, db.years, db.categories, db.entries, db.overrides, db.closures, db.adjustments],
    async () => {
      await db.settings.put(data.settings)
      await db.years.bulkPut(data.years)
      await db.categories.bulkPut(data.categories)
      await db.entries.bulkPut(data.entries)
      await db.overrides.bulkPut(data.overrides)
      await db.closures.bulkPut(data.closures)
      await db.adjustments.bulkPut(data.adjustments)
    },
  )
}

async function clearAllData(db: MitBudgetDB): Promise<void> {
  await db.transaction(
    'rw',
    [db.settings, db.years, db.categories, db.entries, db.overrides, db.closures, db.adjustments],
    async () => {
      await Promise.all([
        db.years.clear(),
        db.categories.clear(),
        db.entries.clear(),
        db.overrides.clear(),
        db.closures.clear(),
        db.adjustments.clear(),
      ])
    },
  )
}

async function snapshotForRecovery(db: MitBudgetDB): Promise<void> {
  const data = await readAllData(db)
  await db.recovery.put({ id: 'last', takenAt: new Date().toISOString(), data })
}

export type ImportMode = 'replace' | 'merge'

/**
 * Imports validated backup data. On any failure, the transaction rolls
 * back and existing data is left completely unchanged.
 */
export async function importBackup(
  db: MitBudgetDB,
  file: BackupFile,
  mode: ImportMode,
): Promise<void> {
  return withSaveErrorHandling(async () => {
    const imported: BackupData = {
      settings: file.settings,
      years: file.years,
      categories: file.categories,
      entries: file.entries,
      overrides: file.overrides,
      closures: file.closures,
      adjustments: file.adjustments,
    }

    if (mode === 'replace') {
      await snapshotForRecovery(db)
      await clearAllData(db)
      await writeAllData(db, imported)
      return
    }

    const existing = await readAllData(db)
    const merged = mergeBackupData(existing, imported)
    await writeAllData(db, merged)
  })
}

/** Restores the internal recovery snapshot taken before the most recent replace-import, if any. */
export async function restoreRecoverySnapshot(db: MitBudgetDB): Promise<boolean> {
  const snap = await db.recovery.get('last')
  if (!snap) return false
  await clearAllData(db)
  await writeAllData(db, snap.data as BackupData)
  return true
}
