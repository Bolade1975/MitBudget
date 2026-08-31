import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastCtx } from './toastContextInstance'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setMessage(msg)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(null), 4000)
  }, [])

  return (
    <ToastCtx.Provider value={showToast}>
      {children}
      {message ? (
        <div className="toast" role="alert">
          {message}
        </div>
      ) : null}
    </ToastCtx.Provider>
  )
}
