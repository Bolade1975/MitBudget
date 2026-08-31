import { useState } from 'react'
import type { BudgetData } from '../../state/useBudgetData'
import { GuideScreen } from './GuideScreen'
import { CategoriesScreen } from './CategoriesScreen'
import { BackupScreen } from './BackupScreen'
import { ResetScreen } from './ResetScreen'
import { AccountScreen } from './AccountScreen'
import { AboutScreen } from './AboutScreen'
import { ChevronRight } from '../../navigation/icons'

type MoreView = 'menu' | 'guide' | 'categories' | 'backup' | 'account' | 'about' | 'reset'

export function MoreScreen({
  data,
  yearId,
  onShowIntro,
}: {
  data: BudgetData
  yearId: string | null
  onShowIntro: () => void
}) {
  const [view, setView] = useState<MoreView>('menu')

  if (view === 'guide') return <GuideScreen onBack={() => setView('menu')} />
  if (view === 'categories') return <CategoriesScreen data={data} onBack={() => setView('menu')} />
  if (view === 'backup') return <BackupScreen onBack={() => setView('menu')} />
  if (view === 'reset')
    return <ResetScreen onBack={() => setView('menu')} onDone={() => setView('menu')} />
  if (view === 'account' && yearId)
    return <AccountScreen data={data} yearId={yearId} onBack={() => setView('menu')} />
  if (view === 'about') return <AboutScreen onBack={() => setView('menu')} />

  return (
    <div className="app-main">
      <h1>Mere</h1>
      <div className="section row-group">
        <LinkRow label="Sådan bruger du appen" onClick={() => setView('guide')} />
        <LinkRow label="Vis introduktion igen" onClick={onShowIntro} />
        <LinkRow label="Kategorier" onClick={() => setView('categories')} />
        {yearId ? (
          <LinkRow label="Konto og åbningsbalance" onClick={() => setView('account')} />
        ) : null}
      </div>
      <div className="section row-group">
        <LinkRow label="Eksporter/importer sikkerhedskopi" onClick={() => setView('backup')} />
        <LinkRow label="Om appen og dine data" onClick={() => setView('about')} />
      </div>
      <div className="section row-group">
        <LinkRow label="Slet alle data" danger onClick={() => setView('reset')} />
      </div>
      <p className="text-sm muted center-text">Mit Budget · alle data er kun gemt på denne enhed</p>
    </div>
  )
}

function LinkRow({
  label,
  onClick,
  danger,
}: {
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      className="link-row"
      style={danger ? { color: 'var(--color-danger)' } : undefined}
      onClick={onClick}
    >
      <span>{label}</span>
      <ChevronRight className="row-chevron" />
    </button>
  )
}
