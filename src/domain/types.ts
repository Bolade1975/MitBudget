// Core data model. All monetary amounts are stored as positive numbers on
// entries/adjustments; sign/effect is derived from `type`/`direction` at
// calculation time (see calculations.ts). Amounts are floating-point DKK,
// rounded to 2 decimals on save (see domain/money.ts).

export const SCHEMA_VERSION = 1

export type EntryType = 'income' | 'expense' | 'saving'

export type Frequency =
  | 'monthly' // every month within [startMonth, endMonth]
  | 'thisMonthOnly' // a single specific month (months[0])
  | 'specificMonths' // an explicit set of months
  | 'quarterly' // paid in specific months, typically 4/year
  | 'yearly' // paid once a year, in months[0]
  | 'oneTime' // occurs exactly once, in months[0], never repeats

export interface AppSettings {
  id: 'settings'
  schemaVersion: number
  onboardingComplete: boolean
  guideSeenFirstRun: boolean
  activeYearId: string | null
  trackedAccountNote: string
  createdAt: string
  updatedAt: string
}

export type OpeningBalanceMode = 'auto' | 'manual'

export interface BudgetYear {
  id: string
  year: number
  /** Link to the previous year for dynamic opening-balance calculation. */
  previousYearId: string | null
  openingBalanceMode: OpeningBalanceMode
  /**
   * For a root year (no previousYearId) this is the user's manually entered
   * starting balance. For a linked year with mode 'manual' this is the
   * override value. For mode 'auto' with a previousYearId, this field is
   * ignored — the opening balance is derived live (see balanceChain.ts).
   */
  manualOpeningBalance: number
  manualOpeningBalanceDate: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  type: EntryType
  name: string
  order: number
  active: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface BudgetEntry {
  id: string
  yearId: string
  type: EntryType
  categoryId: string
  name: string
  /** Always positive. */
  amount: number
  frequency: Frequency
  /** For 'monthly': inclusive range. Ignored by other frequencies. */
  startMonth: number
  endMonth: number
  /** For thisMonthOnly/specificMonths/quarterly/yearly/oneTime: 1-12 set. */
  months: number[]
  note: string
  active: boolean
  /** Metadata only — copied entries are independent afterwards. */
  copiedFromEntryId: string | null
  createdAt: string
  updatedAt: string
}

/** Per-occurrence override, used by the "kun denne måned" edit scope. */
export interface EntryOverride {
  id: string
  entryId: string
  month: number // 1-12, within the entry's yearId
  /** true = this occurrence does not happen at all this month. */
  skip: boolean
  amountOverride: number | null
  nameOverride: string | null
  createdAt: string
  updatedAt: string
}

export interface MonthlyClosure {
  id: string
  yearId: string
  month: number // 1-12
  closed: boolean
  actualBalance: number
  balanceDate: string
  note: string
  createdAt: string
  updatedAt: string
}

export type AdjustmentDirection = 'in' | 'out'

export interface BalanceAdjustment {
  id: string
  yearId: string
  month: number // 1-12
  description: string
  amount: number // always positive
  direction: AdjustmentDirection
  date: string
  createdAt: string
  updatedAt: string
}

export interface MonthBalance {
  month: number
  budgetedIncome: number
  budgetedExpense: number
  budgetedSaving: number
  freeAmount: number
  weeklyFreeAmount: number
  openingBalance: number
  expectedClosingBalance: number
  adjustmentsTotal: number
  adjustedExpectedClosingBalance: number
  actualClosingBalance: number | null
  variance: number | null
  closed: boolean
}
