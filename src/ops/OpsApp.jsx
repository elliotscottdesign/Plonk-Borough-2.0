import React, { useRef, useState } from 'react'
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
import ToiletLog from './sections/ToiletLog.jsx'
import Reservations from './sections/Reservations.jsx'
import Finances from './sections/Finances.jsx'
import useIsMobile from '../lib/useIsMobile.js'

// ─── No Dice Operations hub (/ops) ───────────────────────────────────────
// Internal team area, separate from the investor decks. The nav is TWO-LEVEL
// (founder's UX call, Aug 2026): three groups across the header — Operations
// (running the venue day to day), Events (everything bookable/promotable) and
// Office (paperwork + money) — with the active group's tabs on a second row.
// On phones the whole thing collapses into one ☰ menu, grouped the same way.
// Tab `key`s are stable — deep links (?tab=helpout etc. in alert emails) keep
// working regardless of which group a tab lives in.
const GROUPS = [
  {
    key: 'operations', label: 'Operations',
    tabs: [
      { key: 'operations', label: 'Operations',    Component: Operations },
      { key: 'rota',       label: 'Staff Rota',    Component: StaffRota, founderOnly: true },
      { key: 'kitchen',    label: 'Kitchen',       Component: Kitchen, founderOnly: true },
      { key: 'toilets',    label: 'Toilet Checks', Component: ToiletLog, founderOnly: true },
      { key: 'helpout',    label: 'Help Out',      Component: HelpOut },
    ],
  },
  {
    key: 'events', label: 'Events',
    tabs: [
      // Reservations first — the shift-primary view: staff open it to see what's
      // booked in today (reads live from Supabase; the nodice.bar site writes it).
      { key: 'reservations', label: 'Reservations', Component: Reservations },
      { key: 'djbookings',   label: 'DJ Bookings',  Component: DJBookings },
      { key: 'tournament',   label: 'Tournament',   Component: Tournament, founderOnly: true },
      { key: 'pingpong',     label: 'Ping Pong',    Component: PingPong, founderOnly: true },
      { key: 'worldcup',     label: 'World Cup',    Component: WorldCup },
      { key: 'keydates',     label: 'Key Dates',    Component: KeyDates, founderOnly: true },
    ],
  },
  {
    key: 'office', label: 'Office',
    tabs: [
      { key: 'reports',       label: 'Reports',       Component: Reports },
      { key: 'documentation', label: 'Documentation', Component: Documentation },
      { key: 'finances',      label: 'Finances',      Component: Finances, founderOnly: true },
    ],
  },
]

export default function OpsApp() {
  // Founder-only sections (Staff Rota, Finances…) are hidden from team-tier
  // logins (NDTEAM). Only the founder tier sets ndb_role_founder.
  const isFounder = typeof window !== 'undefined' && sessionStorage.getItem('ndb_role_founder') === '1'
  // Visible groups, each with its visible tabs; a group with nothing visible vanishes.
  const visGroups = GROUPS
    .map(g => ({ ...g, tabs: g.tabs.filter(t => !t.founderOnly || isFounder) }))
    .filter(g => g.tabs.length > 0)
  const allTabs = visGroups.flatMap(g => g.tabs)
  const groupOf = (tabKey) => visGroups.find(g => g.tabs.some(t => t.key === tabKey)) || visGroups[0]

  // Deep link (?tab=helpout) opens straight to that tab, whichever group holds it.
  const initialTab = (() => {
    const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null
    return allTabs.some(t => t.key === q) ? q : 'operations'
  })()
  const [tab, setTab] = useState(initialTab)
  const [menuOpen, setMenuOpen] = useState(false)
  const isMobile = useIsMobile()
  // Remember the last tab you were on in each group, so flipping between groups
  // brings you back where you were (per page-load; nothing persisted).
  const lastInGroup = useRef({})
  const activeGroup = groupOf(tab)
  lastInGroup.current[activeGroup.key] = tab

  const current = allTabs.find(t => t.key === tab) || allTabs[0]
  const pick = (k) => { setTab(k); setMenuOpen(false) }
  const pickGroup = (g) => {
    const remembered = lastInGroup.current[g.key]
    pick(g.tabs.some(t => t.key === remembered) ? remembered : g.tabs[0].key)
  }

  // Group pills (header) — the three big doors.
  const groupStyle = (active) => ({
    padding: isMobile ? '7px 12px' : '9px 20px', fontSize: isMobile ? 12.5 : 13.5, borderRadius: 999, cursor: 'pointer',
    background: active ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
    border: `2px solid ${active ? 'var(--gold)' : 'rgba(255,255,255,0.14)'}`,
    color: active ? '#141414' : 'var(--cream)', letterSpacing: '0.05em',
    fontWeight: active ? 700 : 500, transition: 'all 0.2s', whiteSpace: 'nowrap',
  })
  // Tab pills (second row) — the pages inside the active group.
  const tabStyle = (active) => ({
    padding: '7px 15px', fontSize: 12.5, borderRadius: 8, cursor: 'pointer',
    background: active ? 'rgba(201,168,76,0.15)' : 'transparent',
    border: `1.5px solid ${active ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
    color: active ? 'var(--gold)' : 'var(--cream)', letterSpacing: '0.04em',
    fontWeight: active ? 600 : 400, transition: 'all 0.2s', whiteSpace: 'nowrap',
  })

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--ink)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header — brand + the three group doors */}
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
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{current.label}</span>
            <span style={{ fontSize: 16, lineHeight: 1 }}>{menuOpen ? '✕' : '☰'}</span>
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {visGroups.map(g => <button key={g.key} onClick={() => pickGroup(g)} style={groupStyle(activeGroup.key === g.key)}>{g.label}</button>)}
            </div>
            <a href="/" style={{ fontSize: 11, color: 'var(--cream-dim)', letterSpacing: '0.14em', textDecoration: 'none', whiteSpace: 'nowrap' }}>← nodice.bar</a>
          </>
        )}
      </div>

      {/* Second row (desktop) — the active group's tabs. Hidden when the group has one tab. */}
      {!isMobile && activeGroup.tabs.length > 1 && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', padding: '10px max(16px, env(safe-area-inset-right)) 10px max(16px, env(safe-area-inset-left))', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: 'var(--cream-dim)', letterSpacing: '0.16em', textTransform: 'uppercase', marginRight: 4 }}>{activeGroup.label}</span>
          {activeGroup.tabs.map(t => <button key={t.key} onClick={() => pick(t.key)} style={tabStyle(tab === t.key)}>{t.label}</button>)}
        </div>
      )}

      {/* Mobile dropdown menu — the same three groups as labelled sections */}
      {isMobile && menuOpen && (
        <div style={{ background: 'var(--ink-2)', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, position: 'relative', zIndex: 30, maxHeight: '70dvh', overflowY: 'auto' }}>
          {visGroups.map(g => (
            <div key={g.key}>
              <div style={{ fontSize: 10.5, color: 'var(--gold)', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '12px 4px 6px' }}>{g.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {g.tabs.map(t => (
                  <button key={t.key} onClick={() => pick(t.key)} style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                    background: tab === t.key ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${tab === t.key ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
                    color: tab === t.key ? 'var(--gold)' : 'var(--cream)', fontSize: 14.5, fontWeight: tab === t.key ? 600 : 400,
                  }}>{t.label}</button>
                ))}
              </div>
            </div>
          ))}
          <a href="/" style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--cream-dim)', textDecoration: 'none', letterSpacing: '0.1em' }}>← back to nodice.bar</a>
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
          <current.Component />
        </div>
      </div>
    </div>
  )
}
