// Stable IDs are required throughout (never array positions), so records
// survive reordering, merging on import, and cross-year copying.
export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID (older WebViews).
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
