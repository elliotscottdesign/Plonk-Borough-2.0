import React, { useState, useEffect } from 'react'
import { STOCK_CHECK, loadStockCheck, saveStockCheck } from '../data/stockCheck.js'
import OpsBrandHeader from '../components/OpsBrandHeader.jsx'

// ─── Weekly Stock Check ────────────────────────────────────────────────
// Walk the bar, type in what you HAVE per item. Set a Par once and the
// "To order" column fills itself (Par − In stock, never below 0). Grouped
// by supplier so each order is one block. Everything saves to this device
// and the sheet prints clean for a clipboard count.
// ───────────────────────────────────────────────────────────────────────

const gold = 'var(--gold)'
const cream = 'var(--cream)'
const ink2 = 'rgba(255,255,255,0.04)'
const ink3 = 'rgba(255,255,255,0.08)'
const dim = 'rgba(245,239,227,0.6)'
const amber = '#FBBF24'

export default function StockCheck() {
  const [state, setState] = useState(() => loadStockCheck())
  useEffect(() => { saveStockCheck(state) }, [state])

  const setStock = (key, val) => setState((s) => ({ ...s, stock: { ...s.stock, [key]: val } }))
  const setPar = (key, val) => setState((s) => ({ ...s, par: { ...s.par, [key]: val } }))
  const clearCounts = () => {
    if (confirm('Clear this week’s in-stock counts? (Par levels are kept.)')) {
      setState((s) => ({ ...s, stock: {} }))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: cream }}>
      <OpsBrandHeader
        eyebrow="Operations · Stock Check"
        title="Weekly stock check"
        subtitle={(
          <>
            {STOCK_CHECK.note} Grouped by supplier so each order is one block. Saves to this device;
            hit <strong style={{ color: cream }}>Print</strong> for a clipboard count.
          </>
        )}
      />

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 14mm 10mm; }
          html, body { background: #fff !important; color: #000 !important; }
          .sc-noprint { display: none !important; }
          .sc-card { break-inside: avoid; border: 1px solid #999 !important; background: #fff !important; }
          .sc-card * { color: #000 !important; }
          .sc-input { border: 1px solid #999 !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="sc-noprint" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => window.print()} style={btnGold}>🖨 Print sheet</button>
        <button onClick={clearCounts} style={btnGhost}>Clear week’s counts</button>
      </div>

      {STOCK_CHECK.groups.map((g) => (
        <div key={g.key} className="sc-card" style={{
          background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 10, padding: '10px 14px',
            background: ink2, borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span className="serif" style={{ fontSize: 16, color: gold }}>{g.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: dim }}>{g.supplier}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: ink2 }}>
                <th style={th}>Item</th>
                <th style={{ ...th, width: 130 }}>Unit</th>
                <th style={{ ...th, width: 80, textAlign: 'center' }}>Par</th>
                <th style={{ ...th, width: 90, textAlign: 'center' }}>In stock</th>
                <th style={{ ...th, width: 90, textAlign: 'center' }}>To order</th>
              </tr>
            </thead>
            <tbody>
              {g.items.map((it) => {
                const par = state.par[it.key]
                const stock = state.stock[it.key]
                const order = (par != null && par !== '' && stock != null && stock !== '')
                  ? Math.max(0, Number(par) - Number(stock)) : null
                return (
                  <tr key={it.key} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={td}>
                      {it.name}
                      {it.supplier && <span style={{ color: dim, fontSize: 11 }}> · {it.supplier}</span>}
                    </td>
                    <td style={{ ...td, color: dim }}>{it.unit}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <NumCell value={par} onChange={(v) => setPar(it.key, v)} />
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <NumCell value={stock} onChange={(v) => setStock(it.key, v)} />
                    </td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: order ? amber : dim }}>
                      {order != null ? (order > 0 ? order : '✓') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}

      <p className="sc-noprint" style={{ fontSize: 11, color: dim, lineHeight: 1.5 }}>
        “To order” = Par − In stock (never below zero). A ✓ means you’re at or above par. Backbar spirits aren’t on
        this sheet — it’s the weekly fresh / draught / wine order. Ask to add a spirits block if you want it here too.
      </p>
    </div>
  )
}

// ─── Number cell — text input that keeps what you type (no stuck zero) ──
function NumCell({ value, onChange }) {
  const [draft, setDraft] = useState(null)
  const shown = draft != null ? draft : (value == null ? '' : String(value))
  return (
    <input
      className="sc-input"
      type="text"
      inputMode="decimal"
      placeholder="–"
      value={shown}
      onFocus={(e) => { setDraft(value == null ? '' : String(value)); e.target.select() }}
      onChange={(e) => {
        let v = e.target.value.replace(/[^0-9.]/g, '')
        const dot = v.indexOf('.')
        if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '')
        setDraft(v)
        onChange(v === '' ? '' : (isNaN(parseFloat(v)) ? '' : parseFloat(v)))
      }}
      onBlur={() => setDraft(null)}
      style={{
        width: 60, textAlign: 'center', background: ink3, color: cream,
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '6px 4px', fontSize: 13,
      }}
    />
  )
}

const th = {
  textAlign: 'left', padding: '9px 12px',
  fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: dim, fontWeight: 700,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
}
const td = { padding: '7px 12px', verticalAlign: 'middle' }
const btnGold = {
  background: 'rgba(201,168,76,0.16)', color: gold, border: '2px solid var(--gold)',
  padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
}
const btnGhost = {
  background: 'transparent', color: cream, border: '1px solid rgba(255,255,255,0.18)',
  padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
}
