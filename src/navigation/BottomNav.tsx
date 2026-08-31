import { TABS, type TabId } from './tabs'
import { OverviewIcon, BudgetIcon, YearIcon, MoreIcon } from './icons'

const ICONS: Record<TabId, (props: { className?: string }) => React.JSX.Element> = {
  overblik: OverviewIcon,
  budget: BudgetIcon,
  aar: YearIcon,
  mere: MoreIcon,
}

export function BottomNav({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Hovednavigation">
      {TABS.map((tab) => {
        const Icon = ICONS[tab.id]
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            className="bottom-nav-item"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(tab.id)}
          >
            <Icon />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
