import React, { useState } from 'react'
import { DEAL, ACTUALS_2025, FORECAST, computeDealFromInvestment } from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

// InvestmentSummary — clones Borough's structure exactly:
//   • Title + subtitle
//   • 4-button scenario selector (Conservative · Base · Optimistic · Custom)
//   • 3-card snapshot grid (Deal Structure · Financial · Returns)
//   • Top 3 investment highlights
//   • Interactive return calculator (slider + 3 result tiles)
//
// When the Use of Funds slider tool is locked, the deal terms here recompute
// off the locked total — investment, investor equity, post-money all flex
// with the minimum-viable raise. When unlocked, the static DEAL constants
// from data/hackney.js carry the defaults.

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const pct = (n) => (n * 100).toFixed(1) + '%'

// Borough's calc model uses a per-line cost rule applied to a multiplier on
// 2025 actuals. Hackney's equivalent rules are TBD pending a restatement of
// the bar-only cost lines. Placeholder: scale total costs linearly with the
// scenario multiplier so the calculator at least responds to inputs.
function calcReturns(multiplier, deal) {
  const revenue = ACTUALS_2025.revenue * multiplier
  // TBD: replace with Hackney's 2026 cost model (wages, fixed, variable, VAT).
  // For now use a flat margin estimate so the calculator renders something.
  const opProfit = Math.round(FORECAST.profit * (multiplier / 1.15))   // 1.15 = base
  const investorDiv = Math.max(0, opProfit) * deal.investorEq
  const total = investorDiv
  const coc = total / deal.investment
  const payback = total > 0 ? deal.investment / total : Infinity
  return { revenue, opProfit, investorDiv, total, coc, payback }
}

export default function InvestmentSummary() {
  const { snapshot, isLocked } = useLockedUseOfFunds()

  // When the founder has locked the Use of Funds slider tool, deal terms
  // (investment size, investor/founder equity, post-money) recompute off
  // the locked total. Otherwise fall back to the static DEAL defaults.
  const effective = isLocked && snapshot
    ? { ...DEAL, ...computeDealFromInvestment(snapshot.total) }
    : DEAL

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
  const r = calcReturns(s.multiplier, effective)

  const [amount, setAmount] = useState(effective.investment)
  const equity = amount / effective.postMoney
  const isAShare = equity >= 0.05

  // Calculator dividend = base operating profit × equity slider.
  const OPERATING_PROFIT_BASE = FORECAST.profit
  const divCalc = OPERATING_PROFIT_BASE * equity
  const totalCalc = divCalc
  const cocCalc = totalCalc / amount

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
          ['2025 EBITDA',          fmt(ACTUALS_2025.ebitda)],
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

      {/* Interactive return calculator */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 }}>
          Explore Your Return
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--cream-dim)' }}>Investment Amount</span>
            <span style={{ color: 'var(--gold)' }}>{fmt(amount)}</span>
          </div>
          <input
            type="range" min={5000} max={effective.investment} step={2500}
            value={Math.min(amount, effective.investment)} onChange={e => setAmount(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--gold)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--gold-dim)', marginTop: 4 }}>
            <span>£5,000</span>
            <span>{fmt(effective.investment)} · 50% equity cap</span>
          </div>
        </div>

        {/* Share class badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
          padding: '6px 14px', borderRadius: 20,
          background: isAShare ? 'rgba(45,212,191,0.1)' : 'rgba(201,168,76,0.1)',
          border: `1px solid ${isAShare ? 'rgba(45,212,191,0.4)' : 'rgba(201,168,76,0.4)'}`,
          fontSize: 12, color: isAShare ? 'var(--teal)' : 'var(--gold)',
        }}>
          <span>{isAShare ? '✓' : '○'}</span>
          {isAShare ? 'A Shares · Full Voting Rights' : 'B Shares · Economic Rights Only'}
          <span style={{ color: 'var(--cream-dim)', marginLeft: 4 }}>
            {pct(equity)} equity
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <CalcResult label="Ownership" value={pct(equity)} />
          <CalcResult label="Equity Dividend" value={fmt(divCalc)} />
          <CalcResult label="Total Year 1" value={fmt(totalCalc)} gold />
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--cream-dim)' }}>
          Cash-on-Cash: {(cocCalc * 100).toFixed(1)}% · Payback: {(amount / totalCalc).toFixed(2)} years · Minimum for A shares: £{DEAL.aShareThreshold.toLocaleString('en-GB')}
          {isLocked && <span style={{ display:'block', color:'#10B981', marginTop:6 }}>✓ Live from locked Use of Funds — investment {fmt(effective.investment)} · 50/50 split · implied {effective.impliedMult.toFixed(2)}× EBITDA</span>}
        </div>
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

function CalcResult({ label, value, gold }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--cream-dim)', marginBottom: 6, letterSpacing: '0.05em' }}>{label}</div>
      <div className="serif" style={{ fontSize: 20, color: gold ? 'var(--gold)' : 'var(--cream)' }}>{value}</div>
    </div>
  )
}
