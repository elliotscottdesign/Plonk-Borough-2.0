import React from 'react'
import { DEAL, ACTUALS_2025, FORECAST, computeDealFromInvestment } from '../../data/hackney.js'
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
// slider. Shows: equity stake + INDICATIVE Year-1 dividend (forecast
// basis only — actual dividends are declared by directors at each
// review window). Carries an explicit "not promised" disclaimer.
//
// ROUND 1 NOTE: every share sold this round is a B (non-voting)
// share. A shares are not for sale — the founder retains 100% of
// the A-share class as pre-money holdback. The founder + A-share
// holders agree the per-share dividend at each review window;
// nothing about the indicative return on this card is contractual.
function InvestorReturnsCard({ investorEq }) {
  const equityPct = (investorEq * 100).toFixed(1)
  const shares = Math.round(investorEq * 100)

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

      {/* Three structural stats — NO return projections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
        <ReturnStat label="Ownership" value={`${equityPct}%`} />
        <ReturnStat label="Shares" value={`${shares} / 100`} />
        <ReturnStat label="Share Class" value="B" gold />
      </div>

      {/* Footer line — purely structural */}
      <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.5 }}>
        Share class: <strong style={{ color: 'var(--cream)' }}>B (non-voting)</strong>
        {' · '}Equity: <strong style={{ color: 'var(--cream)' }}>{equityPct}%</strong>
        {' · '}Review cadence: <strong style={{ color: 'var(--cream)' }}>Y1 @ mo 12, Y2+ semi-annual</strong>
      </div>

      {/* No-promises framing — replaces the previous "indicative dividend" card */}
      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 6, fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.55 }}>
        <strong style={{ color: 'var(--gold)' }}>Dividends declared by directors + A-share holders.</strong> No specific per-share dividend, capital-return period or money-on-money figure is promised on this deck or in the Investors' Agreement. Each share (A or B) is entitled to the same £X declared at each review window, based on trailing-12-month trading + working-capital reserve at the time. See the Investor Returns slide for the distribution mechanism + Y3 buyback right.
      </div>
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
  const { effective } = useLockedUseOfFunds()

  // Build a deal-shape struct — DEAL constants for governance fields
  // (investor/founder equity etc.) overlaid with the live computed
  // pre/post-money + implied multiple from the current funding amount.
  const fundingAmount = effective.investment
  const dealLive      = computeDealFromInvestment(fundingAmount)
  const deal          = { ...DEAL, ...dealLive }

  // No per-investor projection is computed on Cover any more — the
  // InvestorReturnsCard shows ownership + share count only. Dividend
  // figures live in the WaterfallReturns slide with explicit "not
  // promised" framing.

  const stats = [
    { label: 'Seeking',                  value: `${fmt(fundingAmount)} inc VAT`,      sub: 'Up to 19 of 100 shares (£1k per share) · founder retains 76 A-class voting shares' },
    { label: '2025 Verified Revenue',    value: fmt(ACTUALS_2025.revenue),            sub: 'Real bar-only trading history — not a projection' },
    { label: 'Share Structure',          value: '100 × £1k',                          sub: '76 A-class founder voting · 24 B-class non-voting external' },
    { label: 'Distribution Model',       value: '£ per share',                        sub: 'Directors + A-share holders declare £X per share · Y1 @ mo 12, Y2+ every 6 months' },
    { label: 'Forecast Revenue',         value: fmt(FORECAST.revenue),                sub: 'Base case +15% · bar-only · May 2026–Apr 2027' },
    { label: 'Valuation Entry',          value: `${deal.impliedMult.toFixed(2)}×`,    sub: 'EBITDA · below 4.1× hospitality sector average' },
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
      <InvestorReturnsCard investorEq={deal.investorEq} />

      <div style={{ marginTop: 40, padding: '16px 24px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10 }}>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
          {/* TBD: confirm exact street address for the Hackney venue. */}
          <strong style={{ color: 'var(--gold)' }}>London Fields, London E8</strong> · Established East London late-night destination
        </div>
      </div>
    </div>
  )
}
