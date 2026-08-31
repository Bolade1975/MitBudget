import { useState } from 'react'
import { db } from '../../db/schema'
import type { BudgetData } from '../../state/useBudgetData'
import { useSafeAction } from '../../state/toastHooks'
import { MonthSwitcher } from '../../components/MonthSwitcher'
import { formatDkk, formatDkkSigned } from '../../domain/format'
import { closeMonth, reopenMonth } from '../../db/repositories/closureRepository'
import { createAdjustment, deleteAdjustment } from '../../db/repositories/adjustmentRepository'
import { CloseMonthSheet } from './CloseMonthSheet'
import { AdjustmentSheet } from './AdjustmentSheet'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { InfoIcon } from '../../components/InfoIcon'
import type { AdjustmentDirection } from '../../domain/types'

export function OverviewScreen({
  data,
  yearId,
  month,
  onMonthChange,
}: {
  data: BudgetData
  yearId: string
  month: number
  onMonthChange: (yearId: string, month: number) => void
}) {
  const safe = useSafeAction()
  const [sheet, setSheet] = useState<'close' | 'adjustment' | 'reopen' | null>(null)

  const resolved = data.resolvedYears.find((r) => r.year.id === yearId)
  if (!resolved) {
    return (
      <div className="app-main">
        <p className="muted">Intet budgetår fundet endnu.</p>
      </div>
    )
  }

  const mb = resolved.months[month - 1]
  if (!mb) return null

  const yearIndex = data.resolvedYears.findIndex((r) => r.year.id === yearId)

  function handleMonthChange(y: number, m: number) {
    // Find the resolved year for calendar year `y` (may need to switch yearId).
    const target = data.resolvedYears.find((r) => r.year.year === y)
    if (target) onMonthChange(target.year.id, m)
  }

  const monthAdjustments = data.adjustments.filter((a) => a.yearId === yearId && a.month === month)
  const existingClosure = data.closures.find((c) => c.yearId === yearId && c.month === month)

  return (
    <div className="app-main">
      <MonthSwitcher year={resolved.year.year} month={month} onChange={handleMonthChange} />

      {yearIndex === 0 ? (
        <p className="text-sm muted center-text" style={{ marginTop: -4 }}>
          {resolved.openingBalanceLabel}: {formatDkk(resolved.openingBalance)}
        </p>
      ) : null}

      <div className="stat-grid section">
        <StatTile label="Indtægter (budget)" value={mb.budgetedIncome} />
        <StatTile label="Udgifter (budget)" value={-mb.budgetedExpense} negativeIsExpense />
        <StatTile label="Opsparing/investering" value={mb.budgetedSaving} />
        <StatTile label="Frit beløb" value={mb.freeAmount} highlight />
      </div>

      <div className="card section">
        <p style={{ margin: 0 }}>
          {mb.freeAmount >= 0
            ? `Du forventer at have ${formatDkk(mb.freeAmount)} tilbage denne måned.`
            : `Du forventer at mangle ${formatDkk(Math.abs(mb.freeAmount))} denne måned.`}
        </p>
        <p className="text-sm muted" style={{ margin: '4px 0 0' }}>
          Det svarer til ca. {formatDkk(mb.weeklyFreeAmount)} om ugen.
        </p>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Banksaldo</h2>
        </div>
        <div className="row-group">
          <BalanceLine label="Åbningsbalance" value={mb.openingBalance} />
          <BalanceLine label="Forventet lukkesaldo" value={mb.expectedClosingBalance} />
          {mb.adjustmentsTotal !== 0 ? (
            <BalanceLine
              label="Forventet efter korrektioner"
              value={mb.adjustedExpectedClosingBalance}
            />
          ) : null}
          {mb.closed && mb.actualClosingBalance !== null ? (
            <BalanceLine label="Faktisk lukkesaldo" value={mb.actualClosingBalance} />
          ) : null}
        </div>
      </div>

      {mb.closed && mb.variance !== null ? (
        <div className={`card section ${mb.variance >= 0 ? 'pill-positive' : 'pill-negative'}`}>
          <p style={{ margin: 0, fontWeight: 700 }}>
            {mb.variance >= 0
              ? `Du endte ${formatDkk(Math.abs(mb.variance))} bedre end budgetteret.`
              : `Du endte ${formatDkk(Math.abs(mb.variance))} dårligere end budgetteret.`}
          </p>
          <p className="text-sm" style={{ margin: '4px 0 0' }}>
            Forskel: {formatDkkSigned(mb.variance)}. Appen kan ikke se, hvilke konkrete udgifter der
            gjorde forskellen.
          </p>
        </div>
      ) : null}

      <div className="section" style={{ display: 'flex', gap: 8 }}>
        {mb.closed ? (
          <>
            <button type="button" className="btn btn-block" onClick={() => setSheet('close')}>
              Ret afslutning
            </button>
            <button type="button" className="btn btn-block" onClick={() => setSheet('reopen')}>
              Genåbn måned
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => setSheet('close')}
          >
            Afslut måned
          </button>
        )}
      </div>

      <div className="section">
        <div className="section-header">
          <h2>
            Korrektioner{' '}
            <InfoIcon text="Brug kun til overførsler mellem egne konti eller lignende, ikke almindeligt forbrug." />
          </h2>
        </div>
        {monthAdjustments.length > 0 ? (
          <div className="row-group">
            {monthAdjustments.map((a) => (
              <div key={a.id} className="row">
                <span className="row-name">{a.description}</span>
                <span className={`row-amount ${a.direction === 'in' ? 'positive' : 'negative'}`}>
                  {a.direction === 'in' ? '+' : '-'}
                  {formatDkk(a.amount)}
                </span>
                <button
                  type="button"
                  className="btn-text btn-sm"
                  onClick={() => safe(() => deleteAdjustment(db, a.id))}
                >
                  Fjern
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="fab-row">
          <button type="button" className="btn btn-sm" onClick={() => setSheet('adjustment')}>
            Tilføj korrektion
          </button>
        </div>
      </div>

      {sheet === 'close' ? (
        <CloseMonthSheet
          year={resolved.year.year}
          monthBalance={mb}
          existingClosure={existingClosure}
          onClose={() => setSheet(null)}
          onSave={async (input) => {
            await safe(() =>
              closeMonth(db, {
                yearId,
                month,
                actualBalance: input.actualBalance,
                balanceDate: input.balanceDate,
                note: input.note,
              }),
            )
            setSheet(null)
          }}
        />
      ) : null}

      {sheet === 'adjustment' ? (
        <AdjustmentSheet
          onClose={() => setSheet(null)}
          onSave={async (input: {
            description: string
            amount: number
            direction: AdjustmentDirection
            date: string
          }) => {
            await safe(() => createAdjustment(db, { yearId, month, ...input }))
            setSheet(null)
          }}
        />
      ) : null}

      {sheet === 'reopen' ? (
        <ConfirmDialog
          title="Genåbn måned"
          message="Måneden bliver markeret som ikke afsluttet. Fremtidige forventede saldi genberegnes automatisk, men dine budgetposter ændres ikke."
          confirmLabel="Genåbn"
          onCancel={() => setSheet(null)}
          onConfirm={async () => {
            await safe(() => reopenMonth(db, yearId, month))
            setSheet(null)
          }}
        />
      ) : null}
    </div>
  )
}

function StatTile({
  label,
  value,
  highlight,
  negativeIsExpense,
}: {
  label: string
  value: number
  highlight?: boolean
  negativeIsExpense?: boolean
}) {
  const displayValue = negativeIsExpense ? Math.abs(value) : value
  return (
    <div
      className="stat-tile"
      style={highlight ? { borderColor: 'var(--color-accent)' } : undefined}
    >
      <div className="stat-label">{label}</div>
      <div
        className="stat-value"
        style={value < 0 ? { color: 'var(--color-negative)' } : undefined}
      >
        {formatDkk(displayValue)}
      </div>
    </div>
  )
}

function BalanceLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="row">
      <span className="row-name">{label}</span>
      <span className={`row-amount ${value < 0 ? 'negative' : ''}`}>{formatDkk(value)}</span>
    </div>
  )
}
