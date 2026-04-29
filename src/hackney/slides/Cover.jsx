import React from 'react'
import { DEAL, ACTUALS_2025, FORECAST, computeDealFromInvestment } from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

// Cover slide — clones the structure of Borough's Cover (eyebrow + title +
// lede + 6 stat cards + address footer). English-only, plain-string copy
// (no i18n). Stat cards read from the locked Use-of-Funds snapshot when
// the founder has locked a custom raise size — Seeking, Year-1 return,
// CoC, payback and the implied EBITDA multiple all flex with the slider.
const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

export default function Cover() {
  const { snapshot, isLocked } = useLockedUseOfFunds()

  // When the founder has locked a custom raise size, all valuation-side
  // figures recompute off the locked total. Otherwise fall back to the
  // static DEAL defaults from data/hackney.js.
  const effective = isLocked && snapshot
    ? { ...DEAL, ...computeDealFromInvestment(snapshot.total) }
    : DEAL

  // Year-1 investor return is 50% of operating profit — fixed in £ terms
  // regardless of investment size (a smaller raise simply means a higher
  // % CoC against the same dividend). CoC and payback flex with the
  // investment.
  const investorReturn = FORECAST.profit * effective.investorEq
  const coc            = effective.investment > 0 ? investorReturn / effective.investment : 0
  const payback        = investorReturn > 0 ? effective.investment / investorReturn : Infinity

  const cocPct  = (coc * 100).toFixed(1)
  const paybackText = isFinite(payback) ? payback.toFixed(2) : 'N/A'

  const stats = [
    { label: 'Seeking',                value: `${fmt(effective.investment)} inc VAT`, sub: `50% equity · 50% retained by founder${isLocked ? ' · live from locked Use of Funds' : ''}` },
    { label: '2025 Verified Revenue',  value: fmt(ACTUALS_2025.revenue),            sub: 'Real bar-only trading history — not a projection' },
    { label: 'Year 1 Investor Return', value: fmt(investorReturn),                  sub: `${cocPct}% cash-on-cash · payback ${paybackText} yrs` },
    { label: 'Distribution Model',     value: 'Pro-rata',                           sub: 'All shareholders paid by equity % at the same time' },
    { label: 'Forecast Revenue',       value: fmt(FORECAST.revenue),                sub: 'Base case +15% · May 2026–Apr 2027' },
    { label: 'Valuation Entry',        value: `${effective.impliedMult.toFixed(2)}×`, sub: 'EBITDA · below 4.1× hospitality sector average' },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
          Series A · Seed Investment · April 2026
        </div>
        <h1 className="serif" style={{ fontSize: 'clamp(3rem,7vw,5.5rem)', lineHeight: 1, color: 'var(--cream)', marginBottom: 20 }}>
          No Dice<br/>Hackney
        </h1>
        <p style={{ fontSize: 18, color: 'var(--cream-dim)', maxWidth: 520, lineHeight: 1.6 }}>
          A proven London Fields bar — DJ &amp; events, garden, pool, arcades and board games. Generating {fmt(ACTUALS_2025.revenue)} verified 2025 revenue (bar-only restated), mini golf operations excluded.
        </p>
      </div>

      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,var(--gold),transparent)', marginBottom: 40 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>{s.label}</div>
            <div className="serif" style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: 'var(--cream)', marginBottom: 8, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, padding: '16px 24px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10 }}>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
          {/* TBD: confirm exact street address for the Hackney venue. */}
          <strong style={{ color: 'var(--gold)' }}>London Fields, London E8</strong> · Established East London late-night destination
        </div>
      </div>
    </div>
  )
}
