import { monthName } from '../domain/format'
import { ChevronLeft, ChevronRight } from '../navigation/icons'

export function MonthSwitcher({
  year,
  month,
  onChange,
}: {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}) {
  function go(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1) {
      m = 12
      y -= 1
    } else if (m > 12) {
      m = 1
      y += 1
    }
    onChange(y, m)
  }

  return (
    <div className="month-switcher">
      <button
        type="button"
        className="btn btn-icon"
        aria-label="Forrige måned"
        onClick={() => go(-1)}
      >
        <ChevronLeft />
      </button>
      <span className="month-switcher-label">
        {monthName(month)} {year}
      </span>
      <button type="button" className="btn btn-icon" aria-label="Næste måned" onClick={() => go(1)}>
        <ChevronRight />
      </button>
    </div>
  )
}
