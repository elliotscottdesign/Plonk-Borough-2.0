import React, { useState } from 'react'
import { generateWeek, holidayName, addDaysISO, hoursFor } from '../../rota/rotaEngine.js'
import { fmtMin } from '../../rota/shifts.js'
import { rotaSaveDayRoster } from '../../rota/api.js'

// ─── AI Rota — auto-filled concept the founder reviews, amends & applies ──────
// Deterministic generator (src/rota/rotaEngine.js) using the venue's rules. This
// is a SEPARATE concept sheet — nothing is written until the founder taps Apply.

const RED = '#DA1B33', GREEN = '#34D399', AMBER = '#F59E0B', BLUE = '#60A5FA', PURPLE = '#A855F7'
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const mondayOf = (d) => addDaysISO(d, -((new Date(d + 'T00:00:00Z').getUTCDay() + 6) % 7))
const dayLabel = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })

export default function AiRota({ staff = [], availability = [], reload }) {
  const now = new Date()
  const [weekStart, setWeekStart] = useState(() => mondayOf(iso(now.getFullYear(), now.getMonth(), now.getDate())))
  const [days, setDays] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [busy, setBusy] = useState(false)
  const [applied, setApplied] = useState({})

  const active = staff.filter(s => s.active !== false)
  const nameById = Object.fromEntries(active.map(s => [s.id, s.name]))
  const weekEnd = addDaysISO(weekStart, 6)
  const todayStr = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const assignedCount = (day) => day.slots.filter(s => s.staffId).length

  const generate = () => { const r = generateWeek(weekStart, staff, availability); setDays(r.days); setWarnings(r.warnings || []); setApplied({}) }
  const stepWeek = (n) => { setWeekStart(w => addDaysISO(w, n * 7)); setDays(null) }

  const reassign = (di, si, staffId) => setDays(ds => ds.map((d, i) => i !== di ? d : { ...d, slots: d.slots.map((s, j) => j !== si ? s : { ...s, staffId: staffId || null, name: staffId ? nameById[staffId] : null, warn: '' }) }))
  const removeSlot = (di, si) => setDays(ds => ds.map((d, i) => i !== di ? d : { ...d, slots: d.slots.filter((_, j) => j !== si) }))

  const blocksOf = (day) => day.slots.filter(s => s.staffId).map(s => ({ staffId: s.staffId, start_min: s.start, end_min: s.end }))
  const applyDay = async (day) => {
    if (day.date < todayStr) { alert("That day is already in the past — it can't be rostered."); return }
    const blocks = blocksOf(day)
    if (blocks.length === 0) { alert('No one is assigned on this day, so there’s nothing to apply — I won’t wipe the day. Assign someone first (or clear a day from the Rota grid).'); return }
    if (!window.confirm(`Apply this roster to ${dayLabel(day.date)}?\n\nThis REPLACES whatever is currently rostered for that day.`)) return
    setBusy(true)
    try { await rotaSaveDayRoster(day.date, blocks); setApplied(a => ({ ...a, [day.date]: true })); await reload?.() }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const applyWeek = async () => {
    // Only upcoming days with someone assigned — never wipe a day or write the past.
    const doable = days.filter(d => d.date >= todayStr && blocksOf(d).length > 0)
    if (doable.length === 0) { alert('Nothing to apply — the upcoming days have no one assigned yet.'); return }
    const skipped = days.length - doable.length
    if (!window.confirm(`Apply ${doable.length} day${doable.length === 1 ? '' : 's'} (${dayLabel(doable[0].date)} – ${dayLabel(doable[doable.length - 1].date)})?${skipped ? `\n\n${skipped} day(s) skipped — in the past or no one assigned.` : ''}\n\nThis REPLACES the current roster for those days.`)) return
    setBusy(true)
    const done = []
    try {
      for (const day of doable) { await rotaSaveDayRoster(day.date, blocksOf(day)); done.push(day.date); setApplied(a => ({ ...a, [day.date]: true })) }
      await reload?.()
    } catch (e) {
      await reload?.()
      alert(`Applied ${done.length} of ${doable.length} day(s), then hit an error: ${e.message}\n\nThe rest weren't changed.`)
    } finally { setBusy(false) }
  }

  const slotTag = (s) => {
    if (s.role === 'manager') return { txt: '👔 Manager', color: PURPLE }
    if (s.kitchen) return { txt: '🍳 Kitchen', color: AMBER }
    return { txt: s.label, color: 'rgba(255,255,255,0.5)' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 20, color: '#fff' }}>🤖 AI Rota — auto-fill</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>A concept built from your rules. Review &amp; tweak below, then Apply — nothing changes until you do.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => stepWeek(-1)} style={nav}>◀</button>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 150, textAlign: 'center' }}>{dayLabel(weekStart)} – {dayLabel(weekEnd)}</div>
          <button onClick={() => stepWeek(1)} style={nav}>▶</button>
          <button onClick={generate} disabled={busy} style={btn('gold')}>✨ Generate</button>
        </div>
      </div>

      {!days ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '16px 18px', lineHeight: 1.7 }}>
          Pick a week and tap <strong style={{ color: '#fff' }}>✨ Generate</strong>. The AI fills every day with:
          a <strong style={{ color: PURPLE }}>manager</strong> from 1h before open to 1h after close, the right headcount
          (Mon–Thu 2 · Fri 2→4 · Sat 3→4 · Sun 2), at least one <strong style={{ color: AMBER }}>kitchen</strong> person, and it
          spreads hours fairly using who's marked themselves available. School-holiday weeks auto-switch to 12pm–12am.
        </div>
      ) : (
        <>
          {warnings.length > 0 && (
            <div style={{ fontSize: 12, color: AMBER, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 12px', lineHeight: 1.6 }}>
              ⚠️ {warnings.length} thing{warnings.length === 1 ? '' : 's'} to check: {warnings.slice(0, 6).join(' · ')}{warnings.length > 6 ? ' …' : ''}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={applyWeek} disabled={busy} style={btn('gold')}>Apply whole week →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {days.map((day, di) => (
              <div key={day.date} style={{ background: '#0A0A0A', border: `1px solid ${applied[day.date] ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{dayLabel(day.date)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{fmtMin(day.open)}–{fmtMin(day.close)}</div>
                </div>
                {day.holiday && <div style={{ fontSize: 10.5, color: BLUE, marginBottom: 8 }}>🏖️ {day.holiday} · 12–12</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {day.slots.map((s, si) => {
                    const tag = slotTag(s)
                    const eligible = s.role === 'manager' ? active.filter(x => x.role === 'Manager' || x.role === 'Asst. Manager') : active
                    return (
                      <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.warn ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, padding: '5px 7px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: tag.color, whiteSpace: 'nowrap', minWidth: 66 }}>{tag.txt}</span>
                        <select value={s.staffId || ''} onChange={e => reassign(di, si, e.target.value)} style={sel}>
                          <option value="">— unassigned —</option>
                          {eligible.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </select>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{fmtMin(s.start)}–{fmtMin(s.end)}</span>
                        <button onClick={() => removeSlot(di, si)} title="Remove" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
                      </div>
                    )
                  })}
                  {day.slots.length === 0 && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>Closed / no one on.</div>}
                </div>
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  {(() => {
                    const past = day.date < todayStr, none = assignedCount(day) === 0
                    const off = (busy || past || none) && !applied[day.date]
                    const label = applied[day.date] ? '✓ Applied' : past ? 'Past day' : none ? 'No one on' : 'Apply this day'
                    return <button onClick={() => applyDay(day)} disabled={busy || past || none} style={{ ...(applied[day.date] ? btn('ghost') : btn('gold')), ...(off ? { opacity: 0.45, cursor: 'not-allowed' } : {}) }}>{label}</button>
                  })()}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
            Change anyone with the dropdowns or remove a slot with ✕. <strong style={{ color: '#fff' }}>Apply</strong> writes it to the real rota for that day (replacing what's there) — you can still fine-tune in the Rota grid afterwards. Holiday dates and staffing rules are set in <code>src/rota/rotaEngine.js</code>.
          </div>
        </>
      )}
    </div>
  )
}

const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: '#DA1B33', color: '#fff' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }
}
const nav = { width: 30, height: 28, borderRadius: 7, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
const sel = { flex: 1, minWidth: 0, padding: '4px 6px', fontSize: 12, borderRadius: 6, background: '#000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', cursor: 'pointer' }
