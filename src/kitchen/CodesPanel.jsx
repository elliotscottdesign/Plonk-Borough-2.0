import React, { useEffect, useState } from 'react'
import { listCodes, createCode, setCodeActive } from './foodOrders.js'

// 🎟 Order codes — party tabs / staff food. Anyone with an OPEN code orders on the
// customer page without a card; every order is tagged to the code and the total
// accrues here. Close the code to "settle" it (take the money at the bar).
const GOLD = '#C9A84C', GREEN = '#34D399', RED = '#DA1B33', BLUE = '#5B8DEF', LINE = 'rgba(201,168,76,0.22)', MUTED = 'rgba(255,255,255,0.55)'
const HEAVY = "Impact, 'Arial Narrow Bold', sans-serif"
const KINDS = [['party', '🎉 Party'], ['staff', '👕 Staff'], ['comp', '🎁 Comp']]
const kindLabel = k => (KINDS.find(x => x[0] === k) || ['', k])[1]
const inp = { background: '#0e0e10', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 8, padding: '9px 10px', fontSize: 14 }

export default function CodesPanel() {
  const [codes, setCodes] = useState(null)
  const [form, setForm] = useState({ code: '', label: '', kind: 'party' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => { try { const r = await listCodes(); setCodes(r.codes || []) } catch (e) { setMsg(e.message) } }
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [])   // eslint-disable-line

  const create = async () => {
    if (form.code.trim().length < 3) { setMsg('Code needs at least 3 characters.'); return }
    setBusy(true); setMsg('')
    try { await createCode(form); setForm({ code: '', label: '', kind: 'party' }); await load(); setMsg('Code created ✓') }
    catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }
  const toggle = async (c) => { setBusy(true); try { await setCodeActive(c.code, !c.active); await load() } catch (e) { alert(e.message) } finally { setBusy(false) } }

  if (codes == null) return <div style={{ color: MUTED, fontSize: 13, padding: '20px 0' }}>Loading codes…</div>
  return (
    <div>
      <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 14 }}>
        A code lets a <b style={{ color: '#fff' }}>party</b> (or staff) order on the customer page <b style={{ color: '#fff' }}>without a card</b> — every order lands on the kitchen screen and the total builds up here. <b style={{ color: '#fff' }}>Close the code</b> to settle it (take the money at the bar).
      </div>

      {/* create */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 10 }}>➕ New code</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))} placeholder="CODE e.g. SMITH" style={{ ...inp, width: 150, textTransform: 'uppercase' }} />
          <button onClick={() => setForm(f => ({ ...f, code: 'ONAROLL' + Math.floor(1000 + Math.random() * 9000) }))} style={{ ...inp, cursor: 'pointer', color: MUTED }}>🎲</button>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Label e.g. Smith birthday" style={{ ...inp, flex: '1 1 160px' }} />
          <select value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
            {KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={create} disabled={busy} style={{ background: GOLD, color: '#1a1a1a', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Create</button>
        </div>
      </div>
      {msg && <div style={{ fontSize: 12.5, color: msg.includes('✓') ? GREEN : GOLD, marginBottom: 10 }}>{msg}</div>}

      {/* list */}
      {codes.length === 0 ? <div style={{ color: MUTED, fontSize: 14, padding: '20px 0', textAlign: 'center' }}>No codes yet.</div> : codes.map(c => (
        <div key={c.code} style={{ background: '#fff', borderRadius: 12, border: `2px solid ${c.active ? GREEN : LINE}`, padding: '12px 14px', marginBottom: 10, color: '#15305c', opacity: c.active ? 1 : 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: HEAVY, fontSize: 22, letterSpacing: '1px' }}>{c.code}</span>
            <span style={{ fontSize: 12, background: '#eef', borderRadius: 999, padding: '2px 9px', fontWeight: 700 }}>{kindLabel(c.kind)}</span>
            {c.label && <span style={{ fontSize: 13.5, color: '#556' }}>{c.label}</span>}
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: c.active ? GREEN : '#999', textTransform: 'uppercase' }}>{c.active ? '● Open' : 'Closed'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 9 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: HEAVY, fontSize: 24, color: RED }}>£{(c.tab.total_pence / 100).toFixed(2)}</span>
              <span style={{ fontSize: 12.5, color: '#8a8275', marginLeft: 8 }}>{c.tab.orders} order{c.tab.orders !== 1 ? 's' : ''} on tab</span>
            </div>
            <button onClick={() => toggle(c)} disabled={busy} style={{ border: 'none', borderRadius: 9, padding: '11px 16px', fontWeight: 800, fontSize: 14, cursor: 'pointer', background: c.active ? RED : GREEN, color: '#fff' }}>
              {c.active ? `Close tab — settle £${(c.tab.total_pence / 100).toFixed(2)}` : 'Reopen'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
