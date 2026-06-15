import React from 'react'

// ─── OpsBrandHeader ──────────────────────────────────────────────────
// Shared header for every Operations sub-tool. Matches the DJ Bookings
// brand language: No Dice wordmark on the left, red No Dice eyebrow,
// black title, optional subtitle, and an optional right-hand action.
// This is the visual handshake that tells the team "yes you're inside
// the No Dice ops hub" regardless of which sub-tool they're using.
// ────────────────────────────────────────────────────────────────────

const ND_RED = '#DA1B33'
const ND_CREAM = '#F5EFE3'

export default function OpsBrandHeader({
  eyebrow,         // e.g. "Stock Costing" — small red uppercase tag
  title,           // big white title
  subtitle,        // optional long descriptive paragraph below
  action,          // optional react node, e.g. <button>Print</button>
}) {
  return (
    <div className="screen-only" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 240 }}>
          <img
            src="/nodice-wordmark.png"
            alt="No Dice"
            style={{ width: 'min(190px, 54vw)', height: 'auto', display: 'block' }}
          />
          {eyebrow && (
            <div style={{
              fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: ND_RED, fontWeight: 700,
            }}>{eyebrow}</div>
          )}
          {title && (
            <h1 style={{
              margin: 0, fontSize: 28, color: ND_CREAM, fontWeight: 600,
              letterSpacing: '0.01em', lineHeight: 1.1,
            }}>{title}</h1>
          )}
          {subtitle && (
            <p style={{
              margin: '4px 0 0', fontSize: 13, lineHeight: 1.55,
              color: 'rgba(245,239,227,0.7)', maxWidth: 720,
            }}>{subtitle}</p>
          )}
        </div>
        {action && (
          <div style={{ flexShrink: 0 }}>
            {action}
          </div>
        )}
      </div>
      <div style={{
        height: 1, background: 'linear-gradient(to right, rgba(218,27,51,0.6), rgba(218,27,51,0))',
        marginTop: 4,
      }} />
    </div>
  )
}

// ─── Print header — used in print mode by sheets that download.
// Renders the wordmark + label centred at the top of each printed page
// thanks to the print-running-element pattern in the parent's @media print.
export function OpsPrintHeader({ subtitle }) {
  return (
    <div className="print-only print-header" style={{ display: 'none' }}>
      <img src="/nodice-wordmark.png" alt="No Dice" className="print-wordmark"
        style={{ height: 28, display: 'block', margin: '0 auto' }} />
      {subtitle && (
        <p style={{ margin: '4px 0 0', fontSize: 10, textAlign: 'center', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
