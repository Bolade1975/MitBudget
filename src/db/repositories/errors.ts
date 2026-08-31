// Wraps IndexedDB/Dexie failures with a Danish, user-facing message so
// screens can show a clear toast instead of silently losing a write.
export class SaveError extends Error {
  constructor(message = 'Kunne ikke gemme ændringen. Prøv igen.') {
    super(message)
    this.name = 'SaveError'
  }
}

export async function withSaveErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.error('Lagringsfejl:', err)
    throw new SaveError()
  }
}
