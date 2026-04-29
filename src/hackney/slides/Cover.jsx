import React from 'react'
import { DEAL, ACTUALS_2025, FORECAST, computeDealFromInvestment, computeForecastProfit } from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'
import FundingSlider from '../components/FundingSlider.jsx'

// Cover slide — eyebrow + title + lede + FundingSlider (the single root
// raise control for the deck) + 6 stat cards + address footer. Every
// stat card reads from the LockedUseOfFundsContext via the slider's
// shared state, so the figures cascade live as the slider is dragged.
const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

export default function Cover() {
  const { effective, isWageLocked, wageEffective } = useLockedUseOfFunds()

  // Build a deal-shape struct — DEAL constants for governance fields
  // (investor/founder equity etc.) overlaid with the live computed
  // pre/post-money + implied multiple from the current funding amount.
  const fundingAmount = effective.investment
  const dealLive      = computeDealFromInvestment(fundingAmount)
  const deal          = { ...DEAL, ...dealLive }

  // Operating profit cascades from the locked wage calculator (if locked)
  // through computeForecastProfit. Y1 investor return = 50% × profit.
  const wagesOverride  = isWageLocked ? wageEffective.loadedAnnual : null
  const liveProfit     = computeForecastProfit(wagesOverride)
  const investorReturn = liveProfit * deal.investorEq
  const coc            = fundingAmount > 0 ? investorReturn / fundingAmount : 0
  const payback        = investorReturn > 0 ? fundingAmount / investorReturn : Infinity

  const cocPct  = (coc * 100).toFixed(1)
  const paybackText = isFinite(payback) ? payback.toFixed(2) : 'N/A'

  const stats = [
    { label: 'Seeking',                value: `${fmt(fundingAmount)} inc VAT`,      sub: '50% equity · 50% retained by founder · controlled by the slider above' },
    { label: '2025 Verified Revenue',  value: fmt(ACTUALS_2025.revenue),            sub: 'Real bar-only trading history — not a projection' },
    { label: 'Year 1 Investor Return', value: fmt(investorReturn),                  sub: `${cocPct}% cash-on-cash · payback ${paybackText} yrs` },
    { label: 'Distribution Model',     value: 'Pro-rata',                           sub: 'All shareholders paid by equity % at the same time' },
    { label: 'Forecast Revenue',       value: fmt(FORECAST.revenue),                sub: 'Base case +15% · May 2026–Apr 2027' },
    { label: 'Valuation Entry',        value: `${deal.impliedMult.toFixed(2)}×`,    sub: 'EBITDA · below 4.1× hospitality sector average' },
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

      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,var(--gold),transparent)', marginBottom: 32 }} />

      {/* Funding slider — single root control. Cascades to every slide
          via LockedUseOfFundsContext. */}
      <FundingSlider />

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
