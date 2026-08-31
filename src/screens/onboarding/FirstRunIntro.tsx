import { BottomSheet } from '../../components/BottomSheet'

const STEPS = [
  'Læg dit budget: tilføj indtægter, udgifter og opsparing under "Budget".',
  'Se dit frie beløb: "Overblik" viser hvad du har tilbage, når alt er betalt.',
  'Følg den forventede banksaldo måned for måned under "Overblik".',
  'Afslut måneden med din faktiske saldo, så appen kan vise om det gik som ventet.',
  'Tag en sikkerhedskopi jævnligt under "Mere", så du ikke mister dine data.',
]

export function FirstRunIntro({ onClose }: { onClose: () => void }) {
  return (
    <BottomSheet title="Sådan bruger du Mit Budget" onClose={onClose}>
      <ol className="step-list" style={{ listStyle: 'none', padding: 0, margin: '4px 0 16px' }}>
        {STEPS.map((step, i) => (
          <li key={i}>
            <span className="step-num">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
        Forstået
      </button>
    </BottomSheet>
  )
}
