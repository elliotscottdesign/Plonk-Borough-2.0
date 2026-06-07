import React, { useState, useMemo } from 'react'
import { STOCK_CATEGORIES, STOCK_META } from '../data/stockItems.js'

// ─── Stock List — the full picture of what's behind the bar ──────────────
// Every physical product to track (by product, not by measure), consolidated
// from the wet stock tracker and cross-referenced with sales. Never-sold items
// are flagged so nothing gets missed at stocktake.

export default function StockList() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all') // all | movers | never

  const cats = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return STOCK_CATEGORIES.map(c => {
      const items = c.items.filter(it => {
        if (filter === 'movers' && !it.sold) return false
        if (filter === 'never' && it.sold) return false
        if (needle && !it.name.toLowerCase().includes(needle)) return false
        return true
      })
      return { ...c, items }
    }).filter(c => c.items.length > 0)
  }, [q, filter])

  const shown = cats.reduce((s, c) => s + c.items.length, 0)

  const copyList = () => {
    const L = [`NO DICE HACKNEY · BAR STOCK LIST (${STOCK_META.totalProducts} products)`, '']
    STOCK_CATEGORIES.forEach(c => {
      L.push(`${c.label}  (track in ${c.unit})`)
      c.items.forEach(it => L.push(`  ${it.sold ? '·' : '○'} ${it.name}`))
      L.push('')
    })
    L.push('○ = stocked but no recorded sales — set a par level')
    const text = L.join('\n')
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="serif" style={{ fontSize: 22, color: 'var(--cream)' }}>Stock List</div>
      <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, maxWidth: 780 }}>
        Everything behind the bar, by product — the wet stock tracker consolidated (measures + bottle/keg/can sizes
        merged into one line each) and checked against what's actually selling. The <strong style={{ color: '#FBBF24' }}>○ never-sold</strong>{' '}
        items are stocked but had no recorded sales — they still need a par level, so they're kept in the list rather than missed.
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
        {[
          ['Tracked products', STOCK_META.totalProducts, 'physical bar stock'],
          ['Never sold', STOCK_META.neverSold, 'stocked · needs par'],
          ['Categories', STOCK_CATEGORIES.length, 'spirits, beer, wine…'],
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
        <input
          value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…"
          style={{ flex: '1 1 220px', padding: '10px 14px', fontSize: 13, borderRadius: 8, background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--cream)', outline: 'none' }}
        />
        {[['all', 'All'], ['movers', 'Movers'], ['never', '○ Never sold']].map(([k, l]) => {
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
        <button onClick={copyList} style={{ padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: 'var(--gold)', color: 'var(--ink)', border: 'none', fontWeight: 600 }}>Copy full list</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{shown} shown</div>

      {/* Categories */}
      {cats.map(c => (
        <div key={c.label} style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{c.items.length} · track in {c.unit}</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {c.items.map(it => (
              <span key={it.name} title={it.sold ? 'Selling' : 'Stocked but no recorded sales — set a par level'} style={{
                fontSize: 12, padding: '5px 10px', borderRadius: 7,
                background: it.sold ? 'rgba(255,255,255,0.04)' : 'rgba(251,191,36,0.08)',
                border: `1px solid ${it.sold ? 'rgba(255,255,255,0.1)' : 'rgba(251,191,36,0.4)'}`,
                color: it.sold ? 'var(--cream)' : '#FCD34D',
              }}>
                {!it.sold && <span style={{ marginRight: 5 }}>○</span>}{it.name}
              </span>
            ))}
          </div>
        </div>
      ))}

      <div style={{ fontSize: 10, color: 'var(--gold-dim)', lineHeight: 1.6 }}>
        Source · {STOCK_META.source}. Consolidated by product — every measure & bottle size of the same line counts as one
        item to track. {STOCK_META.serves} cocktails / serves and the games, kitchen-food and till-deal lines are excluded
        (made to order or not bar stock). Next step: set par levels per product and this becomes the stocktake sheet.
      </div>
    </div>
  )
}
