import { useState } from 'react'
import { db } from '../../db/schema'
import { useSafeAction, useToast } from '../../state/toastHooks'
import { ConfirmDialog } from '../../components/ConfirmDialog'

export function ResetScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const safe = useSafeAction()
  const showToast = useToast()
  const [confirming, setConfirming] = useState(false)

  async function reset() {
    await safe(() => db.delete())
    showToast('Alle data er slettet.')
    onDone()
  }

  return (
    <div className="app-main">
      <button type="button" className="btn-text" onClick={onBack} style={{ marginBottom: 8 }}>
        ‹ Tilbage
      </button>
      <h1>Slet alle data</h1>
      <div className="card">
        <p>
          Dette sletter permanent alle dine budgetår, poster, kategorier, afsluttede måneder og
          korrektioner fra denne telefon. Handlingen kan ikke fortrydes, medmindre du har en
          eksporteret sikkerhedskopi.
        </p>
        <button
          type="button"
          className="btn btn-danger btn-block"
          onClick={() => setConfirming(true)}
        >
          Slet alt
        </button>
      </div>

      {confirming ? (
        <ConfirmDialog
          title="Er du helt sikker?"
          message="Alle data slettes permanent fra denne telefon. Dette kan ikke fortrydes."
          confirmLabel="Ja, slet alt"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={reset}
        />
      ) : null}
    </div>
  )
}
