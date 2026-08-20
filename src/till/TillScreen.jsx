import React, { useEffect, useMemo, useState } from 'react'
import liveTill from './data/liveTill.json'
import { gbp } from './gp.js'
import useIsMobile from '../lib/useIsMobile.js'

// ─── TILL — the ringing screen with TABLES & TABS (demo) ────────────────────
// K Series flow, copied (docs/till-architecture.md): an order is opened against
// a TABLE, a named TAB, or as a QUICK SALE → lines added → SEND (kitchen docket)
// → ADDITION (the bill) → PAY → closed. Several orders stay open at once and the
// floor view shows what's where.
//
// DEMO discipline: orders persist in THIS device's browser (localStorage) so a
// refresh doesn't lose a test — but nothing is written to any server, no sale is
// recorded anywhere, and Lightspeed stays the till of record. The till_* schema
// with sessions, Z-reads and the append-only audit trail is the next slice.

const CREAM = 'var(--cream)', DIM = 'rgba(255,255,255,0.55)', GOLD = 'var(--gold)'
const LINE = 'rgba(255,255,255,0.12)', GREEN = '#34D399', AMBER = '#F59E0B'

// Demo floor plan — rename/extend when the venue confirms its real layout.
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
  id: 'o' + (nextId++), kind, ref, lines: [], openedAt: new Date().toISOString(), status: 'open',
})

export default function TillScreen() {
  const isMobile = useIsMobile()
  const pages = liveTill.pages
  const [orders, setOrders] = useState(loadOrders)       // { id: order }
  const [currentId, setCurrentId] = useState(null)       // open order being rung
  const [screen, setScreen] = useState('floor')          // 'floor' | 'ring' | 'bill'
  const [pageName, setPageName] = useState(pages[0]?.name)
  const [query, setQuery] = useState('')
  const [closed, setClosed] = useState(null)             // last paid order (for the toast)

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(orders)) } catch { /* private mode */ }
  }, [orders])

  const open = Object.values(orders).filter(o => o.status === 'open')
  const orderFor = (kind, ref) => open.find(o => o.kind === kind && o.ref === ref)
  const current = currentId ? orders[currentId] : null
  const totalOf = (o) => o.lines.reduce((s, l) => s + l.qty * l.price, 0)
  const unsentOf = (o) => o.lines.reduce((s, l) => s + Math.max(0, l.qty - (l.sentQty || 0)), 0)

  const start = (kind, ref) => {
    const existing = orderFor(kind, ref)
    if (existing) { setCurrentId(existing.id); setScreen('ring'); return }
    const o = newOrder(kind, ref)
    setOrders(prev => ({ ...prev, [o.id]: o }))
    setCurrentId(o.id); setScreen('ring')
  }
  const patch = (id, fn) => setOrders(prev => ({ ...prev, [id]: fn(prev[id]) }))

  // ── ring actions ──────────────────────────────────────────────────────────
  const add = (b) => patch(currentId, o => {
    const key = `${b.product.sku}·${b.serve.label}`
    const hit = o.lines.find(l => l.key === key)
    const label = b.serve.label && b.serve.label !== 'Each' ? ` — ${b.serve.label}` : ''
    return {
      ...o,
      lines: hit
        ? o.lines.map(l => l.key === key ? { ...l, qty: l.qty + 1 } : l)
        : [...o.lines, { key, name: `${b.product.name}${label}`, price: b.serve.price, qty: 1, sentQty: 0, food: b.page === 'Snacks & Food' }],
    }
  })
  const bump = (key, d) => patch(currentId, o => ({
    ...o,
    lines: o.lines.map(l => l.key === key ? { ...l, qty: Math.max(l.sentQty || 0, l.qty + d) } : l)
      .filter(l => l.qty > 0),
  }))
  const send = () => patch(currentId, o => ({ ...o, lines: o.lines.map(l => ({ ...l, sentQty: l.qty })) }))
  const pay = () => {
    const o = orders[currentId]
    setClosed({ ref: refLabel(o), total: totalOf(o) })
    setOrders(prev => { const n = { ...prev }; delete n[currentId]; return n })
    setCurrentId(null); setScreen('floor')
  }

  const refLabel = (o) => o.kind === 'table' ? o.ref : o.kind === 'tab' ? `Tab · ${o.ref}` : 'Quick sale'

  // Going back to the floor with nothing rung = never opened. Otherwise a
  // mis-tapped table shows "occupied · £0.00" until someone notices.
  const toFloor = () => {
    const o = orders[currentId]
    if (o && o.lines.length === 0) {
      setOrders(prev => { const n = { ...prev }; delete n[currentId]; return n })
    }
    setCurrentId(null); setScreen('floor')
  }

  // ── buttons for the ring grid ─────────────────────────────────────────────
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

  // ═══ FLOOR — tables, tabs, quick sale ═══════════════════════════════════
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
                      ? <span style={{ fontSize: 12 }}>{o.lines.reduce((s, l) => s + l.qty, 0)} items · <b>{gbp(totalOf(o))}</b>{unsentOf(o) > 0 && <span style={{ color: AMBER }}> · unsent</span>}</span>
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
                🍺 <b>{o.ref}</b> · {gbp(totalOf(o))}
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

  // ═══ BILL — the addition ══════════════════════════════════════════════════
  if (screen === 'bill') {
    const total = totalOf(current)
    return (
      <div style={{ maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE}`, borderRadius: 12, padding: 18 }}>
          <div className="serif" style={{ fontSize: 18, color: '#fff' }}>No Dice — London Fields</div>
          <div style={{ fontSize: 10.5, color: DIM, marginBottom: 12 }}>No Dice Hackney Ltd · 407 Mentmore Terrace, E8 3PH · DEMO BILL — NOT A VAT RECEIPT</div>
          <div style={{ fontSize: 12.5, color: CREAM, marginBottom: 10, fontWeight: 700 }}>{refLabel(current)}</div>
          {current.lines.map(l => (
            <div key={l.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, padding: '3px 0' }}>
              <span style={{ color: CREAM }}>{l.qty} × {l.name}</span>
              <span style={{ color: CREAM, fontWeight: 600 }}>{gbp(l.qty * l.price)}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, color: DIM }}>Total (inc VAT)</span>
            <span className="serif" style={{ fontSize: 24, color: '#fff' }}>{gbp(total)}</span>
          </div>
          <div style={{ fontSize: 10.5, color: DIM, marginTop: 2 }}>includes VAT {gbp(total - total / 1.2)} @ 20%</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setScreen('ring')} style={btn()}>← Back to order</button>
          <button onClick={pay} style={{ ...bigBtn(true), flex: 1 }}>PAY {gbp(total)} — close (demo)</button>
        </div>
        <div style={{ fontSize: 10.5, color: DIM }}>Real version: this prints on the receipt printer (the "addition"), then takes cash or Square. Demo: it just closes the order.</div>
      </div>
    )
  }

  // ═══ RING — button grid + this order ══════════════════════════════════════
  const total = totalOf(current)
  const unsent = unsentOf(current)
  const foodUnsent = current.lines.reduce((s, l) => s + (l.food ? Math.max(0, l.qty - (l.sentQty || 0)) : 0), 0)

  const orderPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 12, padding: 12, minWidth: isMobile ? undefined : 280, maxWidth: isMobile ? undefined : 310 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{refLabel(current)}</span>
        <button onClick={toFloor} style={{ ...btn(), padding: '5px 10px', fontSize: 11.5 }}>⊞ Floor</button>
      </div>
      {current.lines.length === 0 && <div style={{ fontSize: 12.5, color: DIM, padding: '4px 0 8px' }}>Tap buttons to ring.</div>}
      {current.lines.map(l => (
        <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
          <button onClick={() => bump(l.key, -1)} style={qtyBtn()}>−</button>
          <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 700, color: GOLD }}>{l.qty}</span>
          <button onClick={() => bump(l.key, +1)} style={qtyBtn()}>+</button>
          <span style={{ flex: 1, color: CREAM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {l.name}{(l.sentQty || 0) >= l.qty && <span title="sent" style={{ color: GREEN }}> ✓</span>}
          </span>
          <span style={{ fontWeight: 700, color: CREAM, whiteSpace: 'nowrap' }}>{gbp(l.qty * l.price)}</span>
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 4, paddingTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: DIM }}>Total</span>
        <span className="serif" style={{ fontSize: 26, color: '#fff' }}>{gbp(total)}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={send} disabled={unsent === 0} style={{ ...bigBtn(false), flex: 1, opacity: unsent ? 1 : 0.45 }}>
          SEND{unsent > 0 ? ` (${unsent})` : ''}
        </button>
        <button onClick={() => setScreen('bill')} disabled={current.lines.length === 0} style={{ ...bigBtn(true), flex: 1, opacity: current.lines.length ? 1 : 0.45 }}>
          BILL
        </button>
      </div>
      {foodUnsent > 0 && <div style={{ fontSize: 11, color: AMBER }}>SEND will fire {foodUnsent} food item{foodUnsent > 1 ? 's' : ''} to the kitchen printer (real version).</div>}
      <div style={{ fontSize: 10.5, color: DIM, lineHeight: 1.5 }}>Demo — nothing is recorded. Lightspeed is still the till of record.</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)} placeholder="🔍 find anything…"
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.05)', color: CREAM, fontFamily: 'inherit', fontSize: 13, width: isMobile ? '100%' : 190 }}
        />
        {!query && pages.map(pg => (
          <button key={pg.name} onClick={() => setPageName(pg.name)} style={{
            padding: '7px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
            background: pg.name === pageName ? 'rgba(201,168,76,0.15)' : 'transparent',
            border: `1.5px solid ${pg.name === pageName ? GOLD : LINE}`,
            color: pg.name === pageName ? GOLD : CREAM, fontWeight: pg.name === pageName ? 700 : 400, whiteSpace: 'nowrap',
          }}>{pg.name}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: isMobile ? 'column-reverse' : 'row' }}>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 140 : 150}px, 1fr))`, gap: 8, width: '100%' }}>
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
        {orderPanel}
      </div>
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
  color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, lineHeight: 1,
})
