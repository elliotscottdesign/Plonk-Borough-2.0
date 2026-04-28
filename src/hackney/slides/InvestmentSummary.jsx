import React, { useState } from 'react'
import { DEAL, ACTUALS_2025, FORECAST } from '../../data/hackney.js'

// InvestmentSummary — clones Borough's structure exactly:
//   • Title + subtitle
//   • 4-button scenario selector (Conservative · Base · Optimistic · Custom)
//   • 3-card snapshot grid (Deal Structure · Financial · Returns)
//   • Top 3 investment highlights
//   • Interactive return calculator (slider + 3 result tiles)
//
// English-only, no i18n. The Custom-scenario LockedForecastContext hookup is
// stubbed out for the framework — Hackney doesn't yet have a 2026 Performance
// tab to populate it. Wire that in once the Business Explorer is built.

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const pct = (n) => (n * 100).toFixed(1) + '%'

// Borough's calc model uses a per-line cost rule applied to a multiplier on
// 2025 actuals. Hackney's equivalent rules are TBD pending a restatement of
// the bar-only cost lines. Placeholder: scale total costs linearly with the
// scenario multiplier so the calculator at least responds to inputs.
function calcReturns(multiplier) {
  const revenue = ACTUALS_2025.revenue * multiplier
  // TBD: replace with Hackney's 2026 cost model (wages, fixed, variable, VAT).
  // For now use a flat margin estimate so the calculator renders something.
  const opProfit = Math.round(FORECAST.profit * (multiplier / 1.15))   // 1.15 = base
  const investorDiv = Math.max(0, opProfit) * DEAL.investorEq
  const total = investorDiv
  const coc = total / DEAL.investment
  const payback = total > 0 ? DEAL.investment / total : Infinity
  return { revenue, opProfit, investorDiv, total, coc, payback }
}

export default function InvestmentSummary() {
  const SCENARIOS = {
    conservative: { label: 'Conservative', sub: '+10% on 2025', multiplier: 1.10 },
    base:         { label: 'Base Case',    sub: '+15% on 2025', multiplier: 1.15 },
    optimistic:   { label: 'Optimistic',   sub: '+20% on 2025', multiplier: 1.20 },
    custom:       { label: 'Custom',       sub: 'Lock the 2026 Performance tab to populate', multiplier: 1.15, disabled: true },
  }

  const [scenario, setScenario] = useState('base')
  const activeKey = SCENARIOS[scenario]?.disabled ? 'base' : scenario
  const s = SCENARIOS[activeKey]
  const r = calcReturns(s.multiplier)

  const [amount, setAmount] = useState(DEAL.investment)
  const equity = amount / DEAL.postMoney
  const isAShare = equity >= 0.05

  // Calculator dividend = base operating profit × equity slider.
  const OPERATING_PROFIT_BASE = FORECAST.profit
  const divCalc = OPERATING_PROFIT_BASE * equity
  const totalCalc = divCalc
  const cocCalc = totalCalc / amount

  const paybackVal = isFinite(r.payback)
    ? `${r.payback.toFixed(1)} years`
    : 'N/A · profit ≤ 0'

  const investorEqPct = (DEAL.investorEq * 100).toFixed(1)

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
        <Section title="🏢 Deal Structure" items={[
          ['Investor Equity',    `${(DEAL.investorEq*100).toFixed(2)}%`],
          ['Founder Equity',     `${(DEAL.founderEq*100).toFixed(2)}%`],
          ['Pre-Money Valuation', fmt(DEAL.preMoney)],
          ['Post-Money Valuation', fmt(DEAL.postMoney)],
          ['Valuation Multiple', `${DEAL.multiple.toFixed(2)}× EBITDA`],
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
          `${fmt(r.total)} Year 1 investor return · ${(r.coc*100).toFixed(1)}% cash-on-cash on ${fmt(DEAL.investment)} invested`,
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
            type="range" min={5000} max={DEAL.investment} step={2500}
            value={amount} onChange={e => setAmount(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--gold)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--gold-dim)', marginTop: 4 }}>
            <span>£5,000</span>
            <span>{fmt(DEAL.investment)} · 50% equity cap</span>
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
