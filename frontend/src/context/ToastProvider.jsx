import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import ToastViewport from '../components/ToastViewport'
import { ToastContext } from './toast-context'

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const sequence = useRef(0)
  const timers = useRef(new Map())

  const dismissToast = useCallback((id) => {
    const timer = timers.current.get(id)

    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }

    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    ({ title, description, tone = 'info', duration = 5200 }) => {
      const id = ++sequence.current

      setToasts((current) => [
        ...current.slice(-3),
        { id, title, description, tone },
      ])

      const timer = window.setTimeout(() => dismissToast(id), duration)
      timers.current.set(id, timer)

      return id
    },
    [dismissToast],
  )

  useEffect(() => {
    const activeTimers = timers.current

    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  const value = useMemo(
    () => ({ pushToast, dismissToast }),
    [pushToast, dismissToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}
