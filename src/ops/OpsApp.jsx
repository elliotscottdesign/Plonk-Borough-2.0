import React, { useState } from 'react'
import Operations from './sections/Operations.jsx'
import DJBookings from './sections/DJBookings.jsx'
import Reports from './sections/Reports.jsx'
import Documentation from './sections/Documentation.jsx'
import WorldCup from './sections/WorldCup.jsx'
import HelpOut from './sections/HelpOut.jsx'
import StaffRota from './sections/StaffRota.jsx'
import Tournament from './sections/Tournament.jsx'
import PingPong from './sections/PingPong.jsx'
import Kitchen from './sections/Kitchen.jsx'
import KeyDates from './sections/KeyDates.jsx'
import useIsMobile from '../lib/useIsMobile.js'

// ─── No Dice Operations hub (/ops) ───────────────────────────────────────
// Internal team area, separate from the investor decks. On phones the tab row
// collapses into a ☰ menu so the links don't crash into each other / the page.
const TABS = [
  { key: 'operations',    label: 'Operations',    Component: Operations },
  { key: 'rota',          label: 'Staff Rota',    Component: StaffRota, founderOnly: true },
  { key: 'tournament',    label: 'Tournament',    Component: Tournament, founderOnly: true },
  { key: 'pingpong',      label: 'Ping Pong',     Component: PingPong, founderOnly: true },
  { key: 'kitchen',       label: 'Kitchen',       Component: Kitchen, founderOnly: true },
  { key: 'keydates',      label: 'Key Dates',     Component: KeyDates, founderOnly: true },
  { key: 'helpout',       label: 'Help Out',      Component: HelpOut },
  { key: 'djbookings',    label: 'DJ Bookings',   Component: DJBookings },
  { key: 'reports',       label: 'Reports',       Component: Reports },
  { key: 'documentation', label: 'Documentation', Component: Documentation },
  { key: 'worldcup',      label: 'World Cup',     Component: WorldCup },
]

export default function OpsApp() {
  // Founder-only sections (Staff Rota = building rotas + staff admin) are hidden
  // from team-tier logins (NDTEAM). Only 888999 sets ndb_role_founder.
  const isFounder = typeof window !== 'undefined' && sessionStorage.getItem('ndb_role_founder') === '1'
  const VISIBLE = TABS.filter(t => !t.founderOnly || isFounder)

  // Allow a deep link like /operations?tab=helpout (used in the Help Out
  // sign-up alert email) to open straight to a given tab.
  const initialTab = (() => {
    const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null
    return VISIBLE.some(t => t.key === q) ? q : 'operations'
  })()
  const [tab, setTab] = useState(initialTab)
  const [menuOpen, setMenuOpen] = useState(false)
  const isMobile = useIsMobile()
  const Active = (VISIBLE.find(t => t.key === tab) || VISIBLE[0]).Component
  const activeLabel = (VISIBLE.find(t => t.key === tab) || VISIBLE[0]).label
  const pick = (k) => { setTab(k); setMenuOpen(false) }

  const tabStyle = (active) => ({
    padding: '9px 18px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
    background: active ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
    border: `2px solid ${active ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
    color: active ? 'var(--gold)' : 'var(--cream)', letterSpacing: '0.04em',
    fontWeight: active ? 600 : 400, transition: 'all 0.2s', whiteSpace: 'nowrap',
  })

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--ink)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'env(safe-area-inset-top) max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left))', minHeight: 56, background: 'var(--ink-2)', borderBottom: '1px solid rgba(201,168,76,0.15)', flexShrink: 0, gap: 12, position: 'relative', zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
          <div className="serif" style={{ fontSize: isMobile ? 15 : 17, color: 'var(--gold)', whiteSpace: 'nowrap' }}>No Dice · Operations</div>
          {!isMobile && <div style={{ fontSize: 11, color: 'var(--cream-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Hackney · London Fields</div>}
        </div>

        {isMobile ? (
          <button onClick={() => setMenuOpen(o => !o)} aria-label="Menu" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
            background: 'rgba(201,168,76,0.12)', border: '1px solid var(--gold)', color: 'var(--gold)',
            fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', maxWidth: '60%',
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeLabel}</span>
            <span style={{ fontSize: 16, lineHeight: 1 }}>{menuOpen ? '✕' : '☰'}</span>
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {VISIBLE.map(t => <button key={t.key} onClick={() => pick(t.key)} style={tabStyle(tab === t.key)}>{t.label}</button>)}
            </div>
            <a href="/" style={{ fontSize: 11, color: 'var(--cream-dim)', letterSpacing: '0.14em', textDecoration: 'none', whiteSpace: 'nowrap' }}>← nodice.bar</a>
          </>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={{ background: 'var(--ink-2)', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, position: 'relative', zIndex: 30 }}>
          {VISIBLE.map(t => (
            <button key={t.key} onClick={() => pick(t.key)} style={{
              textAlign: 'left', padding: '13px 14px', borderRadius: 8, cursor: 'pointer',
              background: tab === t.key ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tab === t.key ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
              color: tab === t.key ? 'var(--gold)' : 'var(--cream)', fontSize: 14.5, fontWeight: tab === t.key ? 600 : 400,
            }}>{t.label}</button>
          ))}
          <a href="/" style={{ padding: '11px 14px', fontSize: 12.5, color: 'var(--cream-dim)', textDecoration: 'none', letterSpacing: '0.1em' }}>← back to nodice.bar</a>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '18px 13px 56px' : '28px 24px 64px' }}>
          {/* No Dice wordmark — brand every backend section like the DJ Bookings page.
              Skipped for tabs that already render their own wordmark: DJ Bookings has
              an inline one; Operations' sub-tools self-brand via OpsBrandHeader. */}
          {!['djbookings', 'operations'].includes(tab) && (
            <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 'min(190px, 54vw)', height: 'auto', display: 'block', marginBottom: 18 }} />
          )}
          <Active />
        </div>
      </div>
    </div>
  )
}
