import type { MitBudgetDB } from '../schema'
import { createId } from '../../domain/id'
import { nowIso } from '../../domain/format'
import { DEFAULT_CATEGORIES } from '../../domain/defaultCategories'
import type { Category, EntryType } from '../../domain/types'
import { withSaveErrorHandling } from './errors'

export async function seedDefaultCategories(db: MitBudgetDB): Promise<void> {
  const existing = await db.categories.count()
  if (existing > 0) return
  const now = nowIso()
  const rows: Category[] = DEFAULT_CATEGORIES.map((seed, i) => ({
    id: createId(),
    type: seed.type,
    name: seed.name,
    order: i,
    active: true,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  }))
  await db.categories.bulkPut(rows)
}

export async function listCategories(db: MitBudgetDB): Promise<Category[]> {
  const rows = await db.categories.toArray()
  return rows.sort((a, b) => a.order - b.order)
}

export async function createCategory(
  db: MitBudgetDB,
  type: EntryType,
  name: string,
): Promise<Category> {
  return withSaveErrorHandling(async () => {
    const now = nowIso()
    const maxOrder = (await db.categories.toArray()).reduce((m, c) => Math.max(m, c.order), -1)
    const category: Category = {
      id: createId(),
      type,
      name: name.trim(),
      order: maxOrder + 1,
      active: true,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    }
    await db.categories.put(category)
    return category
  })
}

export async function updateCategory(
  db: MitBudgetDB,
  id: string,
  patch: Partial<Pick<Category, 'name' | 'active' | 'order'>>,
): Promise<void> {
  return withSaveErrorHandling(async () => {
    const current = await db.categories.get(id)
    if (!current) return
    await db.categories.put({ ...current, ...patch, updatedAt: nowIso() })
  })
}

/** A category with entries cannot be deleted outright; it must be deactivated instead. */
export async function deactivateCategory(db: MitBudgetDB, id: string): Promise<void> {
  await updateCategory(db, id, { active: false })
}

export async function reactivateCategory(db: MitBudgetDB, id: string): Promise<void> {
  await updateCategory(db, id, { active: true })
}

export async function categoryHasEntries(db: MitBudgetDB, id: string): Promise<boolean> {
  const count = await db.entries.where('categoryId').equals(id).count()
  return count > 0
}

/**
 * Permanently deletes a category only if it has no entries referencing it —
 * a safe reassignment (moving entries to another category first) must
 * happen before calling this otherwise.
 */
export async function deleteCategoryIfUnused(db: MitBudgetDB, id: string): Promise<boolean> {
  const inUse = await categoryHasEntries(db, id)
  if (inUse) return false
  await withSaveErrorHandling(() => db.categories.delete(id))
  return true
}
