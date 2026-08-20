import React, { useMemo, useState } from 'react'
import liveTill from './data/liveTill.json'
import { gbp } from './gp.js'
import useIsMobile from '../lib/useIsMobile.js'

// ─── TILL — the ringing screen (DEMO) ────────────────────────────────────────
// The real Hackney till layout (K Series export, 20 Aug 2026) as tappable
// buttons: pick a page, tap serves, watch the order build. Its job is to test
// SPEED — if ringing a round of four here takes one more tap than Lightspeed,
// the design is wrong and we fix it before any money moves.
//
// DELIBERATELY writes nothing. No sale is recorded anywhere; Lightspeed stays
// the till of record. Payments, sessions, floats, voids and the append-only
// audit trail are later slices (docs/till-decision.md §7) — not skipped,
// sequenced.

const CREAM = 'var(--cream)', DIM = 'rgba(255,255,255,0.55)', GOLD = 'var(--gold)'
const LINE = 'rgba(255,255,255,0.12)', GREEN = '#34D399'

export default function TillScreen() {
  const isMobile = useIsMobile()
  const pages = liveTill.pages
  const [pageName, setPageName] = useState(pages[0]?.name)
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState([])          // [{ key, name, label, price, qty }]
  const [rung, setRung] = useState(null)          // last "completed" demo order total

  // Every tappable button: one per product×serve. Search cuts across all pages.
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

  const keyOf = (b) => `${b.product.sku}·${b.serve.label}`
  const add = (b) => {
    setRung(null)
    setOrder(prev => {
      const k = keyOf(b)
      const hit = prev.find(l => l.key === k)
      if (hit) return prev.map(l => l.key === k ? { ...l, qty: l.qty + 1 } : l)
      const label = b.serve.label && b.serve.label !== 'Each' ? ` — ${b.serve.label}` : ''
      return [...prev, { key: k, name: `${b.product.name}${label}`, price: b.serve.price, qty: 1 }]
    })
  }
  const bump = (k, d) => setOrder(prev => prev
    .map(l => l.key === k ? { ...l, qty: l.qty + d } : l)
    .filter(l => l.qty > 0))
  const total = order.reduce((s, l) => s + l.qty * l.price, 0)
  const ring = () => { setRung(total); setOrder([]) }

  const orderPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 12, padding: 12, minWidth: isMobile ? undefined : 270, maxWidth: isMobile ? undefined : 300 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: DIM }}>Order</div>
      {order.length === 0 && !rung && <div style={{ fontSize: 12.5, color: DIM, padding: '6px 0 10px' }}>Tap buttons to ring a round.</div>}
      {rung != null && order.length === 0 && (
        <div style={{ fontSize: 12.5, color: GREEN, padding: '4px 0 8px' }}>
          ✓ Rung {gbp(rung)} — demo only, nothing recorded. Ring it on Lightspeed for real.
        </div>
      )}
      {order.map(l => (
        <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <button onClick={() => bump(l.key, -1)} style={qtyBtn()}>−</button>
          <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 700, color: GOLD }}>{l.qty}</span>
          <button onClick={() => bump(l.key, +1)} style={qtyBtn()}>+</button>
          <span style={{ flex: 1, color: CREAM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
          <span style={{ fontWeight: 700, color: CREAM, whiteSpace: 'nowrap' }}>{gbp(l.qty * l.price)}</span>
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 4, paddingTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: DIM }}>Total</span>
        <span className="serif" style={{ fontSize: 26, color: '#fff' }}>{gbp(total)}</span>
      </div>
      <button onClick={ring} disabled={order.length === 0} style={{
        padding: '13px 10px', borderRadius: 10, border: 'none', cursor: order.length ? 'pointer' : 'default',
        background: order.length ? GOLD : 'rgba(255,255,255,0.07)', color: order.length ? '#141414' : DIM,
        fontFamily: 'inherit', fontSize: 15, fontWeight: 800, letterSpacing: '0.02em',
      }}>
        RING IT — DEMO
      </button>
      {order.length > 0 && (
        <button onClick={() => setOrder([])} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${LINE}`, background: 'transparent', color: DIM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
          Clear order
        </button>
      )}
      <div style={{ fontSize: 10.5, color: DIM, lineHeight: 1.5 }}>
        Demo till — no sale is saved anywhere. Lightspeed is still the till of record.
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Page rail + search */}
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

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Button grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 140 : 150}px, 1fr))`, gap: 8, width: '100%' }}>
          {buttons.map(b => (
            <button key={keyOf(b) + b.page} onClick={() => add(b)} style={{
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

const qtyBtn = () => ({
  width: 26, height: 26, borderRadius: 7, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.06)',
  color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, lineHeight: 1,
})
