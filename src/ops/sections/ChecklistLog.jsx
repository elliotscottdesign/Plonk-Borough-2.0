import React, { useState, useEffect } from 'react'
import { rotaChecklistLog } from '../../rota/api.js'
import { CHECKLISTS, checklistItems, checklistCount, doneCount } from '../../rota/checklists.js'
import { useChecklistOverrides, effectiveShift } from '../../lib/liveChecklists.js'

// ─── Checklist log (founder) ─────────────────────────────────────────────────
// Shows which shift checklists have been filled in — opening / during / closing —
// per day, who did it, how complete, and any flag left. Read from the `rota` fn.

const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33', LINE = 'rgba(255,255,255,0.12)'
const fmtDate = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const fmtTime = (t) => t ? new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''

export default function ChecklistLog() {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(null)   // expanded submission id
  const eff = effectiveShift(useChecklistOverrides())   // live founder edits, fallback to built-in

  const load = async () => {
    setLoading(true); setErr('')
    try { const r = await rotaChecklistLog(21); setSubs(r.submissions || []) }
    catch (e) { setErr(e.message || 'Could not load checklists.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  // Group by date (already sorted desc by the server).
  const byDate = {}
  for (const s of subs) (byDate[s.date] ||= []).push(s)
  const dates = Object.keys(byDate).sort().reverse()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 22, color: '#fff' }}>📋 Shift checklists</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>What the team has ticked off on shift — last 3 weeks.</div>
        </div>
        <button onClick={load} disabled={loading} style={btn('ghost')}>↻ Refresh</button>
      </div>

      {err && <div style={{ fontSize: 12.5, color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 12px' }}>{err}</div>}

      {loading ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', padding: '24px 0', textAlign: 'center' }}>Loading…</div>
      ) : dates.length === 0 ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px 16px', lineHeight: 1.6 }}>
          No checklists filled in yet. Once the team logs into the staff portal and ticks off their opening / closing tasks, they'll show here.
        </div>
      ) : dates.map(date => (
        <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{fmtDate(date)}</div>
          {byDate[date].map(s => {
            const c = eff[s.checklist_key]
            const total = checklistCount(s.checklist_key, s.date, eff), done = doneCount(s.checklist_key, s.items || {}, s.date, eff)
            const pct = total ? Math.round((done / total) * 100) : 0
            const col = done >= total ? GREEN : done > 0 ? AMBER : RED
            const missing = checklistItems(s.checklist_key, s.date, eff).filter(t => !(s.items || {})[t])
            const isOpen = open === s.id
            return (
              <div key={s.id} style={{ background: '#0A0A0A', border: `1px solid ${s.submitted ? 'rgba(52,211,153,0.35)' : LINE}`, borderRadius: 10, overflow: 'hidden' }}>
                <button onClick={() => setOpen(isOpen ? null : s.id)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff' }}>
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
          })}
        </div>
      ))}
    </div>
  )
}

const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }
}
