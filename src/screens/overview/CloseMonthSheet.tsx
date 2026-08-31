import { useState } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { formatDkk, formatDkkSigned, monthName, todayIso } from '../../domain/format'
import { variance as calcVariance } from '../../domain/calculations'
import type { MonthBalance, MonthlyClosure } from '../../domain/types'

export function CloseMonthSheet({
  year,
  monthBalance,
  existingClosure,
  onClose,
  onSave,
}: {
  year: number
  monthBalance: MonthBalance
  existingClosure: MonthlyClosure | undefined
  onClose: () => void
  onSave: (input: { actualBalance: number; balanceDate: string; note: string }) => Promise<void>
}) {
  const [actual, setActual] = useState(existingClosure ? String(existingClosure.actualBalance) : '')
  const [date, setDate] = useState(existingClosure?.balanceDate ?? todayIso())
  const [note, setNote] = useState(existingClosure?.note ?? '')
  const [saving, setSaving] = useState(false)

  const actualNum = Number(actual.replace(',', '.'))
  const valid = actual.trim() !== '' && Number.isFinite(actualNum)
  const previewVariance = valid
    ? calcVariance(actualNum, monthBalance.adjustedExpectedClosingBalance)
    : null

  async function save() {
    if (!valid) return
    setSaving(true)
    await onSave({ actualBalance: actualNum, balanceDate: date, note })
    setSaving(false)
  }

  return (
    <BottomSheet title={`Afslut ${monthName(monthBalance.month)} ${year}`} onClose={onClose}>
      <div className="field">
        <label className="field-label field-required" htmlFor="actualBalance">
          Faktisk saldo på din bankkonto
        </label>
        <input
          id="actualBalance"
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
        />
      </div>
      <div className="field">
        <label className="field-label field-required" htmlFor="closeDate">
          Dato for saldoen
        </label>
        <input id="closeDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="closeNote">
          Note (valgfri)
        </label>
        <textarea
          id="closeNote"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Fx: usikker på et par posteringer"
        />
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="text-sm muted" style={{ marginBottom: 6 }}>
          Forhåndsvisning
        </div>
        <PreviewLine label="Åbningsbalance" value={formatDkk(monthBalance.openingBalance)} />
        <PreviewLine
          label="Forventet saldo"
          value={formatDkk(monthBalance.expectedClosingBalance)}
        />
        {monthBalance.adjustmentsTotal !== 0 ? (
          <PreviewLine
            label="Forventet saldo efter korrektioner"
            value={formatDkk(monthBalance.adjustedExpectedClosingBalance)}
          />
        ) : null}
        <PreviewLine label="Faktisk saldo" value={valid ? formatDkk(actualNum) : '–'} />
        <PreviewLine
          label="Forskel"
          value={previewVariance !== null ? formatDkkSigned(previewVariance) : '–'}
          bold
        />
        {previewVariance !== null ? (
          <p className="text-sm" style={{ marginTop: 6 }}>
            {previewVariance >= 0
              ? `Måneden endte ${formatDkk(Math.abs(previewVariance))} bedre end budgetteret.`
              : `Måneden endte ${formatDkk(Math.abs(previewVariance))} dårligere end budgetteret.`}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={!valid || saving}
        onClick={save}
      >
        {existingClosure ? 'Gem ændringer' : 'Afslut måned'}
      </button>
    </BottomSheet>
  )
}

function PreviewLine({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: bold ? 700 : 400 }}>
      <span className={bold ? '' : 'muted'}>{label}</span>
      <span>{value}</span>
    </div>
  )
}
