import React, { useState, useEffect, useRef } from 'react'
import { generateWeek, holidayName, addDaysISO, hoursFor, withDefaults, isKitchen } from '../../rota/rotaEngine.js'
import { fmtMin } from '../../rota/shifts.js'
import { rotaSaveDayRoster, rotaCompileRules } from '../../rota/api.js'
import RotaRulesEditor from './RotaRulesEditor.jsx'
import HistoricalBuild from './HistoricalBuild.jsx'

// ─── AI Rota — auto-filled concept the founder reviews, amends & applies ──────
// Deterministic generator (src/rota/rotaEngine.js) using the venue's rules. This
// is a SEPARATE concept sheet — nothing is written until the founder taps Apply.

const RED = '#DA1B33', GREEN = '#34D399', AMBER = '#F59E0B', BLUE = '#60A5FA', PURPLE = '#A855F7'
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const mondayOf = (d) => addDaysISO(d, -((new Date(d + 'T00:00:00Z').getUTCDay() + 6) % 7))
const dayLabel = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })

export default function AiRota({ staff = [], availability = [], rules = null, shifts = [], claims = [], reload }) {
  const [mode, setMode] = useState('rules')   // 'rules' (✨ from your rules) | 'history' (📜 from last week's till)
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

  // Readiness: the engine fills from each person's expected hours, so flag anyone
  // missing those for THIS week (they'd otherwise be guessed at). Availability no
  // longer needs flagging — everyone's available by default and only marks days off.
  const missingHours = active.filter(s => { const t = Number(s.target_hours); return !(Number.isFinite(t) && t > 0) })

  const generate = () => { const r = generateWeek(weekStart, staff, availability, rules); setDays(r.days.map(d => ({ ...d, slots: sortSlots(d.slots) }))); setWarnings(r.warnings || []); setApplied({}) }
  // Historical build: slots shaped from last week's till → same assignment engine →
  // same editable preview. Each day keeps its `shadow` so the card can show the bars.
  const buildFromHistory = (slotsByDate) => {
    const r = generateWeek(weekStart, staff, availability, rules, { slotsByDate })
    setDays(r.days.map(d => ({ ...d, slots: sortSlots(d.slots), shadow: slotsByDate[d.date]?.shadow || null })))
    setWarnings(r.warnings || []); setApplied({})
    setTimeout(() => document.getElementById('ai-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  // Engine warnings are strings prefixed "YYYY-MM-DD: …" — split them per day so each
  // one sits on the day card it's about (plus the header pill for the total).
  const warnsFor = (date) => warnings.filter(w => w.startsWith(date + ':')).map(w => w.slice(date.length + 1).trim())
  const stepWeek = (n) => { setWeekStart(w => addDaysISO(w, n * 7)); setDays(null) }

  // What a slot IS is decided by who's in it: a manager → 👔, kitchen-trained → 🍳,
  // else 🍺 Bar. Fixed engine slots (manager/kitchen) keep their identity; free
  // slots (floor / evening / added) take on the person's role. Days keep the
  // Manager → Kitchen → Bar order, so re-assigning re-sorts the card.
  const staffById = Object.fromEntries(active.map(s => [s.id, s]))
  // Kind = what the SHIFT is (the slot's job), not who's in it: 👔 the manager
  // slot, 🍳 the dedicated kitchen slot, 🍺 everything else. The person's own role
  // shows as a small badge instead — so a kitchen-trained barback on a floor shift
  // reads "🍺 Bar · 🍳", not as a second kitchen shift.
  const kindOf = (s) => (s.role === 'manager' ? 'manager' : s.role === 'kitchen' ? 'kitchen' : 'bar')
  const personBadge = (s) => {
    const p = s.staffId ? staffById[s.staffId] : null
    if (!p || s.role === 'manager' || s.role === 'kitchen') return null
    if (p.role === 'Manager' || p.role === 'Asst. Manager') return { txt: '👔', title: `${p.name} is a ${p.role} — this is still a bar shift` }
    if (isKitchen(p)) return { txt: '🍳', title: `${p.name} is kitchen-trained — this is still a bar shift` }
    return null
  }
  const KIND_ORDER = { manager: 0, kitchen: 1, bar: 2 }
  const sortSlots = (slots) => slots.map((s, i) => [s, i]).sort((a, b) => (KIND_ORDER[kindOf(a[0])] - KIND_ORDER[kindOf(b[0])]) || (a[0].start - b[0].start) || (a[1] - b[1])).map(([s]) => s)
  const reassign = (di, si, staffId) => setDays(ds => ds.map((d, i) => i !== di ? d : { ...d, slots: sortSlots(d.slots.map((s, j) => j !== si ? s : { ...s, staffId: staffId || null, name: staffId ? nameById[staffId] : null, warn: '' })) }))
  const removeSlot = (di, si) => setDays(ds => ds.map((d, i) => i !== di ? d : { ...d, slots: d.slots.filter((_, j) => j !== si) }))
  // Add an extra shift to a day — a plain floor slot across the day's opening hours,
  // unassigned; the founder picks the person and trims the times with the steppers.
  const addSlot = (di) => setDays(ds => ds.map((d, i) => i !== di ? d : {
    ...d, slots: [...d.slots, { start: d.open, end: d.close, role: 'any', label: 'Extra', staffId: null, name: null, kitchen: false, warn: '', added: true }],
  }))
  // Shorten / lengthen a single shift (30-min steps). Keeps ≥1h, caps the end at 2am.
  const adjust = (di, si, field, delta) => setDays(ds => ds.map((d, i) => i !== di ? d : {
    ...d, slots: d.slots.map((s, j) => {
      if (j !== si) return s
      if (field === 'start') return { ...s, start: Math.max(0, Math.min(s.end - 60, s.start + delta)) }
      return { ...s, end: Math.max(s.start + 60, Math.min(1560, s.end + delta)) }   // min 1h, cap 2am
    }),
  }))

  const blocksOf = (day) => day.slots.filter(s => s.staffId).map(s => ({ staffId: s.staffId, start_min: s.start, end_min: s.end }))
  const applyDay = async (day) => {
    const blocks = blocksOf(day)
    if (blocks.length === 0) { alert('No one is assigned on this day, so there’s nothing to apply — I won’t wipe the day. Assign someone first (or clear a day from the Rota grid).'); return }
    const pastNote = day.date < todayStr ? '\n\n(This is a past day — you\'re editing history.)' : ''
    const emptyN = day.slots.filter(s => !s.staffId).length
    const emptyNote = emptyN ? `\n\n${emptyN} unassigned slot${emptyN === 1 ? '' : 's'} will be skipped — pick someone for them first if you want them on.` : ''
    if (!window.confirm(`Apply this roster to ${dayLabel(day.date)}?\n\nThis REPLACES whatever is currently rostered for that day.${emptyNote}${pastNote}`)) return
    setBusy(true)
    try { await rotaSaveDayRoster(day.date, blocks); setApplied(a => ({ ...a, [day.date]: true })); await reload?.() }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const applyWeek = async () => {
    // Every day with someone assigned — past weeks included (editing history), never wipe an empty day.
    const doable = days.filter(d => blocksOf(d).length > 0)
    if (doable.length === 0) { alert('Nothing to apply — no one is assigned on any day yet.'); return }
    const skipped = days.length - doable.length
    if (!window.confirm(`Apply ${doable.length} day${doable.length === 1 ? '' : 's'} (${dayLabel(doable[0].date)} – ${dayLabel(doable[doable.length - 1].date)})?${skipped ? `\n\n${skipped} day(s) skipped — no one assigned.` : ''}\n\nThis REPLACES the current roster for those days.`)) return
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
    const k = kindOf(s)
    if (k === 'manager') return { txt: '👔 Manager', color: PURPLE }
    if (k === 'kitchen') return { txt: '🍳 Kitchen', color: AMBER }
    if (!s.staffId) return { txt: '＋ Pick who', color: BLUE }   // added/unassigned bar shift
    return { txt: '🍺 Bar', color: 'rgba(255,255,255,0.6)' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 20, color: '#fff' }}>🤖 Ai Builder — auto-fill</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{mode === 'history' ? 'A concept shaped from last week\'s till — busy times, who was on, what sold. Review & tweak, then Apply.' : 'A concept built from your rules. Review & tweak below, then Apply — nothing changes until you do.'}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[['rules', '✨ From your rules'], ['history', '📜 Historical build']].map(([k, lbl]) => (
              <button key={k} onClick={() => setMode(k)} style={{ padding: '5px 12px', fontSize: 12, borderRadius: 999, cursor: 'pointer', background: mode === k ? 'rgba(96,165,250,0.18)' : 'rgba(255,255,255,0.05)', border: `1px solid ${mode === k ? BLUE : 'rgba(255,255,255,0.14)'}`, color: mode === k ? '#fff' : 'rgba(255,255,255,0.65)', fontWeight: mode === k ? 700 : 400 }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {days && warnings.length > 0 && (
            <span title={warnings.join('\n')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.45)', color: AMBER, fontSize: 11.5, fontWeight: 700, cursor: 'default' }}>⚠️ {warnings.length} thing{warnings.length === 1 ? '' : 's'} to check</span>
          )}
          <button onClick={() => stepWeek(-1)} style={nav}>◀</button>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 150, textAlign: 'center' }}>{dayLabel(weekStart)} – {dayLabel(weekEnd)}</div>
          <button onClick={() => stepWeek(1)} style={nav}>▶</button>
          {mode === 'rules' && <button onClick={generate} disabled={busy} style={btn('gold')}>✨ Generate</button>}
        </div>
      </div>

      {/* The founder's plain-English house rules — always visible as the review checklist */}
      {/* 📌 Rules — THE editable house-rules section (was a read-only copy + a second editor inside ⚙️ Rota rules; unified 19 Aug 2026) */}
      <HouseRulesEditor rules={rules} reload={reload} />

      {/* Editable rules the AI builds from — house rules, hours, staffing, priority, holidays */}
      <details style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '0 14px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: '#fff', padding: '13px 0' }}>⚙️ Rota rules — hours, staffing, staff priority &amp; holidays <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>· what the builder uses (edit &amp; save)</span></summary>
        <div style={{ paddingBottom: 14 }}><RotaRulesEditor rules={rules} staff={staff} onSaved={reload} /></div>
      </details>

      {/* Readiness — the engine fills from expected hours, so flag anyone missing them for this week */}
      {missingHours.length > 0 ? (
        <details style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '0 14px' }}>
          <summary style={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: AMBER, padding: '13px 0' }}>⚠️ Ready to build? <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>· {missingHours.length} {missingHours.length === 1 ? 'person has' : 'people have'} no expected hours set — the AI has to guess for them</span></summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>The AI builds the rota from each person's <strong style={{ color: '#fff' }}>expected hours</strong>. It'll still generate, but it has to guess for these people:</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>💷 <strong>No expected hours:</strong> {missingHours.map(s => s.name).join(', ')} <span style={{ color: 'rgba(255,255,255,0.5)' }}>— set each in Team → Edit profile → Pay &amp; hours.</span></div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Everyone's treated as available unless they've marked days off in their portal or the Availability tab.</div>
          </div>
        </details>
      ) : active.length > 0 ? (
        <details style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 12, padding: '0 14px' }}>
          <summary style={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: GREEN, padding: '13px 0' }}>✓ Ready to build <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>· everyone has expected hours set</span></summary>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, paddingBottom: 14 }}>The AI has what it needs — it builds from each person's expected hours and works around any days they've marked off in their portal or the Availability tab.</div>
        </details>
      ) : null}

      {mode === 'history' && (
        <HistoricalBuild weekStart={weekStart} staff={staff} shifts={shifts} claims={claims} rules={rules} onBuild={buildFromHistory} />
      )}

      <div id="ai-preview" />
      {!days ? (mode === 'history' ? null :
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '16px 18px', lineHeight: 1.7 }}>
          Pick a week and tap <strong style={{ color: '#fff' }}>✨ Generate</strong>. The AI fills every day with:
          a <strong style={{ color: PURPLE }}>manager</strong> from 1h before open until everyone leaves after close, the right headcount
          (Mon–Thu 2 · Fri 2→4 · Sat 3→4 · Sun 2), at least one <strong style={{ color: AMBER }}>kitchen</strong> person, and it
          spreads hours fairly while avoiding anyone who's marked themselves off. School-holiday weeks auto-switch to 12pm–12am.
        </div>
      ) : (
        <>
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
                {day.shadow && (() => {
                  const peak = Math.max(1, ...day.shadow.series.map(p => p.s))
                  return (
                    <div title={`Shaped from ${day.shadow.sourceDate}: £${Math.round(day.shadow.total)} · ${day.shadow.orders} orders`} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 22, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        {day.shadow.series.map(p => <div key={p.t} style={{ flex: 1, height: Math.max(1, (p.s / peak) * 20), background: p.s >= peak * 0.6 ? RED : BLUE, opacity: 0.8, borderRadius: '1px 1px 0 0' }} />)}
                      </div>
                      <div style={{ fontSize: 9.5, color: BLUE, marginTop: 2 }}>📜 shadow of {day.shadow.sourceDate.slice(8)}/{day.shadow.sourceDate.slice(5, 7)} · £{Math.round(day.shadow.total)}</div>
                    </div>
                  )
                })()}
                {(() => { const ws = warnsFor(day.date); return ws.length > 0 ? (
                  <div style={{ fontSize: 10.5, color: AMBER, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 7, padding: '6px 9px', marginBottom: 8, lineHeight: 1.55 }}>
                    {ws.map((w, i) => <div key={i}>⚠️ {w}</div>)}
                  </div>
                ) : null })()}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {day.slots.map((s, si) => {
                    const tag = slotTag(s)
                    // Lanes: managers for the manager slot; kitchen-role (or a kitchen-trained manager as cover) for kitchen; everyone except kitchen-role on the floor.
                    const eligible = s.role === 'manager' ? active.filter(x => x.role === 'Manager' || x.role === 'Asst. Manager') : s.role === 'kitchen' ? active.filter(x => x.role === 'Kitchen / Barback' || (isKitchen(x) && (x.role === 'Manager' || x.role === 'Asst. Manager'))) : active.filter(x => x.role !== 'Kitchen / Barback')
                    return (
                      <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: 5, background: 'rgba(255,255,255,0.03)', border: `1px ${s.added && !s.staffId ? 'dashed' : 'solid'} ${s.warn ? 'rgba(245,158,11,0.4)' : s.added && !s.staffId ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, padding: '6px 7px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: tag.color, whiteSpace: 'nowrap', minWidth: 66 }}>{tag.txt}{(() => { const b = personBadge(s); return b ? <span title={b.title} style={{ marginLeft: 4, opacity: 0.85 }}>· {b.txt}</span> : null })()}</span>
                          <select value={s.staffId || ''} onChange={e => reassign(di, si, e.target.value)} style={sel}>
                            <option value="">— unassigned —</option>
                            {eligible.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                          </select>
                          <button onClick={() => removeSlot(di, si)} title="Remove" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                          <Stepper label="Start" value={s.start} onDelta={d => adjust(di, si, 'start', d)} />
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>→</span>
                          <Stepper label="End" value={s.end} onDelta={d => adjust(di, si, 'end', d)} />
                          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{Math.round((s.end - s.start) / 6) / 10}h</span>
                        </div>
                      </div>
                    )
                  })}
                  {day.slots.length === 0 && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>Closed / no one on.</div>}
                  <button onClick={() => addSlot(di)} disabled={busy} title="Add another shift to this day — pick who, then set the times" style={{ padding: '7px 8px', borderRadius: 7, cursor: 'pointer', background: 'transparent', border: '1px dashed rgba(255,255,255,0.28)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>+ Add a shift</button>
                </div>
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  {(() => {
                    const past = day.date < todayStr, none = assignedCount(day) === 0
                    const off = (busy || none) && !applied[day.date]
                    const label = applied[day.date] ? '✓ Applied' : none ? 'No one on' : past ? 'Apply (past day)' : 'Apply this day'
                    return <button onClick={() => applyDay(day)} disabled={busy || none} style={{ ...(applied[day.date] ? btn('ghost') : btn('gold')), ...(off ? { opacity: 0.45, cursor: 'not-allowed' } : {}) }}>{label}</button>
                  })()}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
            Change anyone with the dropdowns, <strong style={{ color: '#fff' }}>shorten or lengthen a shift</strong> with the −/+ buttons (30-min steps), remove a slot with ✕, or <strong style={{ color: '#fff' }}>+ Add a shift</strong> to put an extra person on a day (pick who, set the times). <strong style={{ color: '#fff' }}>Apply</strong> writes it to the real rota for that day (replacing what's there) — with the exact times you set — and you can still fine-tune in the Rota grid afterwards. All the rules — house rules, hours, staff priority, opener/closer, quiet-day early cut and holidays — are yours to edit in <strong style={{ color: '#fff' }}>⚙️ Rota rules</strong> above.
          </div>
        </>
      )}
    </div>
  )
}

// ─── 📌 Rules — the one place house rules live (type → Save → the AI applies) ──
// Rows are editable in place with a receipt under each (how the AI read it).
// Save sends the FULL current rules object with the new houseRules so nothing
// manual is lost; the 20s background refresh never clobbers unsaved typing.
function HouseRulesEditor({ rules, reload }) {
  const fresh = withDefaults(rules)
  const [list, setList] = useState(() => [...fresh.houseRules])
  const [notes, setNotes] = useState(() => fresh.compiledNotes || [])
  const seedRef = useRef(JSON.stringify(fresh.houseRules))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => {
    const R = withDefaults(rules)
    setNotes(R.compiledNotes || [])
    const seed = JSON.stringify(R.houseRules)
    setList(cur => {
      if (JSON.stringify(cur) !== seedRef.current) return cur   // founder is mid-edit — don't clobber
      seedRef.current = seed
      return [...R.houseRules]
    })
  }, [rules])
  const cleaned = list.map(t => t.trim()).filter(Boolean)
  const dirty = JSON.stringify(cleaned) !== JSON.stringify(withDefaults(rules).houseRules)
  const norm = (x) => String(x || '').replace(/\s+/g, ' ').trim().toLowerCase()
  const noteFor = (r) => notes.find(n => n && norm(n.rule) === norm(r)) || null
  const applied = cleaned.filter(r => noteFor(r)?.status === 'applied').length
  const toCheck = cleaned.filter(r => noteFor(r) && noteFor(r).status !== 'applied').length
  const save = async () => {
    setBusy(true); setErr('')
    try {
      const r = await rotaCompileRules({ ...(rules || {}), houseRules: cleaned })
      const R = withDefaults(r.rules)
      seedRef.current = JSON.stringify(R.houseRules)
      setList([...R.houseRules]); setNotes(R.compiledNotes || [])
      if (r.setup && r.error) setErr(r.error)
      await reload?.()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <details style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: 12, padding: '0 14px' }}>
      <summary style={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: BLUE, padding: '13px 0' }}>
        📌 Rules <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>· {cleaned.length} house rule{cleaned.length === 1 ? '' : 's'}{cleaned.length > 0 && <> · <span style={{ color: GREEN }}>{applied} applied automatically</span></>}{toCheck > 0 && <> · <span style={{ color: AMBER }}>{toCheck} to check by hand</span></>}{dirty && <> · <span style={{ color: AMBER, fontWeight: 700 }}>unsaved changes</span></>} · type, edit or delete — Save has the AI apply them</span>
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 14 }}>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
          Type any rule in plain English — “prioritise Jordan this week”, “never put Alex and Sam on together”, “max 3 shifts for Ben”. <strong style={{ color: '#fff' }}>Save</strong> and the AI wires what it can straight into the builder: <strong style={{ color: GREEN }}>✅ applied</strong> (with what it will do) or <strong style={{ color: AMBER }}>⚠️ reminder</strong> to check by hand. Delete a rule and Save to un-apply it.
        </div>
        {err && <div style={{ fontSize: 12, color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '9px 12px', lineHeight: 1.5 }}>{err}</div>}
        {list.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No house rules yet — add your first below.</div>}
        {list.map((r, i) => {
          const n = r.trim() ? noteFor(r) : null
          return (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 13, lineHeight: '30px', flexShrink: 0 }} title={n ? (n.status === 'applied' ? 'Applied — the builder does this automatically' : 'Reminder — check it by hand as you review') : 'Not read yet — Save'}>{n ? (n.status === 'applied' ? '✅' : '⚠️') : '📝'}</span>
                <textarea value={r} onChange={e => setList(l => l.map((x, k) => k === i ? e.target.value : x))} rows={1} placeholder="e.g. Prioritise Jordan this week" style={{ flex: 1, minWidth: 0, resize: 'vertical', lineHeight: 1.4, padding: '6px 9px', fontSize: 12.5, borderRadius: 6, background: '#000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none' }} />
                <button onClick={() => setList(l => l.filter((_, k) => k !== i))} title="Delete this rule — then Save to make it stick" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7, cursor: 'pointer', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.35)', color: '#F87171', fontSize: 11.5, fontWeight: 700 }}>🗑 Delete</button>
              </div>
              {n
                ? <div style={{ fontSize: 11.5, color: n.status === 'applied' ? GREEN : AMBER, lineHeight: 1.45, marginTop: 5, paddingLeft: 29 }}>{n.understood}</div>
                : <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 5, paddingLeft: 29 }}>New or edited — tap <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Save rules</strong> and the AI will read it.</div>}
            </div>
          )
        })}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
          <button onClick={() => setList(l => [...l, ''])} style={btn('ghost')}>+ Add a rule</button>
          <button onClick={save} disabled={busy || !dirty} style={{ ...btn('gold'), opacity: busy || !dirty ? 0.5 : 1 }}>{busy ? '🧠 AI reading your rules…' : dirty ? 'Save rules' : 'Saved ✓'}</button>
        </div>
      </div>
    </details>
  )
}

// A compact −/+ time stepper (30-min steps) for shortening / lengthening a shift.
function Stepper({ label, value, onDelta }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <button onClick={() => onDelta(-30)} title="30 min earlier" style={step}>−</button>
      <span style={{ fontSize: 11, color: '#fff', minWidth: 40, textAlign: 'center', fontWeight: 600 }}>{fmtMin(value)}</span>
      <button onClick={() => onDelta(30)} title="30 min later" style={step}>+</button>
    </span>
  )
}
const step = { width: 20, height: 20, borderRadius: 5, cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 13, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }

const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: '#DA1B33', color: '#fff' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }
}
const nav = { width: 30, height: 28, borderRadius: 7, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
const sel = { flex: 1, minWidth: 0, padding: '4px 6px', fontSize: 12, borderRadius: 6, background: '#000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', cursor: 'pointer' }
