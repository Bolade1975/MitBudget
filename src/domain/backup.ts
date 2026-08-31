import { SCHEMA_VERSION } from './types'
import type {
  AppSettings,
  BalanceAdjustment,
  BudgetEntry,
  BudgetYear,
  Category,
  EntryOverride,
  MonthlyClosure,
} from './types'

export const BACKUP_APP_ID = 'Mit Budget'

export interface BackupFile {
  app: typeof BACKUP_APP_ID
  schemaVersion: number
  exportedAt: string
  settings: AppSettings
  years: BudgetYear[]
  categories: Category[]
  entries: BudgetEntry[]
  overrides: EntryOverride[]
  closures: MonthlyClosure[]
  adjustments: BalanceAdjustment[]
}

export interface BackupData {
  settings: AppSettings
  years: BudgetYear[]
  categories: Category[]
  entries: BudgetEntry[]
  overrides: EntryOverride[]
  closures: MonthlyClosure[]
  adjustments: BalanceAdjustment[]
}

export function buildBackupFile(data: BackupData): BackupFile {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    ...data,
  }
}

export function backupFileName(exportedAtIso: string): string {
  const date = exportedAtIso.slice(0, 10)
  return `Mit-Budget-backup-${date}.json`
}

export type ValidationResult = { ok: true; file: BackupFile } | { ok: false; error: string }

/** Validates file structure and schema version. Does not mutate any state. */
export function validateBackupFile(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'Filen kunne ikke læses som en sikkerhedskopi.' }
  }
  const obj = raw as Record<string, unknown>
  if (obj.app !== BACKUP_APP_ID) {
    return { ok: false, error: 'Filen ser ikke ud til at være en Mit Budget-sikkerhedskopi.' }
  }
  if (typeof obj.schemaVersion !== 'number') {
    return { ok: false, error: 'Filen mangler en gyldig version og kan ikke importeres.' }
  }
  if (obj.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      error: 'Sikkerhedskopien er lavet med en nyere version af appen. Opdater appen først.',
    }
  }
  const requiredArrays = ['years', 'categories', 'entries', 'overrides', 'closures', 'adjustments']
  for (const key of requiredArrays) {
    if (!Array.isArray(obj[key])) {
      return { ok: false, error: `Filen mangler eller har ugyldigt indhold for "${key}".` }
    }
  }
  if (typeof obj.settings !== 'object' || obj.settings === null) {
    return { ok: false, error: 'Filen mangler indstillinger og kan ikke importeres.' }
  }
  if (typeof obj.exportedAt !== 'string') {
    return { ok: false, error: 'Filen mangler et eksporttidspunkt.' }
  }
  return { ok: true, file: obj as unknown as BackupFile }
}

export interface BackupPreview {
  exportedAt: string
  years: number[]
  entryCount: number
  categoryCount: number
}

export function previewBackup(file: BackupFile): BackupPreview {
  return {
    exportedAt: file.exportedAt,
    years: file.years.map((y) => y.year).sort((a, b) => a - b),
    entryCount: file.entries.length,
    categoryCount: file.categories.length,
  }
}

/**
 * Merges an imported backup into existing data. Because every record has a
 * stable id, "merge" is simply: imported records win for any id present in
 * both, existing records not present in the import are kept — no id can
 * ever appear twice, so no duplicates are created.
 */
export function mergeBackupData(existing: BackupData, imported: BackupData): BackupData {
  function mergeById<T extends { id: string }>(existingRows: T[], importedRows: T[]): T[] {
    const byId = new Map(existingRows.map((r) => [r.id, r]))
    for (const row of importedRows) byId.set(row.id, row)
    return [...byId.values()]
  }
  return {
    settings: imported.settings ?? existing.settings,
    years: mergeById(existing.years, imported.years),
    categories: mergeById(existing.categories, imported.categories),
    entries: mergeById(existing.entries, imported.entries),
    overrides: mergeById(existing.overrides, imported.overrides),
    closures: mergeById(existing.closures, imported.closures),
    adjustments: mergeById(existing.adjustments, imported.adjustments),
  }
}
