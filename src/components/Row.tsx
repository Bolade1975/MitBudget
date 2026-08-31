import type { ReactNode } from 'react'
import { formatDkk } from '../domain/format'
import { ChevronRight } from '../navigation/icons'

export function Row({
  name,
  sub,
  amount,
  amountTone,
  inactive,
  onClick,
}: {
  name: string
  sub?: string
  amount: number
  amountTone?: 'positive' | 'negative' | 'neutral'
  inactive?: boolean
  onClick?: () => void
}) {
  const tone = amountTone ?? (amount < 0 ? 'negative' : 'neutral')
  const content = (
    <>
      <span className="row-name">
        <span className="row-name-text">{name}</span>
        {sub ? <span className="row-sub">{sub}</span> : null}
      </span>
      <span className={`row-amount ${tone !== 'neutral' ? tone : ''}`}>{formatDkk(amount)}</span>
      {onClick ? <ChevronRight className="row-chevron" /> : null}
    </>
  )
  const className = `row${inactive ? ' row-inactive' : ''}`
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    )
  }
  return <div className={className}>{content}</div>
}

export function RowGroup({ children }: { children: ReactNode }) {
  return <div className="row-group">{children}</div>
}
