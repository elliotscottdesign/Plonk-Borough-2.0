import React from 'react'
import { DEAL, ACTUALS_2025, FORECAST, computeDealFromInvestment, computeForecastProfit } from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'
import FundingSlider from '../components/FundingSlider.jsx'

// Cover slide — eyebrow + title + lede + FundingSlider (the single root
// raise control for the deck) + investor return readout + 6 stat cards
// + address footer. Every figure reads from the LockedUseOfFundsContext
// via the slider's shared state, so the figures cascade live as the
// slider is dragged.
const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// ─── InvestorReturnsCard ─────────────────────────────────────────────
// Per-investor return summary that sits directly below the funding
// slider. Three primary stats (Ownership · Equity Dividend · Total
// Year 1), followed by a footer line with CoC + Payback and an
// expandable explainer for why CoC moves with the slider.
//
// ROUND 1 NOTE: every share sold this round is a B (non-voting)
// share. A shares are not for sale — the founder retains 100% of
// the A-share class as pre-money holdback (= the 50% retained slice
// on the cap table). No threshold to graduate to A shares; all
// investors are B shareholders this round.
function InvestorReturnsCard({ investment, investorEq, investorReturn, coc, payback, liveProfit }) {
  const equityPct = (investorEq * 100).toFixed(1)
  const cocPct = (coc * 100).toFixed(1)
  const paybackText = isFinite(payback) ? payback.toFixed(2) : 'N/A'
  const operatingProfitFmt = fmt(liveProfit || 0)

  return (
    <div style={{
      background: 'var(--ink-2)',
      border: '1px solid rgba(201,168,76,0.18)',
      borderRadius: 12,
      padding: 24,
      marginBottom: 32,
    }}>
      {/* Share-class pill — Round 1 is B-shares only */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 22,
        padding: '6px 14px', borderRadius: 20,
        background: 'rgba(201,168,76,0.1)',
        border: '1px solid rgba(201,168,76,0.45)',
        fontSize: 12, color: 'var(--gold)',
        letterSpacing: '0.04em',
      }}>
        <span>○</span>
        B Shares · Non-voting · Round 1
        <span style={{ color: 'var(--cream-dim)', marginLeft: 4 }}>{equityPct}% equity</span>
      </div>

      {/* Three primary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
        <ReturnStat label="Ownership" value={`${equityPct}%`} />
        <ReturnStat label="Equity Dividend" value={fmt(investorReturn)} />
        <ReturnStat label="Total Year 1" value={fmt(investorReturn)} gold />
      </div>

      {/* Footer line */}
      <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.5 }}>
        Cash-on-Cash: <strong style={{ color: 'var(--cream)' }}>{cocPct}%</strong>
        {' · '}Payback: <strong style={{ color: 'var(--cream)' }}>{paybackText} years</strong>
        {' · '}Share class: <strong style={{ color: 'var(--cream)' }}>B (non-voting)</strong>
      </div>

      {/* Why does CoC change? — investor-facing explainer */}
      <details style={{ marginTop: 14, fontSize: 11, color: 'var(--cream-dim)' }}>
        <summary style={{ cursor: 'pointer', color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.04em' }}>
          ⓘ Why does CoC change as I move the slider?
        </summary>
        <div style={{ marginTop: 8, padding: '12px 14px', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 6, lineHeight: 1.6 }}>
          Year-1 dividend = your equity share × <strong style={{ color: 'var(--cream)' }}>operating profit</strong> ({operatingProfitFmt} base case),
          NOT × your cheque. Because the dividend pool is fixed, dropping the raise size lifts everyone's CoC in
          lockstep, and raising it dilutes everyone in lockstep. Your equity stake stays at {equityPct}% throughout
          — the slider above sizes the total raise, not your personal allocation.
        </div>
      </details>
    </div>
  )
}

function ReturnStat({ label, value, gold }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div className="serif" style={{ fontSize: 24, color: gold ? 'var(--gold)' : 'var(--cream)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}

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
      {/* Title block — eyebrow + "No Dice Hackney" + lede */}
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

      {/* 6-card stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>{s.label}</div>
            <div className="serif" style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: 'var(--cream)', marginBottom: 8, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,var(--gold),transparent)', margin: '40px 0 32px' }} />

      {/* Funding slider + per-investor readout — sits below the headline
          stat grid. Slider drives every figure across the deck via
          LockedUseOfFundsContext. */}
      <FundingSlider />
      <InvestorReturnsCard
        investment={fundingAmount}
        investorEq={deal.investorEq}
        investorReturn={investorReturn}
        coc={coc}
        payback={payback}
        liveProfit={liveProfit}
      />

      <div style={{ marginTop: 40, padding: '16px 24px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10 }}>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
          {/* TBD: confirm exact street address for the Hackney venue. */}
          <strong style={{ color: 'var(--gold)' }}>London Fields, London E8</strong> · Established East London late-night destination
        </div>
      </div>
    </div>
  )
}
