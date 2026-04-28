import React from 'react'
import {
  HACKNEY_DEAL,
  HACKNEY_ACTUALS_2025,
  HACKNEY_FORECAST,
  HACKNEY_INVESTOR_RETURNS,
} from '../../data/hackney.js'

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const pct = (n, d=1) => (n*100).toFixed(d) + '%'

export default function Cover() {
  const stats = [
    { label: 'Seeking',           value: fmt(HACKNEY_DEAL.investment),                       sub: `For ${pct(HACKNEY_DEAL.investorEq, 0)} equity · single share class` },
    { label: 'Verified revenue',  value: fmt(HACKNEY_ACTUALS_2025.revenue),                  sub: '2025 bar-only trading actuals' },
    { label: 'Year 1 return',     value: fmt(HACKNEY_INVESTOR_RETURNS.year1.investorReturn), sub: `${pct(HACKNEY_INVESTOR_RETURNS.year1.coc)} cash-on-cash · ~${HACKNEY_INVESTOR_RETURNS.year1.paybackYears}yr payback` },
    { label: 'Distribution',      value: 'Pro-rata 50/50',                                   sub: '8% preferred · then equal split with founder' },
    { label: 'Forecast revenue',  value: fmt(HACKNEY_FORECAST.revenue),                      sub: 'May 2026 – Apr 2027 · Base case (+15%)' },
    { label: 'Entry valuation',   value: `${HACKNEY_DEAL.multiple.toFixed(2)}×`,             sub: 'EBITDA · below 4.1× hospitality sector avg' },
  ]

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div style={{
        marginBottom: 32, padding: 0, borderRadius: 14, overflow: 'hidden',
        position: 'relative', height: 280,
        backgroundImage: 'linear-gradient(180deg, rgba(10,10,15,0.05) 0%, rgba(10,10,15,0.85) 100%), url(/hackney/garden/g3.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>
            Investor Pack · Confidential · April 2026
          </div>
          <h1 className="serif" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.2rem)', lineHeight: 1, color: 'var(--cream)' }}>
            No Dice<br/>Hackney
          </h1>
        </div>
      </div>

      <p style={{ fontSize: 19, color: 'var(--cream-dim)', maxWidth: 640, lineHeight: 1.55, marginBottom: 36 }}>
        <strong style={{ color: 'var(--cream)' }}>{fmt(HACKNEY_DEAL.investment)} for {pct(HACKNEY_DEAL.investorEq, 0)} of a proven London Fields bar.</strong>
        {' '}A bar-only relaunch of an established trading entity — {fmt(HACKNEY_ACTUALS_2025.revenue)} verified 2025 revenue, mini golf drag removed, cash-yielding from day one.
      </p>

      <div className="gold-rule" style={{ marginBottom: 32 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>{s.label}</div>
            <div className="serif" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--cream)', marginBottom: 6, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.45 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: '14px 22px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10 }}>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--gold)' }}>London Fields, London E8.</strong> Established late-night East London destination. Bar · DJ &amp; events · Garden · Pool · Arcades.
        </div>
      </div>
    </div>
  )
}
