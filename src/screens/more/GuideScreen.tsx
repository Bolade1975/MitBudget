const TOPICS: { title: string; body: string }[] = [
  {
    title: 'Sådan laver du dit første budget',
    body: 'Gå til "Budget" og tilføj dine indtægter, faste og variable udgifter samt opsparing/investering under de tre grupper. Hver post er én række – tryk på en post for at rette den.',
  },
  {
    title: 'Forskellen på indtægt, udgift, opsparing og investering',
    body: 'Indtægt er penge, du modtager. Udgift er penge, du bruger. Opsparing/investering er penge, du bevidst lægger til side – de trækkes fra dit frie beløb, men er ikke almindeligt forbrug.',
  },
  {
    title: 'Sådan virker gentagne poster',
    body: 'En post kan gentages hver måned, kun forekomme i en bestemt måned, i flere valgte måneder, kvartalsvis, én gang om året eller som en engangspost. Store, uregelmæssige udgifter placeres i den måned, de faktisk betales.',
  },
  {
    title: 'Sådan beregnes det frie beløb',
    body: 'Frit beløb = budgetteret indtægt − budgetterede udgifter − planlagt opsparing/investering. Det er det beløb, du har til fri disposition den måned.',
  },
  {
    title: 'Sådan beregnes den forventede banksaldo',
    body: 'Forventet lukkesaldo = åbningsbalance + indtægt − udgifter − opsparing/investering. Eventuelle korrektioner lægges til bagefter.',
  },
  {
    title: 'Sådan afslutter du en måned',
    body: 'Under "Overblik" trykker du "Afslut måned" og indtaster den faktiske saldo på din valgte bankkonto. Appen viser derefter, om måneden gik bedre eller dårligere end budgetteret.',
  },
  {
    title: 'Hvornår skal du bruge en korrektion',
    body: 'Brug en korrektion til bevægelser, der ikke er almindeligt forbrug – fx overførsler mellem dine egne konti, ekstra opsparing flyttet ud af kontoen, eller når du skifter, hvilken konto du følger.',
  },
  {
    title: 'Hvorfor almindelige køb ikke skal registreres som korrektioner',
    body: 'Almindelige køb er allerede en del af dit budgetterede forbrug. Registrerer du dem også som korrektioner, bliver sammenligningen mellem budget og faktisk saldo misvisende.',
  },
  {
    title: 'Sådan opretter du et nyt budgetår',
    body: 'Under "År" trykker du "Opret nyt budgetår". Du kan kopiere det foregående års poster eller starte forfra. Engangsposter skal du selv vælge, om skal kopieres med.',
  },
  {
    title: 'Sådan opdateres næste års åbningsbalance',
    body: 'Åbningsbalancen for et nyt år følger automatisk det foregående år. Er december ikke afsluttet endnu, bruges det forventede beløb – når december afsluttes, bruges den faktiske saldo i stedet.',
  },
  {
    title: 'Sådan eksporterer og importerer du en sikkerhedskopi',
    body: 'Under "Mere" kan du eksportere alle dine data som én fil. Får du en ny telefon, kan du importere filen igen – vælg om den skal erstatte eller sammenlægges med eksisterende data.',
  },
  {
    title: 'Hvad appen kan og ikke kan se ud fra en banksaldo',
    body: 'Appen kan vise, om din samlede saldo er bedre eller dårligere end forventet. Den kan ikke ud fra saldoen alene se, hvilke konkrete udgifter der har været højere eller lavere end budgetteret.',
  },
]

export function GuideScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="app-main">
      <button type="button" className="btn-text" onClick={onBack} style={{ marginBottom: 8 }}>
        ‹ Tilbage
      </button>
      <h1>Sådan bruger du appen</h1>
      {TOPICS.map((t) => (
        <div className="section card" key={t.title}>
          <h3 style={{ marginBottom: 4 }}>{t.title}</h3>
          <p className="text-sm" style={{ margin: 0 }}>
            {t.body}
          </p>
        </div>
      ))}
    </div>
  )
}
