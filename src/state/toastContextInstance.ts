import { createContext } from 'react'

export const ToastCtx = createContext<((message: string) => void) | null>(null)
