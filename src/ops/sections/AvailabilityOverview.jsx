import React, { useEffect, useRef, useState } from 'react'
import { rotaSetStaffAvailability } from '../../rota/api.js'

// ─── Availability overview + editor (founder) ────────────────────────────────
// Staff members down the side, every day of the month across the top. Everyone's
// available by default; each cell is a toggle: tap to mark that person OFF
// (unavailable) for the day / clear it. Saves per month, per person (debounced)
// via the founder-gated setStaffAvailability. Staff mark their own days off too —
// this is the founder's way to fill in or correct it.

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

  // Re-seed from the server whenever the loaded availability changes (e.g. after
  // reload, incl. the 20s background refresh). Two guards so a background pull is
  // safe: skip while one of our own toggles is still saving (never revert a tap
  // mid-flight), and skip no-op re-seeds so identical data doesn't clobber optimistic edits.
  useEffect(() => {
    if (Object.values(savingKeys).some(Boolean)) return
    const m = buildMap(availability)
    if (JSON.stringify(m) === JSON.stringify(avRef.current)) return
    setAvData(m); avRef.current = m
  }, [availability])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { avRef.current = avData }, [avData])
  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout) }, [])

  const rows = staff.filter(s => s.active !== false)
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const todayStr = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const shiftMonth = (delta) => { let m = viewM + delta, y = viewY; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } setViewY(y); setViewM(m) }

  // Available by default; a day is 'unavailable' only if explicitly marked off.
  const statusOf = (staffId, date) => {
    const data = avData[`${staffId}|${date.slice(0, 7)}`]
    return data && data[date] && data[date].unavailable ? 'unavailable' : 'available'
  }

  // How many people are off on a date (across every row shown).
  const offCountOn = (date) => rows.reduce((a, s) => a + (statusOf(s.id, date) === 'unavailable' ? 1 : 0), 0)

  // Tap a cell → toggle that person OFF / available for the day, debounce-save the month.
  const toggle = (staffId, date) => {
    // Day-off cap (house rule): max 2 people off per day, first come first served.
    // Staff are hard-blocked in their portal; you're the boss, so you get an override ask.
    if (statusOf(staffId, date) !== 'unavailable' && offCountOn(date) >= 2) {
      if (!window.confirm(`${offCountOn(date)} people are already off on ${date.slice(8)}/${date.slice(5, 7)} — the day-off cap is 2 (staff can't book past it themselves).\n\nOverride and mark this person off anyway?`)) return
    }
    const month = date.slice(0, 7), key = `${staffId}|${month}`
    setAvData(prev => {
      const cur = prev[key] || {}
      const next = { ...cur }
      if (next[date] && next[date].unavailable) delete next[date]; else next[date] = { unavailable: true }
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
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>Everyone's available by default — <strong style={{ color: '#fff' }}>tap any cell to mark someone OFF (can't work)</strong>, tap again to clear it. Staff mark their own days off too; this is your way to fill it in. Swipe across for the whole month.</div>
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
                <div key={d} style={{ width: CELL_W, flexShrink: 0, textAlign: 'center', padding: '3px 0', background: weekend ? 'rgba(255,255,255,0.04)' : 'transparent', boxShadow: isToday ? 'inset 0 0 0 1.5px #FFFFFF' : undefined, borderRadius: isToday ? 5 : 0 }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{DOW[dow]}</div>
                  <div style={{ fontSize: 10, color: isToday ? '#fff' : 'rgba(255,255,255,0.72)', fontWeight: isToday ? 700 : 400 }}>{d}</div>
                </div>
              )
            })}
          </div>

          {rows.length === 0 && <div style={{ padding: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>No active team members yet — add them in the Team tab.</div>}

          {rows.map((s, ri) => {
            const first = (s.name || 'Unnamed').split(' ')[0]
            const offCount = days.reduce((a, d) => a + (statusOf(s.id, iso(viewY, viewM, d)) === 'unavailable' ? 1 : 0), 0)
            const saving = savingKeys[`${s.id}|${iso(viewY, viewM, 1).slice(0, 7)}`]
            return (
              <div key={s.id} style={{ display: 'flex', height: ROW_H, borderBottom: ri === rows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: NAME_W, flexShrink: 0, position: 'sticky', left: 0, background: '#0A0A0A', borderRight: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, padding: '0 8px', zIndex: 1 }}>
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{first}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: saving ? ACCENT : (offCount > 0 ? RED : 'rgba(255,255,255,0.3)'), flexShrink: 0 }} title={saving ? 'Saving…' : (offCount > 0 ? `${offCount} days off this month` : 'Available all month')}>{saving ? '⋯' : (offCount > 0 ? offCount : '—')}</span>
                </div>
                {days.map(d => {
                  const date = iso(viewY, viewM, d)
                  const st = statusOf(s.id, date)
                  const off = st === 'unavailable'
                  const weekend = [0, 6].includes(new Date(viewY, viewM, d).getDay())
                  const bg = off ? 'rgba(248,113,113,0.28)' : (weekend ? 'rgba(255,255,255,0.02)' : 'transparent')
                  return (
                    <button key={d} type="button" onClick={() => toggle(s.id, date)} title={`${first} · ${date} · ${off ? 'off (unavailable)' : 'available'} — tap to ${off ? 'clear (available)' : 'mark off'}`}
                      style={{ width: CELL_W, flexShrink: 0, height: '100%', borderRight: '1px solid rgba(255,255,255,0.05)', borderTop: 'none', borderBottom: 'none', borderLeft: 'none', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: RED, cursor: 'pointer', padding: 0 }}>{off ? '✕' : ''}</button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
        <span><span style={{ color: RED, fontWeight: 700 }}>✕</span> off (can't work)</span>
        <span><span style={{ color: 'rgba(255,255,255,0.3)' }}>▢</span> available (default)</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>· tap a cell to toggle · the number by each name = days they're OFF this month</span>
      </div>
    </div>
  )
}
