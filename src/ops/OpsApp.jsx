import React, { useState } from 'react'
import Operations from './sections/Operations.jsx'
import Reports from './sections/Reports.jsx'
import Documentation from './sections/Documentation.jsx'
import WorldCup from './sections/WorldCup.jsx'

// ─── No Dice Operations hub (/ops) ───────────────────────────────────────
// Internal team area, separate from the investor decks. Sections:
//   Operations    — day-to-day tools (Stock Orders live; pool nights / CRM next)
//   Reports       — weekly/monthly/yearly business read-out (roadmap)
//   Documentation — live operational docs to download / link-share (roadmap)
//   World Cup     — founder strategy planner for World Cup 2026 (moved
//                   here from its standalone /worldcup route, which
//                   collided with the customer-site /world-cup page)
const TABS = [
  { key: 'operations',    label: 'Operations',    Component: Operations },
  { key: 'reports',       label: 'Reports',       Component: Reports },
  { key: 'documentation', label: 'Documentation', Component: Documentation },
  { key: 'worldcup',      label: 'World Cup',     Component: WorldCup },
]

export default function OpsApp() {
  const [tab, setTab] = useState('operations')
  const Active = TABS.find(t => t.key === tab).Component

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, background: 'var(--ink-2)', borderBottom: '1px solid rgba(201,168,76,0.15)', flexShrink: 0, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div className="serif" style={{ fontSize: 17, color: 'var(--gold)' }}>No Dice · Operations</div>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Hackney · London Fields</div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '9px 20px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
              background: tab === t.key ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${tab === t.key ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
              color: tab === t.key ? 'var(--gold)' : 'var(--cream)', letterSpacing: '0.04em',
              fontWeight: tab === t.key ? 600 : 400, transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>
        <a href="/" style={{ fontSize: 11, color: 'var(--cream-dim)', letterSpacing: '0.14em', textDecoration: 'none' }}>← nodice.bar</a>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 64px' }}>
          <Active />
        </div>
      </div>
    </div>
  )
}
