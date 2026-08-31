export type TabId = 'overblik' | 'budget' | 'aar' | 'mere'

export interface TabDef {
  id: TabId
  label: string
}

export const TABS: TabDef[] = [
  { id: 'overblik', label: 'Overblik' },
  { id: 'budget', label: 'Budget' },
  { id: 'aar', label: 'År' },
  { id: 'mere', label: 'Mere' },
]
