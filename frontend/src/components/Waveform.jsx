import { useMemo } from 'react'

const BASE_HEIGHTS = Array.from({ length: 56 }, (_, index) => {
  const wave = Math.abs(Math.sin(index * 0.72) * 0.55 + Math.sin(index * 0.21) * 0.45)
  return 0.18 + wave * 0.82
})

export default function Waveform({ level = 0, active = false, tone = 'teal', bars = 56 }) {
  const heights = useMemo(() => BASE_HEIGHTS.slice(0, bars), [bars])
  const amplitude = active ? Math.max(0.08, Math.min(1, level || 0.12)) : 0.05

  return (
    <div className={`waveform waveform--${tone}`} aria-hidden="true">
      {heights.map((base, index) => (
        <span
          key={index}
          style={{ height: `${5 + base * amplitude * 74}px` }}
        />
      ))}
    </div>
  )
}
