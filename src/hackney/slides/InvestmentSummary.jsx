import React, { useState } from 'react'
import { DEAL, ACTUALS_2025, FORECAST, computeDealFromInvestment, computeForecastProfit } from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

// InvestmentSummary — Hackney deal summary slide.
//   • Title + subtitle
//   • 4-button scenario selector (Conservative · Base · Optimistic · Custom)
//   • 3-card snapshot grid (Deal Structure · Financial · Returns)
//   • Top 3 investment highlights
//
// All deal-side figures (investment, equity %, pre/post-money, implied
// multiple) read from LockedUseOfFundsContext.effective so they cascade
// from the FundingSlider on Cover. Per-investor "Explore Your Return"
// calculator removed — the funding slider on Cover is the single
// raise-sizing control.

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// Borough's calc model uses a per-line cost rule applied to a multiplier on
// 2025 actuals. Hackney's equivalent rules are TBD pending a restatement of
// the bar-only cost lines. Placeholder: scale total costs linearly with the
// scenario multiplier so the calculator at least responds to inputs.
function calcReturns(multiplier, deal, baseProfit) {
  const revenue = ACTUALS_2025.revenue * multiplier
  // baseProfit is the Y1 forecast profit at +15% revenue growth. Scenario
  // profit scales linearly with the multiplier (× / 1.15) — placeholder
  // until a per-scenario cost-rule split is wired in. baseProfit already
  // reflects the locked wage calculator if the founder has locked one.
  const opProfit = Math.round(baseProfit * (multiplier / 1.15))   // 1.15 = base
  const investorDiv = Math.max(0, opProfit) * deal.investorEq
  const total = investorDiv
  const coc = total / deal.investment
  const payback = total > 0 ? deal.investment / total : Infinity
  return { revenue, opProfit, investorDiv, total, coc, payback }
}

export default function InvestmentSummary() {
  const { effective: ctxEffective, isLocked, isWageLocked, wageEffective } = useLockedUseOfFunds()
  // Deal terms (investment size, investor/founder equity, post-money)
  // recompute live off the funding-amount slider — locked snapshot
  // when locked, slider preview otherwise.
  const effective = { ...DEAL, ...computeDealFromInvestment(ctxEffective.investment) }
  // Forecast profit cascades from the locked Wage Calculator when locked.
  const wagesOverride = isWageLocked ? wageEffective.loadedAnnual : null
  const liveProfit    = computeForecastProfit(wagesOverride)

  const SCENARIOS = {
    conservative: { label: 'Conservative', sub: '+10% on 2025', multiplier: 1.10 },
    base:         { label: 'Base Case',    sub: '+15% on 2025', multiplier: 1.15 },
    optimistic:   { label: 'Optimistic',   sub: '+20% on 2025', multiplier: 1.20 },
    custom:       {
      label:    'Custom',
      sub:      isLocked ? 'Live from locked Use of Funds' : 'Lock the Use of Funds slider tool to populate',
      multiplier: 1.15,
      disabled: !isLocked,
    },
  }

  const [scenario, setScenario] = useState(isLocked ? 'custom' : 'base')
  const activeKey = SCENARIOS[scenario]?.disabled ? 'base' : scenario
  const s = SCENARIOS[activeKey]
  const r = calcReturns(s.multiplier, effective, liveProfit)

  const paybackVal = isFinite(r.payback)
    ? `${r.payback.toFixed(1)} years`
    : 'N/A · profit ≤ 0'

  const investorEqPct = (effective.investorEq * 100).toFixed(1)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        Investment Summary
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 28, fontSize: 14 }}>
        At-a-glance deal structure, returns and financials.
      </p>

      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {Object.entries(SCENARIOS).map(([key, sc]) => (
          <button key={key} onClick={() => { if (!sc.disabled) setScenario(key) }} disabled={sc.disabled} style={{
            padding: '7px 18px', fontSize: 11, borderRadius: 6, cursor: sc.disabled ? 'not-allowed' : 'pointer',
            background: activeKey === key ? 'rgba(201,168,76,0.15)' : 'transparent',
            border: `1px solid ${activeKey === key ? 'var(--gold)' : 'rgba(201,168,76,0.25)'}`,
            color: activeKey === key ? 'var(--gold)' : 'var(--cream-dim)',
            transition: 'all 0.15s',
            opacity: sc.disabled ? 0.45 : 1,
          }} title={sc.disabled ? sc.sub : undefined}>
            {sc.label}
            {sc.sub && <span style={{ fontSize:9, color:'var(--cream-dim)', display:'block', marginTop:2 }}>{sc.sub}</span>}
          </button>
        ))}
      </div>

      {/* 3-section snapshot grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 28 }}>
        <Section title={`🏢 Deal Structure${isLocked ? ' · LOCKED' : ''}`} items={[
          ['Investment Sought',   fmt(effective.investment), isLocked],
          ['Investor Equity',    `${(effective.investorEq*100).toFixed(0)}%`],
          ['Founder Equity',     `${(effective.founderEq*100).toFixed(0)}%`],
          ['Pre-Money Valuation', fmt(effective.preMoney)],
          ['Post-Money Valuation', fmt(effective.postMoney)],
          ['Implied Multiple',    effective.impliedMult ? `${effective.impliedMult.toFixed(2)}× EBITDA` : `${DEAL.multiple.toFixed(2)}× EBITDA`],
        ]} />
        <Section title="📊 Financial Performance" items={[
          ['2025 Actual Revenue',  fmt(ACTUALS_2025.revenue)],
          ['Forecast Revenue',     fmt(r.revenue)],
          ['Revenue Growth',       `+${Math.round((s.multiplier-1)*100)}%`],
          ['Forecast Op Profit',   fmt(r.opProfit)],
          ['2025 Op Profit',       fmt(ACTUALS_2025.profit)],
        ]} />
        <Section title="💰 Investor Returns" items={[
          ['Distribution Model', 'Pro-rata · no tiers', true],
          [`Equity Dividend (${investorEqPct}%)`, fmt(r.investorDiv), true],
          ['Total Year 1 Return', fmt(r.total), true],
          ['Cash-on-Cash', `${(r.coc*100).toFixed(1)}%`, true],
          ['Payback Period', paybackVal],
        ]} />
      </div>

      {/* Top 3 highlights */}
      <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
        Top 3 Investment Highlights
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {[
          `${fmt(r.total)} Year 1 investor return · ${(r.coc*100).toFixed(1)}% cash-on-cash on ${fmt(effective.investment)} invested`,
          `Proven London Fields bar — ${fmt(ACTUALS_2025.revenue)} verified 2025 revenue · bar-only restated, mini golf excluded`,
          'All shareholders paid at the same time · pro-rata on operating profit (no preferred, no priority tiers)',
        ].map((text, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 16, padding: '14px 18px', alignItems: 'flex-start' }}>
            <span className="serif" style={{ fontSize: 18, color: 'var(--gold)', flexShrink: 0, lineHeight: 1 }}>0{i+1}</span>
            <span style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>

    </div>
  )
}

function Section({ title, items }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: 11, color: 'var(--gold)', marginBottom: 14, fontWeight: 500 }}>{title}</div>
      {items.map(([label, value, gold]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0',
          borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11 }}>
          <span style={{ color: 'var(--cream-dim)' }}>{label}</span>
          <span style={{ color: gold ? 'var(--gold)' : 'var(--cream)' }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

