// All amounts are rounded to 2 decimals internally to avoid floating-point
// drift accumulating across many additions in the balance chain.
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((total, v) => total + v, 0))
}
