import { useState } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { todayIso } from '../../domain/format'
import type { AdjustmentDirection } from '../../domain/types'

export function AdjustmentSheet({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (input: {
    description: string
    amount: number
    direction: AdjustmentDirection
    date: string
  }) => Promise<void>
}) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<AdjustmentDirection>('out')
  const [date, setDate] = useState(todayIso())
  const [saving, setSaving] = useState(false)

  const amountNum = Number(amount.replace(',', '.'))
  const valid =
    description.trim() !== '' && amount.trim() !== '' && Number.isFinite(amountNum) && amountNum > 0

  async function save() {
    if (!valid) return
    setSaving(true)
    await onSave({ description: description.trim(), amount: amountNum, direction, date })
    setSaving(false)
  }

  return (
    <BottomSheet title="Tilføj korrektion" onClose={onClose}>
      <p className="text-sm muted">
        Brug kun korrektioner til bevægelser, der ellers ville forvrænge sammenligningen – fx
        overførsler mellem dine egne konti, ekstra opsparing flyttet ud af kontoen, eller skift af
        hvilken konto du følger. Almindelige køb og forbrug skal ikke registreres her.
      </p>
      <div className="field">
        <label className="field-label field-required" htmlFor="adjDescription">
          Beskrivelse
        </label>
        <input
          id="adjDescription"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Fx: Flyttet til opsparingskonto"
        />
      </div>
      <div className="field">
        <span className="field-label field-required">Retning</span>
        <div className="segmented" role="group" aria-label="Retning">
          <button
            type="button"
            aria-pressed={direction === 'in'}
            onClick={() => setDirection('in')}
          >
            Ind på kontoen
          </button>
          <button
            type="button"
            aria-pressed={direction === 'out'}
            onClick={() => setDirection('out')}
          >
            Ud af kontoen
          </button>
        </div>
      </div>
      <div className="field">
        <label className="field-label field-required" htmlFor="adjAmount">
          Beløb
        </label>
        <input
          id="adjAmount"
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="adjDate">
          Dato (valgfri)
        </label>
        <input id="adjDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={!valid || saving}
        onClick={save}
      >
        Gem korrektion
      </button>
    </BottomSheet>
  )
}
