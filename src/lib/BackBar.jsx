import React from 'react'

// ─── BackBar — the house "way out" control (founder rule, Aug 2026) ──────────
// NO SCREEN IS A DEAD END. Any view you can open must show a visible way back to
// where you came from. This is an ON-SCREEN control on purpose: the phone's own
// Back button can't be relied on (the app has no router — hooking history proved
// fragile), and a visible button works identically on desktop and mobile.
//
// Usage — put it as the FIRST thing inside the view you opened:
//     <BackBar onBack={() => setView('list')} label="All pool nights" />
//
// It sticks to the top of the scrolling area, so it's still reachable after a
// long scroll (a back control buried at the bottom of a long sheet is no better
// than none). `label` should name the DESTINATION, not just say "Back".
export default function BackBar({ onBack, label = 'Back', sub, right }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 10,
      margin: '-4px -2px 12px', padding: '8px 2px',
      background: 'linear-gradient(to bottom, var(--ink,#0A0A0A) 72%, transparent)',
    }}>
      <button onClick={onBack} style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 9,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.22)',
        color: 'var(--cream,#fff)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
        whiteSpace: 'nowrap', maxWidth: '100%',
      }}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>←</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </button>
      {sub && <span style={{ fontSize: 11.5, color: 'var(--cream-dim,rgba(255,255,255,0.5))', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>}
      {right && <span style={{ marginLeft: 'auto' }}>{right}</span>}
    </div>
  )
}
