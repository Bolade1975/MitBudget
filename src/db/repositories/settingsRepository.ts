import type { MitBudgetDB } from '../schema'
import { nowIso } from '../../domain/format'
import type { AppSettings } from '../../domain/types'
import { SCHEMA_VERSION } from '../../domain/types'
import { withSaveErrorHandling } from './errors'

const SETTINGS_ID = 'settings' as const

export function defaultSettings(): AppSettings {
  const now = nowIso()
  return {
    id: SETTINGS_ID,
    schemaVersion: SCHEMA_VERSION,
    onboardingComplete: false,
    guideSeenFirstRun: false,
    activeYearId: null,
    trackedAccountNote: '',
    createdAt: now,
    updatedAt: now,
  }
}

export async function getSettings(db: MitBudgetDB): Promise<AppSettings> {
  const existing = await db.settings.get(SETTINGS_ID)
  if (existing) return existing
  const created = defaultSettings()
  await db.settings.put(created)
  return created
}

export async function updateSettings(
  db: MitBudgetDB,
  patch: Partial<Omit<AppSettings, 'id' | 'createdAt'>>,
): Promise<AppSettings> {
  return withSaveErrorHandling(async () => {
    const current = await getSettings(db)
    const updated: AppSettings = { ...current, ...patch, updatedAt: nowIso() }
    await db.settings.put(updated)
    return updated
  })
}
