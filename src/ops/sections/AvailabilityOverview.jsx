import React, { useEffect, useRef, useState } from 'react'
import { rotaSetStaffAvailability } from '../../rota/api.js'

// ─── Availability overview + editor (founder) ────────────────────────────────
// Staff members down the side, every day of the month across the top. Each cell
// is a toggle: tap to mark that person available / clear it. Saves per month, per
// person (debounced) via the founder-gated setStaffAvailability. Staff still set
// their own too — this is the founder's way to fill in or correct it.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const GREEN = '#34D399', RED = '#F87171', ACCENT = '#DA1B33'
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const NAME_W = 118, CELL_W = 26, ROW_H = 30
const navBtn = { width: 32, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: ACCENT, fontSize: 14, cursor: 'pointer' }

// availability array → { 'staffId|YYYY-MM': { 'YYYY-MM-DD': entry } }
function buildMap(rows) {
  const m = {}
  for (const r of rows || []) { if (r?.staff_id && r?.month) m[`${r.staff_id}|${r.month}`] = { ...(r.data || {}) } }
  return m
}

export default function AvailabilityOverview({ staff = [], availability = [], reload }) {
  const now = new Date()
  const [viewY, setViewY] = useState(now.getFullYear())
  const [viewM, setViewM] = useState(now.getMonth())
  const [avData, setAvData] = useState(() => buildMap(availability))   // optimistic local copy, keyed staffId|month
  const avRef = useRef(avData)
  const timers = useRef({})
  const [savingKeys, setSavingKeys] = useState({})

  // Re-seed from the server whenever the loaded availability changes (e.g. after reload).
  useEffect(() => { const m = buildMap(availability); setAvData(m); avRef.current = m }, [availability])
  useEffect(() => { avRef.current = avData }, [avData])
  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout) }, [])

  const rows = staff.filter(s => s.active !== false)
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const todayStr = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const shiftMonth = (delta) => { let m = viewM + delta, y = viewY; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } setViewY(y); setViewM(m) }

  const statusOf = (staffId, date) => {
    const data = avData[`${staffId}|${date.slice(0, 7)}`]
    if (!data || Object.keys(data).length === 0) return 'unset'
    return data[date] ? 'available' : 'unavailable'
  }

  // Tap a cell → toggle that person's availability for the day, debounce-save the month.
  const toggle = (staffId, date) => {
    const month = date.slice(0, 7), key = `${staffId}|${month}`
    setAvData(prev => {
      const cur = prev[key] || {}
      const next = { ...cur }
      if (next[date]) delete next[date]; else next[date] = { available: true }
      const merged = { ...prev, [key]: next }
      avRef.current = merged
      return merged
    })
    clearTimeout(timers.current[key])
    setSavingKeys(s => ({ ...s, [key]: true }))
    timers.current[key] = setTimeout(async () => {
      try { await rotaSetStaffAvailability(staffId, month, avRef.current[key] || {}) }
      catch (e) { alert(e.message || 'Could not save availability'); }
      finally { setSavingKeys(s => ({ ...s, [key]: false })); reload?.() }
    }, 550)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div className="serif" style={{ fontSize: 22, color: '#fff' }}>📅 Availability</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>Everyone's availability at a glance — <strong style={{ color: '#fff' }}>tap any cell to mark someone free or clear it</strong>. Staff can set their own too; this is your way to fill it in. Swipe across for the whole month.</div>
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
            const availCount = days.reduce((a, d) => a + (statusOf(s.id, iso(viewY, viewM, d)) === 'available' ? 1 : 0), 0)
            const anySet = days.some(d => statusOf(s.id, iso(viewY, viewM, d)) !== 'unset')
            const saving = savingKeys[`${s.id}|${iso(viewY, viewM, 1).slice(0, 7)}`]
            return (
              <div key={s.id} style={{ display: 'flex', height: ROW_H, borderBottom: ri === rows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: NAME_W, flexShrink: 0, position: 'sticky', left: 0, background: '#0A0A0A', borderRight: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, padding: '0 8px', zIndex: 1 }}>
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{first}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: saving ? ACCENT : (anySet ? GREEN : 'rgba(255,255,255,0.3)'), flexShrink: 0 }} title={saving ? 'Saving…' : (anySet ? `${availCount} days marked available` : 'Not set this month')}>{saving ? '⋯' : (anySet ? availCount : '—')}</span>
                </div>
                {days.map(d => {
                  const date = iso(viewY, viewM, d)
                  const st = statusOf(s.id, date)
                  const weekend = [0, 6].includes(new Date(viewY, viewM, d).getDay())
                  const bg = st === 'available' ? 'rgba(52,211,153,0.30)' : st === 'unavailable' ? 'rgba(248,113,113,0.22)' : (weekend ? 'rgba(255,255,255,0.02)' : 'transparent')
                  const mark = st === 'available' ? '✓' : st === 'unavailable' ? '✕' : ''
                  return (
                    <button key={d} type="button" onClick={() => toggle(s.id, date)} title={`${first} · ${date} · ${st === 'unset' ? 'not set' : st} — tap to ${st === 'available' ? 'clear' : 'mark free'}`}
                      style={{ width: CELL_W, flexShrink: 0, height: '100%', borderRight: '1px solid rgba(255,255,255,0.05)', borderTop: 'none', borderBottom: 'none', borderLeft: 'none', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: st === 'available' ? GREEN : RED, cursor: 'pointer', padding: 0 }}>{mark}</button>
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
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>· tap a cell to toggle · the number by each name = days they're free this month</span>
      </div>
    </div>
  )
}
