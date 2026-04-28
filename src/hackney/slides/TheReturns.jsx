import React from 'react'
import {
  HACKNEY_DEAL,
  HACKNEY_WATERFALL,
  HACKNEY_SCENARIOS,
  HACKNEY_INVESTOR_RETURNS,
} from '../../data/hackney.js'

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const pct = (n, d=1) => (n*100).toFixed(d) + '%'

export default function TheReturns() {
  const r = HACKNEY_INVESTOR_RETURNS

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>The Returns</div>
        <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05, color: 'var(--cream)', marginBottom: 14 }}>
          {fmt(r.year1.investorReturn)} year one. {fmt(r.totalReturned)} over five.
        </h2>
        <p style={{ fontSize: 17, color: 'var(--cream-dim)', maxWidth: 760, lineHeight: 1.6 }}>
          Returns come from operating cash flow — paid as dividends — plus an exit at year five at the same {HACKNEY_DEAL.multiple.toFixed(0)}× multiple. No multiple-expansion bet required.
        </p>
      </div>

      <div className="gold-rule" style={{ marginBottom: 28 }} />

      {/* HEADLINE NUMBERS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Year 1 return',    value: fmt(r.year1.investorReturn), sub: `${pct(r.year1.coc)} cash-on-cash` },
          { label: '5-year total',      value: fmt(r.totalReturned),       sub: 'Dividends + exit' },
          { label: 'Multiple of money', value: `${r.multipleOfMoney.toFixed(2)}×`, sub: 'On £100k invested' },
          { label: '5-year IRR',        value: pct(r.irr, 2),              sub: `~${r.year1.paybackYears}yr payback (base)` },
        ].map(s => (
          <div key={s.label} className="card-highlight" style={{ padding: 22 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>{s.label}</div>
            <div className="serif" style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2rem)', color: 'var(--gold)', lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* WATERFALL */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Distribution waterfall — 4 steps</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {HACKNEY_WATERFALL.map((w, i) => (
            <div key={w.step} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 140px', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: i < HACKNEY_WATERFALL.length - 1 ? '1px solid rgba(201,168,76,0.08)' : 'none' }}>
              <div className="serif" style={{ fontSize: 22, color: 'var(--gold-dim)', textAlign: 'center' }}>{w.step}</div>
              <div>
                <div style={{ fontSize: 14, color: 'var(--cream)', marginBottom: 4 }}>{w.label}</div>
                <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{w.note}</div>
              </div>
              <div className="serif" style={{ fontSize: 20, color: 'var(--gold)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(w.value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SCENARIOS */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Three scenarios — Year 1</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {HACKNEY_SCENARIOS.map(s => {
            const isBase = s.name === 'Base Case'
            return (
              <div key={s.name} style={{ padding: 18, background: isBase ? 'rgba(201,168,76,0.08)' : 'var(--ink-3)', border: isBase ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(201,168,76,0.1)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: isBase ? 'var(--gold)' : 'var(--cream-dim)', fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{s.growth}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 4 }}>Revenue</div>
                <div style={{ fontSize: 15, color: 'var(--cream)', marginBottom: 10, fontVariantNumeric: 'tabular-nums' }}>{fmt(s.revenue)}</div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 4 }}>Profit (after director salary)</div>
                <div style={{ fontSize: 15, color: 'var(--cream)', marginBottom: 10, fontVariantNumeric: 'tabular-nums' }}>{fmt(s.profit)}</div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 4 }}>Investor Y1</div>
                <div className="serif" style={{ fontSize: '1.4rem', color: isBase ? 'var(--gold)' : 'var(--cream)', lineHeight: 1, marginBottom: 4 }}>{fmt(s.investorY1)}</div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{pct(s.coc)} cash-on-cash</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5-YEAR PROJECTION */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>5-year projection</div>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>Y2–Y5 growth held at 7.5% (conservative)</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                <th style={{ textAlign: 'left',  padding: '8px 0', color: 'var(--cream-dim)', fontWeight: 400, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Year</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--cream-dim)', fontWeight: 400, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Revenue</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--cream-dim)', fontWeight: 400, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Profit</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: 'var(--gold)', fontWeight: 400, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Investor share</th>
              </tr>
            </thead>
            <tbody>
              {r.fiveYear.map(row => (
                <tr key={row.year} style={{ borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--cream)' }}>{row.year}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--cream)' }}>{fmt(row.revenue)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--cream)' }}>{fmt(row.profit)}</td>
                  <td style={{ padding: '10px 0',   textAlign: 'right', color: 'var(--gold)' }}>{fmt(row.investorShare)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{ padding: '14px 0 4px', color: 'var(--cream-dim)', fontSize: 12 }}>Cumulative dividends Y1–Y5</td>
                <td style={{ padding: '14px 0 4px', textAlign: 'right', color: 'var(--gold)' }}>{fmt(r.cumulativeDividends)}</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ padding: '4px 0', color: 'var(--cream-dim)', fontSize: 12 }}>+ Year 5 exit ({HACKNEY_DEAL.multiple}× EBITDA × {pct(HACKNEY_DEAL.investorEq, 2)})</td>
                <td style={{ padding: '4px 0', textAlign: 'right', color: 'var(--gold)' }}>{fmt(r.exit.investorProceeds)}</td>
              </tr>
              <tr style={{ borderTop: '1px solid var(--gold-dim)' }}>
                <td colSpan={3} style={{ padding: '10px 0', color: 'var(--cream)', fontSize: 13, fontWeight: 500 }}>Total returned</td>
                <td className="serif" style={{ padding: '10px 0', textAlign: 'right', color: 'var(--gold)', fontSize: 18 }}>{fmt(r.totalReturned)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
