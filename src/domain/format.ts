const DKK_WHOLE = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
  maximumFractionDigits: 0,
})

const DKK_DECIMALS = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Whole kroner unless the amount has non-zero øre, per spec. */
export function formatDkk(amount: number): string {
  const hasDecimals = Math.round(amount * 100) % 100 !== 0
  return (hasDecimals ? DKK_DECIMALS : DKK_WHOLE).format(amount)
}

/** Signed variant: "+1.800 kr." / "-550 kr." for variance-style displays. */
export function formatDkkSigned(amount: number): string {
  const formatted = formatDkk(Math.abs(amount))
  if (amount > 0) return `+${formatted}`
  if (amount < 0) return `-${formatted}`
  return formatted
}

export const DA_MONTH_NAMES = [
  'januar',
  'februar',
  'marts',
  'april',
  'maj',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'december',
]

export const DA_MONTH_NAMES_SHORT = [
  'jan',
  'feb',
  'mar',
  'apr',
  'maj',
  'jun',
  'jul',
  'aug',
  'sep',
  'okt',
  'nov',
  'dec',
]

/** 1-12 -> "januar" */
export function monthName(month: number): string {
  return DA_MONTH_NAMES[month - 1] ?? String(month)
}

export function monthNameShort(month: number): string {
  return DA_MONTH_NAMES_SHORT[month - 1] ?? String(month)
}

/** ISO date (yyyy-mm-dd) -> "31. august 2026" */
export function formatDaDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d}. ${monthName(m)} ${y}`
}

/** Today as an ISO yyyy-mm-dd string, for date inputs. */
export function todayIso(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function nowIso(): string {
  return new Date().toISOString()
}
