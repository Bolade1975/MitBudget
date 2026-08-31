import Dexie, { type Table } from 'dexie'
import type {
  AppSettings,
  BalanceAdjustment,
  BudgetEntry,
  BudgetYear,
  Category,
  EntryOverride,
  MonthlyClosure,
} from '../domain/types'

// Schema changes must add a new .version(n).stores({...}) call (with an
// .upgrade() function if existing record shapes change) rather than editing
// a previous version in place, so existing user data is never dropped on an
// app update.
export class MitBudgetDB extends Dexie {
  settings!: Table<AppSettings, string>
  years!: Table<BudgetYear, string>
  categories!: Table<Category, string>
  entries!: Table<BudgetEntry, string>
  overrides!: Table<EntryOverride, string>
  closures!: Table<MonthlyClosure, string>
  adjustments!: Table<BalanceAdjustment, string>
  /** A single-row snapshot of all data taken right before a "replace" import, for recovery. */
  recovery!: Table<{ id: string; takenAt: string; data: unknown }, string>

  // A name parameter is accepted so tests can create isolated,
  // independently named databases instead of sharing the app's real one.
  constructor(name = 'MitBudget') {
    super(name)
    this.version(1).stores({
      settings: 'id',
      years: 'id, year',
      categories: 'id, type, order',
      entries: 'id, yearId, categoryId, type',
      overrides: 'id, entryId, month',
      closures: 'id, yearId, month, [yearId+month]',
      adjustments: 'id, yearId, month',
      recovery: 'id',
    })
  }
}

export const db = new MitBudgetDB()
