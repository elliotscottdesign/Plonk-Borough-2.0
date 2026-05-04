import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEAL, ACTUALS_2025, computeDealFromInvestment } from '../data.js'
import { formatCurrency } from '../i18n/format.js'
import { useLockedForecast } from '../components/LockedForecastContext.jsx'
import { useLockedFunding } from '../components/LockedFundingContext.jsx'
import { useLockedWages } from '../components/LockedDeckContext.jsx'

// Scenario returns — pure pro-rata on operating profit (no preferred, no A-share priority).
// Uses the realistic 2026 cost model: wages +10%, non-rent fixed +10%, drinks = 30% of bar,
// rent = 15% of turnover (NO inflation — contractual), hosting removed (now Plonk Golf).
// NOT the old 22.4% blanket margin.
//
// HISTORICAL_NON_RENT_FIXED_2025 = £54,400 — the £165,647 P&L Fixed Costs line minus
// the implied rent at 15% × 2025 turnover (£111,247). Rent is now broken out so it
// scales with turnover, not inflation.
const HISTORICAL_NON_RENT_FIXED_2025 = 54400
const RENT_PCT_OF_TURNOVER           = 0.15

function calcReturns(multiplier, totalRaise, wagesLine) {
  const revenue = ACTUALS_2025.revenue * multiplier
  const bar = 362836 * multiplier
  const costs =
    wagesLine                                    // wages — locked calculator if set, else default +10%
    + HISTORICAL_NON_RENT_FIXED_2025 * 1.10      // non-rent fixed costs +10%
    + revenue * RENT_PCT_OF_TURNOVER             // rent = 15% of turnover (NO inflation)
    + bar * 0.30                                 // drinks = 30% of bar
    + 78851 * multiplier                         // VAT
    + 22965 * multiplier                         // cleaning
    + 17152 * multiplier                         // arcades
    + 9101 * multiplier                          // food
    + 5443 * multiplier                          // card charges
    // hosting removed — Plonk Golf owns it under the IP & Licensing model
  const opProfit = revenue - costs
  const investorDiv = Math.max(0, opProfit) * DEAL.investorEq
  const total = investorDiv
  const coc = totalRaise > 0 ? total / totalRaise : 0
  const payback = total > 0 ? totalRaise / total : Infinity
  return { revenue, opProfit, investorDiv, total, coc, payback }
}

// Custom scenario uses the locked snapshot directly — no multiplier
// approximation, because the snapshot already reflects user edits to
// price, tokens, fixed costs, wages, office costs, etc.
function calcReturnsFromSnapshot(snapshot, totalRaise) {
  const opProfit = snapshot.opProfit
  const investorDiv = Math.max(0, opProfit) * DEAL.investorEq
  const total = investorDiv
  const coc = totalRaise > 0 ? total / totalRaise : 0
  const payback = total > 0 ? totalRaise / total : Infinity
  return { revenue: snapshot.revenue, opProfit, investorDiv, total, coc, payback }
}

export default function InvestmentSummary() {
  const { t, i18n } = useTranslation('summary')
  const lang = i18n.language
  const fmt = (n) => formatCurrency(n, lang)
  const { snapshot, isLocked } = useLockedForecast()
  const { effective: funding } = useLockedFunding()
  const { isLocked: isWagesLocked, effective: wagesEffective } = useLockedWages()
  // Wages line for scenario costs — when the founder has locked the
  // Sliding Wage Rate Calculator, use its loadedAnnual; otherwise fall
  // back to the historical 2025 P&L wage line + 10% inflation.
  const wagesLine = isWagesLocked ? wagesEffective.loadedAnnual : 242370 * 1.10

  // Single source of truth for the deal — derived from the live / locked
  // funding amount on the Cover slide. As that slider drags, every figure
  // on this slide updates: pre-money, post-money, multiple, A-share floor,
  // calculator slider max, all CoC + payback rows.
  const fundingAmount = funding.investment
  const deal          = computeDealFromInvestment(fundingAmount)

  const SCENARIOS = {
    conservative: { label: t('scenarios.conservative.label'), sub: t('scenarios.conservative.sub'), multiplier: 1.10 },
    base:         { label: t('scenarios.base.label'),         sub: t('scenarios.base.sub'),         multiplier: 1.15 },
    optimistic:   { label: t('scenarios.optimistic.label'),   sub: t('scenarios.optimistic.sub'),   multiplier: 1.20 },
    custom:       {
      label:      t('scenarios.custom.label'),
      sub:        isLocked ? t('scenarios.custom.sub') : t('scenarios.custom.subUnlocked'),
      multiplier: snapshot ? snapshot.revenue / ACTUALS_2025.revenue : 1.15,
      disabled:   !isLocked,
    },
  }

  const [scenario, setScenario] = useState('base')
  // Force selection back to base if user had Custom selected and then unlocked
  const activeKey = SCENARIOS[scenario]?.disabled ? 'base' : scenario
  const s = SCENARIOS[activeKey]
  const r = activeKey === 'custom' && snapshot
    ? calcReturnsFromSnapshot(snapshot, fundingAmount)
    : calcReturns(s.multiplier, fundingAmount, wagesLine)

  const paybackVal = isFinite(r.payback)
    ? t('rows.paybackYears', { n: r.payback.toFixed(1) })
    : t('rows.paybackNA')

  const investorEqPct = (DEAL.investorEq * 100).toFixed(1)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        {t('title')}
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 28, fontSize: 16 }}>
        {t('subtitle')}
      </p>

      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {Object.entries(SCENARIOS).map(([key, sc]) => (
          <button key={key} onClick={() => { if (!sc.disabled) setScenario(key) }} disabled={sc.disabled} style={{
            padding: '10px 22px', fontSize: 13, borderRadius: 6, cursor: sc.disabled ? 'not-allowed' : 'pointer',
            background: activeKey === key ? 'rgba(201,168,76,0.15)' : 'transparent',
            border: `1px solid ${activeKey === key ? 'var(--gold)' : 'rgba(201,168,76,0.25)'}`,
            color: activeKey === key ? 'var(--gold)' : 'var(--cream-dim)',
            transition: 'all 0.15s',
            opacity: sc.disabled ? 0.45 : 1,
          }} title={sc.disabled ? sc.sub : undefined}>
            {sc.label}
            {sc.sub && <span style={{ fontSize:11, color:'var(--cream-dim)', display:'block', marginTop:3 }}>{sc.sub}</span>}
          </button>
        ))}
      </div>

      {/* 3-section snapshot grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 28 }}>
        <Section title={t('sections.deal')} items={[
          [t('rows.investorEquity'), `${(deal.investorEq*100).toFixed(2)}%`],
          [t('rows.founderEquity'),  `${(deal.founderEq*100).toFixed(2)}%`],
          [t('rows.preMoney'),       fmt(deal.preMoney)],
          [t('rows.postMoney'),      fmt(deal.postMoney)],
          [t('rows.valuationMultiple'), `${deal.impliedMult.toFixed(2)}× EBITDA`],
        ]} />
        <Section title={t('sections.financial')} items={[
          [t('rows.actualRevenue'),    fmt(ACTUALS_2025.revenue)],
          [t('rows.forecastRevenue'),  fmt(r.revenue)],
          [t('rows.revenueGrowth'),    `+${Math.round((s.multiplier-1)*100)}%`],
          [t('rows.forecastOpProfit'), fmt(r.opProfit)],
          [t('rows.ebitda2025'),       fmt(ACTUALS_2025.ebitda)],
        ]} />
        <Section title={t('sections.returns')} items={[
          [t('rows.distributionModel'), t('rows.proRataNoTiers'), true],
          [t('rows.equityDividend', { pct: investorEqPct }), fmt(r.investorDiv), true],
          [t('rows.totalYear1'), fmt(r.total), true],
          [t('rows.cashOnCash'), `${(r.coc*100).toFixed(1)}%`, true],
          [t('rows.payback'), paybackVal],
        ]} />
      </div>

      {/* Top 3 highlights */}
      <div style={{ fontSize: 13, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
        {t('highlights.header')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          t('highlights.first',  { total: fmt(r.total), coc: (r.coc*100).toFixed(1), investment: fmt(fundingAmount) }),
          t('highlights.second', { revenue: fmt(ACTUALS_2025.revenue) }),
          t('highlights.third'),
        ].map((text, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 18, padding: '16px 22px', alignItems: 'flex-start' }}>
            <span className="serif" style={{ fontSize: 22, color: 'var(--gold)', flexShrink: 0, lineHeight: 1 }}>0{i+1}</span>
            <span style={{ fontSize: 14, color: 'var(--cream-dim)', lineHeight: 1.55 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, items }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 16, fontWeight: 600, letterSpacing: '0.02em' }}>{title}</div>
      {items.map(([label, value, gold]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0',
          borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
          <span style={{ color: 'var(--cream-dim)' }}>{label}</span>
          <span style={{ color: gold ? 'var(--gold)' : 'var(--cream)', fontWeight: gold ? 600 : 400 }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

