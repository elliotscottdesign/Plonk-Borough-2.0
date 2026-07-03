import React, { useState, useEffect } from 'react'
import { rotaTrainingLog } from '../../rota/api.js'
import { MODULE_META, MODULES, TRAINING_CATEGORIES, moduleByKey, cocktailKey } from '../../rota/training.js'
import { SPECS } from '../data/cocktailSpecs.js'
import TrainingDoc from '../../rota/TrainingDoc.jsx'
import TrainingEditor from '../../rota/TrainingEditor.jsx'

// ─── Training matrix (founder) ───────────────────────────────────────────────
// Who's completed which training module + how many cocktails they're signed off
// on. Reads training_completions via the `rota` fn; staff come from the parent.

const GREEN = '#34D399', RED = '#DA1B33', LINE = 'rgba(255,255,255,0.12)'

export default function TrainingMatrix({ staff = [] }) {
  const [byStaff, setByStaff] = useState({})   // staff_id → Set(item_key)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('matrix')     // 'matrix' | 'docs'
  const [docKey, setDocKey] = useState(null)   // module being viewed in Documents
  const [editingDoc, setEditingDoc] = useState(false)
  const [docReloadKey, setDocReloadKey] = useState(0)

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
        {tab === 'matrix' && <button onClick={load} disabled={loading} style={btn}>↻ Refresh</button>}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {[['matrix', '✅ Progress'], ['docs', '📄 Documents']].map(([k, lbl]) => (
          <button key={k} onClick={() => { setTab(k); setDocKey(null) }} style={{ padding: '7px 14px', fontSize: 12.5, borderRadius: 8, cursor: 'pointer', background: tab === k ? 'rgba(218,27,51,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${tab === k ? RED : LINE}`, color: tab === k ? '#fff' : 'rgba(255,255,255,0.8)', fontWeight: tab === k ? 700 : 400 }}>{lbl}</button>
        ))}
      </div>

      {tab === 'matrix' ? (<>
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
          Hover a column icon for the module name. Staff mark their own training complete in the portal as they read each module and get signed off on cocktails.
        </div>
      </>) : docKey ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => { setDocKey(null); setEditingDoc(false) }} style={btn}>‹ All documents</button>
            {!editingDoc && <button onClick={() => setEditingDoc(true)} style={btn}>✏️ Edit this doc</button>}
          </div>
          {editingDoc
            ? <TrainingEditor moduleKey={docKey} onClose={() => { setEditingDoc(false); setDocReloadKey(k => k + 1) }} />
            : <TrainingDoc key={docReloadKey} moduleKey={docKey} />}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>Every training document staff see — read them, or open the print version for a black-&-white hard copy.</div>
          {TRAINING_CATEGORIES.map(cat => {
            const rows = MODULES.filter(m => m.category === cat)
            if (!rows.length) return null
            return (
              <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{cat}</div>
                <div style={{ background: '#0A0A0A', border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
                  {rows.map((m, i) => (
                    <button key={m.key} onClick={() => setDocKey(m.key)} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', padding: '12px 14px', background: 'transparent', border: 'none', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', color: '#fff' }}>
                      <span style={{ fontSize: 19, flexShrink: 0 }}>{m.icon}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 14 }}>{m.title}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>read / print ›</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const th = { padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.65)', fontWeight: 600, whiteSpace: 'nowrap' }
const td = { padding: '9px 8px', textAlign: 'center', color: '#fff' }
const btn = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', whiteSpace: 'nowrap' }
