import { useState } from 'react'
import { db } from '../../db/schema'
import type { BudgetData } from '../../state/useBudgetData'
import { useSafeAction } from '../../state/toastHooks'
import { Row, RowGroup } from '../../components/Row'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { formatDkk, monthName } from '../../domain/format'
import {
  createEntry,
  deleteEntry,
  editEntryWithScope,
  type EditScope,
} from '../../db/repositories/entryRepository'
import { sumMoney } from '../../domain/money'
import { EntryFormSheet, type EntryFormValues } from './EntryFormSheet'
import { EditScopeDialog } from './EditScopeDialog'
import type { BudgetEntry, EntryType } from '../../domain/types'

const SECTIONS: { type: EntryType; title: string }[] = [
  { type: 'income', title: 'Indtægter' },
  { type: 'expense', title: 'Udgifter' },
  { type: 'saving', title: 'Opsparing og investering' },
]

export function BudgetScreen({
  data,
  yearId,
  contextMonth,
}: {
  data: BudgetData
  yearId: string
  contextMonth: number
}) {
  const safe = useSafeAction()
  const [formType, setFormType] = useState<EntryType | null>(null)
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null)
  const [pendingScope, setPendingScope] = useState<{ values: EntryFormValues } | null>(null)
  const [deleting, setDeleting] = useState<BudgetEntry | null>(null)

  const yearEntries = data.entries
    .filter((e) => e.yearId === yearId && e.active)
    .sort((a, b) => a.name.localeCompare(b.name, 'da'))

  const categoryName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? ''

  function entrySub(e: BudgetEntry): string {
    const cat = categoryName(e.categoryId)
    const freq =
      e.frequency === 'monthly'
        ? ''
        : e.frequency === 'thisMonthOnly'
          ? `Kun ${monthName(e.months[0] ?? contextMonth)}`
          : e.frequency === 'oneTime'
            ? `Engangspost, ${monthName(e.months[0] ?? contextMonth)}`
            : e.frequency === 'yearly'
              ? `Årlig, ${monthName(e.months[0] ?? contextMonth)}`
              : e.frequency === 'quarterly'
                ? 'Kvartalsvis'
                : 'Bestemte måneder'
    return [cat, freq].filter(Boolean).join(' · ')
  }

  async function handleCreate(type: EntryType, values: EntryFormValues) {
    await safe(() =>
      createEntry(db, {
        yearId,
        type,
        categoryId: values.categoryId,
        name: values.name,
        amount: values.amount,
        frequency: values.frequency,
        startMonth: values.startMonth,
        endMonth: values.endMonth,
        months: values.months,
        note: values.note,
        active: true,
      }),
    )
    setFormType(null)
  }

  async function applyEdit(entry: BudgetEntry, values: EntryFormValues, scope: EditScope) {
    await safe(() =>
      editEntryWithScope(
        db,
        entry.id,
        scope,
        {
          name: values.name,
          amount: values.amount,
          categoryId: values.categoryId,
          note: values.note,
        },
        contextMonth,
      ),
    )
    setEditingEntry(null)
    setPendingScope(null)
  }

  return (
    <div className="app-main">
      <h1>Budget</h1>
      {SECTIONS.map((section) => {
        const items = yearEntries.filter((e) => e.type === section.type)
        const total = sumMoney(items.map((e) => e.amount))
        return (
          <div className="section" key={section.type}>
            <div className="section-header">
              <h2>{section.title}</h2>
              <span className="section-total">{formatDkk(total)}</span>
            </div>
            {items.length > 0 ? (
              <RowGroup>
                {items.map((e) => (
                  <Row
                    key={e.id}
                    name={e.name}
                    sub={entrySub(e)}
                    amount={e.amount}
                    amountTone="neutral"
                    onClick={() => setEditingEntry(e)}
                  />
                ))}
              </RowGroup>
            ) : (
              <p className="text-sm muted" style={{ margin: '4px 2px' }}>
                Ingen poster endnu.
              </p>
            )}
            <div className="fab-row">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setFormType(section.type)}
              >
                Tilføj post
              </button>
            </div>
          </div>
        )
      })}

      {formType ? (
        <EntryFormSheet
          title={`Ny post – ${SECTIONS.find((s) => s.type === formType)?.title}`}
          categories={data.categories}
          initial={{ type: formType }}
          contextMonth={contextMonth}
          onCancel={() => setFormType(null)}
          onSubmit={(values) => handleCreate(formType, values)}
        />
      ) : null}

      {editingEntry && !pendingScope ? (
        <EntryFormSheet
          title="Ret post"
          categories={data.categories}
          initial={{
            type: editingEntry.type,
            categoryId: editingEntry.categoryId,
            name: editingEntry.name,
            amount: editingEntry.amount,
            frequency: editingEntry.frequency,
            months: editingEntry.months,
            note: editingEntry.note,
            active: editingEntry.active,
          }}
          contextMonth={contextMonth}
          onCancel={() => setEditingEntry(null)}
          onDelete={() => setDeleting(editingEntry)}
          onSubmit={(values) => {
            if (
              editingEntry.frequency === 'oneTime' ||
              editingEntry.frequency === 'thisMonthOnly'
            ) {
              void applyEdit(editingEntry, values, 'all')
            } else {
              setPendingScope({ values })
            }
          }}
        />
      ) : null}

      {editingEntry && pendingScope ? (
        <EditScopeDialog
          onCancel={() => setPendingScope(null)}
          onChoose={(scope) => void applyEdit(editingEntry, pendingScope.values, scope)}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Slet post"
          message={`Er du sikker på, at du vil slette "${deleting.name}"? Dette kan ikke fortrydes.`}
          confirmLabel="Slet"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await safe(() => deleteEntry(db, deleting.id))
            setDeleting(null)
            setEditingEntry(null)
          }}
        />
      ) : null}
    </div>
  )
}
