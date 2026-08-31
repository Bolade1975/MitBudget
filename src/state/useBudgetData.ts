import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { resolveYearChain, type ResolvedYear } from '../domain/balanceChain'
import { defaultSettings } from '../db/repositories/settingsRepository'
import type {
  AppSettings,
  BalanceAdjustment,
  BudgetEntry,
  BudgetYear,
  Category,
  EntryOverride,
  MonthlyClosure,
} from '../domain/types'

export interface BudgetData {
  loading: boolean
  settings: AppSettings
  categories: Category[]
  years: BudgetYear[]
  entries: BudgetEntry[]
  overrides: EntryOverride[]
  closures: MonthlyClosure[]
  adjustments: BalanceAdjustment[]
  resolvedYears: ResolvedYear[]
}

/**
 * Single reactive read of all app data. Small enough for this app's scale
 * (one person, a handful of years) that recomputing the whole balance chain
 * on every change is simpler and safer than incremental updates.
 */
export function useBudgetData(): BudgetData {
  const raw = useLiveQuery(async () => {
    const [settings, categories, years, entries, overrides, closures, adjustments] =
      await Promise.all([
        db.settings.get('settings'),
        db.categories.toArray(),
        db.years.toArray(),
        db.entries.toArray(),
        db.overrides.toArray(),
        db.closures.toArray(),
        db.adjustments.toArray(),
      ])
    return { settings, categories, years, entries, overrides, closures, adjustments }
  }, [])

  if (!raw) {
    return {
      loading: true,
      settings: defaultSettings(),
      categories: [],
      years: [],
      entries: [],
      overrides: [],
      closures: [],
      adjustments: [],
      resolvedYears: [],
    }
  }

  const years = [...raw.years].sort((a, b) => a.year - b.year)
  const yearData = years.map((year) => ({
    year,
    entries: raw.entries.filter((e) => e.yearId === year.id),
    overrides: raw.overrides.filter((o) =>
      raw.entries.some((e) => e.id === o.entryId && e.yearId === year.id),
    ),
    closures: raw.closures.filter((c) => c.yearId === year.id),
    adjustments: raw.adjustments.filter((a) => a.yearId === year.id),
  }))
  const resolvedYears = resolveYearChain(yearData)

  return {
    loading: false,
    settings: raw.settings ?? defaultSettings(),
    categories: raw.categories,
    years,
    entries: raw.entries,
    overrides: raw.overrides,
    closures: raw.closures,
    adjustments: raw.adjustments,
    resolvedYears,
  }
}
