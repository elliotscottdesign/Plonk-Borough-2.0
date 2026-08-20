import React, { useEffect, useMemo, useState } from 'react'
import liveTill from './data/liveTill.json'
import { gbp } from './gp.js'
import useIsMobile from '../lib/useIsMobile.js'

// ─── TILL — the register, K Series layout (demo) ────────────────────────────
// Founder (20 Aug 2026): "layout should mimic Lightspeed K Series — stock on
// right, calculator and list of orders on left — discount section inline with
// Lightspeed." So the register is:
//
//   LEFT  — the ticket: order lines (tap a line to select it), running total,
//           a numeric keypad (type 3, tap Corona → 3 × Corona, exactly like
//           K Series), and the function row: SEND · DISC · ADDITION.
//   RIGHT — the stock: page rail + product buttons.
//
// Discounts, K Series style: preset % buttons, comp (100%), or a custom % / £
// typed on the keypad — applied to the SELECTED LINE if one is selected,
// otherwise to the whole order, always with its name printed on the ticket
// and the addition. Removing one is one tap in the same panel.
//
// DEMO discipline unchanged: orders persist in this device's browser only,
// nothing is written server-side, Lightspeed stays the till of record.

const CREAM = 'var(--cream)', DIM = 'rgba(255,255,255,0.55)', GOLD = 'var(--gold)'
const LINE = 'rgba(255,255,255,0.12)', GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33'

const FLOOR = [
  { zone: 'Booths', spots: ['Booth 1', 'Booth 2', 'Booth 3', 'Booth 4'] },
  { zone: 'Tables', spots: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'] },
  { zone: 'Bar', spots: ['Bar 1', 'Bar 2'] },
]

const STORE = 'nd_till_demo_orders_v1'
const loadOrders = () => {
  try { return JSON.parse(localStorage.getItem(STORE)) || {} } catch { return {} }
}
let nextId = Date.now()
const newOrder = (kind, ref) => ({
  id: 'o' + (nextId++), kind, ref, lines: [], disc: null, openedAt: new Date().toISOString(), status: 'open',
})

// ── discount arithmetic (all inc-VAT money) ──────────────────────────────────
const lineGross = (l) => l.qty * l.price
const lineDiscAmt = (l) => !l.disc ? 0
  : l.disc.kind === 'pct' ? lineGross(l) * l.disc.value / 100
  : Math.min(l.disc.value, lineGross(l))
const lineTotal = (l) => lineGross(l) - lineDiscAmt(l)
const orderSub = (o) => o.lines.reduce((s, l) => s + lineTotal(l), 0)
const orderDiscAmt = (o) => !o.disc ? 0
  : o.disc.kind === 'pct' ? orderSub(o) * o.disc.value / 100
  : Math.min(o.disc.value, orderSub(o))
const orderTotal = (o) => orderSub(o) - orderDiscAmt(o)

export default function TillScreen() {
  const isMobile = useIsMobile()
  const pages = liveTill.pages
  const [orders, setOrders] = useState(loadOrders)
  const [currentId, setCurrentId] = useState(null)
  const [screen, setScreen] = useState('floor')          // 'floor' | 'ring' | 'bill'
  const [pageName, setPageName] = useState(pages[0]?.name)
  const [query, setQuery] = useState('')
  const [closed, setClosed] = useState(null)
  const [selKey, setSelKey] = useState(null)             // selected ticket line
  const [buf, setBuf] = useState('')                     // keypad buffer
  const [discOpen, setDiscOpen] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(orders)) } catch { /* private mode */ }
  }, [orders])

  const open = Object.values(orders).filter(o => o.status === 'open')
  const orderFor = (kind, ref) => open.find(o => o.kind === kind && o.ref === ref)
  const current = currentId ? orders[currentId] : null
  const unsentOf = (o) => o.lines.reduce((s, l) => s + Math.max(0, l.qty - (l.sentQty || 0)), 0)
  const refLabel = (o) => o.kind === 'table' ? o.ref : o.kind === 'tab' ? `Tab · ${o.ref}` : 'Quick sale'

  const start = (kind, ref) => {
    const existing = orderFor(kind, ref)
    if (existing) { setCurrentId(existing.id); setScreen('ring'); return }
    const o = newOrder(kind, ref)
    setOrders(prev => ({ ...prev, [o.id]: o }))
    setCurrentId(o.id); setScreen('ring')
  }
  const patch = (id, fn) => setOrders(prev => ({ ...prev, [id]: fn(prev[id]) }))
  const resetRingUi = () => { setSelKey(null); setBuf(''); setDiscOpen(false) }

  const toFloor = () => {
    const o = orders[currentId]
    if (o && o.lines.length === 0) {
      setOrders(prev => { const n = { ...prev }; delete n[currentId]; return n })
    }
    setCurrentId(null); setScreen('floor'); resetRingUi()
  }

  // ── ring actions ──────────────────────────────────────────────────────────
  const add = (b) => {
    const qty = Math.max(1, Math.min(99, parseInt(buf || '1', 10) || 1))
    setBuf('')
    patch(currentId, o => {
      const key = `${b.product.sku}·${b.serve.label}`
      const hit = o.lines.find(l => l.key === key)
      const label = b.serve.label && b.serve.label !== 'Each' ? ` — ${b.serve.label}` : ''
      return {
        ...o,
        lines: hit
          ? o.lines.map(l => l.key === key ? { ...l, qty: l.qty + qty } : l)
          : [...o.lines, { key, name: `${b.product.name}${label}`, price: b.serve.price, qty, sentQty: 0, disc: null, food: b.page === 'Snacks & Food' }],
      }
    })
  }
  const bump = (key, d) => patch(currentId, o => ({
    ...o,
    lines: o.lines.map(l => l.key === key ? { ...l, qty: Math.max(l.sentQty || 0, l.qty + d) } : l)
      .filter(l => l.qty > 0),
  }))
  const send = () => patch(currentId, o => ({ ...o, lines: o.lines.map(l => ({ ...l, sentQty: l.qty })) }))
  const pay = () => {
    const o = orders[currentId]
    setClosed({ ref: refLabel(o), total: orderTotal(o) })
    setOrders(prev => { const n = { ...prev }; delete n[currentId]; return n })
    setCurrentId(null); setScreen('floor'); resetRingUi()
  }

  // ── discounts ─────────────────────────────────────────────────────────────
  const applyDisc = (disc) => {          // disc = {kind,value,name} or null to remove
    if (selKey) {
      patch(currentId, o => ({ ...o, lines: o.lines.map(l => l.key === selKey ? { ...l, disc } : l) }))
    } else {
      patch(currentId, o => ({ ...o, disc }))
    }
    setDiscOpen(false); setBuf('')
  }

  // ── product buttons ───────────────────────────────────────────────────────
  const buttons = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = []
    for (const pg of pages) {
      if (!q && pg.name !== pageName) continue
      for (const p of pg.products) for (const s of p.serves) {
        if (q && !(`${p.name} ${s.label} ${s.button || ''}`.toLowerCase().includes(q))) continue
        out.push({ product: p, serve: s, page: pg.name })
      }
    }
    return out
  }, [pages, pageName, query])

  // ═══ FLOOR ════════════════════════════════════════════════════════════════
  if (screen === 'floor') {
    const tabs = open.filter(o => o.kind === 'tab')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {closed && (
          <div style={{ fontSize: 13, color: GREEN, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, padding: '10px 14px' }}>
            ✓ {closed.ref} paid {gbp(closed.total)} — demo only, nothing recorded. Ring it on Lightspeed for real.
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => start('quick', null)} style={bigBtn(true)}>⚡ Quick sale</button>
          <button onClick={() => { const name = prompt('Name for the tab? (e.g. "Sarah — blue jacket")'); if (name?.trim()) start('tab', name.trim()) }} style={bigBtn(false)}>➕ Open a tab</button>
        </div>
        {FLOOR.map(z => (
          <div key={z.zone}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: DIM, marginBottom: 8 }}>{z.zone}</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 100 : 120}px, 1fr))`, gap: 8 }}>
              {z.spots.map(ref => {
                const o = orderFor('table', ref)
                return (
                  <button key={ref} onClick={() => start('table', ref)} style={{
                    minHeight: 74, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: '10px 12px',
                    background: o ? 'rgba(201,168,76,0.13)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${o ? GOLD : LINE}`, color: CREAM,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 4,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: o ? GOLD : CREAM }}>{ref}</span>
                    {o
                      ? <span style={{ fontSize: 12 }}>{o.lines.reduce((s, l) => s + l.qty, 0)} items · <b>{gbp(orderTotal(o))}</b>{unsentOf(o) > 0 && <span style={{ color: AMBER }}> · unsent</span>}</span>
                      : <span style={{ fontSize: 11.5, color: DIM }}>free</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: DIM, marginBottom: 8 }}>Open tabs</div>
          {tabs.length === 0 && <div style={{ fontSize: 12.5, color: DIM }}>No tabs open.</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tabs.map(o => (
              <button key={o.id} onClick={() => { setCurrentId(o.id); setScreen('ring') }} style={{
                borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', padding: '10px 16px',
                background: 'rgba(201,168,76,0.13)', border: `1.5px solid ${GOLD}`, color: CREAM, fontSize: 13,
              }}>
                🍺 <b>{o.ref}</b> · {gbp(orderTotal(o))}
              </button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: DIM, lineHeight: 1.5 }}>
          Demo till — orders live only in this browser; no sale is recorded anywhere. Lightspeed is still the till of
          record. Table names are placeholders until the venue's real floor plan goes in.
        </div>
      </div>
    )
  }

  if (!current) { setScreen('floor'); return null }

  // ═══ ADDITION (the bill) ══════════════════════════════════════════════════
  if (screen === 'bill') {
    const sub = orderSub(current), oDisc = orderDiscAmt(current), total = orderTotal(current)
    return (
      <div style={{ maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE}`, borderRadius: 12, padding: 18 }}>
          <div className="serif" style={{ fontSize: 18, color: '#fff' }}>No Dice — London Fields</div>
          <div style={{ fontSize: 10.5, color: DIM, marginBottom: 12 }}>No Dice Hackney Ltd · 407 Mentmore Terrace, E8 3PH · DEMO BILL — NOT A VAT RECEIPT</div>
          <div style={{ fontSize: 12.5, color: CREAM, marginBottom: 10, fontWeight: 700 }}>{refLabel(current)}</div>
          {current.lines.map(l => (
            <div key={l.key} style={{ padding: '3px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                <span style={{ color: CREAM }}>{l.qty} × {l.name}</span>
                <span style={{ color: CREAM, fontWeight: 600 }}>{gbp(lineGross(l))}</span>
              </div>
              {l.disc && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: AMBER }}>
                  <span>&nbsp;&nbsp;{l.disc.name}</span><span>−{gbp(lineDiscAmt(l))}</span>
                </div>
              )}
            </div>
          ))}
          {current.disc && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, color: AMBER, borderTop: `1px solid ${LINE}`, marginTop: 8, paddingTop: 8 }}>
              <span>{current.disc.name} (whole order)</span><span>−{gbp(oDisc)}</span>
            </div>
          )}
          <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, color: DIM }}>Total (inc VAT)</span>
            <span className="serif" style={{ fontSize: 24, color: '#fff' }}>{gbp(total)}</span>
          </div>
          <div style={{ fontSize: 10.5, color: DIM, marginTop: 2 }}>includes VAT {gbp(total - total / 1.2)} @ 20%{sub !== total ? ` · before discounts ${gbp(sub + 0)}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setScreen('ring')} style={btn()}>← Back to order</button>
          <button onClick={pay} style={{ ...bigBtn(true), flex: 1 }}>PAY {gbp(total)} — close (demo)</button>
        </div>
        <div style={{ fontSize: 10.5, color: DIM }}>Real version: this prints on the receipt printer (the "addition"), then takes cash or Square. Demo: it just closes the order.</div>
      </div>
    )
  }

  // ═══ REGISTER — ticket + keypad LEFT · stock RIGHT (K Series layout) ═══════
  const total = orderTotal(current)
  const unsent = unsentOf(current)
  const foodUnsent = current.lines.reduce((s, l) => s + (l.food ? Math.max(0, l.qty - (l.sentQty || 0)) : 0), 0)
  const selLine = current.lines.find(l => l.key === selKey) || null

  const keypadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '⌫']
  const pressKey = (k) => {
    if (k === 'C') return setBuf('')
    if (k === '⌫') return setBuf(b => b.slice(0, -1))
    setBuf(b => (b + k).slice(0, 4))
  }

  const ticket = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 12, padding: 12, width: isMobile ? '100%' : 330, flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: GOLD }}>{refLabel(current)}</span>
        <button onClick={toFloor} style={{ ...btn(), padding: '5px 10px', fontSize: 11.5 }}>⊞ Floor</button>
      </div>

      {/* the ticket lines — tap a line to select it (for line discounts) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 60, maxHeight: isMobile ? 200 : 300, overflowY: 'auto' }}>
        {current.lines.length === 0 && <div style={{ fontSize: 12.5, color: DIM, padding: '4px 0' }}>Tap stock buttons to ring.</div>}
        {current.lines.map(l => (
          <div key={l.key} onClick={() => setSelKey(selKey === l.key ? null : l.key)} style={{
            display: 'flex', flexDirection: 'column', gap: 1, padding: '5px 6px', borderRadius: 8, cursor: 'pointer',
            background: selKey === l.key ? 'rgba(201,168,76,0.14)' : 'transparent',
            border: `1px solid ${selKey === l.key ? GOLD : 'transparent'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
              <button onClick={(e) => { e.stopPropagation(); bump(l.key, -1) }} style={qtyBtn()}>−</button>
              <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 700, color: GOLD }}>{l.qty}</span>
              <button onClick={(e) => { e.stopPropagation(); bump(l.key, +1) }} style={qtyBtn()}>+</button>
              <span style={{ flex: 1, color: CREAM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {l.name}{(l.sentQty || 0) >= l.qty && l.qty > 0 && <span title="sent" style={{ color: GREEN }}> ✓</span>}
              </span>
              <span style={{ fontWeight: 700, color: CREAM, whiteSpace: 'nowrap' }}>{gbp(lineTotal(l))}</span>
            </div>
            {l.disc && <div style={{ fontSize: 11, color: AMBER, paddingLeft: 76 }}>{l.disc.name} −{gbp(lineDiscAmt(l))}</div>}
          </div>
        ))}
      </div>

      {/* totals */}
      {current.disc && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: AMBER }}>
          <span>{current.disc.name} (order)</span><span>−{gbp(orderDiscAmt(current))}</span>
        </div>
      )}
      <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: DIM }}>Total</span>
        <span className="serif" style={{ fontSize: 26, color: '#fff' }}>{gbp(total)}</span>
      </div>

      {/* keypad — type a number, tap a product: 3 → Corona = 3 × Corona */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, flex: 1 }}>
          {keypadKeys.map(k => (
            <button key={k} onClick={() => pressKey(k)} style={{
              padding: '10px 0', borderRadius: 8, border: `1px solid ${LINE}`, cursor: 'pointer', fontFamily: 'inherit',
              background: 'rgba(255,255,255,0.05)', color: CREAM, fontSize: 15, fontWeight: 600,
            }}>{k}</button>
          ))}
        </div>
        <div style={{ width: 86, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ flex: 1, borderRadius: 8, border: `1px solid ${buf ? GOLD : LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: buf ? GOLD : DIM, background: 'rgba(255,255,255,0.03)' }}>
            {buf ? `×${buf}` : '×1'}
          </div>
          <button onClick={() => setDiscOpen(true)} disabled={current.lines.length === 0} style={{
            padding: '10px 0', borderRadius: 8, border: `1.5px solid ${AMBER}`, cursor: 'pointer', fontFamily: 'inherit',
            background: 'rgba(245,158,11,0.1)', color: AMBER, fontSize: 12.5, fontWeight: 800, opacity: current.lines.length ? 1 : 0.45,
          }}>DISC</button>
        </div>
      </div>

      {/* function row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={send} disabled={unsent === 0} style={{ ...bigBtn(false), flex: 1, opacity: unsent ? 1 : 0.45, padding: '12px 8px' }}>
          SEND{unsent > 0 ? ` (${unsent})` : ''}
        </button>
        <button onClick={() => setScreen('bill')} disabled={current.lines.length === 0} style={{ ...bigBtn(true), flex: 1.3, opacity: current.lines.length ? 1 : 0.45, padding: '12px 8px' }}>
          ADDITION
        </button>
      </div>
      {foodUnsent > 0 && <div style={{ fontSize: 11, color: AMBER }}>SEND will fire {foodUnsent} food item{foodUnsent > 1 ? 's' : ''} to the kitchen printer (real version).</div>}
      <div style={{ fontSize: 10.5, color: DIM, lineHeight: 1.5 }}>Demo — nothing is recorded. Lightspeed is still the till of record.</div>
    </div>
  )

  const discPanel = discOpen && (
    <div onClick={() => setDiscOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--ink-2)', border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, width: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: CREAM }}>Discount</div>
        <div style={{ fontSize: 12, color: selLine ? GOLD : DIM }}>
          {selLine ? <>On the selected line: <b>{selLine.qty} × {selLine.name}</b></> : <>On the <b>whole order</b> — tap a ticket line first to discount just that line.</>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
          {[10, 20, 50].map(v => (
            <button key={v} onClick={() => applyDisc({ kind: 'pct', value: v, name: `${v}% off` })} style={discBtn()}>{v}% off</button>
          ))}
          <button onClick={() => applyDisc({ kind: 'pct', value: 100, name: 'Comp' })} style={discBtn()}>Comp (100%)</button>
          <button onClick={() => { const v = parseFloat(buf); if (v > 0 && v <= 100) applyDisc({ kind: 'pct', value: v, name: `${v}% off` }) }} disabled={!buf} style={{ ...discBtn(), opacity: buf ? 1 : 0.4 }}>
            {buf ? `${buf}% off` : 'Custom % (keypad)'}
          </button>
          <button onClick={() => { const v = parseFloat(buf); if (v > 0) applyDisc({ kind: 'amt', value: v, name: `£${v} off` }) }} disabled={!buf} style={{ ...discBtn(), opacity: buf ? 1 : 0.4 }}>
            {buf ? `£${buf} off` : 'Custom £ (keypad)'}
          </button>
        </div>
        {(selLine ? selLine.disc : current.disc) && (
          <button onClick={() => applyDisc(null)} style={{ ...discBtn(), borderColor: RED, color: RED, background: 'rgba(218,27,51,0.08)' }}>
            Remove {selLine ? 'this line\'s' : 'the order'} discount
          </button>
        )}
        <button onClick={() => setDiscOpen(false)} style={btn()}>Cancel</button>
        <div style={{ fontSize: 10.5, color: DIM }}>Real version: every discount and comp lands in the audit trail with who and why.</div>
      </div>
    </div>
  )

  const stock = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)} placeholder="🔍 find anything…"
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.05)', color: CREAM, fontFamily: 'inherit', fontSize: 13, width: isMobile ? '100%' : 180 }}
        />
        {!query && pages.map(pg => (
          <button key={pg.name} onClick={() => setPageName(pg.name)} style={{
            padding: '7px 11px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5,
            background: pg.name === pageName ? 'rgba(201,168,76,0.15)' : 'transparent',
            border: `1.5px solid ${pg.name === pageName ? GOLD : LINE}`,
            color: pg.name === pageName ? GOLD : CREAM, fontWeight: pg.name === pageName ? 700 : 400, whiteSpace: 'nowrap',
          }}>{pg.name}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 140 : 148}px, 1fr))`, gap: 8 }}>
        {buttons.map(b => (
          <button key={`${b.product.sku}·${b.serve.label}·${b.page}`} onClick={() => add(b)} style={{
            minHeight: 62, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`, color: CREAM, fontFamily: 'inherit',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 4,
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25 }}>
              {b.product.name}{b.serve.label && b.serve.label !== 'Each' ? <span style={{ color: DIM, fontWeight: 400 }}> · {b.serve.label}</span> : null}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: GOLD }}>{gbp(b.serve.price)}</span>
          </button>
        ))}
        {buttons.length === 0 && <div style={{ fontSize: 13, color: DIM, padding: 12 }}>Nothing matches "{query}".</div>}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
      {ticket}
      {stock}
      {discPanel}
    </div>
  )
}

const btn = () => ({
  padding: '8px 12px', borderRadius: 8, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.05)',
  color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5,
})
const bigBtn = (primary) => ({
  padding: '13px 18px', borderRadius: 10, border: primary ? 'none' : `1.5px solid ${GOLD}`,
  background: primary ? GOLD : 'rgba(201,168,76,0.1)', color: primary ? '#141414' : GOLD,
  cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, letterSpacing: '0.02em',
})
const qtyBtn = () => ({
  width: 26, height: 26, borderRadius: 7, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.06)',
  color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, lineHeight: 1, flexShrink: 0,
})
const discBtn = () => ({
  padding: '11px 8px', borderRadius: 9, border: `1.5px solid ${AMBER}`, background: 'rgba(245,158,11,0.08)',
  color: AMBER, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
})
