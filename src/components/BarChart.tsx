import { monthNameShort } from '../domain/format'
import { formatDkk } from '../domain/format'

export function BarChart({
  values,
  labelPrefix,
}: {
  values: number[] // length 12, index 0 = January
  labelPrefix: string
}) {
  const max = Math.max(1, ...values.map((v) => Math.abs(v)))
  const width = 320
  const height = 120
  const barWidth = width / values.length - 4

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={`${labelPrefix} pr. måned`}
    >
      <line
        x1="0"
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="var(--color-border)"
        strokeWidth="1"
      />
      {values.map((v, i) => {
        const barHeight = (Math.abs(v) / max) * (height / 2 - 6)
        const x = i * (barWidth + 4) + 2
        const isNeg = v < 0
        const y = isNeg ? height / 2 : height / 2 - barHeight
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(1, barHeight)}
              rx="2"
              fill={isNeg ? 'var(--color-negative)' : 'var(--color-positive)'}
            >
              <title>
                {monthNameShort(i + 1)}: {formatDkk(v)}
              </title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={height - 2}
              fontSize="8"
              textAnchor="middle"
              fill="var(--color-text-muted)"
            >
              {monthNameShort(i + 1)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
