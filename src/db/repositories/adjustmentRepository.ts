import type { MitBudgetDB } from '../schema'
import { createId } from '../../domain/id'
import { nowIso } from '../../domain/format'
import type { AdjustmentDirection, BalanceAdjustment } from '../../domain/types'
import { withSaveErrorHandling } from './errors'

export async function listAdjustmentsForYear(
  db: MitBudgetDB,
  yearId: string,
): Promise<BalanceAdjustment[]> {
  return db.adjustments.where('yearId').equals(yearId).toArray()
}

export interface NewAdjustmentInput {
  yearId: string
  month: number
  description: string
  amount: number
  direction: AdjustmentDirection
  date: string
}

export async function createAdjustment(
  db: MitBudgetDB,
  input: NewAdjustmentInput,
): Promise<BalanceAdjustment> {
  return withSaveErrorHandling(async () => {
    const now = nowIso()
    const row: BalanceAdjustment = { ...input, id: createId(), createdAt: now, updatedAt: now }
    await db.adjustments.put(row)
    return row
  })
}

export async function deleteAdjustment(db: MitBudgetDB, id: string): Promise<void> {
  return withSaveErrorHandling(() => db.adjustments.delete(id))
}
