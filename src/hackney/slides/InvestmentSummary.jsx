import React, { useState } from 'react'
import { DEAL, ACTUALS_2025, FORECAST, computeDealFromInvestment, computeForecastProfit, computeInvestorDividend } from '../../data/hackney.js'
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
  // Investor dividend includes the 10% preferred yield on the investor's
  // invested capital, paid before the pro-rata residual split. External
  // B-only — founder's buyback does not get preferred.
  const investorDiv = computeInvestorDividend(Math.max(0, opProfit), deal.investment)
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
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2.2rem, 4.4vw, 3.2rem)', color: 'var(--cream)', marginBottom: 10 }}>
        Investment Summary
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 32, fontSize: 16, lineHeight: 1.5 }}>
        At-a-glance deal structure, returns and financials.
      </p>

      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {Object.entries(SCENARIOS).map(([key, sc]) => (
          <button key={key} onClick={() => { if (!sc.disabled) setScenario(key) }} disabled={sc.disabled} style={{
            padding: '10px 22px', fontSize: 13, borderRadius: 8, cursor: sc.disabled ? 'not-allowed' : 'pointer',
            background: activeKey === key ? 'rgba(201,168,76,0.15)' : 'transparent',
            border: `1px solid ${activeKey === key ? 'var(--gold)' : 'rgba(201,168,76,0.25)'}`,
            color: activeKey === key ? 'var(--gold)' : 'var(--cream-dim)',
            transition: 'all 0.15s',
            opacity: sc.disabled ? 0.45 : 1,
            fontWeight: activeKey === key ? 600 : 400,
            letterSpacing: '0.02em',
          }} title={sc.disabled ? sc.sub : undefined}>
            {sc.label}
            {sc.sub && <span style={{ fontSize:11, color:'var(--cream-dim)', display:'block', marginTop:3 }}>{sc.sub}</span>}
          </button>
        ))}
      </div>

      {/* Round progress + cap table — hurried-sale round */}
      <RoundProgressBlock />

      {/* 3-section snapshot grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, marginBottom: 36 }}>
        <Section title={`🏢 Deal Structure${isLocked ? ' · LOCKED' : ''}`} items={[
          ['Investment Sought',   fmt(effective.investment), isLocked],
          ['Share Class · Round 1', DEAL.shareClass || 'Ordinary'],
          ['Voting Rights',       'Founder retains 100% via A shares'],
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
          ['Distribution Model',         'Preferred → pro-rata', true],
          ['Preferred Yield (External B)', `${((DEAL.preferredYield || 0)*100).toFixed(0)}% on capital invested`, true],
          [`Your Annual Preferred`,        fmt(Math.round((effective.investment || 0) * (DEAL.preferredYield || 0))), true],
          [`Total Year 1 (Preferred + Residual)`, fmt(r.total), true],
          ['Cash-on-Cash',                `${(r.coc*100).toFixed(1)}%`, true],
          ['Payback Period',              paybackVal],
        ]} />
      </div>

      {/* Top 3 highlights */}
      <div style={{ fontSize: 13, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 18, fontWeight: 600 }}>
        Top 3 Investment Highlights
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
        {[
          `${fmt(r.total)} Year 1 investor return · ${(r.coc*100).toFixed(1)}% cash-on-cash on ${fmt(effective.investment)} invested`,
          `Proven London Fields bar — ${fmt(ACTUALS_2025.revenue)} verified 2025 revenue · bar-only restated, mini golf excluded`,
          'All shareholders paid at the same time · pro-rata on operating profit (no preferred, no priority tiers)',
        ].map((text, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 20, padding: '20px 24px', alignItems: 'flex-start' }}>
            <span className="serif" style={{ fontSize: 28, color: 'var(--gold)', flexShrink: 0, lineHeight: 1 }}>0{i+1}</span>
            <span style={{ fontSize: 15, color: 'var(--cream)', lineHeight: 1.65 }}>{text}</span>
          </div>
        ))}
      </div>

    </div>
  )
}

function Section({ title, items }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ fontSize: 14, color: 'var(--gold)', marginBottom: 18, fontWeight: 600, letterSpacing: '0.02em' }}>{title}</div>
      {items.map(([label, value, gold]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0',
          borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14, gap: 12 }}>
          <span style={{ color: 'var(--cream-dim)' }}>{label}</span>
          <span style={{ color: gold ? 'var(--gold)' : 'var(--cream)', fontWeight: gold ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Round progress + cap-table block ──────────────────────────────
// Live state of the £50k hurried-sale round. Reads DEAL.commitments
// (an array of {label, amount, equity, type}) so new commitments show
// up here as they're added to the DEAL constant — no UI change needed.
// Visible blocks:
//   1) Two-segment progress bar (sold green / available gold)
//   2) Cap table — Founder retained + every commitment + Available
function RoundProgressBlock() {
  const round       = DEAL.roundSize        ?? 50000
  const commitments = Array.isArray(DEAL.commitments) ? DEAL.commitments : []
  const retainedEq  = (DEAL.founderRetained ?? 0.50) * 100

  // Derive sold / available from the commitments array so a new entry
  // in DEAL.commitments propagates here automatically.
  const sold       = commitments.reduce((s, c) => s + (c.amount || 0), 0)
  const soldEq     = commitments.reduce((s, c) => s + (c.equity || 0), 0) * 100
  const available  = DEAL.availableAmount ?? (round - sold)
  const availEq    = (DEAL.availableEq    ?? Math.max(0, 0.50 - (sold / round) * 0.50)) * 100
  const pctSold    = (sold      / round) * 100
  const pctAvail   = (available / round) * 100

  // Tone palette per commitment type
  const colorFor = (type) =>
    type === 'founder'  ? '#34D399' :   // green
    type === 'external' ? '#A78BFA' :   // purple
                          '#22D3EE'     // fallback teal

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(167,139,250,0.05))',
      border: '1px solid rgba(201,168,76,0.28)',
      borderRadius: 14,
      padding: '20px 24px',
      marginBottom: 28,
    }}>
      {/* Eyebrow */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
          First investment round · hurried sale
        </span>
        <span style={{ fontSize: 12, color: 'var(--cream-dim)' }}>
          {fmt(sold)} of {fmt(round)} committed
          <span style={{ color: 'var(--cream)', marginLeft: 8, fontWeight: 600 }}>· {fmt(available)} still available</span>
        </span>
      </div>

      {/* Headline + progress bar */}
      <div className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginBottom: 14, lineHeight: 1.2 }}>
        {fmt(round)} for 50% of the company. {fmt(available)} remains on offer.
      </div>
      <div style={{ width: '100%', height: 18, background: 'rgba(255,255,255,0.06)', borderRadius: 9, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
        <div style={{ width: `${pctSold}%`, background: 'linear-gradient(90deg, #10B981, #34D399)', height: '100%' }} title={`Sold: ${fmt(sold)}`} />
        <div style={{ width: `${pctAvail}%`, background: 'rgba(201,168,76,0.45)', height: '100%' }} title={`Available: ${fmt(available)}`} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--cream-dim)', marginBottom: 18 }}>
        <span style={{ color: '#34D399', fontWeight: 600 }}>● Sold · {fmt(sold)} ({pctSold.toFixed(0)}%)</span>
        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>● Available · {fmt(available)} ({pctAvail.toFixed(0)}%)</span>
      </div>

      {/* Cap-table breakdown — iterates commitments */}
      <div style={{ fontSize: 10, color: 'var(--gold-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
        Post-round cap table
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 120px', gap: 10, alignItems: 'center' }}>
        {/* Founder retained — never sold, ALWAYS first row */}
        <div style={{ width: 16, height: 16, borderRadius: 4, background: '#10B981' }} />
        <div style={{ color: 'var(--cream)', fontSize: 13 }}>
          <strong>Founder retained</strong> — pre-money holdback (not for sale)
        </div>
        <div style={{ textAlign: 'right', color: 'var(--cream)', fontWeight: 600 }}>{retainedEq.toFixed(0)}%</div>
        <div style={{ textAlign: 'right', color: 'var(--cream-dim)', fontSize: 12 }}>—</div>

        {/* Each committed stake */}
        {commitments.map((c, i) => (
          <React.Fragment key={i}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: colorFor(c.type) }} />
            <div style={{ color: 'var(--cream)', fontSize: 13 }}>
              <strong>{c.label}</strong> — <span style={{ color: '#86EFAC', fontWeight: 600 }}>SOLD</span>
            </div>
            <div style={{ textAlign: 'right', color: 'var(--cream)', fontWeight: 600 }}>{(c.equity * 100).toFixed(0)}%</div>
            <div style={{ textAlign: 'right', color: 'var(--cream-dim)', fontSize: 12 }}>{fmt(c.amount)}</div>
          </React.Fragment>
        ))}

        {/* Available — ALWAYS last row */}
        <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--gold)' }} />
        <div style={{ color: 'var(--cream)', fontSize: 13 }}>
          <strong style={{ color: 'var(--gold)' }}>Available to external investors</strong> — FOR SALE
        </div>
        <div style={{ textAlign: 'right', color: 'var(--gold)', fontWeight: 700 }}>{availEq.toFixed(0)}%</div>
        <div style={{ textAlign: 'right', color: 'var(--gold)', fontWeight: 600, fontSize: 12 }}>{fmt(available)}</div>
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
        Founder retains <strong style={{ color: 'var(--cream)' }}>{retainedEq.toFixed(0)}%</strong> as pre-money holdback. <strong style={{ color: 'var(--cream)' }}>{fmt(sold)}</strong> of the round ({soldEq.toFixed(0)}%) is already committed across {commitments.length} cheque{commitments.length === 1 ? '' : 's'}. The remaining <strong style={{ color: 'var(--gold)' }}>{fmt(available)}</strong> ({availEq.toFixed(0)}%) is open to new investors at the same valuation — pro-rata cheque size to equity.
      </div>
    </div>
  )
}

