import React, { useEffect, useState } from 'react'
import { getStock, setStock, setStockOverride } from './foodOrders.js'

// 📦 Live On A Roll stock — the limiting ingredients that gate the customer menu.
// Set/replenish counts ANY time (open, mid-shift, close); the order page reads them
// live → shows "Only X left" and auto "Sold out" at 0, so we never oversell.
const GOLD = '#C9A84C', GREEN = '#34D399', RED = '#DA1B33', LINE = 'rgba(201,168,76,0.22)', MUTED = 'rgba(255,255,255,0.55)'
const HEAVY = "Impact, 'Arial Narrow Bold', sans-serif"
const TRACKED = [
  { key: 'buns', label: '🍞 Brioche buns', gates: 'every roll (Cheeseburger · Halloumi · Mortadella)' },
  { key: 'patties', label: '🥩 Beef patties', gates: 'Cheeseburger' },
  { key: 'halloumi', label: '🧀 Halloumi', gates: 'Halloumi Burger' },
  { key: 'mortadella', label: '🥓 Mortadella', gates: 'Bella Mortadella' },
  { key: 'springrolls', label: '🥟 Frozen spring rolls', gates: 'Spring Rolls' },
]
const qbtn = { background: '#0e0e10', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 8, padding: '7px 11px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }
const ovbtn = { background: 'transparent', border: `1px solid ${LINE}`, color: MUTED, borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }

export default function StockPanel() {
  const [levels, setLevels] = useState(null)
  const [draft, setDraft] = useState({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const r = await getStock(); setLevels(r.levels || {})
      setDraft(Object.fromEntries(TRACKED.map(t => [t.key, String(r.levels?.[t.key]?.count ?? 0)])))
    } catch (e) { setMsg(e.message) }
  }
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [])   // eslint-disable-line

  const save = async () => {
    setBusy(true); setMsg('')
    try {
      const payload = Object.fromEntries(TRACKED.map(t => [t.key, Math.max(0, parseInt(draft[t.key], 10) || 0)]))
      await setStock(payload); await load(); setMsg('Saved ✓ — the customer menu now reflects these counts.')
    } catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }
  const bump = (key, delta) => setDraft(d => ({ ...d, [key]: String(Math.max(0, (parseInt(d[key], 10) || 0) + delta)) }))
  const doOverride = async (key, ov) => { setBusy(true); try { await setStockOverride(key, ov); await load() } catch (e) { alert(e.message) } finally { setBusy(false) } }

  if (levels == null) return <div style={{ color: MUTED, fontSize: 13, padding: '20px 0' }}>Loading stock…</div>
  return (
    <div>
      <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 14 }}>
        How many <b style={{ color: '#fff' }}>servings</b> you have right now. The order page shows <b style={{ color: '#fff' }}>“Only X left”</b> and auto <b style={{ color: '#fff' }}>“Sold out”</b> at 0 — so you never sell what you don't have. Made or bought more mid-shift? Bump the number and <b style={{ color: '#fff' }}>Save</b> — it goes live instantly.
      </div>
      {TRACKED.map(t => {
        const lv = levels[t.key] || {}
        const soldOut = lv.soldOut
        return (
          <div key={t.key} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${soldOut ? RED : LINE}`, borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{t.label}</span>
              <span style={{ fontSize: 11.5, color: MUTED }}>gates {t.gates}</span>
              {soldOut && <span style={{ marginLeft: 'auto', fontFamily: HEAVY, color: RED, fontSize: 14, textTransform: 'uppercase' }}>Sold out</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <input type="number" min="0" value={draft[t.key] ?? ''} onChange={e => setDraft(d => ({ ...d, [t.key]: e.target.value.replace(/[^0-9]/g, '') }))}
                style={{ width: 72, background: '#0e0e10', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 8, padding: '8px', fontSize: 18, fontWeight: 800, textAlign: 'center' }} />
              <span style={{ fontSize: 12, color: MUTED }}>left</span>
              {[5, 10, 40].map(n => <button key={n} onClick={() => bump(t.key, n)} style={qbtn}>+{n}</button>)}
              <button onClick={() => setDraft(d => ({ ...d, [t.key]: '0' }))} style={{ ...qbtn, borderColor: RED, color: RED }}>set 0</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: MUTED, alignSelf: 'center', marginRight: 2 }}>Override:</span>
              {[['Auto', null, GOLD], ['Force ON', 'available', GREEN], ['Force OFF', 'sold_out', RED]].map(([l, ov, c]) => {
                const on = (lv.override || null) === ov
                return <button key={l} onClick={() => doOverride(t.key, ov)} style={{ ...ovbtn, ...(on ? { background: c, color: '#1a1a1a', borderColor: 'transparent' } : {}) }}>{l}</button>
              })}
            </div>
          </div>
        )
      })}
      <button onClick={save} disabled={busy} style={{ width: '100%', border: 'none', borderRadius: 11, padding: '13px', fontFamily: HEAVY, fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', background: GOLD, color: '#1a1a1a', marginTop: 6 }}>{busy ? 'Saving…' : '💾 Save counts'}</button>
      {msg && <div style={{ fontSize: 12.5, color: msg.startsWith('Saved') ? GREEN : GOLD, marginTop: 10, lineHeight: 1.5 }}>{msg}</div>}
    </div>
  )
}
