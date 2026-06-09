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
const RED = '#DA1B33', LINE = 'rgba(255,255,255,0.12)'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const tones = {
  closed: { border: '1px dashed rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.5)', background: 'transparent' },
  open: { border: `1px solid ${RED}`, color: '#fff', background: 'rgba(218,27,51,0.12)' },
  pending: { border: '1px solid #FCD34D', color: '#fff', background: 'transparent' },
  confirmed: { border: '1px solid #34D399', color: '#fff', background: 'transparent' },
  'mine-pending': { border: '1px solid #FCD34D', color: '#fff', background: 'rgba(252,211,36,0.18)' },
  'mine-confirmed': { border: '1px solid #34D399', color: '#fff', background: 'rgba(52,211,153,0.18)' },
}

export default function MonthCalendar({ year, month, onPrev, onNext, canPrev = true, cellFor, onDay, selected, legend }) {
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const dateStr = iso(year, month, d)
          const info = cellFor(dateStr)
          const isSel = selected === dateStr
          const clickable = info && !info.disabled
          const t = info ? (tones[info.tone] || {}) : {}
          return (
            <button key={i} type="button" disabled={!clickable} onClick={() => clickable && onDay(dateStr)}
              style={{
                aspectRatio: '1 / 1', borderRadius: 8, fontSize: 13, fontWeight: info ? 700 : 400,
                background: isSel ? RED : (t.background || 'transparent'),
                color: isSel ? '#fff' : (info ? (t.color || '#fff') : 'rgba(255,255,255,0.22)'),
                border: isSel ? `1px solid ${RED}` : (t.border || '1px solid transparent'),
                cursor: clickable ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: 0, position: 'relative',
              }}>
              <span>{d}</span>
              {info && info.kind && <span style={{ width: 5, height: 5, borderRadius: '50%', background: info.kind === 'session' ? RED : '#34D399' }} />}
            </button>
          )
        })}
      </div>
      {legend && <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>{legend}</div>}
    </div>
  )
}
