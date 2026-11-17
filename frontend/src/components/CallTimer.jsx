import { useEffect, useState } from 'react'

import { elapsedLabel } from '../utils/format'

export default function CallTimer({ startedAt }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!startedAt) return undefined

    const interval = window.setInterval(() => setTick((tick) => tick + 1), 1000)

    return () => window.clearInterval(interval)
  }, [startedAt])

  return <span className="call-timer">{elapsedLabel(startedAt)}</span>
}
