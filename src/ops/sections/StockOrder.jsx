import React, { useState } from 'react'
import {
  PINT_LITRES, WASTAGE, AVG_WEEK_REVENUE, DOW_SHARE, WEEKEND_SHARE,
  DRAUGHT, SPIRITS, SOFTS, PRESETS,
} from '../data/stockBaseline.js'

// ─── Stock Order calculator ──────────────────────────────────────────────
// Scales the February baseline by a single "how busy" multiplier and prints
// kegs / bottles / cans to order for the week, plus the weekend-loading split.

const money = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const ceil = (n) => Math.ceil(n - 1e-9)

function Panel({ title, sub, accent, children }) {
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div className="serif" style={{ fontSize: 18, color: accent || 'var(--gold)' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

const cell = { padding: '8px 6px', fontSize: 13, color: 'var(--cream)', fontVariantNumeric: 'tabular-nums' }
const head = { padding: '6px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cream-dim)', textAlign: 'right', fontWeight: 600 }

export default function StockOrder() {
  const [mult, setMult] = useState(1.0)
  const weekRev = AVG_WEEK_REVENUE * mult

  // Draught: pints → litres (+wastage) → kegs
  const draught = DRAUGHT.map(d => {
    const pints = d.pintsPerWeek * mult
    const litres = pints * PINT_LITRES * (1 + WASTAGE)
    const kegsRaw = litres / d.kegL
    return { ...d, pints, litres, kegsRaw, order: ceil(kegsRaw) }
  })
  const totalKegs = draught.reduce((s, d) => s + d.order, 0)

  const spirits = SPIRITS.map(s => {
    const bottlesRaw = s.bottlesPerWeek * mult
    return { ...s, bottlesRaw, order: ceil(bottlesRaw) }
  })
  const totalBottles = spirits.reduce((s, x) => s + x.order, 0)

  const softs = SOFTS.map(s => ({ ...s, qty: Math.round(s.perWeek * mult) }))

  // Weekend load: how many kegs of the headline taps you want IN before Friday.
  const weekendKegs = draught.map(d => ({ label: d.label, kegs: d.kegsRaw * WEEKEND_SHARE }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Intro */}
      <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, maxWidth: 760 }}>
        Order quantities for <strong style={{ color: 'var(--cream)' }}>one week</strong>, scaled from your February
        baseline. Drag the dial to match how busy you expect the week to be, then read the kegs, bottles and cans to order.
        Everything rounds up to whole units and includes a {Math.round(WASTAGE * 100)}% draught wastage allowance.
      </div>

      {/* Busy dial */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div className="serif" style={{ fontSize: 16, color: 'var(--gold)' }}>How busy is the week?</div>
          <div style={{ fontSize: 13, color: 'var(--cream-dim)' }}>
            ≈ <strong style={{ color: 'var(--cream)' }}>{money(weekRev)}</strong> week · {Math.round(mult * 100)}% of a Feb average
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {PRESETS.map(p => {
            const on = Math.abs(mult - p.mult) < 0.001
            return (
              <button key={p.key} onClick={() => setMult(p.mult)} style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                background: on ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${on ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
                color: on ? 'var(--gold)' : 'var(--cream)', fontWeight: on ? 600 : 400,
              }}>{p.label} <span style={{ opacity: 0.6 }}>·{Math.round(p.mult * 100)}%</span></button>
            )
          })}
        </div>
        <input type="range" min="0.5" max="2" step="0.05" value={mult}
          onChange={e => setMult(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--gold)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--cream-dim)', marginTop: 4 }}>
          <span>50% (very quiet)</span><span>100% (Feb avg)</span><span>200% (peak summer)</span>
        </div>
      </div>

      {/* Headline tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
        {[
          ['Draught', `${totalKegs} kegs`, 'across 4 taps'],
          ['Spirits', `${totalBottles} bottles`, '700ml'],
          ['Cans/bottles', `${softs[1].qty} units`, 'soft drinks'],
          ['Est. week', money(weekRev), 'till sales'],
        ].map(([l, v, s]) => (
          <div key={l} style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)' }}>{l}</div>
            <div className="serif" style={{ fontSize: 24, color: 'var(--gold)', lineHeight: 1.2 }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Draught */}
      <Panel title="Draught beer — kegs/week" sub="halves counted as ½ · +5% wastage">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ ...head, textAlign: 'left' }}>Tap</th>
            <th style={head}>Pints</th><th style={head}>Litres</th><th style={head}>Keg</th>
            <th style={head}>Kegs/wk</th><th style={{ ...head, color: 'var(--gold)' }}>Order</th>
          </tr></thead>
          <tbody>
            {draught.map(d => (
              <tr key={d.key} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ ...cell, textAlign: 'left' }}>{d.label} <span style={{ color: 'var(--cream-dim)', fontSize: 11 }}>· {d.brand}</span></td>
                <td style={{ ...cell, textAlign: 'right' }}>{Math.round(d.pints)}</td>
                <td style={{ ...cell, textAlign: 'right' }}>{Math.round(d.litres)} L</td>
                <td style={{ ...cell, textAlign: 'right', color: 'var(--cream-dim)' }}>{d.kegL}L</td>
                <td style={{ ...cell, textAlign: 'right', color: 'var(--cream-dim)' }}>{d.kegsRaw.toFixed(1)}</td>
                <td style={{ ...cell, textAlign: 'right', color: 'var(--gold)', fontWeight: 700 }}>
                  {d.order}{d.kegsRaw < 0.6 ? <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--cream-dim)' }}> (≈1 / {Math.round(1 / Math.max(d.kegsRaw, 0.01))} wks)</span> : ''}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: '1px solid rgba(201,168,76,0.25)' }}>
              <td style={{ ...cell, textAlign: 'left', fontWeight: 700, color: 'var(--gold)' }}>Total</td>
              <td colSpan={4} />
              <td style={{ ...cell, textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>{totalKegs} kegs</td>
            </tr>
          </tbody>
        </table>
      </Panel>

      {/* Weekend timing */}
      <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
          ⏱ Get it in before Friday — {Math.round(WEEKEND_SHARE * 100)}% of the week is Fri–Sun (Sat alone is 42%)
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.6 }}>
          On your 2-day order cycle, make the <strong>Thursday delivery the big one</strong>. For this week, have roughly{' '}
          <strong style={{ color: 'var(--gold)' }}>{Math.ceil(weekendKegs[0].kegs)} lager</strong> +{' '}
          <strong style={{ color: 'var(--gold)' }}>{Math.ceil(weekendKegs[1].kegs)} pale</strong> kegs connected/spare for the weekend,
          plus the tequila and the canned softs. Mon–Thu is only ~23% of the week — keep midweek top-ups small.
        </div>
      </div>

      {/* Spirits */}
      <Panel title="Liquor — 700ml bottles/week" sub="direct measures + cocktail usage" accent="#4FD1C5">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ ...head, textAlign: 'left' }}>Spirit</th>
            <th style={head}>Bottles/wk</th><th style={{ ...head, color: '#4FD1C5' }}>Order</th>
            <th style={{ ...head, textAlign: 'left', width: '46%' }}>Notes</th>
          </tr></thead>
          <tbody>
            {spirits.map(s => (
              <tr key={s.key} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ ...cell, textAlign: 'left' }}>{s.label}</td>
                <td style={{ ...cell, textAlign: 'right', color: 'var(--cream-dim)' }}>{s.bottlesRaw.toFixed(1)}</td>
                <td style={{ ...cell, textAlign: 'right', color: '#4FD1C5', fontWeight: 700 }}>{s.order}</td>
                <td style={{ ...cell, textAlign: 'left', fontSize: 11, color: 'var(--cream-dim)' }}>{s.note}</td>
              </tr>
            ))}
            <tr style={{ borderTop: '1px solid rgba(79,209,197,0.25)' }}>
              <td style={{ ...cell, textAlign: 'left', fontWeight: 700, color: '#4FD1C5' }}>Total</td>
              <td />
              <td style={{ ...cell, textAlign: 'right', fontWeight: 700, color: '#4FD1C5' }}>{totalBottles}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </Panel>

      {/* Softs */}
      <Panel title="Soft drinks" sub="per week" accent="#6FA8DC">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {softs.map(s => (
            <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '160px 90px 1fr', gap: 12, alignItems: 'baseline', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--cream)' }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{s.detail}</div>
              </div>
              <div style={{ fontSize: 18, color: '#6FA8DC', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {s.qty} <span style={{ fontSize: 11, color: 'var(--cream-dim)', fontWeight: 400 }}>{s.unit}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.5 }}>→ {s.order}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Caveat */}
      <div style={{ fontSize: 11, color: 'var(--gold-dim)', lineHeight: 1.6 }}>
        Baseline = February 2026 (your first full post-reopening month, a quiet time of year). You're heading into summer,
        which trades higher — use the “Going into June” preset (+35%) for the fast movers and recalibrate after the first
        couple of weekends. Kegs are whole units; a tapped keg of pasteurised lager/pale keeps well under gas for a week+,
        so rounding up is safe — just don't stack up stout & cider (one keg of each covers 1½–2 weeks).
      </div>
    </div>
  )
}
