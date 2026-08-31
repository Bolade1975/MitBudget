import { useState } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { InfoIcon } from '../../components/InfoIcon'
import { monthName } from '../../domain/format'
import type { Category, EntryType, Frequency } from '../../domain/types'

export interface EntryFormValues {
  type: EntryType
  categoryId: string
  name: string
  amount: number
  frequency: Frequency
  startMonth: number
  endMonth: number
  months: number[]
  note: string
  active: boolean
}

const TYPE_LABELS: Record<EntryType, string> = {
  income: 'Indtægt',
  expense: 'Udgift',
  saving: 'Opsparing/investering',
}

const FREQUENCY_LABELS: Record<Frequency, string> = {
  monthly: 'Hver måned',
  thisMonthOnly: 'Kun denne måned',
  specificMonths: 'Bestemte måneder',
  quarterly: 'Hvert kvartal',
  yearly: 'Én gang om året',
  oneTime: 'Engangspost',
}

export function EntryFormSheet({
  title,
  categories,
  initial,
  contextMonth,
  onCancel,
  onDelete,
  onSubmit,
}: {
  title: string
  categories: Category[]
  initial?: Partial<EntryFormValues>
  contextMonth: number
  onCancel: () => void
  onDelete?: () => void
  onSubmit: (values: EntryFormValues) => void
}) {
  const [type, setType] = useState<EntryType>(initial?.type ?? 'expense')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '')
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? 'monthly')
  const [months, setMonths] = useState<number[]>(initial?.months ?? [contextMonth])
  const [note, setNote] = useState(initial?.note ?? '')

  const activeCategories = categories.filter((c) => c.type === type && c.active)
  const amountNum = Number(amount.replace(',', '.'))
  const valid =
    name.trim() !== '' &&
    amount.trim() !== '' &&
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    categoryId !== '' &&
    (frequency === 'monthly' || months.length > 0)

  function toggleMonth(m: number, single: boolean) {
    if (single) {
      setMonths([m])
      return
    }
    setMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b),
    )
  }

  function submit() {
    if (!valid) return
    onSubmit({
      type,
      categoryId,
      name: name.trim(),
      amount: amountNum,
      frequency,
      startMonth: 1,
      endMonth: 12,
      months,
      note: note.trim(),
      active: initial?.active ?? true,
    })
  }

  return (
    <BottomSheet title={title} onClose={onCancel}>
      <div className="field">
        <span className="field-label field-required">Type</span>
        <div className="segmented" role="group" aria-label="Type">
          {(Object.keys(TYPE_LABELS) as EntryType[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => {
                setType(t)
                setCategoryId('')
              }}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label field-required" htmlFor="entryName">
          Navn
        </label>
        <input
          id="entryName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Fx: Løn"
        />
      </div>

      <div className="field">
        <label className="field-label field-required" htmlFor="entryAmount">
          Beløb (positivt tal)
        </label>
        <input
          id="entryAmount"
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label field-required" htmlFor="entryCategory">
          Kategori
        </label>
        <select
          id="entryCategory"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Vælg kategori</option>
          {activeCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <span className="field-label">
          Gentagelse{' '}
          <InfoIcon text="Store, uregelmæssige udgifter registreres i den måned, de faktisk skal betales – ikke fordelt ud over hele året." />
        </span>
        <select
          value={frequency}
          onChange={(e) => {
            const f = e.target.value as Frequency
            setFrequency(f)
            if (f !== 'specificMonths' && f !== 'quarterly') setMonths([contextMonth])
          }}
        >
          {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
            <option key={f} value={f}>
              {FREQUENCY_LABELS[f]}
            </option>
          ))}
        </select>
      </div>

      {frequency !== 'monthly' ? (
        <div className="field">
          <span className="field-label">
            {frequency === 'specificMonths' || frequency === 'quarterly' ? 'Vælg måneder' : 'Måned'}
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <button
                key={m}
                type="button"
                className="month-chip"
                aria-pressed={months.includes(m)}
                onClick={() =>
                  toggleMonth(
                    m,
                    frequency === 'thisMonthOnly' ||
                      frequency === 'yearly' ||
                      frequency === 'oneTime',
                  )
                }
              >
                {monthName(m).slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="field">
        <label className="field-label" htmlFor="entryNote">
          Note (valgfri)
        </label>
        <textarea id="entryNote" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!valid}
          onClick={submit}
        >
          Gem
        </button>
        {onDelete ? (
          <button type="button" className="btn-text" onClick={onDelete}>
            Slet post
          </button>
        ) : null}
      </div>
    </BottomSheet>
  )
}
