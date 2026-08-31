import type { MitBudgetDB } from '../schema'
import { createId } from '../../domain/id'
import { nowIso } from '../../domain/format'
import type { MonthlyClosure } from '../../domain/types'
import { withSaveErrorHandling } from './errors'

export async function listClosuresForYear(
  db: MitBudgetDB,
  yearId: string,
): Promise<MonthlyClosure[]> {
  return db.closures.where('yearId').equals(yearId).toArray()
}

export async function getClosure(
  db: MitBudgetDB,
  yearId: string,
  month: number,
): Promise<MonthlyClosure | undefined> {
  return db.closures.where('[yearId+month]').equals([yearId, month]).first()
}

export interface CloseMonthInput {
  yearId: string
  month: number
  actualBalance: number
  balanceDate: string
  note: string
}

export async function closeMonth(db: MitBudgetDB, input: CloseMonthInput): Promise<MonthlyClosure> {
  return withSaveErrorHandling(async () => {
    const existing = await getClosure(db, input.yearId, input.month)
    const now = nowIso()
    const row: MonthlyClosure = {
      id: existing?.id ?? createId(),
      yearId: input.yearId,
      month: input.month,
      closed: true,
      actualBalance: input.actualBalance,
      balanceDate: input.balanceDate,
      note: input.note,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await db.closures.put(row)
    return row
  })
}

export async function reopenMonth(db: MitBudgetDB, yearId: string, month: number): Promise<void> {
  return withSaveErrorHandling(async () => {
    const existing = await getClosure(db, yearId, month)
    if (!existing) return
    await db.closures.put({ ...existing, closed: false, updatedAt: nowIso() })
  })
}
