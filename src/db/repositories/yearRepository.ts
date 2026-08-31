import type { MitBudgetDB } from '../schema'
import { createId } from '../../domain/id'
import { nowIso, todayIso } from '../../domain/format'
import type { BudgetYear } from '../../domain/types'
import { withSaveErrorHandling } from './errors'

export async function listYears(db: MitBudgetDB): Promise<BudgetYear[]> {
  const rows = await db.years.toArray()
  return rows.sort((a, b) => a.year - b.year)
}

export async function getYear(db: MitBudgetDB, id: string): Promise<BudgetYear | undefined> {
  return db.years.get(id)
}

export async function createRootYear(
  db: MitBudgetDB,
  year: number,
  openingBalance: number,
  openingBalanceDate: string,
): Promise<BudgetYear> {
  return withSaveErrorHandling(async () => {
    const now = nowIso()
    const row: BudgetYear = {
      id: createId(),
      year,
      previousYearId: null,
      openingBalanceMode: 'manual',
      manualOpeningBalance: openingBalance,
      manualOpeningBalanceDate: openingBalanceDate || todayIso(),
      createdAt: now,
      updatedAt: now,
    }
    await db.years.put(row)
    return row
  })
}

export async function updateYear(
  db: MitBudgetDB,
  id: string,
  patch: Partial<Omit<BudgetYear, 'id' | 'createdAt'>>,
): Promise<void> {
  return withSaveErrorHandling(async () => {
    const current = await db.years.get(id)
    if (!current) return
    await db.years.put({ ...current, ...patch, updatedAt: nowIso() })
  })
}

export async function setOpeningBalanceManual(
  db: MitBudgetDB,
  id: string,
  value: number,
): Promise<void> {
  await updateYear(db, id, { openingBalanceMode: 'manual', manualOpeningBalance: value })
}

export async function restoreOpeningBalanceAuto(db: MitBudgetDB, id: string): Promise<void> {
  await updateYear(db, id, { openingBalanceMode: 'auto' })
}
