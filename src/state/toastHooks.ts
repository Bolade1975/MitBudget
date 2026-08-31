import { useCallback, useContext } from 'react'
import { ToastCtx } from './toastContextInstance'

export function useToast(): (message: string) => void {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

/** Wraps an async action, showing a Danish toast if it throws (e.g. a save error). */
export function useSafeAction(): <T>(fn: () => Promise<T>) => Promise<T | undefined> {
  const showToast = useToast()
  return useCallback(
    async <T>(fn: () => Promise<T>) => {
      try {
        return await fn()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Der skete en fejl. Prøv igen.')
        return undefined
      }
    },
    [showToast],
  )
}
