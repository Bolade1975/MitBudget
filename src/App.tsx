import { useState } from 'react'
import { db } from './db/schema'
import { useBudgetData } from './state/useBudgetData'
import { updateSettings } from './db/repositories/settingsRepository'
import { BottomNav } from './navigation/BottomNav'
import type { TabId } from './navigation/tabs'
import { OnboardingFlow } from './screens/onboarding/OnboardingFlow'
import { FirstRunIntro } from './screens/onboarding/FirstRunIntro'
import { OverviewScreen } from './screens/overview/OverviewScreen'
import { BudgetScreen } from './screens/budget/BudgetScreen'
import { YearScreen } from './screens/year/YearScreen'
import { MoreScreen } from './screens/more/MoreScreen'

export function App() {
  const data = useBudgetData()
  const [tab, setTab] = useState<TabId>('overblik')
  const [yearOverride, setYearOverride] = useState<string | null>(null)
  const [monthOverride, setMonthOverride] = useState<number | null>(null)
  const [introOverride, setIntroOverride] = useState<boolean | null>(null)

  if (data.loading) {
    return (
      <div className="app-main center-text">
        <p className="muted">Indlæser…</p>
      </div>
    )
  }

  if (!data.settings.onboardingComplete) {
    return <OnboardingFlow onDone={() => window.location.reload()} />
  }

  const currentCalendarYear = new Date().getFullYear()
  const preferredYear =
    data.years.find((y) => y.id === data.settings.activeYearId) ??
    data.years.find((y) => y.year === currentCalendarYear) ??
    data.years[data.years.length - 1]
  const selectedYearId =
    yearOverride && data.years.some((y) => y.id === yearOverride)
      ? yearOverride
      : (preferredYear?.id ?? null)
  const selectedYear = data.years.find((y) => y.id === selectedYearId)
  const defaultMonth = selectedYear?.year === currentCalendarYear ? new Date().getMonth() + 1 : 1
  const selectedMonth = monthOverride ?? defaultMonth

  const showIntro = introOverride ?? !data.settings.guideSeenFirstRun

  function selectMonth(y: string, m: number) {
    setYearOverride(y)
    setMonthOverride(m)
  }

  function closeIntro() {
    setIntroOverride(false)
    void updateSettings(db, { guideSeenFirstRun: true })
  }

  return (
    <div className="app-shell">
      {tab === 'overblik' && selectedYearId ? (
        <OverviewScreen
          data={data}
          yearId={selectedYearId}
          month={selectedMonth}
          onMonthChange={selectMonth}
        />
      ) : null}
      {tab === 'budget' && selectedYearId ? (
        <BudgetScreen data={data} yearId={selectedYearId} contextMonth={selectedMonth} />
      ) : null}
      {tab === 'aar' && selectedYearId ? (
        <YearScreen
          data={data}
          yearId={selectedYearId}
          onSelectYear={(y) => setYearOverride(y)}
          onSelectMonth={(y, m) => {
            selectMonth(y, m)
            setTab('overblik')
          }}
        />
      ) : null}
      {tab === 'mere' ? (
        <MoreScreen
          data={data}
          yearId={selectedYearId}
          onShowIntro={() => setIntroOverride(true)}
        />
      ) : null}

      <BottomNav active={tab} onChange={setTab} />

      {showIntro ? <FirstRunIntro onClose={closeIntro} /> : null}
    </div>
  )
}
