import { useState } from 'react'
import { db } from '../../db/schema'
import { useSafeAction } from '../../state/toastHooks'
import {
  categoryHasEntries,
  createCategory,
  deactivateCategory,
  deleteCategoryIfUnused,
  reactivateCategory,
  updateCategory,
} from '../../db/repositories/categoryRepository'
import { BottomSheet } from '../../components/BottomSheet'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import type { BudgetData } from '../../state/useBudgetData'
import type { Category, EntryType } from '../../domain/types'

const TYPE_LABELS: Record<EntryType, string> = {
  income: 'Indtægter',
  expense: 'Udgifter',
  saving: 'Opsparing og investering',
}

export function CategoriesScreen({ data, onBack }: { data: BudgetData; onBack: () => void }) {
  const safe = useSafeAction()
  const [editing, setEditing] = useState<Category | null>(null)
  const [addingType, setAddingType] = useState<EntryType | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState<Category | null>(null)

  const byType = (t: EntryType) =>
    data.categories.filter((c) => c.type === t).sort((a, b) => a.order - b.order)

  async function move(cat: Category, direction: -1 | 1) {
    const siblings = byType(cat.type)
    const idx = siblings.findIndex((c) => c.id === cat.id)
    const swapWith = siblings[idx + direction]
    if (!swapWith) return
    await safe(async () => {
      await updateCategory(db, cat.id, { order: swapWith.order })
      await updateCategory(db, swapWith.id, { order: cat.order })
    })
  }

  return (
    <div className="app-main">
      <button type="button" className="btn-text" onClick={onBack} style={{ marginBottom: 8 }}>
        ‹ Tilbage
      </button>
      <h1>Kategorier</h1>
      {(Object.keys(TYPE_LABELS) as EntryType[]).map((type) => (
        <div className="section" key={type}>
          <div className="section-header">
            <h2>{TYPE_LABELS[type]}</h2>
          </div>
          <div className="row-group">
            {byType(type).map((c, i, arr) => (
              <div key={c.id} className={`row${!c.active ? ' row-inactive' : ''}`}>
                <button
                  type="button"
                  className="btn-text btn-sm"
                  aria-label="Flyt op"
                  disabled={i === 0}
                  onClick={() => move(c, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-text btn-sm"
                  aria-label="Flyt ned"
                  disabled={i === arr.length - 1}
                  onClick={() => move(c, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="row-name"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    textAlign: 'left',
                    color: 'inherit',
                  }}
                  onClick={() => setEditing(c)}
                >
                  <span className="row-name-text">{c.name}</span>
                  {!c.active ? <span className="row-sub">Deaktiveret</span> : null}
                </button>
                {c.active ? (
                  <button
                    type="button"
                    className="btn-text btn-sm"
                    onClick={() => setConfirmDeactivate(c)}
                  >
                    Deaktiver
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-text btn-sm"
                    onClick={() => safe(() => reactivateCategory(db, c.id))}
                  >
                    Genaktiver
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="fab-row">
            <button type="button" className="btn btn-sm" onClick={() => setAddingType(type)}>
              Tilføj kategori
            </button>
          </div>
        </div>
      ))}

      {editing ? (
        <RenameSheet
          category={editing}
          onClose={() => setEditing(null)}
          onSave={async (name) => {
            await safe(() => updateCategory(db, editing.id, { name }))
            setEditing(null)
          }}
        />
      ) : null}

      {addingType ? (
        <RenameSheet
          category={null}
          onClose={() => setAddingType(null)}
          onSave={async (name) => {
            await safe(() => createCategory(db, addingType, name))
            setAddingType(null)
          }}
        />
      ) : null}

      {confirmDeactivate ? (
        <DeactivateDialog
          category={confirmDeactivate}
          onCancel={() => setConfirmDeactivate(null)}
          onConfirm={async () => {
            const inUse = await categoryHasEntries(db, confirmDeactivate.id)
            if (inUse) {
              await safe(() => deactivateCategory(db, confirmDeactivate.id))
            } else {
              await safe(() => deleteCategoryIfUnused(db, confirmDeactivate.id))
            }
            setConfirmDeactivate(null)
          }}
        />
      ) : null}
    </div>
  )
}

function RenameSheet({
  category,
  onClose,
  onSave,
}: {
  category: Category | null
  onClose: () => void
  onSave: (name: string) => void
}) {
  const [name, setName] = useState(category?.name ?? '')
  return (
    <BottomSheet title={category ? 'Omdøb kategori' : 'Ny kategori'} onClose={onClose}>
      <div className="field">
        <label className="field-label field-required" htmlFor="categoryName">
          Navn
        </label>
        <input
          id="categoryName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={name.trim() === ''}
        onClick={() => onSave(name.trim())}
      >
        Gem
      </button>
    </BottomSheet>
  )
}

function DeactivateDialog({
  category,
  onCancel,
  onConfirm,
}: {
  category: Category
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <ConfirmDialog
      title="Deaktiver kategori"
      message={`"${category.name}" bliver skjult ved oprettelse af nye poster. Har kategorien ingen poster, slettes den permanent. Har den poster, bevares de og kategorien kan genaktiveres senere.`}
      confirmLabel="Deaktiver"
      danger
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
