import React, { useState, useMemo } from 'react'
import {
  TOURNAMENT, COMMUNITIES, LICENSING, PACKAGES, SCHEDULE, SLOTS,
  packageById, intensityColor, intensityLabel,
} from './data.js'

// World Cup 2026 founder-only planning page. Served at /worldcup with the
// 888999 gate (App.jsx restricts to plonkAccess). Standalone — does not
// share state with the investor deck or lock contexts.

const INK     = '#0A0A0F'
const INK_2   = '#13131A'
const INK_3   = '#1C1C27'
const GOLD    = '#C9A84C'
const GOLD_D  = '#8A6E2F'
const CREAM   = '#F5F0E8'
const CREAM_D = '#B8B0A0'
const TEAL    = '#2DD4BF'

// ─── flagify ─────────────────────────────────────────────────────────
// Walk a string and prepend a country flag emoji wherever a known
// nation / nationality term appears. Returns either the original string
// (no matches) or a React fragment of mixed strings + <span>s. Used to
// make community focus obvious at a glance across the planning sheet.
//
// Skips insertion if a flag emoji already appears within the 6 chars
// before the match — so data fields that already include a flag (e.g.
// "🏴 England — sell-out target") don't double up.
// Home-nations use subdivision (ZWJ) flag sequences — these render as the
// proper St George's Cross / Saltire / Y Ddraig Goch on iOS, macOS, Android
// and Chromium-family browsers. On the few platforms that don't support
// them (older Windows, some Linux fonts) they fall back to a plain black
// flag — acceptable.
const ENG_FLAG = '🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}'
const SCT_FLAG = '🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}'
const WLS_FLAG = '🏴\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}'

const COUNTRY_FLAGS = {
  England:    ENG_FLAG,
  English:    ENG_FLAG,
  Brazil:     '🇧🇷',
  Brazilian:  '🇧🇷',
  Brazilians: '🇧🇷',
  Spain:      '🇪🇸',
  Spanish:    '🇪🇸',
  Australia:  '🇦🇺',
  Australian: '🇦🇺',
  Australians:'🇦🇺',
  Aussie:     '🇦🇺',
  Aussies:    '🇦🇺',
  Matildas:   '🇦🇺',
  Mexico:     '🇲🇽',
  Mexican:    '🇲🇽',
  USA:        '🇺🇸',
  America:    '🇺🇸',
  American:   '🇺🇸',
  Canada:     '🇨🇦',
  Canadian:   '🇨🇦',
  UK:         '🇬🇧',
  British:    '🇬🇧',
  Britain:    '🇬🇧',
  Wales:      WLS_FLAG,
  Welsh:      WLS_FLAG,
  Scotland:   SCT_FLAG,
  Scottish:   SCT_FLAG,
  Ireland:    '🇮🇪',
  Irish:      '🇮🇪',
}
const FLAG_NAMES = Object.keys(COUNTRY_FLAGS).sort((a, b) => b.length - a.length)
const FLAG_VALUES = Object.values(COUNTRY_FLAGS)

function flagify(text) {
  if (text == null) return text
  if (typeof text !== 'string') return text
  if (!text) return text
  const rx = new RegExp(`\\b(${FLAG_NAMES.join('|')})\\b`, 'gi')
  const parts = []
  let lastIdx = 0
  let m
  let key = 0
  while ((m = rx.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index))
    const canonical = FLAG_NAMES.find(n => n.toLowerCase() === m[0].toLowerCase())
    const flag = COUNTRY_FLAGS[canonical]
    const lookbehind = text.slice(Math.max(0, m.index - 8), m.index)
    // A bare 🏴 (no ZWJ tags) is treated as "already flagged" too so
    // legacy source strings that prefix England rows with plain 🏴
    // don't end up double-tagged after flagify runs.
    const alreadyFlagged = lookbehind.includes('🏴') ||
      FLAG_VALUES.some(f => lookbehind.includes(f))
    if (alreadyFlagged) {
      parts.push(m[0])
    } else {
      parts.push(
        <span key={`f${key++}`} style={{ whiteSpace: 'nowrap' }}>{flag} {m[0]}</span>
      )
    }
    lastIdx = m.index + m[0].length
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  if (parts.length === 0) return text
  return <>{parts}</>
}

function Section({ title, kicker, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section style={{ marginBottom: 32 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          padding: '12px 0', background: 'transparent', border: 'none',
          borderBottom: `1px solid ${GOLD_D}`, color: CREAM, cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div>
          {kicker && <div style={{ fontSize: 10, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>{kicker}</div>}
          <div className="serif" style={{ fontSize: 26, color: GOLD }}>{title}</div>
        </div>
        <div style={{ fontSize: 18, color: GOLD_D }}>{open ? '−' : '+'}</div>
      </button>
      {open && <div style={{ paddingTop: 18 }}>{children}</div>}
    </section>
  )
}

function StatusPill({ status }) {
  const map = {
    'must-have': { bg: 'rgba(229,57,53,0.15)', fg: '#FF6B68', label: 'MUST HAVE' },
    'check':     { bg: 'rgba(201,168,76,0.15)', fg: GOLD, label: 'CHECK' },
    'file-now':  { bg: 'rgba(229,57,53,0.15)', fg: '#FF6B68', label: 'FILE NOW' },
    'standard':  { bg: 'rgba(45,212,191,0.15)', fg: TEAL, label: 'STANDARD' },
  }
  const c = map[status] || map.check
  return (
    <span style={{
      fontSize: 10, letterSpacing: '0.12em', padding: '3px 8px', borderRadius: 4,
      background: c.bg, color: c.fg, fontWeight: 600, whiteSpace: 'nowrap',
    }}>{c.label}</span>
  )
}

function LicensingRow({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0', background: 'transparent', border: 'none', color: CREAM, cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: GOLD_D, fontSize: 13, width: 14 }}>{open ? '−' : '+'}</span>
          <span style={{ fontSize: 15 }}>{item.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: CREAM_D }}>{item.cost}</span>
          <StatusPill status={item.status} />
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 0 16px 26px', fontSize: 14, color: CREAM_D, lineHeight: 1.55 }}>
          <p style={{ marginBottom: 10 }}>{flagify(item.detail)}</p>
          <p style={{ color: GOLD }}><strong style={{ color: GOLD }}>Action:</strong> {flagify(item.action)}</p>
        </div>
      )}
    </div>
  )
}

function PackageCard({ p }) {
  return (
    <div style={{
      background: INK_2, border: '1px solid rgba(201,168,76,0.18)', borderRadius: 10,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="serif" style={{ fontSize: 18, color: GOLD }}>{p.name}</div>
        <div style={{ fontSize: 16, color: CREAM }}>{p.price}</div>
      </div>
      <div style={{ fontSize: 11, color: CREAM_D, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        For: {flagify(p.forMatch)} · Covers: {p.covers}
      </div>
      <div style={{ fontSize: 13, color: CREAM_D, lineHeight: 1.5 }}>{flagify(p.includes)}</div>
    </div>
  )
}

function CommunityCard({ c }) {
  return (
    <div style={{
      background: INK_2, border: `1px solid ${c.sellOut ? GOLD_D : 'rgba(45,212,191,0.25)'}`,
      borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24 }}>{c.flag}</span>
        <div className="serif" style={{ fontSize: 18, color: c.sellOut ? GOLD : TEAL }}>{c.name}</div>
        {c.sellOut && <span style={{ fontSize: 9, letterSpacing: '0.14em', padding: '2px 6px', background: 'rgba(201,168,76,0.15)', color: GOLD, borderRadius: 3 }}>SELL-OUT TARGET</span>}
      </div>
      <Row label="Hook" value={flagify(c.hook)} />
      <Row label="Drinks" value={flagify(c.drinks)} />
      <Row label="Food" value={flagify(c.food)} />
      <Row label="Package" value={flagify(c.package)} />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: GOLD_D, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: CREAM, lineHeight: 1.5 }}>{value}</div>
    </div>
  )
}

function DayRow({ day }) {
  const [open, setOpen] = useState(false)
  const color = intensityColor(day.intensity)
  const label = intensityLabel(day.intensity)
  const isRest = day.intensity === 'rest'
  const matchCount = day.matches?.length || 0
  const dateObj = new Date(day.date + 'T12:00:00Z')
  const dayNum = dateObj.getUTCDate()
  const monthShort = dateObj.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })

  return (
    <div style={{
      borderLeft: `3px solid ${color}`, background: open ? INK_2 : 'transparent',
      borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'grid', gridTemplateColumns: '70px 1fr 110px 90px 28px',
          gap: 16, alignItems: 'center', padding: '14px 14px 14px 16px',
          background: 'transparent', border: 'none', color: CREAM, cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div>
          <div className="serif" style={{ fontSize: 22, color: isRest ? CREAM_D : GOLD, lineHeight: 1 }}>{dayNum}</div>
          <div style={{ fontSize: 9, color: CREAM_D, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>{monthShort} · {day.weekday.slice(0,3)}</div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: CREAM, marginBottom: 3 }}>{flagify(day.phase)}</div>
          <div style={{ fontSize: 11, color: CREAM_D }}>
            {isRest
              ? '— no matches'
              : <>{matchCount} match{matchCount === 1 ? '' : 'es'} · {flagify(day.community || '—')}</>}
          </div>
        </div>
        <div style={{ fontSize: 10, color, letterSpacing: '0.14em', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 10, color: day.ten?.required ? '#FF6B68' : CREAM_D, letterSpacing: '0.08em' }}>
          {day.ten?.required ? 'TEN NEEDED' : 'No TEN'}
        </div>
        <div style={{ fontSize: 14, color: GOLD_D }}>{open ? '−' : '+'}</div>
      </button>

      {open && (
        <div style={{ padding: '0 16px 20px 16px', display: 'grid', gap: 16 }}>
          {matchCount > 0 && (
            <div>
              <div style={{ fontSize: 10, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>Matches</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {day.matches.map((m, i) => (
                  <div key={i} style={{ background: INK_3, borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontSize: 13, color: CREAM }}>{flagify(m.fixture)}</div>
                      <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.08em' }}>{SLOTS[m.slot] || m.slot}</div>
                    </div>
                    {m.notes && <div style={{ fontSize: 11, color: CREAM_D, marginTop: 4, lineHeight: 1.5 }}>{flagify(m.notes)}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <Row label="TEN" value={
              day.ten?.required
                ? <><span style={{ color: '#FF6B68', fontWeight: 600 }}>YES · {day.ten.cost}</span><br/><span style={{ color: CREAM_D }}>{flagify(day.ten.reason)}</span></>
                : <span style={{ color: CREAM_D }}>Not required. {flagify(day.ten?.reason)}</span>
            } />
            <Row label="Staff" value={
              <>
                <span style={{ color: CREAM }}>Bar {day.staff.bar} · Floor {day.staff.floor} · Door {day.staff.door}</span><br/>
                <span style={{ color: CREAM_D, fontSize: 12 }}>{flagify(day.staff.notes)}</span>
              </>
            } />
            <Row label="Drinks pairing" value={flagify(day.drinks)} />
            <Row label="Community" value={flagify(day.community || '—')} />
            <Row label="Regular events" value={flagify(day.regulars || '—')} />
            <Row label="Packages active" value={flagify(
              (day.packages || []).map(pid => {
                const p = packageById(pid)
                return p ? p.name : pid
              }).join(' · ') || '—'
            )} />
          </div>

          {day.actions && day.actions.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>Actions</div>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {day.actions.map((a, i) => (
                  <li key={i} style={{ fontSize: 13, color: CREAM_D, lineHeight: 1.6 }}>{flagify(a)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Top-of-page metrics + filter ────────────────────────────────────
function Summary() {
  const stats = useMemo(() => {
    const tens = SCHEDULE.filter(d => d.ten?.required).length
    const sellouts = SCHEDULE.filter(d => d.intensity === 'sellout').length
    const matchDays = SCHEDULE.filter(d => d.intensity !== 'rest').length
    return { tens, sellouts, matchDays }
  }, [])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
      <Stat label="Tournament window" value={`${formatDate(TOURNAMENT.start)} → ${formatDate(TOURNAMENT.end)}`} />
      <Stat label="Match days" value={stats.matchDays} />
      <Stat label="Sell-out targets" value={stats.sellouts} accent={GOLD} />
      <Stat label="TENs to file" value={stats.tens} accent="#FF6B68" />
      <Stat label="Tables" value={`${TOURNAMENT.tables} · ~${TOURNAMENT.estCovers} covers`} />
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ background: INK_2, border: '1px solid rgba(201,168,76,0.18)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 9, color: CREAM_D, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div className="serif" style={{ fontSize: 20, color: accent || CREAM, lineHeight: 1.2 }}>{value}</div>
    </div>
  )
}

function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00Z')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

// ─── Tabs ────────────────────────────────────────────────────────────
// Five top-of-page tabs — replaces what was previously a single long
// scroll with five stacked accordion sections. Each tab shows the
// matching section's content; Summary stays visible above the tab strip
// so the planning dashboard is always one glance away.
const PAGE_TABS = [
  { id: 'strategy',    kicker: '01', label: 'Strategy',    title: 'Strategy at a glance' },
  { id: 'licensing',   kicker: '02', label: 'Licensing',   title: 'Licensing & permissions' },
  { id: 'communities', kicker: '03', label: 'Communities', title: 'Community nights' },
  { id: 'packages',    kicker: '04', label: 'Packages',    title: 'Package menu' },
  { id: 'calendar',    kicker: '05', label: 'Calendar',    title: 'Tournament calendar' },
]

function TabStrip({ active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 2, marginBottom: 28, overflowX: 'auto',
      borderBottom: `1px solid ${GOLD_D}`,
    }}>
      {PAGE_TABS.map(t => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: '14px 22px', background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? GOLD : 'transparent'}`,
              color: isActive ? GOLD : CREAM_D, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 4, marginBottom: -1, whiteSpace: 'nowrap',
              fontFamily: 'inherit',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
            }}
          >
            <span style={{ fontSize: 9, letterSpacing: '0.18em', opacity: 0.75 }}>{t.kicker}</span>
            <span style={{ fontSize: 13, letterSpacing: '0.08em', fontWeight: isActive ? 600 : 400 }}>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function TabHeading({ kicker, title }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 10, color: GOLD, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 4 }}>{kicker}</div>
      <div className="serif" style={{ fontSize: 30, color: GOLD, lineHeight: 1.1 }}>{title}</div>
      <div className="gold-rule" style={{ marginTop: 14 }} />
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────
export default function WorldCupPage() {
  const [tab, setTab] = useState('strategy')
  const [filter, setFilter] = useState('all')
  const filtered = useMemo(() => {
    if (filter === 'all') return SCHEDULE
    if (filter === 'sellout') return SCHEDULE.filter(d => d.intensity === 'sellout')
    if (filter === 'ten') return SCHEDULE.filter(d => d.ten?.required)
    if (filter === 'match') return SCHEDULE.filter(d => d.intensity !== 'rest')
    if (filter === 'england') return SCHEDULE.filter(d =>
      (d.community || '').includes('England') ||
      (d.matches || []).some(m => /ENGLAND/i.test(m.fixture))
    )
    if (filter === 'brazil') return SCHEDULE.filter(d =>
      (d.community || '').includes('Brazil') ||
      (d.matches || []).some(m => /Brazil/i.test(m.fixture))
    )
    return SCHEDULE
  }, [filter])

  return (
    <div style={{ minHeight: '100vh', background: INK, color: CREAM, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${GOLD_D}`, padding: '20px 32px', background: INK_2 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: GOLD, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 4 }}>No Dice Borough · Planning</div>
            <div className="serif" style={{ fontSize: 36, color: GOLD, lineHeight: 1 }}>World Cup 2026</div>
            <div style={{ fontSize: 13, color: CREAM_D, marginTop: 6 }}>{flagify(TOURNAMENT.host)} · 11 Jun – 19 Jul 2026 · {TOURNAMENT.teams} teams</div>
          </div>
          <a href="/" style={{ fontSize: 11, color: CREAM_D, letterSpacing: '0.14em', textDecoration: 'none' }}>← back to nodice.bar</a>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px' }}>

        <Summary />

        <TabStrip active={tab} onChange={setTab} />

        {tab === 'strategy' && (
          <>
            <TabHeading kicker="01" title="Strategy at a glance" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <Row label="Time-zone gift" value={flagify("Host = USA / Canada / Mexico. UK gets evening kick-offs. Three slots: early (17:00–18:00), prime (20:00–21:00), late (23:00–00:00), graveyard (02:00+).")} />
              <Row label="Free-to-air advantage" value={flagify("BBC + ITV share UK rights. NO Sky / TNT subscription needed. Budget that saving on screens, sound, decor.")} />
              <Row label="Tournament arc" value={flagify("Group stage builds awareness. Knockouts peak. Treat every England game as a ticketed event, not a booking.")} />
              <Row label="Communities" value={`${ENG_FLAG} England (sell-out target every match) · 🇧🇷 Brazilian (Borough/Bermondsey draw) · 🇪🇸 Spanish · 🇦🇺 Australian (late-night)`} />
              <Row label="Booking model" value={flagify("Pre-paid deposits only for England + knockouts. £25/head minimum spend on standard tables. Walk-in standing-room £10 door on sell-outs. Bookings via OWN system (not Design My Night).")} />
              <Row label="Capacity" value={flagify("10 tables × ~6 covers = 60 seated. Add ~30 standing for England / knockout overflow if SIA can manage the door. Hard cap defined by fire safety.")} />
            </div>
          </>
        )}

        {tab === 'licensing' && (
          <>
            <TabHeading kicker="02" title="Licensing & permissions" />
            <div style={{ background: INK_2, borderRadius: 10, padding: '0 18px' }}>
              {LICENSING.map(item => <LicensingRow key={item.id} item={item} />)}
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: CREAM_D, lineHeight: 1.6 }}>
              <strong style={{ color: GOLD }}>TEN summary:</strong> ~{SCHEDULE.filter(d => d.ten?.required).length} TENs needed across the tournament at £21 each = ~£{SCHEDULE.filter(d => d.ten?.required).length * 21} total. Well below the 15-per-year statutory cap. File the batch by end of May 2026.
            </div>
          </>
        )}

        {tab === 'communities' && (
          <>
            <TabHeading kicker="03" title="Community nights" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {COMMUNITIES.map(c => <CommunityCard key={c.id} c={c} />)}
            </div>
          </>
        )}

        {tab === 'packages' && (
          <>
            <TabHeading kicker="04" title="Package menu" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {PACKAGES.map(p => <PackageCard key={p.id} p={p} />)}
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: CREAM_D, lineHeight: 1.6 }}>
              <strong style={{ color: GOLD }}>Deposit rules:</strong> 100% up-front for {flagify('England')} + knockouts. Non-refundable BUT transferable to another match if the team is eliminated before the booked date. Standard tables: 50% deposit, balance against minimum spend. Captures email at booking — future-events list.
            </div>
          </>
        )}

        {tab === 'calendar' && (
          <>
            <TabHeading kicker="05" title="Tournament calendar" />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All dates' },
                { id: 'match', label: 'Match days only' },
                { id: 'england', label: `${ENG_FLAG} England` },
                { id: 'brazil', label: '🇧🇷 Brazil' },
                { id: 'sellout', label: 'Sell-out targets' },
                { id: 'ten', label: 'TEN required' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  style={{
                    padding: '8px 14px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
                    background: filter === opt.id ? 'rgba(201,168,76,0.15)' : 'transparent',
                    border: `1px solid ${filter === opt.id ? GOLD : 'rgba(255,255,255,0.15)'}`,
                    color: filter === opt.id ? GOLD : CREAM_D,
                    letterSpacing: '0.1em',
                  }}
                >{opt.label}</button>
              ))}
            </div>
            <div style={{ background: INK_2, borderRadius: 10, overflow: 'hidden' }}>
              {filtered.map(day => <DayRow key={day.date} day={day} />)}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: CREAM_D, lineHeight: 1.6 }}>
              Time slots: <strong style={{ color: CREAM }}>early</strong> {SLOTS.early} · <strong style={{ color: CREAM }}>prime</strong> {SLOTS.prime} · <strong style={{ color: CREAM }}>late</strong> {SLOTS.late} · <strong style={{ color: CREAM }}>graveyard</strong> {SLOTS.graveyard}. All times approximate — confirm against final FIFA schedule.
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ paddingTop: 24, marginTop: 24, borderTop: `1px solid ${GOLD_D}`, fontSize: 11, color: CREAM_D, lineHeight: 1.6 }}>
          <p>Page generated 2026-05-22. Fixture details marked TBC need confirming against the official FIFA / BBC Sport schedule before printing customer-facing materials. {flagify('England')} fixtures + likely knockout dates are placed on the most probable slots — adjust as the bracket fills in.</p>
          <p style={{ marginTop: 6 }}>Founder-only view. URL: nodice.bar/worldcup · Access code: 888999.</p>
        </div>
      </div>
    </div>
  )
}
