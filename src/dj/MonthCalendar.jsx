import React from 'react'

// Reusable No Dice month calendar grid. Mobile-first, branded red/black.
//   year, month (0-11)         — the month shown
//   onPrev / onNext            — month nav
//   canPrev                    — disable going earlier than this month
//   cellFor(dateStr) => info|null   info = { tone, kind?, disabled? }
//       tone: closed | open | pending | confirmed | mine-pending | mine-confirmed
//   onDay(dateStr)             — tap a (clickable) day
//   selected                   — highlighted date
//   legend                     — optional node under the grid
//   rich                       — render booked days as thumbnail+detail cards
//       (admin Events calendar). cellFor may then also return
//       events: [{ image, title, time, sub, status }] — matches the public
//       events viewer at /events. Off by default (DJ portal keeps plain cells).
const RED = '#DA1B33', ORANGE = '#F97316', LINE = 'rgba(255,255,255,0.12)'   // ORANGE = Open Decks (distinct from confirmed-green)
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const tones = {
  closed: { border: '1px dashed rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.5)', background: 'transparent' },
  open: { border: `1px solid ${RED}`, color: '#fff', background: 'rgba(218,27,51,0.12)' },               // paid session, open for DJs → solid red
  'open-decks': { border: `1px solid ${ORANGE}`, color: '#fff', background: 'rgba(249,115,22,0.12)' },     // Open Decks night, open for DJs → solid orange
  // Bookable but NOT yet opened for DJs (admin only): kind-coloured + dashed.
  'closed-session': { border: `1px dashed rgba(218,27,51,0.5)`, color: 'rgba(255,255,255,0.55)', background: 'transparent' },     // paid session, not opened → dashed red
  'closed-opendecks': { border: '1px dashed rgba(249,115,22,0.55)', color: 'rgba(255,255,255,0.55)', background: 'transparent' }, // Open Decks, not opened → dashed orange
  pending: { border: '1px solid #FCD34D', color: '#fff', background: 'transparent' },
  confirmed: { border: '1px solid #34D399', color: '#fff', background: 'transparent' },
  'mine-pending': { border: '1px solid #FCD34D', color: '#fff', background: 'rgba(252,211,36,0.18)' },
  'mine-confirmed': { border: '1px solid #34D399', color: '#fff', background: 'rgba(52,211,153,0.18)' },
}

export default function MonthCalendar({ year, month, onPrev, onNext, canPrev = true, cellFor, onDay, selected, legend, rich = false }) {
  const startDow = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7   // Mon=0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7) cells.push(null)

  return (
    <div style={{ background: '#0A0A0A', border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button type="button" onClick={onPrev} disabled={!canPrev} style={{ background: 'transparent', border: 'none', color: canPrev ? RED : 'rgba(255,255,255,0.2)', fontSize: 16, cursor: canPrev ? 'pointer' : 'default', padding: '4px 12px' }}>◀</button>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{MONTHS[month]} {year}</div>
        <button type="button" onClick={onNext} style={{ background: 'transparent', border: 'none', color: RED, fontSize: 16, cursor: 'pointer', padding: '4px 12px' }}>▶</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 5 }}>
        {DOW.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{d}</div>)}
      </div>
      <div className={rich ? 'cal-rich-grid' : undefined} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const dateStr = iso(year, month, d)
          const info = cellFor(dateStr)
          const isSel = selected === dateStr
          const clickable = info && !info.disabled
          // An "open for DJs" day is coloured by kind: Open Decks → orange, paid session → red.
          const toneKey = info ? (info.tone === 'open' && info.kind === 'opendecks' ? 'open-decks' : info.tone) : null
          const t = info ? (tones[toneKey] || {}) : {}
          const evs = (rich && info && Array.isArray(info.events)) ? info.events : []

          // Multi-session day (Saturday: afternoon 4–8pm + evening 8pm–12am) → each
          // session is its own coloured box (green+thumbnail when booked, red when
          // open) so it's obvious at a glance which of the two is taken vs free.
          if (rich && info && Array.isArray(info.daySlots) && info.daySlots.length > 1 && info.daySlots.some(s => s.status !== 'closed')) {
            const sc = (st) => st === 'confirmed' ? '#34D399' : st === 'pending' ? '#FCD34D' : st === 'held' ? '#F59E0B' : st === 'open' ? RED : 'rgba(255,255,255,0.3)'
            const bg = (st) => st === 'confirmed' ? 'rgba(52,211,153,0.10)' : st === 'pending' ? 'rgba(252,211,77,0.10)' : st === 'held' ? 'rgba(245,158,11,0.10)' : st === 'open' ? 'rgba(218,27,51,0.10)' : 'transparent'
            return (
              <button key={i} type="button" className="cal-rich-cell" disabled={!clickable} onClick={() => clickable && onDay(dateStr)}
                style={{ borderRadius: 8, padding: 0, overflow: 'hidden', textAlign: 'left', background: '#000', color: '#fff', cursor: clickable ? 'pointer' : 'default', border: isSel ? `2px solid ${RED}` : '1px solid rgba(255,255,255,0.14)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{d}</span>
                  <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>2 sessions</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px 4px' }}>
                  {info.daySlots.map((s, j) => {
                    const c = sc(s.status), booked = !!s.dj
                    return (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 5, border: s.status === 'closed' ? `1px dashed ${c}` : `1px solid ${c}`, background: bg(s.status), borderRadius: 6, padding: '3px 5px', minWidth: 0 }}>
                        {booked && s.image
                          ? <img src={s.image} alt="" loading="lazy" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', objectPosition: 'center top', background: '#0a0a0a', flexShrink: 0 }} />
                          : <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />}
                        <span style={{ fontSize: 8.5, fontWeight: 700, color: RED, whiteSpace: 'nowrap' }}>{s.start}</span>
                        <span style={{ fontSize: 9, color: booked ? '#fff' : 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{s.dj || (s.status === 'open' ? 'Open' : s.status === 'closed' ? '—' : s.status)}</span>
                        {s.clash && <span title={s.clash} style={{ marginLeft: 'auto', fontSize: 10, flexShrink: 0, cursor: 'help' }}>⚽</span>}
                      </div>
                    )
                  })}
                </div>
              </button>
            )
          }

          // Rich cell: booked day → thumbnail + DJ + time + detail (public-viewer style).
          if (rich && evs.length) {
            const e0 = evs[0]
            // Border + corner dot share ONE status (highest-priority booked slot:
            // pending/held > confirmed) so they can never disagree.
            const rank = (st) => (st === 'pending' || st === 'held') ? 0 : st === 'confirmed' ? 1 : 2
            const worst = evs.reduce((a, e) => rank(e.status) < rank(a) ? e.status : a, e0.status)
            const statusColor = worst === 'confirmed' ? '#34D399' : (worst === 'pending' || worst === 'held') ? '#FCD34D' : RED
            const openCount = (info && info.openCount) || 0   // other slots that day still open for DJs
            return (
              <button key={i} type="button" className="cal-rich-cell" disabled={!clickable} onClick={() => clickable && onDay(dateStr)}
                style={{
                  borderRadius: 8, padding: 0, overflow: 'hidden', textAlign: 'left',
                  background: '#000', color: '#fff', cursor: clickable ? 'pointer' : 'default',
                  border: isSel ? `2px solid ${RED}` : `1px solid ${statusColor}`,
                  display: 'flex', flexDirection: 'column', position: 'relative',
                }}>
                <div style={{ position: 'relative', width: '100%', height: 70, background: '#0A0A0A', flexShrink: 0 }}>
                  {e0.image
                    ? <img src={e0.image} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>No art</div>}
                  <span style={{ position: 'absolute', left: 4, top: 4, background: 'rgba(0,0,0,0.78)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '0 6px', lineHeight: '16px' }}>{d}</span>
                  <div style={{ position: 'absolute', right: 4, top: 4, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                    {info.clash && <span title={info.clash} style={{ background: 'rgba(0,0,0,0.8)', fontSize: 10, borderRadius: 999, padding: '1px 5px', lineHeight: '14px', cursor: 'help' }}>⚽</span>}
                    {evs.length > 1 && <span style={{ background: RED, color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 999, padding: '1px 6px', lineHeight: '14px' }}>{evs.length}</span>}
                    {openCount > 0 && <span style={{ background: 'rgba(218,27,51,0.9)', color: '#fff', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 999, padding: '1px 6px', lineHeight: '14px' }}>{openCount > 1 ? `${openCount} open` : 'open'}</span>}
                  </div>
                  <span style={{ position: 'absolute', right: 5, bottom: 5, width: 7, height: 7, borderRadius: '50%', background: statusColor, boxShadow: '0 0 0 2px rgba(0,0,0,0.65)' }} />
                </div>
                <div className="cal-cell-text" style={{ padding: '4px 6px 6px', minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e0.title}</div>
                  {e0.time && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', color: RED, marginTop: 1 }}>{e0.time}</div>}
                  {(evs.length > 1 || e0.sub) && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{evs.length > 1 ? `+${evs.length - 1} more` : e0.sub}</div>}
                </div>
              </button>
            )
          }

          // Plain cell: number + status dot (DJ portal, and admin open/closed days).
          return (
            <button key={i} type="button" className={rich ? 'cal-rich-cell' : undefined} disabled={!clickable} onClick={() => clickable && onDay(dateStr)}
              style={{
                aspectRatio: rich ? 'auto' : '1 / 1', borderRadius: 8, fontSize: 13, fontWeight: info ? 700 : 400,
                background: isSel ? RED : (t.background || 'transparent'),
                color: isSel ? '#fff' : (info ? (t.color || '#fff') : 'rgba(255,255,255,0.22)'),
                border: isSel ? `1px solid ${RED}` : (t.border || '1px solid transparent'),
                cursor: clickable ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: 0, position: 'relative',
              }}>
              <span>{d}</span>
              {info && info.kind && (info.slots > 1
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 2 }} title="Two sessions — afternoon + evening"><span style={{ width: 4, height: 4, borderRadius: '50%', background: info.kind === 'session' ? RED : ORANGE }} /><span style={{ width: 4, height: 4, borderRadius: '50%', background: info.kind === 'session' ? RED : ORANGE }} /></span>
                : <span style={{ width: 5, height: 5, borderRadius: '50%', background: info.kind === 'session' ? RED : ORANGE }} />)}
            </button>
          )
        })}
      </div>
      {legend && <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>{legend}</div>}
    </div>
  )
}
