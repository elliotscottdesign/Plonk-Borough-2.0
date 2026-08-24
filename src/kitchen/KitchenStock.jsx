import React, { useState, useEffect } from 'react'
import { KITCHEN_STOCK, loadKitchenStock, saveKitchenStock } from './stockList.js'

// ─── Kitchen stock checklist ───────────────────────────────────────────
// A simple weekly order sheet (mirrors the bar's Stock Check): every kitchen
// item grouped by category, one "Qty needed" box per line. Type what you need;
// it saves to this device. Print for a clean order sheet.
// ───────────────────────────────────────────────────────────────────────

const gold = 'var(--gold)', cream = 'var(--cream)'
const dim = 'rgba(245,239,227,0.6)'
const ink2 = 'rgba(255,255,255,0.04)', ink3 = 'rgba(255,255,255,0.08)'

export default function KitchenStock() {
  const [state, setState] = useState(() => loadKitchenStock())
  useEffect(() => { saveKitchenStock(state) }, [state])

  const setQty = (key, val) => setState((s) => ({ ...s, qty: { ...s.qty, [key]: val } }))
  const clearAll = () => { if (confirm('Clear all quantities?')) setState((s) => ({ ...s, qty: {} })) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: cream }}>
      <div style={{ fontSize: 12.5, color: dim, lineHeight: 1.5 }}>
        {KITCHEN_STOCK.note} Type the quantity you need next to each item — it saves to this device. Hit Print for a clean order sheet.
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 14mm 10mm; }
          html, body { background:#fff !important; color:#000 !important; }
          .ks-noprint { display:none !important; }
          .ks-card { break-inside: avoid; border:1px solid #999 !important; background:#fff !important; }
          .ks-card * { color:#000 !important; }
          .ks-input { border:1px solid #999 !important; }
        }
      `}</style>

      <div className="ks-noprint" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => window.print()} style={btnGold}>🖨 Print order sheet</button>
        <button onClick={clearAll} style={btnGhost}>Clear all</button>
      </div>

      {KITCHEN_STOCK.groups.map((g) => (
        <div key={g.key} className="ks-card" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: ink2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="serif" style={{ fontSize: 16, color: gold }}>{g.label}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: ink2 }}>
                <th style={th}>Item</th>
                <th style={{ ...th, width: 120 }}>Unit</th>
                <th style={{ ...th, width: 110, textAlign: 'center' }}>Qty needed</th>
              </tr>
            </thead>
            <tbody>
              {g.items.map((it) => (
                <tr key={it.key} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={td}>{it.name}</td>
                  <td style={{ ...td, color: dim }}>{it.unit}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <QtyCell value={state.qty[it.key]} onChange={(v) => setQty(it.key, v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

// Number cell — text input that keeps what you type (no stuck zero).
function QtyCell({ value, onChange }) {
  const [draft, setDraft] = useState(null)
  const shown = draft != null ? draft : (value == null ? '' : String(value))
  return (
    <input
      className="ks-input" type="text" inputMode="decimal" placeholder="–" value={shown}
      onFocus={(e) => { setDraft(value == null ? '' : String(value)); e.target.select() }}
      onChange={(e) => {
        let v = e.target.value.replace(/[^0-9.]/g, '')
        const dot = v.indexOf('.'); if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '')
        setDraft(v)
        onChange(v === '' ? '' : (isNaN(parseFloat(v)) ? '' : parseFloat(v)))
      }}
      onBlur={() => setDraft(null)}
      style={{ width: 64, textAlign: 'center', background: ink3, color: cream, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '6px 4px', fontSize: 13 }}
    />
  )
}

const th = { textAlign: 'left', padding: '9px 12px', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: dim, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }
const td = { padding: '7px 12px', verticalAlign: 'middle' }
const btnGold = { background: 'rgba(201,168,76,0.16)', color: gold, border: '2px solid var(--gold)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }
const btnGhost = { background: 'transparent', color: cream, border: '1px solid rgba(255,255,255,0.18)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }
