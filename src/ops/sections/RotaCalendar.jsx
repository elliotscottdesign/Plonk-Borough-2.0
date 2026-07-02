import React, { useState } from 'react'
import { rotaReleaseMonth, rotaOpenDay, rotaCloseShift, rotaSetHeadcount, rotaAssign, rotaUnassign } from '../../rota/api.js'
import { shiftsForDate, fmtMin, shiftTimeLabel, shiftHours, dayName } from '../../rota/shifts.js'

// ─── Rota calendar (founder) ─────────────────────────────────────────────────
// The founder releases the fixed bar-team shift patterns onto a month, sets how
// many staff each shift needs, and assigns people. Green = full · amber = part-
// filled · red = open & empty · dashed grey = not released yet. Own calendar grid
// (not the DJ MonthCalendar) so every day can show its shift boxes.

const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33', GREY = 'rgba(255,255,255,0.28)'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

function Avatar({ name, size = 26 }) {
  const initials = (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = [...(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return <div title={name} style={{ width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `hsl(${hue} 42% 24%)`, color: '#fff', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
}

export default function RotaCalendar({ staff = [], shifts = [], claims = [], reload }) {
  const now = new Date()
  const [viewY, setViewY] = useState(now.getFullYear())
  const [viewM, setViewM] = useState(now.getMonth())
  const [selDate, setSelDate] = useState(null)
  const [busy, setBusy] = useState(false)
  const [headcount, setHeadcount] = useState(2)   // default headcount when releasing
  const [assignFor, setAssignFor] = useState(null) // shift id whose assign-picker is open

  const staffById = Object.fromEntries(staff.map(s => [s.id, s]))
  const activeStaff = staff.filter(s => s.active !== false)
  // date → shift rows (sorted by start); shift_id → claim rows.
  const shiftsByDate = {}
  for (const s of shifts) (shiftsByDate[s.date] ||= []).push(s)
  for (const arr of Object.values(shiftsByDate)) arr.sort((a, b) => (a.start_min || 0) - (b.start_min || 0))
  const claimsByShift = {}
  for (const c of claims) (claimsByShift[c.shift_id] ||= []).push(c)

  const todayStr = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const atCurrentMonth = viewY === now.getFullYear() && viewM === now.getMonth()
  const shiftMonth = (d) => { let m = viewM + d, y = viewY; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } setViewY(y); setViewM(m); setSelDate(null) }

  const act = async (fn) => { setBusy(true); try { await fn(); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const releaseMonth = () => { if (!window.confirm(`Open all bar shifts for ${MONTHS[viewM]} ${viewY}? New shifts get ${headcount} staff each. Shifts already opened keep their current staffing — change those with the Need +/− buttons.`)) return; act(() => rotaReleaseMonth(`${viewY}-${String(viewM + 1).padStart(2, '0')}`, headcount)) }
  const openDay = (date) => act(() => rotaOpenDay(date, headcount))
  const closeShift = (sh) => { const n = (claimsByShift[sh.id] || []).length; if (!window.confirm(n ? `Delete this ${sh.label} shift? ${n} person/people are on it — they'll be removed.` : 'Delete this shift?')) return; act(() => rotaCloseShift(sh.id)) }
  const bump = (sh, delta) => act(() => rotaSetHeadcount(sh.id, Math.max(1, (sh.headcount || 1) + delta)))
  const assign = (shiftId, staffId) => { setAssignFor(null); act(() => rotaAssign(shiftId, staffId)) }
  const unassign = (shiftId, staffId) => act(() => rotaUnassign(shiftId, staffId))

  // Calendar grid (weeks start Monday, UTC math — matches the rest of the app).
  const startDow = (new Date(Date.UTC(viewY, viewM, 1)).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(viewY, viewM + 1, 0)).getUTCDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7) cells.push(null)

  const boxColor = (filled, need) => filled >= need && need > 0 ? GREEN : filled > 0 ? AMBER : RED

  const selShifts = selDate ? (shiftsByDate[selDate] || []) : []
  const selPattern = selDate ? shiftsForDate(selDate) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 20, color: '#fff' }}>🗓️ Rota — release &amp; fill shifts</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Open a month of shifts, set how many staff each needs, and assign your team.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
            Staff / shift
            <input type="number" min={1} max={20} value={headcount} onChange={e => setHeadcount(Math.max(1, Math.min(20, +e.target.value || 1)))} style={{ ...inp(56), textAlign: 'center' }} />
          </label>
          <button onClick={releaseMonth} disabled={busy} style={btn('gold')}>🚀 Open {MONTHS[viewM]} shifts</button>
        </div>
      </div>

      {/* Month nav */}
      <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => shiftMonth(-1)} disabled={atCurrentMonth} style={{ background: 'transparent', border: 'none', color: atCurrentMonth ? 'rgba(255,255,255,0.2)' : RED, fontSize: 16, cursor: atCurrentMonth ? 'default' : 'pointer', padding: '4px 12px' }}>◀</button>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{MONTHS[viewM]} {viewY}</div>
          <button onClick={() => shiftMonth(1)} style={{ background: 'transparent', border: 'none', color: RED, fontSize: 16, cursor: 'pointer', padding: '4px 12px' }}>▶</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 5 }}>
          {DOW.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const dateStr = iso(viewY, viewM, d)
            const past = dateStr < todayStr
            const rows = shiftsByDate[dateStr] || []
            const pattern = shiftsForDate(dateStr)
            const isSel = selDate === dateStr
            return (
              <button key={i} type="button" disabled={past} onClick={() => setSelDate(dateStr)}
                style={{ minHeight: 62, borderRadius: 8, padding: '3px 4px 4px', textAlign: 'left', background: '#000', color: '#fff', cursor: past ? 'default' : 'pointer', opacity: past ? 0.4 : 1, border: isSel ? `2px solid ${RED}` : '1px solid rgba(255,255,255,0.14)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{d}</span>
                {rows.length === 0
                  ? pattern.map((p, j) => (
                    <div key={j} style={{ fontSize: 8, color: GREY, border: `1px dashed ${GREY}`, borderRadius: 4, padding: '1px 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label} {fmtMin(p.start)}</div>
                  ))
                  : rows.map(sh => {
                    const filled = (claimsByShift[sh.id] || []).length, need = sh.headcount || 1
                    const c = boxColor(filled, need)
                    return (
                      <div key={sh.id} style={{ fontSize: 8.5, color: '#fff', border: `1px solid ${c}`, background: `${c}22`, borderRadius: 4, padding: '1px 4px', display: 'flex', justifyContent: 'space-between', gap: 3, whiteSpace: 'nowrap' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{sh.label}</span>
                        <span style={{ fontWeight: 700, color: c }}>{filled}/{need}</span>
                      </div>
                    )
                  })}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
          <span><span style={{ color: GREEN }}>■</span> fully staffed</span>
          <span><span style={{ color: AMBER }}>■</span> part-filled</span>
          <span><span style={{ color: RED }}>■</span> open, empty</span>
          <span><span style={{ color: GREY }}>▢</span> not released yet</span>
        </div>
      </div>

      {/* Day panel */}
      {selDate && (
        <div style={{ background: '#0A0A0A', border: '1px solid rgba(218,27,51,0.35)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div className="serif" style={{ fontSize: 18, color: '#fff' }}>{dayName(selDate)} {selDate.slice(8)} {MONTHS[+selDate.slice(5, 7) - 1]}</div>
            <button onClick={() => setSelDate(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>

          {selShifts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                Not released yet. This {dayName(selDate)} runs{' '}
                {selPattern.map((p, i) => <span key={i}><strong style={{ color: '#fff' }}>{p.label} {shiftTimeLabel(p)}</strong>{i < selPattern.length - 1 ? ' + ' : ''}</span>)}.
              </div>
              <div><button onClick={() => openDay(selDate)} disabled={busy} style={btn('gold')}>Open this day (new shifts: {headcount} each)</button></div>
            </div>
          ) : selShifts.map(sh => {
            const cl = claimsByShift[sh.id] || []
            const need = sh.headcount || 1
            const full = cl.length >= need
            const available = activeStaff.filter(s => !cl.some(c => c.staff_id === s.id))   // active + not already on
            return (
              <div key={sh.id} style={{ borderLeft: `3px solid ${boxColor(cl.length, need)}`, paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{sh.label}</div>
                  <div style={{ fontSize: 12, color: RED, fontWeight: 700 }}>{shiftTimeLabel(sh)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{shiftHours(sh)}h</div>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                    <span>Need</span>
                    <button onClick={() => bump(sh, -1)} disabled={busy || need <= 1} style={stepper}>−</button>
                    <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 700, color: '#fff' }}>{need}</span>
                    <button onClick={() => bump(sh, +1)} disabled={busy} style={stepper}>+</button>
                  </div>
                  <button onClick={() => closeShift(sh)} disabled={busy} style={btn('red')}>Delete</button>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {cl.map(c => {
                    const p = staffById[c.staff_id]
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '3px 8px 3px 4px' }}>
                        <Avatar name={p?.name} />
                        <span style={{ fontSize: 12, color: '#fff' }}>{p?.name || 'Unknown'}{c.source === 'admin' ? '' : ' ·picked'}</span>
                        <button onClick={() => unassign(sh.id, c.staff_id)} disabled={busy} title="Remove" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, padding: 0 }}>✕</button>
                      </div>
                    )
                  })}
                  {cl.length === 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Nobody on yet.</span>}
                  {!full && available.length > 0 && (assignFor === sh.id
                    ? (
                      <select autoFocus value="" onChange={e => e.target.value && assign(sh.id, e.target.value)} onBlur={() => setAssignFor(null)} style={{ ...inp(180) }}>
                        <option value="">— pick someone —</option>
                        {available.map(s => <option key={s.id} value={s.id}>{s.name}{s.role ? ` · ${s.role}` : ''}</option>)}
                      </select>
                    )
                    : <button onClick={() => setAssignFor(sh.id)} disabled={busy} style={btn('ghost')}>＋ Assign</button>)}
                  {!full && available.length === 0 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Everyone active is already on — add more team members to fill it.</span>}
                  {full && <span style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>✓ Fully staffed</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: '#fff' }}>Shift patterns:</strong> Mon–Thu one open-to-close shift (2pm–12am) · Fri &amp; Sat split into Open (11am–6pm) + Close (6pm–1am) · Sun split into Open (11am–5:30pm) + Close (5:30pm–12am). Minimum shift 6 hours. Assign people yourself here, or (coming next) let staff pick released shifts from their own portal.
      </div>
    </div>
  )
}

const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: '#DA1B33', color: '#FFFFFF' }
  if (kind === 'red') return { ...base, background: 'transparent', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.18)' }
}
const stepper = { width: 24, height: 24, borderRadius: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const inp = (w) => ({ width: w, minWidth: 0, padding: '8px 10px', fontSize: 13, borderRadius: 7, background: '#000000', border: '1px solid rgba(255,255,255,0.18)', color: '#FFFFFF', outline: 'none', boxSizing: 'border-box' })
