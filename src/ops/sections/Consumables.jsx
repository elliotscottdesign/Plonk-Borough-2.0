import React, { useState, useMemo, useEffect } from 'react'
import {
  CONSUMABLES,
  CATEGORIES,
  TRACKING_MONTHS,
  loadOverrides,
  saveOverrides,
} from '../data/consumables.js'

// ─── Consumables — BCS Supplies operational cost tracker ───────────────
// Different shape from Costing: these items don't get marked up + sold,
// they just leave the business as overhead. So no margin computation,
// no sell-price column, no "suggest £". Instead we surface:
//   • Latest unit price (editable — overrides the auto-seeded BCS price)
//   • Pack size
//   • Last invoice date
//   • Orders in tracked period (24 invoices, 14 months)
//   • 14-month spend
//   • Avg £/month (the burn rate that matters for ops planning)
//   • On-hand qty (editable — stocktake input)
//   • Founder notes (editable)
//
// Category tabs across the top; click any row to expand and edit on-hand
// and notes. Top banner shows total tracked spend and per-category share.
// ──────────────────────────────────────────────────────────────────────

const gold = 'var(--gold)'
const cream = 'var(--cream)'
const ink2 = 'rgba(255,255,255,0.04)'
const ink3 = 'rgba(255,255,255,0.08)'
const dim = 'rgba(245,239,227,0.6)'

const fmtMoney = (n) => `£${(Math.round(n * 100) / 100).toFixed(2)}`

export default function Consumables() {
  const [activeCat, setActiveCat] = useState('paper')
  const [state, setState] = useState(() => loadOverrides())
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { saveOverrides(state) }, [state])

  const { prices, onhand, notes } = state

  const setPrice  = (code, v) => setState(s => ({ ...s, prices: { ...s.prices, [code]: v } }))
  const setOnhand = (code, v) => setState(s => ({ ...s, onhand: { ...s.onhand, [code]: v } }))
  const setNote   = (code, v) => setState(s => ({ ...s, notes:  { ...s.notes,  [code]: v } }))
  const resetAll = () => {
    if (confirm('Reset all overrides? Latest prices revert to the auto-seeded BCS invoice values. On-hand counts cleared.')) {
      setState({ prices: {}, onhand: {}, notes: {} })
      setExpanded(null)
    }
  }

  // Effective price per item — override wins, else seed.
  const effPrice = (item) => prices[item.code] != null ? prices[item.code] : item.latestPrice

  const filtered = useMemo(
    () => CONSUMABLES.filter(c => c.category === activeCat),
    [activeCat]
  )

  // Top-line stats — across ALL categories, not just active.
  const totals = useMemo(() => {
    const byCat = {}
    let totalSpend = 0
    for (const it of CONSUMABLES) {
      byCat[it.category] = byCat[it.category] || { spend: 0, items: 0 }
      byCat[it.category].spend += it.totalSpend
      byCat[it.category].items += 1
      totalSpend += it.totalSpend
    }
    return { totalSpend, byCat, totalItems: CONSUMABLES.length }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: cream }}>
      {/* ─── Header / blurb ────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: gold, fontWeight: 700 }}>
          Operations · Consumables
        </div>
        <h2 style={{ margin: '6px 0 0', fontSize: 24, color: gold, fontFamily: 'inherit' }}>BCS supplies — 14-month spend tracker</h2>
        <p style={{ margin: '6px 0 0', color: dim, fontSize: 13, maxWidth: 720 }}>
          Auto-seeded from {totals.totalItems} unique BCS SKUs across 24 invoices (Jan 2025 → Feb 2026, {TRACKING_MONTHS} months).
          These are <strong style={{ color: cream }}>operating costs</strong> — paper, cleaning chemicals, bar disposables — not cost-of-sales. Use this sheet to spot
          where the consumables budget is going, track on-hand for next order, and override the latest unit price as new invoices land.
        </p>
      </div>

      {/* ─── Top-line totals ──────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center',
        background: ink2, border: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', borderRadius: 10,
      }}>
        <Stat label="Items tracked" value={totals.totalItems} />
        <Stat label="14-mo spend" value={fmtMoney(totals.totalSpend)} valueColor={gold} />
        <Stat label="≈ Per month" value={fmtMoney(totals.totalSpend / TRACKING_MONTHS)} />
        <Stat label="Biggest cat." value={(() => {
          const top = Object.entries(totals.byCat).sort((a,b) => b[1].spend - a[1].spend)[0]
          const lbl = CATEGORIES.find(c => c.key === top[0])?.label || top[0]
          return `${lbl} · ${fmtMoney(top[1].spend)}`
        })()} valueColor={cream} />
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={resetAll} style={btnGhost}>Reset overrides</button>
        </div>
      </div>

      {/* ─── Category tabs ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => {
          const on = c.key === activeCat
          const cat = totals.byCat[c.key] || { spend: 0, items: 0 }
          return (
            <button
              key={c.key}
              onClick={() => { setActiveCat(c.key); setExpanded(null) }}
              style={{
                padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                background: on ? 'rgba(201,168,76,0.16)' : ink2,
                border: `2px solid ${on ? gold : 'rgba(255,255,255,0.1)'}`,
                color: on ? gold : cream, letterSpacing: '0.04em', fontWeight: 600,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1,
              }}
            >
              <span>{c.label}</span>
              <span style={{ fontSize: 10, color: on ? gold : dim, fontWeight: 500 }}>
                {cat.items} · {fmtMoney(cat.spend)}
              </span>
            </button>
          )
        })}
      </div>

      {/* ─── Items table ──────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: ink2 }}>
              <th style={th}>SKU</th>
              <th style={th}>Item</th>
              <th style={{ ...th, textAlign: 'right' }}>Pack</th>
              <th style={{ ...th, textAlign: 'right' }}>Latest £ ex-VAT</th>
              <th style={{ ...th, textAlign: 'right' }}>Last ord</th>
              <th style={{ ...th, textAlign: 'right' }}>Orders</th>
              <th style={{ ...th, textAlign: 'right' }}>14-mo £</th>
              <th style={{ ...th, textAlign: 'right' }}>£/mo</th>
              <th style={{ ...th, textAlign: 'right' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(it => {
              const isOpen = expanded === it.code
              const price = effPrice(it)
              return (
                <React.Fragment key={it.code}>
                  <tr style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: isOpen ? 'rgba(201,168,76,0.06)' : 'transparent',
                  }}>
                    <td style={{ ...td, color: dim, fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }}>{it.code}</td>
                    <td style={td}>{it.name}</td>
                    <td style={{ ...td, textAlign: 'right', color: dim }}>{it.pack || '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <input
                        type="number" step={0.01} min={0}
                        value={price}
                        onChange={e => setPrice(it.code, parseFloat(e.target.value) || 0)}
                        style={{ ...inp, width: 80, textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: dim, fontSize: 11 }}>{it.latestDate}</td>
                    <td style={{ ...td, textAlign: 'right', color: dim }}>{it.orders}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{fmtMoney(it.totalSpend)}</td>
                    <td style={{ ...td, textAlign: 'right', color: gold, fontWeight: 700 }}>{fmtMoney(it.avgPerMonth)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <button onClick={() => setExpanded(isOpen ? null : it.code)} style={btnGhost}>
                        {isOpen ? 'Close' : 'Open'}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <td colSpan={9} style={{ padding: 14 }}>
                        <DetailPanel
                          item={it}
                          price={price}
                          onhandVal={onhand[it.code] ?? ''}
                          setOnhand={v => setOnhand(it.code, v)}
                          note={notes[it.code] ?? ''}
                          setNote={v => setNote(it.code, v)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...td, color: dim, textAlign: 'center', padding: 30 }}>
                  No items in this category yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 11, color: dim, lineHeight: 1.5 }}>
        Source: 24 BCS Supplies invoices Jan 2025 → Feb 2026. Latest £ defaults to the price on the most recent invoice
        that contained the SKU; editable to reflect a fresher quote. "14-mo £" is total spend across the tracking window;
        "£/mo" is that spend ÷ {TRACKING_MONTHS}. On-hand + notes are local to this device.
      </p>
    </div>
  )
}

// ─── Detail panel — on-hand + reorder hint + notes ───────────────────
function DetailPanel({ item, price, onhandVal, setOnhand, note, setNote }) {
  // Rough order-cycle hint: total qty ÷ orders ≈ qty per delivery, and
  // 14 months ÷ orders ≈ delivery frequency in months.
  const qtyPerOrder = item.orders > 0 ? (item.totalQty / item.orders) : 0
  const monthsPerOrder = item.orders > 0 ? (14 / item.orders) : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
      <div>
        <Label>On-hand now</Label>
        <input
          type="number" step={1} min={0}
          value={onhandVal}
          placeholder="—"
          onChange={e => setOnhand(e.target.value === '' ? '' : parseFloat(e.target.value))}
          style={{ ...inp, width: 100 }}
        />
        <div style={{ marginTop: 6, fontSize: 11, color: dim }}>
          Re-counted at stocktake.
        </div>
      </div>
      <div>
        <Label>Typical reorder</Label>
        <div style={{ fontSize: 13 }}>
          {item.orders >= 2
            ? `≈ ${qtyPerOrder.toFixed(1)} units every ${monthsPerOrder.toFixed(1)} months`
            : 'Only 1 order in window — irregular.'}
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: dim }}>
          Total ordered: {item.totalQty} units
        </div>
      </div>
      <div>
        <Label>Last invoice</Label>
        <div style={{ fontSize: 13 }}>{item.latestDate} · {fmtMoney(price)}/unit</div>
        <div style={{ marginTop: 4, fontSize: 11, color: dim }}>
          Tracked supplier: {item.supplier}
        </div>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Label>Notes</Label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          placeholder="e.g. switched to eco brand last order, look for cheaper alt"
          style={{
            ...inp, width: '100%', minHeight: 50, resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  )
}

function Label({ children }) {
  return <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: dim, fontWeight: 700, marginBottom: 6 }}>{children}</div>
}

function Stat({ label, value, valueColor = cream }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: dim, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: valueColor }}>{value}</div>
    </div>
  )
}

const th = {
  textAlign: 'left', padding: '10px 12px',
  fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: dim, fontWeight: 700,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
}
const td = { padding: '8px 12px', verticalAlign: 'middle' }
const inp = {
  background: ink3, border: '1px solid rgba(255,255,255,0.12)', color: cream,
  padding: '6px 8px', borderRadius: 6, fontSize: 13,
}
const btnGhost = {
  background: 'transparent', color: cream, border: '1px solid rgba(255,255,255,0.18)',
  padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
}
