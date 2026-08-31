import { describe, expect, it } from 'vitest'
import { formatDaDate, formatDkk, formatDkkSigned, monthName } from './format'

describe('17) Danish amount and date handling', () => {
  it('formats whole kroner without decimals', () => {
    expect(formatDkk(1800)).toMatch(/1\.800/)
    expect(formatDkk(1800)).toMatch(/kr/)
  })

  it('formats amounts with øre when non-zero', () => {
    expect(formatDkk(33.5)).toMatch(/33,50/)
  })

  it('signs positive and negative amounts explicitly', () => {
    expect(formatDkkSigned(550)).toMatch(/^\+/)
    expect(formatDkkSigned(-550)).toMatch(/^-/)
    expect(formatDkkSigned(0)).not.toMatch(/^[+-]/)
  })

  it('formats Danish month names', () => {
    expect(monthName(1)).toBe('januar')
    expect(monthName(12)).toBe('december')
  })

  it('formats an ISO date in Danish long form', () => {
    expect(formatDaDate('2026-08-31')).toBe('31. august 2026')
  })
})
