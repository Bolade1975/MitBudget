import type { MitBudgetDB } from '../schema'
import { createId } from '../../domain/id'
import { nowIso, todayIso } from '../../domain/format'
import { isRecurring } from '../../domain/newYear'
import type { BudgetEntry, BudgetYear } from '../../domain/types'
import { withSaveErrorHandling } from './errors'
import { listEntriesForYear } from './entryRepository'

export interface CreateNewYearOptions {
  sourceYearId: string | null
  newYearNumber: number
  /** Entry ids (one-time entries only) to include; recurring entries are always copied. */
  includeOneTimeEntryIds: Set<string>
  startEmpty: boolean
}

/**
 * Creates a new budget year. When copying from a source year, the opening
 * balance stays dynamically linked (mode 'auto') to that source year; new
 * copied entries get a `copiedFromEntryId` pointer for provenance only —
 * later edits to either side never propagate to the other.
 */
export async function createNewYear(
  db: MitBudgetDB,
  options: CreateNewYearOptions,
): Promise<BudgetYear> {
  return withSaveErrorHandling(async () => {
    const now = nowIso()
    const sourceYear = options.sourceYearId ? await db.years.get(options.sourceYearId) : undefined

    const newYear: BudgetYear = {
      id: createId(),
      year: options.newYearNumber,
      previousYearId: sourceYear?.id ?? null,
      openingBalanceMode: sourceYear ? 'auto' : 'manual',
      manualOpeningBalance: 0,
      manualOpeningBalanceDate: todayIso(),
      createdAt: now,
      updatedAt: now,
    }
    await db.years.put(newYear)

    if (!options.startEmpty && sourceYear) {
      const sourceEntries = await listEntriesForYear(db, sourceYear.id)
      const toCopy = sourceEntries.filter(
        (e) => e.active && (isRecurring(e) || options.includeOneTimeEntryIds.has(e.id)),
      )
      const copies: BudgetEntry[] = toCopy.map((e) => ({
        ...e,
        id: createId(),
        yearId: newYear.id,
        copiedFromEntryId: e.id,
        createdAt: now,
        updatedAt: now,
      }))
      if (copies.length > 0) await db.entries.bulkPut(copies)
    }

    return newYear
  })
}
