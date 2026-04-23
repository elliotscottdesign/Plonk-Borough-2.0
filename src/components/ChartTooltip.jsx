import React, { useState } from 'react'

// Lightweight chart tooltip system.
//
// Usage inside any chart component:
//
//   const { containerProps, segmentProps, overlay } = useChartTooltip()
//   return (
//     <div {...containerProps}>
//       {data.map(d => <rect {...segmentProps(`${d.label}: £${d.value}`)} />)}
//       {overlay}
//     </div>
//   )
//
// One tooltip state lives at the chart level, so each segment just registers
// text on hover — no per-segment React state, no per-segment listeners churn.

export function useChartTooltip() {
  const [tip, setTip] = useState(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const containerProps = {
    onMouseMove: e => setPos({ x: e.clientX, y: e.clientY }),
    onMouseLeave: () => setTip(null),
  }

  const segmentProps = (tipText) => ({
    onMouseEnter: () => setTip(tipText),
    onMouseLeave: () => setTip(null),
  })

  const overlay = tip
    ? (
      <div
        style={{
          position: 'fixed',
          left: pos.x + 14,
          top: pos.y + 14,
          background: 'var(--ink-3)',
          border: '1px solid rgba(201,168,76,0.45)',
          color: 'var(--cream)',
          padding: '8px 12px',
          fontSize: 11,
          borderRadius: 6,
          zIndex: 1000,
          pointerEvents: 'none',
          whiteSpace: 'pre-line',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          lineHeight: 1.55,
          maxWidth: 300,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {tip}
      </div>
    )
    : null

  return { containerProps, segmentProps, overlay }
}
