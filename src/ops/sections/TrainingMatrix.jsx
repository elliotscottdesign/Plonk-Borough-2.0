import React, { useState, useEffect } from 'react'
import { rotaTrainingLog } from '../../rota/api.js'
import { MODULE_META, cocktailKey } from '../../rota/training.js'
import { SPECS } from '../data/cocktailSpecs.js'

// ─── Training matrix (founder) ───────────────────────────────────────────────
// Who's completed which training module + how many cocktails they're signed off
// on. Reads training_completions via the `rota` fn; staff come from the parent.

const GREEN = '#34D399', RED = '#DA1B33', LINE = 'rgba(255,255,255,0.12)'

export default function TrainingMatrix({ staff = [] }) {
  const [byStaff, setByStaff] = useState({})   // staff_id → Set(item_key)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const r = await rotaTrainingLog()
      const m = {}
      for (const c of r.completions || []) (m[c.staff_id] ||= new Set()).add(c.item_key)
      setByStaff(m)
    } catch (e) { setErr(e.message || 'Could not load training.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const done = (id, key) => byStaff[id]?.has(key)
  const modN = (id) => MODULE_META.filter(m => done(id, m.key)).length
  const cocktailN = (id) => SPECS.filter(s => done(id, cocktailKey(s.id))).length
  const people = staff.filter(s => s.active !== false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 22, color: '#fff' }}>🎓 Training</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Who's completed which module, and how many cocktails they're trained on.</div>
        </div>
        <button onClick={load} disabled={loading} style={btn}>↻ Refresh</button>
      </div>

      {err && <div style={{ fontSize: 12.5, color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 12px' }}>{err}</div>}

      {loading ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', padding: '24px 0', textAlign: 'center' }}>Loading…</div>
      ) : people.length === 0 ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px 16px' }}>No active team members yet — add them on the Team tab.</div>
      ) : (
        <div style={{ overflowX: 'auto', border: `1px solid ${LINE}`, borderRadius: 10, background: '#0A0A0A' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                <th style={{ ...th, position: 'sticky', left: 0, background: '#0A0A0A', textAlign: 'left', minWidth: 130 }}>Team member</th>
                {MODULE_META.map(m => <th key={m.key} title={m.title} style={{ ...th, fontSize: 15, cursor: 'help' }}>{m.icon}</th>)}
                <th style={{ ...th, fontSize: 15 }} title="Cocktails trained">🍸</th>
              </tr>
            </thead>
            <tbody>
              {people.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ ...td, position: 'sticky', left: 0, background: '#0A0A0A', textAlign: 'left', fontWeight: 600, color: '#fff' }}>
                    {s.name}
                    <div style={{ fontSize: 10, color: modN(s.id) >= MODULE_META.length ? GREEN : 'rgba(255,255,255,0.45)', fontWeight: 400 }}>{modN(s.id)}/{MODULE_META.length} modules</div>
                  </td>
                  {MODULE_META.map(m => (
                    <td key={m.key} style={td}>{done(s.id, m.key) ? <span style={{ color: GREEN, fontWeight: 800 }}>✓</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>}</td>
                  ))}
                  <td style={{ ...td, fontWeight: 700, color: cocktailN(s.id) >= SPECS.length ? GREEN : cocktailN(s.id) > 0 ? '#fff' : 'rgba(255,255,255,0.3)' }}>{cocktailN(s.id)}/{SPECS.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 8, padding: '12px 14px' }}>
        Hover a column icon for the module name. Staff mark their own training complete in the portal (Training tab) as they read each module and get signed off on cocktails.
      </div>
    </div>
  )
}

const th = { padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.65)', fontWeight: 600, whiteSpace: 'nowrap' }
const td = { padding: '9px 8px', textAlign: 'center', color: '#fff' }
const btn = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', whiteSpace: 'nowrap' }
