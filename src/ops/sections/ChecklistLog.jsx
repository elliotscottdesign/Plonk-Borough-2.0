import React, { useState, useEffect, useMemo, useRef } from 'react'
import { rotaChecklistLog } from '../../rota/api.js'
import { CHECKLISTS, checklistItems, checklistCount, doneCount } from '../../rota/checklists.js'

// ─── Checklist log (founder) ─────────────────────────────────────────────────
// A MONTH CALENDAR of shift checklists. Every day that has checklists shows a
// small logo per checklist (🌅 opening · 🔄 during · 🌙 closing …), colour-ringed
// by how complete it is. Tap a logo (or the day) to open that day underneath —
// who did it, the note they left, and exactly what wasn't ticked.
// Data comes from the `rota` fn (checklistLog) — it keeps 90 days.

const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33', LINE = 'rgba(255,255,255,0.12)'
const DAYS_BACK = 90
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const fmtDate = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const fmtTime = (t) => t ? new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const todayISO = () => { const n = new Date(); return iso(n.getFullYear(), n.getMonth(), n.getDate()) }
const monthLabel = (y, m) => new Date(Date.UTC(y, m, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })

// How a submission scores — drives the ring colour on its logo.
const scoreOf = (s) => {
  const total = checklistCount(s.checklist_key, s.date)
  const done = doneCount(s.checklist_key, s.items || {}, s.date)
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
}
const colourOf = (s) => { const { done, total } = scoreOf(s); return done >= total && total > 0 ? GREEN : done > 0 ? AMBER : RED }

export default function ChecklistLog() {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(null)        // expanded submission id (in the day panel)
  const [sel, setSel] = useState(null)          // selected day (ISO) — null until data lands
  const now = new Date()
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const panelRef = useRef(null)

  const load = async () => {
    setLoading(true); setErr('')
    try { const r = await rotaChecklistLog(DAYS_BACK); setSubs(r.submissions || []) }
    catch (e) { setErr(e.message || 'Could not load checklists.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  // Group by date, newest first (the server already sorts).
  const byDate = useMemo(() => {
    const g = {}
    for (const s of subs) (g[s.date] ||= []).push(s)
    for (const d of Object.keys(g)) g[d].sort((a, b) => String(a.checklist_key).localeCompare(String(b.checklist_key)))
    return g
  }, [subs])
  const dates = useMemo(() => Object.keys(byDate).sort().reverse(), [byDate])

  // First load: land on the month (and day) of the most recent checklist.
  useEffect(() => {
    if (sel || dates.length === 0) return
    const d = dates[0]
    setSel(d)
    setView({ y: +d.slice(0, 4), m: +d.slice(5, 7) - 1 })
  }, [dates, sel])

  // Month nav bounds — we only hold DAYS_BACK of history.
  const oldest = dates.length ? dates[dates.length - 1] : todayISO()
  const oldestM = { y: +oldest.slice(0, 4), m: +oldest.slice(5, 7) - 1 }
  const thisM = { y: now.getFullYear(), m: now.getMonth() }
  const key = (o) => o.y * 12 + o.m
  const canBack = key(view) > key(oldestM)
  const canFwd = key(view) < key(thisM)
  const step = (n) => setView(v => { const d = new Date(Date.UTC(v.y, v.m + n, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() } })

  // Build the month grid — Monday-first, padded to whole weeks.
  const cells = useMemo(() => {
    const first = new Date(Date.UTC(view.y, view.m, 1))
    const lead = (first.getUTCDay() + 6) % 7                      // Mon = 0
    const len = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate()
    const out = []
    for (let i = 0; i < lead; i++) out.push(null)
    for (let d = 1; d <= len; d++) out.push(iso(view.y, view.m, d))
    while (out.length % 7 !== 0) out.push(null)
    return out
  }, [view])

  const today = todayISO()
  const monthCount = cells.filter(Boolean).reduce((n, d) => n + (byDate[d]?.length || 0), 0)
  // Opening a day scrolls the panel into view only if it isn't already ('nearest'),
  // so on a phone the day you tapped is never left below the fold.
  const reveal = () => setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 40)
  const pickDay = (d) => { setSel(d); setOpen(null); if ((byDate[d] || []).length) reveal() }
  const pickSub = (d, id) => { setSel(d); setOpen(id); reveal() }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 22, color: '#fff' }}>📋 Shift checklists</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Every day the team ticked off — tap a logo to open it.</div>
        </div>
        <button onClick={load} disabled={loading} style={btn()}>↻ Refresh</button>
      </div>

      {err && <div style={{ fontSize: 12.5, color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 12px' }}>{err}</div>}

      {loading && subs.length === 0 ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', padding: '24px 0', textAlign: 'center' }}>Loading…</div>
      ) : dates.length === 0 ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px 16px', lineHeight: 1.6 }}>
          No checklists filled in yet. Once the team logs into the staff portal and ticks off their opening / closing tasks, they'll show here.
        </div>
      ) : <>
        {/* ── Month nav ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <button onClick={() => step(-1)} disabled={!canBack} style={btn(!canBack)}>‹</button>
          <div style={{ textAlign: 'center', minWidth: 0 }}>
            <div className="serif" style={{ fontSize: 17, color: '#fff' }}>{monthLabel(view.y, view.m)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{monthCount} checklist{monthCount === 1 ? '' : 's'}</div>
          </div>
          <button onClick={() => step(1)} disabled={!canFwd} style={btn(!canFwd)}>›</button>
        </div>

        {/* ── The calendar ──────────────────────────────────────────────────── */}
        <div style={{ background: '#0A0A0A', border: `1px solid ${LINE}`, borderRadius: 12, padding: 'clamp(6px, 1.6vw, 10px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'clamp(3px, 0.9vw, 6px)' }}>
            {WD.map(w => (
              <div key={w} style={{ fontSize: 'clamp(8.5px, 2vw, 10px)', color: 'rgba(255,255,255,0.4)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 4 }}>
                <span style={{ display: 'inline-block' }}>{w.slice(0, 3)}</span>
              </div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={`p${i}`} />
              const list = byDate[d] || []
              const isSel = sel === d
              const isToday = d === today
              return (
                <button key={d} onClick={() => pickDay(d)} title={fmtDate(d)} style={{
                  background: isSel ? 'rgba(52,211,153,0.10)' : list.length ? 'rgba(255,255,255,0.035)' : 'transparent',
                  border: `1px solid ${isSel ? 'rgba(52,211,153,0.55)' : isToday ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 8, padding: 'clamp(3px, 1vw, 6px) 2px', minHeight: 'clamp(46px, 11vw, 62px)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  cursor: 'pointer', color: '#fff', font: 'inherit', overflow: 'hidden',
                }}>
                  <span style={{ fontSize: 'clamp(9.5px, 2.2vw, 11px)', fontWeight: isToday ? 800 : 600, color: list.length ? '#fff' : 'rgba(255,255,255,0.3)', lineHeight: 1 }}>{+d.slice(8)}</span>
                  <span style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, lineHeight: 1 }}>
                    {list.slice(0, 4).map(s => {
                      const c = CHECKLISTS[s.checklist_key]
                      const { pct } = scoreOf(s)
                      return (
                        <span key={s.id} role="button" tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); pickSub(d, s.id) }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); pickSub(d, s.id) } }}
                          title={`${c?.title || s.checklist_key} — ${s.staff_name || 'Unknown'} · ${pct}%${s.note ? ' · ⚑ note' : ''}`}
                          style={{
                            display: 'inline-block', fontSize: 'clamp(10px, 2.6vw, 14px)', lineHeight: 1,
                            padding: 'clamp(1px, 0.4vw, 2px)', borderRadius: 5,
                            border: `1.5px solid ${colourOf(s)}`, background: 'rgba(255,255,255,0.06)',
                            opacity: s.submitted ? 1 : 0.75, cursor: 'pointer',
                          }}><span data-keep-color>{c?.icon || '📋'}</span></span>
                      )
                    })}
                    {list.length > 4 && <span style={{ fontSize: 'clamp(8px, 1.8vw, 9.5px)', color: 'rgba(255,255,255,0.5)', alignSelf: 'center' }}>+{list.length - 4}</span>}
                  </span>
                </button>
              )
            })}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(6px, 2vw, 14px)', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, paddingTop: 8 }}>
            {['opening', 'during', 'closing'].filter(k => CHECKLISTS[k]).map(k => (
              <span key={k} style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: 'rgba(255,255,255,0.5)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span data-keep-color style={{ fontSize: 'clamp(11px, 2.4vw, 13px)' }}>{CHECKLISTS[k].icon}</span>{CHECKLISTS[k].title}
              </span>
            ))}
            <span style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: 'rgba(255,255,255,0.5)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Dot c={GREEN} />all done <Dot c={AMBER} />part <Dot c={RED} />barely
            </span>
          </div>
        </div>

        {/* ── The chosen day ───────────────────────────────────────────────── */}
        <div ref={panelRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, scrollMarginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {sel ? fmtDate(sel) : 'Pick a day'}
          </div>
          {!sel ? null : (byDate[sel] || []).length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', background: '#0A0A0A', border: `1px solid ${LINE}`, borderRadius: 10, padding: '16px 14px', textAlign: 'center' }}>
              No checklist was filled in on this day.
            </div>
          ) : byDate[sel].map(s => (
            <SubCard key={s.id} s={s} isOpen={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} />
          ))}
        </div>
      </>}
    </div>
  )
}

function Dot({ c }) { return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 99, background: c, marginLeft: 4 }} /> }

// One submission — the same expandable card as before, now inside the day panel.
function SubCard({ s, isOpen, onToggle }) {
  const c = CHECKLISTS[s.checklist_key]
  const { total, done, pct } = scoreOf(s)
  const col = colourOf(s)
  const missing = checklistItems(s.checklist_key, s.date).filter(t => !(s.items || {})[t])
  return (
    <div style={{ background: '#0A0A0A', border: `1px solid ${s.submitted ? 'rgba(52,211,153,0.35)' : LINE}`, borderRadius: 10, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff' }}>
        <span style={{ fontSize: 20 }}>{c?.icon || '📋'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{c?.title || s.checklist_key}
            {s.submitted ? <span style={{ fontSize: 10, color: GREEN, fontWeight: 700, marginLeft: 8 }}>✓ submitted {fmtTime(s.submitted_at)}</span>
              : <span style={{ fontSize: 10, color: AMBER, fontWeight: 700, marginLeft: 8 }}>in progress</span>}
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{s.staff_name || 'Unknown'} · {done}/{total} done{s.note ? ' · ⚑ note' : ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: col }}>{pct}%</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>
      {isOpen && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {s.note && <div style={{ fontSize: 12.5, color: '#FCD34D', background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.25)', borderRadius: 7, padding: '8px 10px', margin: '12px 0', lineHeight: 1.5 }}>⚑ {s.note}</div>}
          {missing.length === 0
            ? <div style={{ fontSize: 12.5, color: GREEN, marginTop: 12 }}>✓ Everything ticked off.</div>
            : <>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 6px' }}>Not ticked ({missing.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {missing.map((t, i) => <div key={i} style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', display: 'flex', gap: 8, lineHeight: 1.4 }}><span style={{ color: RED, flexShrink: 0 }}>✕</span>{t}</div>)}
              </div>
            </>}
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', marginTop: 12 }}>Last saved {fmtTime(s.updated_at)}</div>
        </div>
      )}
    </div>
  )
}

const btn = (disabled) => ({
  padding: '7px 12px', borderRadius: 7, cursor: disabled ? 'default' : 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
  background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', opacity: disabled ? 0.3 : 1,
})
