import React, { useEffect, useRef, useState } from 'react'
import Operations from './sections/Operations.jsx'
import Bar from './sections/Bar.jsx'
import DJBookings from './sections/DJBookings.jsx'
import Reports from './sections/Reports.jsx'
import Documentation from './sections/Documentation.jsx'
import WorldCup from './sections/WorldCup.jsx'
import StaffRota from './sections/StaffRota.jsx'
import Tournament from './sections/Tournament.jsx'
import PingPong from './sections/PingPong.jsx'
import Kitchen from './sections/Kitchen.jsx'
import KeyDates from './sections/KeyDates.jsx'
import HowItWorks from './sections/HowItWorks.jsx'
import Reservations from './sections/Reservations.jsx'
import Finances from './sections/Finances.jsx'
import Receipts from './sections/Receipts.jsx'
import useIsMobile from '../lib/useIsMobile.js'

// ─── No Dice Operations hub (/ops) ───────────────────────────────────────
// Internal team area, separate from the investor decks. The nav is TWO-LEVEL
// (founder's UX call, Aug 2026): three groups across the header — Operations
// (running the venue day to day), Events (everything bookable/promotable) and
// Office (paperwork + money) — with the active group's tabs on a second row.
// On phones the whole thing collapses into one ☰ menu, grouped the same way.
// working regardless of which group a tab lives in.
const GROUPS = [
  {
    // BAR — one sheet (founder, Aug 2026): "All Stock reports perishables stock
    // sheets should come from one sheet called BAR". The new Bar page reads the
    // bar_* tables (real stock, costs, margins, orders). The eleven legacy
    // sub-tabs live on under "Old sheets" while the new system builds up its
    // first weeks of counts — they are being retired, not kept.
    key: 'bar', label: 'Bar',
    tabs: [
      { key: 'bar',        label: 'Bar',           Component: Bar },
      { key: 'operations', label: 'Old sheets',    Component: Operations, founderOnly: true },
      // The founder's system map — how every service fits together. Founder-only.
      { key: 'howitworks', label: 'How It Works',  Component: HowItWorks, founderOnly: true },
    ],
  },
  {
    key: 'kitchen', label: 'Kitchen',
    tabs: [
      { key: 'kitchen', label: 'Kitchen', Component: Kitchen, founderOnly: true },
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
      // World Cup hidden 7 Aug 2026 (tournament's over on the customer site
      // too — /worldcup redirects to /book there). Component + import kept;
      // uncomment this line to bring the tab back for the next tournament.
      // { key: 'worldcup',     label: 'World Cup',    Component: WorldCup },
      { key: 'keydates',     label: 'Key Dates',    Component: KeyDates, founderOnly: true },
    ],
  },
  {
    // The WHOLE Office group is founder-only (founder's call, Aug 2026): reports,
    // paperwork and money are senior-management — team-tier logins never see the door.
    key: 'office', label: 'Office', founderOnly: true,
    tabs: [
      { key: 'receipts',      label: 'Receipts',      Component: Receipts, founderOnly: true },
      { key: 'reports',       label: 'Reports',       Component: Reports },
      { key: 'documentation', label: 'Documentation', Component: Documentation },
      { key: 'finances',      label: 'Finances',      Component: Finances, founderOnly: true },
    ],
  },
  {
    // TEAM — its own door (founder, Aug 2026): the rota outgrew being one tab
    // inside Operations. Single tab, so no second row renders — StaffRota's own
    // sub-tabs (Team/Rota/Availability/Ai Builder/Checklists/Training/Menus/
    // Settings) are the navigation. Key stays 'rota' so ?tab=rota links live on.
    // Management (founder + Manager/Asst. Manager) — founder opened this to Rhys
    // on 13 Aug 2026. NB it shows pay rates and staff login passwords, so it is
    // gated on the person's STAFF RECORD (ndb_role_manager, set by the sign-in
    // bridge), never on the shared NDTEAM code.
    key: 'team', label: 'Team', managerOnly: true,
    tabs: [
      { key: 'rota', label: 'Team', Component: StaffRota, managerOnly: true },
    ],
  },
]

export default function OpsApp() {
  // Founder-only sections (Staff Rota, Finances…) are hidden from team-tier
  // logins (NDTEAM). Only the founder tier sets ndb_role_founder.
  const isFounder = typeof window !== 'undefined' && sessionStorage.getItem('ndb_role_founder') === '1'
  // Real management (founder, Manager, Asst. Manager) — set by the sign-in bridge
  // from their staff record, so the shared team code alone never grants it.
  const isManager = isFounder || (typeof window !== 'undefined' && sessionStorage.getItem('ndb_role_manager') === '1')
  // Visible groups, each with its visible tabs; a group with nothing visible vanishes.
  // A group-level founderOnly (Office) hides the WHOLE group from team-tier logins.
  const visGroups = GROUPS
    .map(g => ({ ...g, tabs: ((g.founderOnly && !isFounder) || (g.managerOnly && !isManager)) ? [] : g.tabs.filter(t => (!t.founderOnly || isFounder) && (!t.managerOnly || isManager)) }))
    .filter(g => g.tabs.length > 0)
  const allTabs = visGroups.flatMap(g => g.tabs)
  const groupOf = (tabKey) => visGroups.find(g => g.tabs.some(t => t.key === tabKey)) || visGroups[0]

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

  // Keep the open tab IN THE URL (?tab=djbookings). Without this, refreshing any
  // screen threw you back to the first tab, and the phone's Back button left the
  // app entirely (founder, Aug 2026). Changing tab pushes a history entry, so
  // Back now steps between tabs; refresh reopens exactly where you were.
  const putTabInUrl = (k, push) => {
    try {
      const u = new URL(window.location.href)
      u.searchParams.set('tab', k)
      window.history[push ? 'pushState' : 'replaceState']({ ndbTab: k }, '', u)
    } catch { /* non-fatal */ }
  }
  useEffect(() => { putTabInUrl(tab, false) }, [])   // stamp the URL on first paint
  useEffect(() => {
    const onPop = () => {
      const q = new URLSearchParams(window.location.search).get('tab')
      if (q && allTabs.some(t => t.key === q)) { setTab(q); setMenuOpen(false) }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pick = (k) => { if (k !== tab) putTabInUrl(k, true); setTab(k); setMenuOpen(false) }
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
          {/* The wordmark used to be repeated here on every screen, under a sticky
              header that already reads "No Dice · Operations" — and several sub-tools
              printed a THIRD one via OpsBrandHeader. On a phone that pushed the actual
              content below the fold before you'd read a single number. Branded once,
              in the header. (Founder, Aug 2026: "ugly menu headers".) */}
          <current.Component />
        </div>
      </div>
    </div>
  )
}
