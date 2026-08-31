import { useState } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { useSafeAction } from '../../state/toastHooks'
import { db } from '../../db/schema'
import { createNewYear } from '../../db/repositories/newYearRepository'
import { buildNewYearReview } from '../../domain/newYear'
import { formatDkk, monthName } from '../../domain/format'
import type { BudgetData } from '../../state/useBudgetData'

export function NewYearFlow({
  data,
  sourceYearId,
  onClose,
  onCreated,
}: {
  data: BudgetData
  sourceYearId: string
  onClose: () => void
  onCreated: (newYearId: string) => void
}) {
  const safe = useSafeAction()
  const sourceResolved = data.resolvedYears.find((r) => r.year.id === sourceYearId)
  const sourceEntries = data.entries.filter((e) => e.yearId === sourceYearId && e.active)

  const [step, setStep] = useState<'options' | 'review'>('options')
  const [startEmpty, setStartEmpty] = useState(false)
  const [newYearNumber, setNewYearNumber] = useState(
    (sourceResolved?.year.year ?? new Date().getFullYear()) + 1,
  )
  const [includeOneTime, setIncludeOneTime] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)

  const oneTimeEntries = sourceEntries.filter(
    (e) => e.frequency === 'oneTime' || e.frequency === 'thisMonthOnly',
  )

  const review = (() => {
    if (!sourceResolved) return null
    const december = sourceResolved.months[11]
    const expectedOpening = december
      ? december.closed && december.actualClosingBalance !== null
        ? december.actualClosingBalance
        : december.adjustedExpectedClosingBalance
      : sourceResolved.openingBalance
    const annual = {
      income: sourceResolved.months.reduce((s, m) => s + m.budgetedIncome, 0),
      expense: sourceResolved.months.reduce((s, m) => s + m.budgetedExpense, 0),
      saving: sourceResolved.months.reduce((s, m) => s + m.budgetedSaving, 0),
    }
    return buildNewYearReview(
      sourceResolved.year.year,
      newYearNumber,
      startEmpty
        ? []
        : sourceEntries.filter(
            (e) =>
              e.active &&
              (e.frequency !== 'oneTime' && e.frequency !== 'thisMonthOnly'
                ? true
                : includeOneTime.has(e.id)),
          ),
      expectedOpening,
      annual,
    )
  })()

  if (!sourceResolved) return null

  async function create() {
    setCreating(true)
    const year = await safe(() =>
      createNewYear(db, {
        sourceYearId,
        newYearNumber,
        includeOneTimeEntryIds: includeOneTime,
        startEmpty,
      }),
    )
    setCreating(false)
    if (year) onCreated(year.id)
  }

  if (step === 'options') {
    return (
      <BottomSheet title="Opret nyt budgetår" onClose={onClose}>
        <div className="field">
          <label className="field-label field-required" htmlFor="newYearNumber">
            Nyt budgetår
          </label>
          <input
            id="newYearNumber"
            type="number"
            inputMode="numeric"
            value={newYearNumber}
            onChange={(e) => setNewYearNumber(Number(e.target.value))}
          />
        </div>

        <div className="field">
          <span className="field-label">Udgangspunkt</span>
          <div className="segmented" role="group">
            <button type="button" aria-pressed={!startEmpty} onClick={() => setStartEmpty(false)}>
              Kopiér {sourceResolved.year.year}
            </button>
            <button type="button" aria-pressed={startEmpty} onClick={() => setStartEmpty(true)}>
              Start forfra
            </button>
          </div>
        </div>

        {!startEmpty && oneTimeEntries.length > 0 ? (
          <div className="field">
            <span className="field-label">
              Engangsposter fra {sourceResolved.year.year} (vælg dem, der skal kopieres)
            </span>
            <div className="row-group">
              {oneTimeEntries.map((e) => (
                <label key={e.id} className="row" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeOneTime.has(e.id)}
                    onChange={(ev) => {
                      setIncludeOneTime((prev) => {
                        const next = new Set(prev)
                        if (ev.target.checked) next.add(e.id)
                        else next.delete(e.id)
                        return next
                      })
                    }}
                    style={{ marginRight: 8 }}
                  />
                  <span className="row-name">
                    <span className="row-name-text">{e.name}</span>
                    <span className="row-sub">{monthName(e.months[0] ?? 1)}</span>
                  </span>
                  <span className="row-amount">{formatDkk(e.amount)}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => setStep('review')}
        >
          Gennemse
        </button>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet title="Gennemse nyt budgetår" onClose={onClose}>
      {review ? (
        <div className="row-group" style={{ marginBottom: 12 }}>
          <ReviewLine label="Kildeår" value={String(review.sourceYear)} />
          <ReviewLine label="Nyt år" value={String(review.newYear)} />
          <ReviewLine label="Antal poster der kopieres" value={String(review.entryCount)} />
          <ReviewLine
            label="Forventet åbningsbalance"
            value={formatDkk(review.expectedOpeningBalance)}
          />
          <ReviewLine label="Forventet årsindtægt" value={formatDkk(review.annualIncome)} />
          <ReviewLine label="Forventet årsudgift" value={formatDkk(review.annualExpense)} />
          <ReviewLine
            label="Planlagt opsparing/investering"
            value={formatDkk(review.annualSaving)}
          />
          <ReviewLine
            label="Forventet lukkesaldo, år"
            value={formatDkk(review.expectedAnnualClosingBalance)}
          />
        </div>
      ) : null}
      <p className="field-hint">
        Åbningsbalancen beregnes normalt ud fra det foregående budgetår. Hvis du ændrer den manuelt
        senere, stopper den automatiske opdatering.
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" className="btn btn-block" onClick={() => setStep('options')}>
          Tilbage
        </button>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={creating}
          onClick={create}
        >
          Opret år
        </button>
      </div>
    </BottomSheet>
  )
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="row">
      <span className="row-name">{label}</span>
      <span className="row-amount">{value}</span>
    </div>
  )
}
