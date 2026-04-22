import React from 'react'

// Small unobtrusive reset-to-default button, used next to every slider value display.
// Pass `onClick` (usually () => setter(defaultValue)) and optional `title`.
export default function ResetBtn({ onClick, title = 'Reset to default' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 4,
        color: '#9CA3AF',
        cursor: 'pointer',
        fontSize: 11,
        lineHeight: 1,
        padding: '2px 6px',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
        e.currentTarget.style.color = 'var(--gold)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
        e.currentTarget.style.color = '#9CA3AF'
      }}
    >
      ↺
    </button>
  )
}
