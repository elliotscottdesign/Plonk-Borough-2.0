import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEAL, ACTUALS_2025, computeDealFromInvestment } from '../data.js'
import { formatCurrency, formatNumber } from '../i18n/format.js'
import ResetBtn from '../components/ResetBtn.jsx'
import { useLockedForecast } from '../components/LockedForecastContext.jsx'
import { useLockedFunding } from '../components/LockedFundingContext.jsx'

const pct = (n) => (n * 100).toFixed(1) + '%'

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

function calcReturns(multiplier, totalRaise) {
  const revenue = ACTUALS_2025.revenue * multiplier
  const bar = 362836 * multiplier
  const costs =
    242370 * 1.10                                // wages +10%
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

  // Single source of truth for the deal — derived from the live / locked
  // funding amount on the Cover slide. As that slider drags, every figure
  // on this slide updates: pre-money, post-money, multiple, A-share floor,
  // calculator slider max, all CoC + payback rows.
  const fundingAmount = funding.investment
  const deal          = computeDealFromInvestment(fundingAmount)
  const investorMaxCheque = deal.postMoney * deal.investorEq   // = fundingAmount

  const SCENARIOS = {
    conservative: { label: t('scenarios.conservative.label'), sub: t('scenarios.conservative.sub'), multiplier: 1.10 },
    base:         { label: t('scenarios.base.label'),         sub: t('scenarios.base.sub'),         multiplier: 1.15 },
    optimistic:   { label: t('scenarios.optimistic.label'),   sub: t('scenarios.optimistic.sub'),   multiplier: 1.25 },
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
    : calcReturns(s.multiplier, fundingAmount)

  // Calculator slider — investor's personal cheque size within the locked
  // total raise. Capped at 50% × post-money = total raise (founder retains
  // the other 50%). When the Cover slider drops the total raise below the
  // user's last calculator pick, clamp down so the slider can't exceed
  // its new max.
  const [amount, setAmount] = useState(fundingAmount)
  useEffect(() => {
    if (amount > investorMaxCheque) setAmount(investorMaxCheque)
    else if (amount < 5000)         setAmount(Math.min(fundingAmount, 5000))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investorMaxCheque])

  // Pure pro-rata — investor's dividend = operating profit × equity %.
  // Base operating profit = 2026 base case (£124k) under the new cost
  // rules (wages +10%, non-rent fixed +10%, drinks 30% of bar, rent 15%
  // of turnover, etc.).
  const OPERATING_PROFIT_BASE = 124000
  const equity = amount / deal.postMoney
  const isAShare = amount >= deal.aShareFloor

  // Recalculate based on slider (uses base-case operating profit for the calculator)
  const divCalc = OPERATING_PROFIT_BASE * equity
  const totalCalc = divCalc
  const cocCalc = totalCalc / amount

  const paybackVal = isFinite(r.payback)
    ? t('rows.paybackYears', { n: r.payback.toFixed(1) })
    : t('rows.paybackNA')

  const investorEqPct = (DEAL.investorEq * 100).toFixed(1)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        {t('title')}
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 28, fontSize: 14 }}>
        {t('subtitle')}
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
      <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
        {t('highlights.header')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {[
          t('highlights.first',  { total: fmt(r.total), coc: (r.coc*100).toFixed(1), investment: fmt(fundingAmount) }),
          t('highlights.second', { revenue: fmt(ACTUALS_2025.revenue) }),
          t('highlights.third'),
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
          {t('calculator.title')}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--cream-dim)' }}>{t('calculator.amount')}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--gold)' }}>{fmt(amount)}</span>
              <ResetBtn onClick={() => setAmount(investorMaxCheque)} />
            </span>
          </div>
          <input
            type="range" min={5000} max={investorMaxCheque} step={2500}
            value={Math.min(amount, investorMaxCheque)} onChange={e => setAmount(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--gold)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--gold-dim)', marginTop: 4 }}>
            <span>£5,000</span>
            <span>{t('calculator.capNote', { investment: fmt(investorMaxCheque) })}</span>
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
          {isAShare ? t('calculator.aShares') : t('calculator.bShares')}
          <span style={{ color: 'var(--cream-dim)', marginLeft: 4 }}>
            {pct(equity)} {t('calculator.equitySuffix')}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <CalcResult label={t('calculator.ownership')} value={pct(equity)} />
          <CalcResult label={t('calculator.equityDividend')} value={fmt(divCalc)} />
          <CalcResult label={t('calculator.totalYear1')} value={fmt(totalCalc)} gold />
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--cream-dim)' }}>
          {t('calculator.footnote', {
            coc: (cocCalc * 100).toFixed(1),
            payback: totalCalc > 0 ? (amount / totalCalc).toFixed(2) : 'N/A',
            threshold: formatNumber(deal.aShareFloor, lang),
          })}
        </div>

        {/* Why does CoC go up if I write a smaller cheque? — investor-facing
            explainer requested by user. Anchored to operating profit, not
            to the raise — so smaller cheque = same dividend pool slice in
            absolute £ at the cap (50% equity), but the personal CoC ratio
            improves at smaller cheque sizes for the same equity %. */}
        <details style={{ marginTop: 14, fontSize: 11, color: 'var(--cream-dim)' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.04em' }}>
            ⓘ Why does CoC change as I move the slider?
          </summary>
          <div style={{ marginTop: 8, padding: '12px 14px', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 6, lineHeight: 1.6 }}>
            Year-1 dividend = your equity share × <strong style={{ color: 'var(--cream)' }}>operating profit</strong> (£124k base case),
            NOT × your cheque. Equity share = your cheque ÷ post-money. So a smaller cheque buys
            less equity and earns a smaller dividend in £, but the dividend-to-cheque <em>ratio</em>
            (cash-on-cash) is the same as anyone else's at the same total raise. Where CoC
            <em> does </em> shift is when the founder drags the <strong style={{ color: 'var(--cream)' }}>raise on Cover</strong> up or down — because
            the dividend pool is fixed (50% × £124k), so dropping the raise size lifts everyone's
            CoC in lockstep, and raising it dilutes everyone in lockstep. Cap on personal cheque
            stays {fmt(investorMaxCheque)} (= 50% of post-money — founder's half).
          </div>
        </details>
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
