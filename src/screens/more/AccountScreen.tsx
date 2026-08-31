import { useState } from 'react'
import { db } from '../../db/schema'
import { useSafeAction } from '../../state/toastHooks'
import {
  restoreOpeningBalanceAuto,
  setOpeningBalanceManual,
} from '../../db/repositories/yearRepository'
import { updateSettings } from '../../db/repositories/settingsRepository'
import { formatDkk } from '../../domain/format'
import type { BudgetData } from '../../state/useBudgetData'

export function AccountScreen({
  data,
  yearId,
  onBack,
}: {
  data: BudgetData
  yearId: string
  onBack: () => void
}) {
  const safe = useSafeAction()
  const resolved = data.resolvedYears.find((r) => r.year.id === yearId)
  const [manualValue, setManualValue] = useState(String(resolved?.openingBalance ?? 0))
  const [note, setNote] = useState(data.settings.trackedAccountNote)

  if (!resolved) return null
  const hasPrevious = resolved.year.previousYearId !== null

  return (
    <div className="app-main">
      <button type="button" className="btn-text" onClick={onBack} style={{ marginBottom: 8 }}>
        ‹ Tilbage
      </button>
      <h1>Konto og åbningsbalance</h1>

      <div className="section">
        <div className="field">
          <label className="field-label" htmlFor="accountNote">
            Note om hvilken konto du følger
          </label>
          <input
            id="accountNote"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => safe(() => updateSettings(db, { trackedAccountNote: note }))}
            placeholder="Fx: Min lønkonto i Danske Bank"
          />
          <div className="field-hint">
            Følg konsekvent den samme bankkonto hver måned. Investeringer skal ikke medregnes i
            saldoen.
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Åbningsbalance for {resolved.year.year}</h2>
        <div className="card">
          <p className="text-sm muted" style={{ marginTop: 0 }}>
            {resolved.openingBalanceLabel}: {formatDkk(resolved.openingBalance)}
          </p>
          {hasPrevious ? (
            <>
              <p className="text-sm">
                Åbningsbalancen beregnes normalt ud fra det foregående budgetår. Hvis du ændrer den
                manuelt, stopper den automatiske opdatering.
              </p>
              {resolved.year.openingBalanceMode === 'auto' ? (
                <div className="field">
                  <label className="field-label" htmlFor="manualBalance">
                    Angiv manuelt
                  </label>
                  <input
                    id="manualBalance"
                    type="number"
                    inputMode="decimal"
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-block"
                    style={{ marginTop: 8 }}
                    onClick={() =>
                      safe(() =>
                        setOpeningBalanceManual(
                          db,
                          yearId,
                          Number(manualValue.replace(',', '.')) || 0,
                        ),
                      )
                    }
                  >
                    Angiv manuelt
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-block"
                  onClick={() => safe(() => restoreOpeningBalanceAuto(db, yearId))}
                >
                  Gendan automatisk beregning
                </button>
              )}
            </>
          ) : (
            <p className="text-sm">
              Dette er det første budgetår, så åbningsbalancen er altid manuel.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
