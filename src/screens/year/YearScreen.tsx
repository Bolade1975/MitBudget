import { useState } from 'react'
import type { BudgetData } from '../../state/useBudgetData'
import { formatDkk, formatDkkSigned, monthName } from '../../domain/format'
import { sumMoney } from '../../domain/money'
import { BarChart } from '../../components/BarChart'
import { ChevronRight } from '../../navigation/icons'
import { NewYearFlow } from './NewYearFlow'

export function YearScreen({
  data,
  yearId,
  onSelectYear,
  onSelectMonth,
}: {
  data: BudgetData
  yearId: string
  onSelectYear: (yearId: string) => void
  onSelectMonth: (yearId: string, month: number) => void
}) {
  const [showNewYear, setShowNewYear] = useState(false)
  const [chartMode, setChartMode] = useState<'free' | 'variance'>('free')

  const resolved = data.resolvedYears.find((r) => r.year.id === yearId)
  if (!resolved) {
    return (
      <div className="app-main">
        <h1>År</h1>
        <p className="muted">Intet budgetår fundet endnu.</p>
      </div>
    )
  }

  const anyClosed = resolved.months.some((m) => m.closed)
  const annualIncome = sumMoney(resolved.months.map((m) => m.budgetedIncome))
  const annualExpense = sumMoney(resolved.months.map((m) => m.budgetedExpense))
  const annualSaving = sumMoney(resolved.months.map((m) => m.budgetedSaving))
  const annualFree = sumMoney(resolved.months.map((m) => m.freeAmount))
  const annualVariance = sumMoney(
    resolved.months.filter((m) => m.variance !== null).map((m) => m.variance as number),
  )

  const chartValues =
    chartMode === 'free'
      ? resolved.months.map((m) => m.freeAmount)
      : resolved.months.map((m) => m.variance ?? 0)

  return (
    <div className="app-main">
      <div className="month-switcher">
        <button
          type="button"
          className="btn btn-icon"
          aria-label="Forrige år"
          disabled={data.resolvedYears.findIndex((r) => r.year.id === yearId) === 0}
          onClick={() => {
            const idx = data.resolvedYears.findIndex((r) => r.year.id === yearId)
            const prev = data.resolvedYears[idx - 1]
            if (prev) onSelectYear(prev.year.id)
          }}
        >
          ‹
        </button>
        <span className="month-switcher-label">{resolved.year.year}</span>
        <button
          type="button"
          className="btn btn-icon"
          aria-label="Næste år"
          disabled={
            data.resolvedYears.findIndex((r) => r.year.id === yearId) ===
            data.resolvedYears.length - 1
          }
          onClick={() => {
            const idx = data.resolvedYears.findIndex((r) => r.year.id === yearId)
            const next = data.resolvedYears[idx + 1]
            if (next) onSelectYear(next.year.id)
          }}
        >
          ›
        </button>
      </div>

      <div className="section row-group">
        {resolved.months.map((m) => (
          <button
            key={m.month}
            type="button"
            className="row"
            onClick={() => onSelectMonth(yearId, m.month)}
          >
            <span className="row-name">
              <span className="row-name-text">{monthName(m.month)}</span>
              <span className="row-sub">
                Frit: {formatDkk(m.freeAmount)}
                {m.closed && m.variance !== null
                  ? ` · Forskel: ${formatDkkSigned(m.variance)}`
                  : ''}
              </span>
            </span>
            <span className={`row-amount ${m.closed ? '' : 'muted'}`}>
              {formatDkk(
                m.closed && m.actualClosingBalance !== null
                  ? m.actualClosingBalance
                  : m.expectedClosingBalance,
              )}
            </span>
            <ChevronRight className="row-chevron" />
          </button>
        ))}
      </div>

      <div className="section">
        <div className="section-header">
          <h2>{chartMode === 'free' ? 'Frit beløb pr. måned' : 'Forskel pr. måned'}</h2>
          {anyClosed ? (
            <button
              type="button"
              className="btn-text btn-sm"
              onClick={() => setChartMode((m) => (m === 'free' ? 'variance' : 'free'))}
            >
              Skift graf
            </button>
          ) : null}
        </div>
        <div className="card">
          <BarChart
            values={chartValues}
            labelPrefix={chartMode === 'free' ? 'Frit beløb' : 'Forskel'}
          />
        </div>
      </div>

      <div className="section">
        <h2>Årstotal</h2>
        <div className="row-group">
          <TotalRow label="Indtægter" value={annualIncome} />
          <TotalRow label="Udgifter" value={-annualExpense} />
          <TotalRow label="Opsparing og investering" value={annualSaving} />
          <TotalRow label="Frit beløb" value={annualFree} />
          <TotalRow label="Registreret forskel i alt" value={annualVariance} />
        </div>
      </div>

      <div className="fab-row">
        <button type="button" className="btn btn-primary" onClick={() => setShowNewYear(true)}>
          Opret nyt budgetår
        </button>
      </div>

      {showNewYear ? (
        <NewYearFlow
          data={data}
          sourceYearId={yearId}
          onClose={() => setShowNewYear(false)}
          onCreated={(newYearId) => {
            setShowNewYear(false)
            onSelectYear(newYearId)
          }}
        />
      ) : null}
    </div>
  )
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="row">
      <span className="row-name">{label}</span>
      <span className={`row-amount ${value < 0 ? 'negative' : ''}`}>{formatDkk(value)}</span>
    </div>
  )
}
