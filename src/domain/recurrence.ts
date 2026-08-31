import type { BudgetEntry, EntryOverride } from './types'

/** Which months (1-12) an entry produces an occurrence in, before overrides. */
export function entryMonths(entry: BudgetEntry): number[] {
  switch (entry.frequency) {
    case 'monthly': {
      const months: number[] = []
      for (let m = entry.startMonth; m <= entry.endMonth; m++) months.push(m)
      return months
    }
    case 'thisMonthOnly':
    case 'yearly':
    case 'oneTime':
      return entry.months.slice(0, 1)
    case 'specificMonths':
    case 'quarterly':
      return [...entry.months].sort((a, b) => a - b)
    default:
      return []
  }
}

export interface Occurrence {
  entry: BudgetEntry
  month: number
  amount: number
  name: string
}

/** Resolved occurrences for a given month, active entries only, with per-occurrence overrides applied. */
export function occurrencesForMonth(
  entries: BudgetEntry[],
  overrides: EntryOverride[],
  month: number,
): Occurrence[] {
  const overrideByEntry = new Map<string, EntryOverride>()
  for (const o of overrides) {
    if (o.month === month) overrideByEntry.set(o.entryId, o)
  }

  const result: Occurrence[] = []
  for (const entry of entries) {
    if (!entry.active) continue
    if (!entryMonths(entry).includes(month)) continue
    const override = overrideByEntry.get(entry.id)
    if (override?.skip) continue
    result.push({
      entry,
      month,
      amount: override?.amountOverride ?? entry.amount,
      name: override?.nameOverride ?? entry.name,
    })
  }
  return result
}

/**
 * Split a recurring entry so an edit applies "denne og kommende måneder"
 * (from `fromMonth` onward, within the same year). Returns the mutated
 * original entry (months before fromMonth only) plus a new entry to insert
 * (fromMonth onward) that the caller should give new field values.
 * Returns null if the entry has no occurrences before fromMonth (nothing to
 * split off — caller should just edit the entry directly instead).
 */
export function splitEntryFromMonth(
  entry: BudgetEntry,
  fromMonth: number,
): { before: BudgetEntry; from: BudgetEntry } | null {
  const months = entryMonths(entry)
  const beforeMonths = months.filter((m) => m < fromMonth)
  const fromMonths = months.filter((m) => m >= fromMonth)
  if (beforeMonths.length === 0 || fromMonths.length === 0) return null

  if (entry.frequency === 'monthly') {
    const before: BudgetEntry = { ...entry, endMonth: fromMonth - 1 }
    const from: BudgetEntry = { ...entry, startMonth: fromMonth, endMonth: entry.endMonth }
    return { before, from }
  }
  // specificMonths / quarterly
  const before: BudgetEntry = { ...entry, months: beforeMonths }
  const from: BudgetEntry = { ...entry, months: fromMonths }
  return { before, from }
}
