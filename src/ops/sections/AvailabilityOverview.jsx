import React, { useMemo, useState } from 'react'
import { availabilityIndex, availabilityStatus } from '../../rota/availability.js'

// ─── Availability overview (founder) ─────────────────────────────────────────
// A read-only sheet: staff members down the side, every day of the month across
// the top, colour-coded by each person's marked availability. Separate from the
// rota builder — this is just the "who's free when" picture at a glance.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const GREEN = '#34D399', RED = '#F87171', ACCENT = '#DA1B33'
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const NAME_W = 118, CELL_W = 26, ROW_H = 30
const navBtn = { width: 32, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: ACCENT, fontSize: 14, cursor: 'pointer' }

export default function AvailabilityOverview({ staff = [], availability = [] }) {
  const now = new Date()
  const [viewY, setViewY] = useState(now.getFullYear())
  const [viewM, setViewM] = useState(now.getMonth())
  const idx = useMemo(() => availabilityIndex(availability), [availability])
  const rows = staff.filter(s => s.active !== false)
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const todayStr = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const shiftMonth = (delta) => { let m = viewM + delta, y = viewY; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } setViewY(y); setViewM(m) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div className="serif" style={{ fontSize: 22, color: '#fff' }}>📅 Availability overview</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>Everyone's marked availability at a glance — read-only, separate from the rota builder. Swipe across to see the whole month.</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => shiftMonth(-1)} style={navBtn}>◀</button>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', minWidth: 140, textAlign: 'center' }}>{MONTHS[viewM]} {viewY}</div>
        <button onClick={() => shiftMonth(1)} style={navBtn}>▶</button>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, background: '#0A0A0A' }}>
        <div style={{ minWidth: NAME_W + days.length * CELL_W }}>
          {/* Header — day numbers */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.14)' }}>
            <div style={{ width: NAME_W, flexShrink: 0, position: 'sticky', left: 0, background: '#0A0A0A', borderRight: '1px solid rgba(255,255,255,0.14)', zIndex: 2, display: 'flex', alignItems: 'flex-end', padding: '0 8px 4px', fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Staff</div>
            {days.map(d => {
              const date = iso(viewY, viewM, d)
              const dow = new Date(viewY, viewM, d).getDay()
              const weekend = dow === 0 || dow === 6
              const isToday = date === todayStr
              return (
                <div key={d} style={{ width: CELL_W, flexShrink: 0, textAlign: 'center', padding: '3px 0', background: isToday ? 'rgba(218,27,51,0.22)' : (weekend ? 'rgba(255,255,255,0.04)' : 'transparent') }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{DOW[dow]}</div>
                  <div style={{ fontSize: 10, color: isToday ? '#fff' : 'rgba(255,255,255,0.72)', fontWeight: isToday ? 700 : 400 }}>{d}</div>
                </div>
              )
            })}
          </div>

          {rows.length === 0 && <div style={{ padding: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>No active team members yet — add them in the Team tab.</div>}

          {rows.map((s, ri) => {
            const first = (s.name || 'Unnamed').split(' ')[0]
            const availCount = days.reduce((a, d) => a + (availabilityStatus(idx, s.id, iso(viewY, viewM, d)) === 'available' ? 1 : 0), 0)
            const anySet = days.some(d => availabilityStatus(idx, s.id, iso(viewY, viewM, d)) !== 'unset')
            return (
              <div key={s.id} style={{ display: 'flex', height: ROW_H, borderBottom: ri === rows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: NAME_W, flexShrink: 0, position: 'sticky', left: 0, background: '#0A0A0A', borderRight: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, padding: '0 8px', zIndex: 1 }}>
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{first}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: anySet ? GREEN : 'rgba(255,255,255,0.3)', flexShrink: 0 }} title={anySet ? `${availCount} days marked available` : 'Not set this month'}>{anySet ? availCount : '—'}</span>
                </div>
                {days.map(d => {
                  const date = iso(viewY, viewM, d)
                  const st = availabilityStatus(idx, s.id, date)
                  const weekend = [0, 6].includes(new Date(viewY, viewM, d).getDay())
                  const bg = st === 'available' ? 'rgba(52,211,153,0.30)' : st === 'unavailable' ? 'rgba(248,113,113,0.22)' : (weekend ? 'rgba(255,255,255,0.02)' : 'transparent')
                  const mark = st === 'available' ? '✓' : st === 'unavailable' ? '✕' : ''
                  return (
                    <div key={d} title={`${first} · ${date} · ${st === 'unset' ? 'not set' : st}`} style={{ width: CELL_W, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: st === 'available' ? GREEN : RED }}>{mark}</div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
        <span><span style={{ color: GREEN, fontWeight: 700 }}>✓</span> available</span>
        <span><span style={{ color: RED, fontWeight: 700 }}>✕</span> unavailable</span>
        <span><span style={{ color: 'rgba(255,255,255,0.3)' }}>▢</span> not set</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>· the number by each name = days they've marked free this month</span>
      </div>
    </div>
  )
}
