import { useState } from 'react'
import { db } from '../../db/schema'
import {
  completeOnboarding,
  type OnboardingAnswers,
} from '../../db/repositories/onboardingRepository'
import { seedDefaultCategories } from '../../db/repositories/categoryRepository'
import { createRootYear } from '../../db/repositories/yearRepository'
import { updateSettings } from '../../db/repositories/settingsRepository'
import { todayIso } from '../../domain/format'
import { useSafeAction } from '../../state/toastHooks'
import { InfoIcon } from '../../components/InfoIcon'

function NumberField({
  label,
  value,
  onChange,
  required,
  hint,
  info,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  hint?: string
  info?: string
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={label}>
        <span className={required ? 'field-required' : ''}>{label}</span>
        {info ? <InfoIcon text={info} /> : null}
      </label>
      <input
        id={label}
        type="number"
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  )
}

export function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const safe = useSafeAction()
  const currentYear = new Date().getFullYear()

  const [year, setYear] = useState(String(currentYear))
  const [balance, setBalance] = useState('')
  const [balanceDate, setBalanceDate] = useState(todayIso())
  const [income, setIncome] = useState('')
  const [housing, setHousing] = useState('')
  const [transport, setTransport] = useState('')
  const [subscriptions, setSubscriptions] = useState('')
  const [saving, setSaving] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function num(v: string): number | null {
    const n = Number(v.replace(',', '.'))
    return Number.isFinite(n) && v.trim() !== '' ? n : null
  }

  async function finish() {
    setSubmitting(true)
    const answers: OnboardingAnswers = {
      year: num(year) ?? currentYear,
      openingBalance: num(balance) ?? 0,
      openingBalanceDate: balanceDate || todayIso(),
      monthlyIncome: num(income),
      housingPayment: num(housing),
      transportCost: num(transport),
      subscriptions: num(subscriptions),
      monthlySaving: num(saving),
    }
    await safe(() => completeOnboarding(db, answers))
    setSubmitting(false)
    onDone()
  }

  async function skipAll() {
    setSubmitting(true)
    await safe(async () => {
      await seedDefaultCategories(db)
      const y = await createRootYear(db, currentYear, 0, todayIso())
      await updateSettings(db, { onboardingComplete: true, activeYearId: y.id })
    })
    setSubmitting(false)
    onDone()
  }

  return (
    <div className="app-main" style={{ paddingBottom: 32 }}>
      <h1>Velkommen til Mit Budget</h1>
      <p className="muted text-sm">
        Besvar det du kan – du kan altid springe spørgsmål over og rette alt senere. Vi bruger dine
        svar til at lave et simpelt startbudget for dig.
      </p>

      <div className="section">
        <h2>Budgetår og saldo</h2>
        <div className="row-group" style={{ padding: 12, display: 'block' }}>
          <NumberField label="Budgetår" value={year} onChange={setYear} required />
          <NumberField
            label="Nuværende saldo på din bankkonto"
            value={balance}
            onChange={setBalance}
            required
            info="Vælg én bankkonto, som du løbende følger i appen. Brug ikke en konto med investeringer."
          />
          <div className="field">
            <label className="field-label field-required" htmlFor="balanceDate">
              Dato for saldoen
            </label>
            <input
              id="balanceDate"
              type="date"
              value={balanceDate}
              onChange={(e) => setBalanceDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Forventede beløb pr. måned</h2>
        <div className="row-group" style={{ padding: 12, display: 'block' }}>
          <NumberField label="Normal månedlig indtægt" value={income} onChange={setIncome} />
          <NumberField
            label="Betaling for bolig/at bo hjemme"
            value={housing}
            onChange={setHousing}
          />
          <NumberField label="Transport" value={transport} onChange={setTransport} />
          <NumberField
            label="Faste abonnementer"
            value={subscriptions}
            onChange={setSubscriptions}
          />
          <NumberField
            label="Ønsket månedlig opsparing/investering"
            value={saving}
            onChange={setSaving}
          />
        </div>
      </div>

      <p className="field-hint">
        Husk at følge den samme bankkonto konsekvent hver måned. Investeringer skal ikke medregnes i
        banksaldoen.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={submitting}
          onClick={finish}
        >
          Kom i gang
        </button>
        <button type="button" className="btn-text" disabled={submitting} onClick={skipAll}>
          Spring det hele over
        </button>
      </div>
    </div>
  )
}
