import React, { useEffect, useState } from 'react'
import { getStock, setStock, setStockOverride, ensureStock } from './foodOrders.js'
import { getMenu } from './menuApi.js'

// 📦 Live On A Roll stock — now DRIVEN BY THE MENU. Every non-archived dish is
// tracked: dishes that share a limiting ingredient (buns/patties…) show that
// ingredient; a dish with no shared ingredient (e.g. Padron Peppers) gets its own
// per-item line. Set/replenish counts any time; the order page reads them live →
// "Only X left" and auto "Sold out" at 0, so we never oversell. New menu items
// appear here automatically with the same controls.
const GOLD = '#C9A84C', GREEN = '#34D399', RED = '#DA1B33', LINE = 'rgba(201,168,76,0.22)', MUTED = 'rgba(255,255,255,0.55)'
const HEAVY = "Impact, 'Arial Narrow Bold', sans-serif"
// Friendly labels for the known shared ingredients; anything else falls back to
// the saved stock label or a tidied-up key.
const ING_LABEL = { buns: '🍞 Brioche buns', patties: '🥩 Beef patties', halloumi: '🧀 Halloumi', mortadella: '🥓 Mortadella', springrolls: '🥟 Frozen spring rolls' }
const titleCase = s => String(s).replace(/^itm_/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const qbtn = { background: '#0e0e10', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 8, padding: '7px 11px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }
const ovbtn = { background: 'transparent', border: `1px solid ${LINE}`, color: MUTED, borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }

// From the live menu, work out every stock line + which dishes it gates.
function buildLines(sections, levels) {
  const order = [], seen = new Map()
  for (const sec of (sections || [])) for (const it of (sec.items || [])) {
    if (!it.name || !it.name.trim() || it.archived) continue
    let keys = Array.isArray(it.stock) ? it.stock.filter(Boolean) : []
    if (!keys.length) keys = ['itm_' + it.id]
    for (const k of keys) {
      const perItem = String(k).startsWith('itm_')
      if (!seen.has(k)) { seen.set(k, { items: [], perItem, label: perItem ? it.name.trim() : (ING_LABEL[k] || levels?.[k]?.label || titleCase(k)) }); order.push(k) }
      seen.get(k).items.push(it.name.trim())
    }
  }
  return order.map(k => ({ key: k, ...seen.get(k) }))
}

export default function StockPanel() {
  const [levels, setLevels] = useState(null)
  const [lines, setLines] = useState([])
  const [draft, setDraft] = useState({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const [m, s] = await Promise.all([getMenu(), getStock()])
      let lv = s.levels || {}
      let built = buildLines(m.sections, lv)
      // Create a stock row for any menu line that doesn't have one yet (new dishes).
      if (built.some(l => !lv[l.key])) {
        await ensureStock(built.map(l => ({ ingredient: l.key, label: l.perItem ? l.label : l.key }))).catch(() => {})
        lv = (await getStock()).levels || {}
        built = buildLines(m.sections, lv)
      }
      setLevels(lv); setLines(built)
      setDraft(Object.fromEntries(built.map(l => [l.key, String(lv[l.key]?.count ?? 0)])))
    } catch (e) { setMsg(e.message) }
  }
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [])   // eslint-disable-line

  const save = async () => {
    setBusy(true); setMsg('')
    try {
      const payload = Object.fromEntries(lines.map(l => [l.key, Math.max(0, parseInt(draft[l.key], 10) || 0)]))
      await setStock(payload); await load(); setMsg('Saved ✓ — the customer menu now reflects these counts.')
    } catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }
  const bump = (key, delta) => setDraft(d => ({ ...d, [key]: String(Math.max(0, (parseInt(d[key], 10) || 0) + delta)) }))
  const doOverride = async (key, ov) => { setBusy(true); try { await setStockOverride(key, ov); await load() } catch (e) { alert(e.message) } finally { setBusy(false) } }

  if (levels == null) return <div style={{ color: MUTED, fontSize: 13, padding: '20px 0' }}>Loading stock…</div>
  return (
    <div>
      <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 14 }}>
        How many <b style={{ color: '#fff' }}>servings</b> you have right now. The order page shows <b style={{ color: '#fff' }}>“Only X left”</b> and auto <b style={{ color: '#fff' }}>“Sold out”</b> at 0 — so you never sell what you don't have. <b style={{ color: '#fff' }}>Every menu item is listed here automatically.</b> A new count is set to <b style={{ color: GREEN }}>Force ON</b> (unlimited) until you give it a number or force it off.
      </div>
      {lines.length === 0 && <div style={{ color: MUTED, fontSize: 14, padding: '20px 0', textAlign: 'center' }}>No live menu items yet.</div>}
      {lines.map(l => {
        const lv = levels[l.key] || {}
        const soldOut = lv.soldOut
        const gates = l.perItem ? 'this dish' : l.items.join(' · ')
        return (
          <div key={l.key} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${soldOut ? RED : LINE}`, borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{l.perItem ? '🍽 ' : ''}{l.label}</span>
              <span style={{ fontSize: 11.5, color: MUTED }}>gates {gates}</span>
              {soldOut && <span style={{ marginLeft: 'auto', fontFamily: HEAVY, color: RED, fontSize: 14, textTransform: 'uppercase' }}>Sold out</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <input type="number" min="0" value={draft[l.key] ?? ''} onChange={e => setDraft(d => ({ ...d, [l.key]: e.target.value.replace(/[^0-9]/g, '') }))}
                style={{ width: 72, background: '#0e0e10', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 8, padding: '8px', fontSize: 18, fontWeight: 800, textAlign: 'center' }} />
              <span style={{ fontSize: 12, color: MUTED }}>left</span>
              {[5, 10, 40].map(n => <button key={n} onClick={() => bump(l.key, n)} style={qbtn}>+{n}</button>)}
              <button onClick={() => setDraft(d => ({ ...d, [l.key]: '0' }))} style={{ ...qbtn, borderColor: RED, color: RED }}>set 0</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: MUTED, alignSelf: 'center', marginRight: 2 }}>Override:</span>
              {[['Auto', null, GOLD], ['Force ON', 'available', GREEN], ['Force OFF', 'sold_out', RED]].map(([lab, ov, c]) => {
                const on = (lv.override || null) === ov
                return <button key={lab} onClick={() => doOverride(l.key, ov)} style={{ ...ovbtn, ...(on ? { background: c, color: '#1a1a1a', borderColor: 'transparent' } : {}) }}>{lab}</button>
              })}
            </div>
          </div>
        )
      })}
      {lines.length > 0 && <button onClick={save} disabled={busy} style={{ width: '100%', border: 'none', borderRadius: 11, padding: '13px', fontFamily: HEAVY, fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', background: GOLD, color: '#1a1a1a', marginTop: 6 }}>{busy ? 'Saving…' : '💾 Save counts'}</button>}
      {msg && <div style={{ fontSize: 12.5, color: msg.startsWith('Saved') ? GREEN : GOLD, marginTop: 10, lineHeight: 1.5 }}>{msg}</div>}
    </div>
  )
}
