import React, { useState } from 'react'
import { rotaReleaseMonth, rotaOpenDay, rotaAddShift, rotaEditShift, rotaCloseShift, rotaSetHeadcount, rotaAssign, rotaUnassign, rotaSetShiftReq } from '../../rota/api.js'
import { shiftsForDate, fmtMin, shiftTimeLabel, shiftHours, dayName, hhmmToMin, minToHHMM } from '../../rota/shifts.js'
import { ABILITIES, RANKS } from '../../rota/roles.js'

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

// A progress ring (clock/gauge) showing hours-assigned vs target for one staffer.
function Ring({ pct, color, hasTarget, size = 44 }) {
  const r = (size - 7) / 2, c = 2 * Math.PI * r
  const frac = hasTarget ? Math.min(1, Math.max(0, pct)) : 0
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{hasTarget ? `${Math.round(pct * 100)}%` : '–'}</div>
    </div>
  )
}

// One person's line in the week overview: ring + name/type + hours-vs-target + cost.
function WeekRow({ row }) {
  const { s, hrs, target, cost, rate } = row
  const pct = target ? hrs / target : 0
  const color = target == null ? 'rgba(255,255,255,0.28)' : hrs > target + 0.05 ? '#60A5FA' : hrs >= target ? GREEN : hrs > 0 ? AMBER : RED
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Ring pct={pct} color={color} hasTarget={target != null} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {s.name || 'Unnamed'}{s.employment_type ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> · {s.employment_type}</span> : null}
        </div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
          <strong style={{ color: '#fff' }}>{hrs}h</strong>{target != null ? ` / ${target}h target` : ' · no target set'}
          {target != null && hrs > target + 0.05 && <span style={{ color: '#60A5FA' }}> · +{Math.round((hrs - target) * 10) / 10}h over</span>}
          {target != null && hrs < target - 0.05 && <span style={{ color: AMBER }}> · {Math.round((target - hrs) * 10) / 10}h short</span>}
          {target != null && hrs >= target - 0.05 && hrs <= target + 0.05 && <span style={{ color: GREEN }}> · on target</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{cost == null ? '—' : gbp(cost)}</div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>{rate == null ? 'no rate' : `£${rate}/h`}</div>
      </div>
    </div>
  )
}

export default function RotaCalendar({ staff = [], shifts = [], claims = [], reload }) {
  const now = new Date()
  const [viewY, setViewY] = useState(now.getFullYear())
  const [viewM, setViewM] = useState(now.getMonth())
  const [selDate, setSelDate] = useState(null)
  const [busy, setBusy] = useState(false)
  const [headcount, setHeadcount] = useState(2)   // default headcount when releasing
  const [assignFor, setAssignFor] = useState(null) // shift id whose assign-picker is open
  const [build, setBuild] = useState({ start: '18:00', end: '23:00', headcount: 2, ability: 'bar', min_rank: 1, label: '' })   // custom shift builder
  const [weekStart, setWeekStart] = useState(() => mondayOf(iso(now.getFullYear(), now.getMonth(), now.getDate())))   // week-overview Monday
  const [overviewOpen, setOverviewOpen] = useState(true)
  const [editShiftId, setEditShiftId] = useState(null)   // shift being time-edited
  const [editForm, setEditForm] = useState({ start: '', end: '', label: '' })

  const staffById = Object.fromEntries(staff.map(s => [s.id, s]))
  const activeStaff = staff.filter(s => s.active !== false)
  // date → shift rows (sorted by start); shift_id → claim rows.
  const shiftsByDate = {}
  for (const s of shifts) (shiftsByDate[s.date] ||= []).push(s)
  for (const arr of Object.values(shiftsByDate)) arr.sort((a, b) => (a.start_min || 0) - (b.start_min || 0))
  const claimsByShift = {}
  for (const c of claims) (claimsByShift[c.shift_id] ||= []).push(c)

  // ── Week overview: assigned hours vs each person's target + wage spend ───────
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i))
  const weekEnd = weekDates[6]
  const weekSet = new Set(weekDates)
  const hoursByStaff = {}   // staff_id → hours assigned this week
  for (const sh of shifts) {
    if (!weekSet.has(sh.date)) continue
    const hrs = shiftHours(sh)
    for (const c of (claimsByShift[sh.id] || [])) hoursByStaff[c.staff_id] = (hoursByStaff[c.staff_id] || 0) + hrs
  }
  const weekRows = staff.filter(s => s.active !== false).map(s => {
    const hrs = Math.round((hoursByStaff[s.id] || 0) * 10) / 10
    const rate = s.hourly_rate == null || s.hourly_rate === '' ? null : Number(s.hourly_rate)
    const target = s.target_hours == null || s.target_hours === '' ? null : Number(s.target_hours)
    const cost = rate != null ? Math.round(hrs * rate * 100) / 100 : null
    return { s, hrs, rate, target, cost }
  }).sort((a, b) => b.hrs - a.hrs || (a.s.name || '').localeCompare(b.s.name || ''))
  const totalHours = Math.round(weekRows.reduce((a, r) => a + r.hrs, 0) * 10) / 10
  const totalSpend = weekRows.reduce((a, r) => a + (r.cost || 0), 0)
  const missingRate = weekRows.some(r => r.hrs > 0 && r.rate == null)
  const overviewRows = weekRows.filter(r => r.hrs > 0 || r.target != null)

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
  const setReq = (sh, patch) => act(() => rotaSetShiftReq(sh.id, patch))
  const addShift = () => act(() => rotaAddShift(selDate, {
    start_min: hhmmToMin(build.start), end_min: hhmmToMin(build.end),
    headcount: build.headcount, ability: build.ability, min_rank: build.min_rank, label: build.label.trim(),
  }))
  const startEditShift = (sh) => { setEditShiftId(sh.id); setEditForm({ start: minToHHMM(sh.start_min), end: minToHHMM(sh.end_min), label: sh.label || '' }) }
  const saveEditShift = (sh) => act(async () => {
    await rotaEditShift(sh.id, { start_min: hhmmToMin(editForm.start), end_min: hhmmToMin(editForm.end), label: editForm.label.trim() })
    setEditShiftId(null)
  })

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
  // Live preview for the custom-shift builder (end ≤ start ⇒ finishes next day).
  // Guard in MINUTES so it matches the backend exactly (1h–18h) — rounded hours
  // would let 59 min show as "1h" and slip past a `< 1` check the server rejects.
  const bStart = hhmmToMin(build.start), bEnd0 = hhmmToMin(build.end)
  const bDurMin = (bEnd0 <= bStart ? bEnd0 + 1440 : bEnd0) - bStart
  const bDur = Math.round((bDurMin / 60) * 10) / 10
  const bNextDay = bEnd0 <= bStart
  const bValid = bDurMin >= 60 && bDurMin <= 18 * 60

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

      {/* Week overview — hours vs target + wage spend (founder only) */}
      <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setOverviewOpen(o => !o)} title={overviewOpen ? 'Hide breakdown' : 'Show breakdown'} style={{ ...weekNav, width: 26 }}>{overviewOpen ? '▾' : '▸'}</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>📊 Week</span>
            <button onClick={() => setWeekStart(w => addDaysISO(w, -7))} style={weekNav}>◀</button>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 150, textAlign: 'center' }}>{fmtDay(weekStart)} – {fmtDayMon(weekEnd)}</div>
            <button onClick={() => setWeekStart(w => addDaysISO(w, 7))} style={weekNav}>▶</button>
            <button onClick={() => setWeekStart(mondayOf(todayStr))} style={{ ...btn('ghost'), padding: '4px 9px', fontSize: 11 }}>This week</button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wage spend this week</div>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{gbp(totalSpend)} <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>· {totalHours}h assigned</span></div>
          </div>
        </div>
        {missingRate && <div style={{ fontSize: 11, color: AMBER, marginTop: 8 }}>⚠️ Some assigned staff have no hourly rate, so their pay isn't in the total — set it in Team → Edit profile → Pay &amp; hours.</div>}
        {overviewOpen && (
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {overviewRows.length === 0
              ? <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>No one assigned this week yet and no targets set. Assign shifts below, and set each person's target hours &amp; rate in Team → Edit profile.</div>
              : overviewRows.map(r => <WeekRow key={r.s.id} row={r} />)}
          </div>
        )}
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
                No shifts on this day yet. The usual {dayName(selDate)} pattern is{' '}
                {selPattern.map((p, i) => <span key={i}><strong style={{ color: '#fff' }}>{p.label} {shiftTimeLabel(p)}</strong>{i < selPattern.length - 1 ? ' + ' : ''}</span>)}
                {' '}— add it in one tap, or build your own below.
              </div>
              <div><button onClick={() => openDay(selDate)} disabled={busy} style={btn('gold')}>Add the usual {dayName(selDate)} shift{selPattern.length === 1 ? '' : 's'} ({headcount} each)</button></div>
            </div>
          ) : selShifts.map(sh => {
            const cl = claimsByShift[sh.id] || []
            const need = sh.headcount || 1
            const full = cl.length >= need
            const available = activeStaff.filter(s => !cl.some(c => c.staff_id === s.id))   // active + not already on
            const editingThis = editShiftId === sh.id
            const es = hhmmToMin(editForm.start), ee0 = hhmmToMin(editForm.end)
            const eDurMin = (ee0 <= es ? ee0 + 1440 : ee0) - es
            const eValid = eDurMin >= 60 && eDurMin <= 18 * 60
            return (
              <div key={sh.id} style={{ borderLeft: `3px solid ${boxColor(cl.length, need)}`, paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{sh.label}</div>
                  <div style={{ fontSize: 12, color: RED, fontWeight: 700 }}>{shiftTimeLabel(sh)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{shiftHours(sh)}h</div>
                  <button onClick={() => editingThis ? setEditShiftId(null) : startEditShift(sh)} disabled={busy} style={{ ...btn('ghost'), padding: '4px 9px' }}>{editingThis ? 'Close' : '✏️ Edit'}</button>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                    <span>Need</span>
                    <button onClick={() => bump(sh, -1)} disabled={busy || need <= 1} style={stepper}>−</button>
                    <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 700, color: '#fff' }}>{need}</span>
                    <button onClick={() => bump(sh, +1)} disabled={busy} style={stepper}>+</button>
                  </div>
                  <button onClick={() => closeShift(sh)} disabled={busy} style={btn('red')}>Delete</button>
                </div>

                {editingThis && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px' }}>
                    <label style={fieldLbl}>Start<input type="time" value={editForm.start} onChange={e => setEditForm(f => ({ ...f, start: e.target.value }))} style={timeInp} /></label>
                    <label style={fieldLbl}>End<input type="time" value={editForm.end} onChange={e => setEditForm(f => ({ ...f, end: e.target.value }))} style={timeInp} /></label>
                    <label style={{ ...fieldLbl, flex: 1, minWidth: 120 }}>Name<input value={editForm.label} maxLength={40} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Open, Close, Setup" style={{ ...timeInp, width: '100%' }} /></label>
                    <button onClick={() => saveEditShift(sh)} disabled={busy || !eValid} style={btn('gold')}>Save times</button>
                    <button onClick={() => setEditShiftId(null)} style={btn('ghost')}>Cancel</button>
                    <span style={{ fontSize: 11.5, color: eValid ? 'rgba(255,255,255,0.6)' : '#F59E0B', width: '100%' }}>
                      {fmtMin(es)}–{fmtMin(ee0)} · {Math.round(eDurMin / 60 * 10) / 10}h{ee0 <= es ? ' · ends next day' : ''}
                      {!eValid && (eDurMin < 60 ? ' · too short (min 1h)' : ' · too long (max 18h)')}
                      {cl.length > 0 && eValid ? ` · ${cl.length} assigned ${cl.length === 1 ? 'person stays' : 'people stay'} on` : ''}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                  <span>Needs</span>
                  <select value={sh.ability || 'bar'} onChange={e => setReq(sh, { ability: e.target.value })} disabled={busy} style={reqSel}>
                    {ABILITIES.map(a => <option key={a.key} value={a.key}>{a.icon} {a.label}</option>)}
                  </select>
                  <span>· min role</span>
                  <select value={sh.min_rank || 1} onChange={e => setReq(sh, { min_rank: +e.target.value })} disabled={busy} style={reqSel}>
                    {RANKS.map((r, i) => <option key={r} value={i + 1}>{r}{i === 0 ? ' (anyone)' : '+'}</option>)}
                  </select>
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

          {/* Build a custom shift — any start/end time, staffing & role */}
          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: 12, marginTop: 2 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>➕ Build a shift</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>Set your own times and staffing — you're not limited to the open/close pattern.</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={fieldLbl}>Start<input type="time" value={build.start} onChange={e => setBuild(b => ({ ...b, start: e.target.value }))} style={timeInp} /></label>
              <label style={fieldLbl}>End<input type="time" value={build.end} onChange={e => setBuild(b => ({ ...b, end: e.target.value }))} style={timeInp} /></label>
              <label style={fieldLbl}>Staff<input type="number" min={1} max={20} value={build.headcount} onChange={e => setBuild(b => ({ ...b, headcount: Math.max(1, Math.min(20, +e.target.value || 1)) }))} style={{ ...timeInp, width: 60, textAlign: 'center' }} /></label>
              <label style={fieldLbl}>Needs<select value={build.ability} onChange={e => setBuild(b => ({ ...b, ability: e.target.value }))} style={reqSel}>{ABILITIES.map(a => <option key={a.key} value={a.key}>{a.icon} {a.label}</option>)}</select></label>
              <label style={fieldLbl}>Min role<select value={build.min_rank} onChange={e => setBuild(b => ({ ...b, min_rank: +e.target.value }))} style={reqSel}>{RANKS.map((r, i) => <option key={r} value={i + 1}>{r}{i === 0 ? ' (anyone)' : '+'}</option>)}</select></label>
              <label style={{ ...fieldLbl, flex: 1, minWidth: 120 }}>Name (optional)<input value={build.label} maxLength={40} onChange={e => setBuild(b => ({ ...b, label: e.target.value }))} placeholder="e.g. Setup, Barback" style={{ ...timeInp, width: '100%' }} /></label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              <button onClick={addShift} disabled={busy || !bValid} style={btn('gold')}>Add shift</button>
              <span style={{ fontSize: 11.5, color: bValid ? 'rgba(255,255,255,0.6)' : '#F59E0B' }}>
                {fmtMin(bStart)}–{fmtMin(bEnd0)} · {bDur}h{bNextDay ? ' · ends next day' : ''}
                {!bValid && (bDurMin < 60 ? ' · too short (min 1h)' : ' · too long (max 18h)')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: '#fff' }}>Two ways to add shifts:</strong> tap a day and hit <strong style={{ color: '#fff' }}>Add the usual … shift</strong> for the standard pattern (Mon–Thu 2pm–12am · Fri/Sat Open + Close · Sun Open + Close), or use <strong style={{ color: '#fff' }}>➕ Build a shift</strong> to set your own times, length, staffing and role. Assign people here, or let staff pick released shifts from their own portal.
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
const weekNav = { width: 30, height: 28, borderRadius: 7, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
// Week-overview date helpers (UTC, Monday-start — matches the rest of the app).
const addDaysISO = (d, n) => { const dt = new Date(d + 'T00:00:00Z'); dt.setUTCDate(dt.getUTCDate() + n); return dt.toISOString().slice(0, 10) }
const mondayOf = (d) => addDaysISO(d, -((new Date(d + 'T00:00:00Z').getUTCDay() + 6) % 7))
const fmtDay = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })
const fmtDayMon = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const gbp = (n) => '£' + Number(n || 0).toLocaleString('en-GB', { maximumFractionDigits: 2 })
const reqSel = { padding: '4px 6px', fontSize: 11, borderRadius: 6, background: '#000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', cursor: 'pointer' }
const inp = (w) => ({ width: w, minWidth: 0, padding: '8px 10px', fontSize: 13, borderRadius: 7, background: '#000000', border: '1px solid rgba(255,255,255,0.18)', color: '#FFFFFF', outline: 'none', boxSizing: 'border-box' })
const fieldLbl = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 9.5, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }
const timeInp = { padding: '7px 8px', fontSize: 13, borderRadius: 7, background: '#000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }
