import React, { useState, useMemo, useEffect } from 'react'
import { STOCK_CATEGORIES, STOCK_META } from '../data/stockItems.js'

// ─── Stock List + Par / reorder sheet ────────────────────────────────────
// Every physical product behind the bar (by product), with a par level
// computed from the latest Lightspeed usage: weekend-safe cover + buffer.
//   par(use) = use<=0 ? 1 : ceil(use × coverShare × (1 + buffer)), floor 1
// Enter on-hand at stocktake → "to order" = par − on-hand. On-hand persists
// locally so a count isn't lost on refresh.

const COVERS = [
  { key: 'weekend', label: 'Weekend-safe', share: 0.77, hint: 'Fri–Sun' },
  { key: 'cycle',   label: 'Delivery cycle', share: 0.29, hint: '~2 days' },
  { key: 'week',    label: 'Full week', share: 1.0, hint: '7 days' },
]
const ONHAND_KEY = 'ndb_ops_onhand_v1'

export default function StockList() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all') // all | movers | never | below
  const [coverKey, setCoverKey] = useState('weekend')
  const [buffer, setBuffer] = useState(0.25)
  const [onhand, setOnhand] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ONHAND_KEY) || '{}') } catch { return {} }
  })
  useEffect(() => {
    try { localStorage.setItem(ONHAND_KEY, JSON.stringify(onhand)) } catch { /* ignore */ }
  }, [onhand])

  const cover = COVERS.find(c => c.key === coverKey).share
  const parOf = (use) => (use <= 0 ? 1 : Math.max(1, Math.ceil(use * cover * (1 + buffer))))
  const toOrder = (it) => Math.max(0, parOf(it.use) - (Number(onhand[it.name]) || 0))

  const cats = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return STOCK_CATEGORIES.map(c => {
      const items = c.items.filter(it => {
        if (filter === 'movers' && !it.sold) return false
        if (filter === 'never' && it.sold) return false
        if (filter === 'below' && toOrder(it) <= 0) return false
        if (needle && !it.name.toLowerCase().includes(needle)) return false
        return true
      })
      return { ...c, items }
    }).filter(c => c.items.length > 0)
  }, [q, filter, onhand, coverKey, buffer])

  const allItems = STOCK_CATEGORIES.flatMap(c => c.items)
  const belowCount = allItems.filter(it => toOrder(it) > 0).length
  const shown = cats.reduce((s, c) => s + c.items.length, 0)

  const setHand = (name, v) => setOnhand(o => ({ ...o, [name]: v }))

  const copyOrder = () => {
    const L = [`NO DICE HACKNEY · REORDER (to par · ${COVERS.find(c => c.key === coverKey).label} +${Math.round(buffer * 100)}%)`, '']
    STOCK_CATEGORIES.forEach(c => {
      const due = c.items.filter(it => toOrder(it) > 0)
      if (!due.length) return
      L.push(c.label)
      due.forEach(it => L.push(`  ${it.name}: ${toOrder(it)} × ${it.size}`))
      L.push('')
    })
    navigator.clipboard?.writeText(L.join('\n')).catch(() => {})
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="serif" style={{ fontSize: 22, color: 'var(--cream)' }}>Stock List &amp; Par</div>
      <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, maxWidth: 800 }}>
        Every product behind the bar with a <strong style={{ color: 'var(--cream)' }}>par level</strong> from the latest
        Lightspeed usage — sized to survive the cover window below (weekend-safe by default, since Saturday is 42% of the
        week) plus a buffer. Count on-hand at stocktake and it tells you what to order back up to par. Never-sold lines hold a
        par of 1. <span style={{ color: '#FBBF24' }}>○ = stocked but no recorded sales.</span>
      </div>

      {/* Par dials */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: 16, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)', marginBottom: 6 }}>Cover window</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {COVERS.map(c => {
              const on = coverKey === c.key
              return (
                <button key={c.key} onClick={() => setCoverKey(c.key)} style={{
                  padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                  background: on ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${on ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
                  color: on ? 'var(--gold)' : 'var(--cream)', fontWeight: on ? 600 : 400,
                }}>{c.label} <span style={{ opacity: 0.6 }}>· {c.hint}</span></button>
              )
            })}
          </div>
        </div>
        <div style={{ flex: '1 1 200px', minWidth: 180 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)', marginBottom: 6 }}>Safety buffer · {Math.round(buffer * 100)}%</div>
          <input type="range" min="0" max="0.5" step="0.05" value={buffer} onChange={e => setBuffer(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--gold)' }} />
        </div>
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
        {[
          ['Tracked products', STOCK_META.totalProducts, 'physical bar stock'],
          ['Below par', belowCount, 'lines to order'],
          ['Never sold', STOCK_META.neverSold, 'par 1 · review'],
          ['Serves excluded', STOCK_META.serves, 'cocktails / deals'],
        ].map(([l, v, s]) => (
          <div key={l} style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)' }}>{l}</div>
            <div className="serif" style={{ fontSize: 26, color: 'var(--gold)', lineHeight: 1.2 }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…"
          style={{ flex: '1 1 200px', padding: '10px 14px', fontSize: 13, borderRadius: 8, background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--cream)', outline: 'none' }} />
        {[['all', 'All'], ['below', 'Below par'], ['movers', 'Movers'], ['never', '○ Never sold']].map(([k, l]) => {
          const on = filter === k
          return (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
              background: on ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${on ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
              color: on ? 'var(--gold)' : 'var(--cream)', fontWeight: on ? 600 : 400,
            }}>{l}</button>
          )
        })}
        <button onClick={copyOrder} style={{ padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: 'var(--gold)', color: 'var(--ink)', border: 'none', fontWeight: 600 }}>Copy reorder</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{shown} shown · enter on-hand to get “to order”</div>

      {/* Categories — par sheet rows */}
      {cats.map(c => (
        <div key={c.label} style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{c.items.length} · {c.unit}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 70px 60px', gap: 8, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cream-dim)', paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>Product</div><div style={{ textAlign: 'center' }}>Par</div><div style={{ textAlign: 'center' }}>On hand</div><div style={{ textAlign: 'right' }}>Order</div>
          </div>
          {c.items.map(it => {
            const par = parOf(it.use), ord = toOrder(it)
            return (
              <div key={it.name} style={{ display: 'grid', gridTemplateColumns: '1fr 52px 70px 60px', gap: 8, alignItems: 'center', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ color: it.sold ? 'var(--cream)' : '#FCD34D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {!it.sold && <span style={{ marginRight: 5 }} title="Stocked but no recorded sales">○</span>}{it.name}
                  <span style={{ color: 'var(--cream-dim)', fontSize: 11 }}> · {it.size}</span>
                </div>
                <div style={{ textAlign: 'center', color: 'var(--cream-dim)', fontVariantNumeric: 'tabular-nums' }}>{par}</div>
                <input
                  type="number" min="0" inputMode="numeric"
                  value={onhand[it.name] ?? ''} onChange={e => setHand(it.name, e.target.value)}
                  placeholder="–"
                  style={{ width: '100%', textAlign: 'center', padding: '4px 6px', fontSize: 13, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.25)', color: 'var(--cream)', outline: 'none' }}
                />
                <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: ord > 0 ? 'var(--gold)' : 'var(--cream-dim)' }}>{ord > 0 ? ord : '—'}</div>
              </div>
            )
          })}
        </div>
      ))}

      <div style={{ fontSize: 10, color: 'var(--gold-dim)', lineHeight: 1.6 }}>
        Par = ceil( weekly usage × cover × (1 + buffer) ), floor 1. Usage from {STOCK_META.source}; cocktail-base spirits
        bumped for cocktail draw the till can't brand-split. Campari is lifted ahead of demand for the summer Beericano push
        (revise once it's selling). On-hand saved on this device only. Re-baseline usage as fresher Lightspeed exports land.
        {' '}{STOCK_META.serves} cocktails/serves + games/kitchen/deals excluded (not bar stock).
      </div>
    </div>
  )
}
