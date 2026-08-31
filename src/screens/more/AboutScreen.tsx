export function AboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="app-main">
      <button type="button" className="btn-text" onClick={onBack} style={{ marginBottom: 8 }}>
        ‹ Tilbage
      </button>
      <h1>Om appen og dine data</h1>

      <div className="section card">
        <h3 style={{ marginBottom: 4 }}>Valuta</h3>
        <p className="text-sm" style={{ margin: 0 }}>
          Alle beløb vises i danske kroner (DKK) med dansk talformat. Beløb gemmes internt med to
          decimaler og vises normalt som hele kroner, medmindre decimaler er relevante.
        </p>
      </div>

      <div className="section card">
        <h3 style={{ marginBottom: 4 }}>Lagring af data</h3>
        <p className="text-sm" style={{ margin: 0 }}>
          Alle dine data gemmes udelukkende lokalt på denne enhed i browserens IndexedDB. Der er
          ingen konto, intet login og ingen cloud-server – Mit Budget sender aldrig dine økonomiske
          oplysninger nogen steder. Rydder du hjemmesidedata for appen, eller sletter du appen uden
          at have eksporteret en sikkerhedskopi, forsvinder dine data permanent.
        </p>
      </div>

      <div className="section card">
        <h3 style={{ marginBottom: 4 }}>Begrænsning</h3>
        <p className="text-sm" style={{ margin: 0 }}>
          Appen kan vise, om din samlede saldo er bedre eller dårligere end forventet. Den kan ikke
          ud fra saldoen alene se, hvilke konkrete udgifter der har været højere eller lavere end
          budgetteret.
        </p>
      </div>
    </div>
  )
}
