import type { MitBudgetDB } from '../schema'
import { createId } from '../../domain/id'
import { nowIso } from '../../domain/format'
import { splitEntryFromMonth } from '../../domain/recurrence'
import type { BudgetEntry, EntryOverride } from '../../domain/types'
import { withSaveErrorHandling } from './errors'

export async function listEntriesForYear(db: MitBudgetDB, yearId: string): Promise<BudgetEntry[]> {
  return db.entries.where('yearId').equals(yearId).toArray()
}

export async function listOverridesForYear(
  db: MitBudgetDB,
  yearId: string,
): Promise<EntryOverride[]> {
  const entries = await listEntriesForYear(db, yearId)
  const entryIds = new Set(entries.map((e) => e.id))
  const all = await db.overrides.toArray()
  return all.filter((o) => entryIds.has(o.entryId))
}

export type NewEntryInput = Omit<
  BudgetEntry,
  'id' | 'createdAt' | 'updatedAt' | 'copiedFromEntryId'
>

export async function createEntry(db: MitBudgetDB, input: NewEntryInput): Promise<BudgetEntry> {
  return withSaveErrorHandling(async () => {
    const now = nowIso()
    const entry: BudgetEntry = {
      ...input,
      id: createId(),
      copiedFromEntryId: null,
      createdAt: now,
      updatedAt: now,
    }
    await db.entries.put(entry)
    return entry
  })
}

export type EditScope = 'thisMonthOnly' | 'thisAndFuture' | 'all'

/**
 * Edits an entry with the requested scope. `changes` are the new field
 * values (name/amount/categoryId/note/etc.); `fromMonth` is the month the
 * edit was made from (required for thisMonthOnly/thisAndFuture).
 */
export async function editEntryWithScope(
  db: MitBudgetDB,
  entryId: string,
  scope: EditScope,
  changes: Partial<Pick<BudgetEntry, 'name' | 'amount' | 'categoryId' | 'note' | 'active'>>,
  fromMonth?: number,
): Promise<void> {
  return withSaveErrorHandling(async () => {
    const entry = await db.entries.get(entryId)
    if (!entry) return
    const now = nowIso()

    if (scope === 'all' || entry.frequency === 'oneTime' || fromMonth === undefined) {
      await db.entries.put({ ...entry, ...changes, updatedAt: now })
      return
    }

    if (scope === 'thisMonthOnly') {
      const existing = await db.overrides
        .where('entryId')
        .equals(entryId)
        .filter((o) => o.month === fromMonth)
        .first()
      const override: EntryOverride = {
        id: existing?.id ?? createId(),
        entryId,
        month: fromMonth,
        skip: false,
        amountOverride: changes.amount ?? existing?.amountOverride ?? null,
        nameOverride: changes.name ?? existing?.nameOverride ?? null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      await db.overrides.put(override)
      return
    }

    // thisAndFuture: split into a "before" entry (unchanged, up to fromMonth-1)
    // and a "from" entry (fromMonth onward, with the new values).
    const split = splitEntryFromMonth(entry, fromMonth)
    if (!split) {
      // No occurrences before fromMonth to preserve — just edit in place.
      await db.entries.put({ ...entry, ...changes, updatedAt: now })
      return
    }
    await db.entries.put({ ...split.before, updatedAt: now })
    const newEntry: BudgetEntry = {
      ...split.from,
      ...changes,
      id: createId(),
      copiedFromEntryId: entry.id,
      createdAt: now,
      updatedAt: now,
    }
    await db.entries.put(newEntry)
  })
}

export async function deactivateEntry(db: MitBudgetDB, id: string): Promise<void> {
  return withSaveErrorHandling(async () => {
    const entry = await db.entries.get(id)
    if (!entry) return
    await db.entries.put({ ...entry, active: false, updatedAt: nowIso() })
  })
}

export async function deleteEntry(db: MitBudgetDB, id: string): Promise<void> {
  return withSaveErrorHandling(async () => {
    await db.overrides.where('entryId').equals(id).delete()
    await db.entries.delete(id)
  })
}
