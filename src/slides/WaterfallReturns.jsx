import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DEAL,
  BOROUGH_INVESTOR_RETURNS, BOROUGH_WORKING_CAPITAL_CUSHION,
  computeBoroughDistributionCalendar,
} from '../data.js'
import { formatCurrency } from '../i18n/format.js'
import { useLockedForecast } from '../components/LockedForecastContext.jsx'
import { useLockedFunding } from '../components/LockedFundingContext.jsx'

function calcWaterfall(profit, totalRaise) {
  // Pure pro-rata — operating profit splits directly by equity %. No preferred, no A-share priority.
  const investorDiv = profit * DEAL.investorEq
  const founderDiv = profit * DEAL.founderEq
  const totalInvestor = investorDiv
  const coc = totalRaise > 0 ? totalInvestor / totalRaise : 0
  return { investorDiv, founderDiv, totalInvestor, coc }
}

// Newton-Raphson IRR. flows = [-investment, year1, year2, ...].
// Returns the discount rate that makes NPV = 0. Returns NaN if it
// fails to converge (e.g. all-negative or all-positive flows).
function computeIRR(flows, guess = 0.5) {
  if (!flows || flows.length < 2) return NaN
  let r = guess
  for (let iter = 0; iter < 80; iter++) {
    let npv = 0
    let dnpv = 0
    for (let t = 0; t < flows.length; t++) {
      const denom = Math.pow(1 + r, t)
      npv  += flows[t] / denom
      dnpv -= t * flows[t] / (denom * (1 + r))
    }
    if (Math.abs(npv) < 0.5) return r
    if (dnpv === 0) break
    const next = r - npv / dnpv
    if (!isFinite(next)) break
    if (Math.abs(next - r) < 1e-7) return next
    r = next
  }
  return r
}

const fmtK = (n) => '£' + Math.round(n / 1000) + 'k'

export default function WaterfallReturns() {
  const { t, i18n } = useTranslation('waterfall')
  const lang = i18n.language
  const fmt = (n) => formatCurrency(n, lang)
  const { snapshot, isLocked: forecastIsLocked } = useLockedForecast()
  const { effective: funding, isLocked: fundingIsLocked } = useLockedFunding()
  const fundingAmount = funding.investment

  // Working-capital safe-zone — Borough's floor is the locked rent prepay
  // (1/2/3 month snap from Use of Funds), target adds £15k cushion for
  // VAT bills + supplier swings. Both flex live with the rent snap.
  const reserveFloor  = funding.rent
  const reserveTarget = reserveFloor + BOROUGH_WORKING_CAPITAL_CUSHION

  // Custom scenario reads from the locked snapshot. When the 2026
  // Performance tab is locked, snapshot.opProfit (= profitAfterVat)
  // populates the Custom card. When unlocked, Custom is greyed out
  // and falls back to base.
  const customProfit = snapshot?.opProfit ?? 124000

  const SCENARIOS = {
    bear:   { label: t('scenarios.bear'),   badge: t('scenarioBadges.bear'),   profit: 0,            color: '#E53935' },
    base:   { label: t('scenarios.base'),   badge: t('scenarioBadges.base'),   profit: 124000,       color: '#C9A84C' },
    bull:   { label: t('scenarios.bull'),   badge: t('scenarioBadges.bull'),   profit: 174000,       color: '#2DD4BF' },
    custom: {
      label:  t('scenarios.custom'),
      badge:  forecastIsLocked ? t('scenarioBadges.custom') : t('scenarioBadges.customUnlocked'),
      profit: customProfit,
      color:  'var(--gold)',
      disabled: !forecastIsLocked,
    },
  }

  const [scenario, setScenario] = useState('base')
  const s = SCENARIOS[scenario]
  const w = calcWaterfall(s.profit, fundingAmount)

  const investorPct = (DEAL.investorEq * 100).toFixed(1)
  const founderPct = (DEAL.founderEq * 100).toFixed(1)

  const steps = [
    { label: t('steps.operatingProfit'), amount: s.profit, color: '#1565C0', note: s.badge },
    { label: t('steps.investorDividend', { pct: investorPct }), amount: w.investorDiv, color: '#C9A84C', note: t('steps.investorNote', { pct: investorPct }) },
    { label: t('steps.founderDividend',  { pct: founderPct  }), amount: w.founderDiv,  color: '#4A5568', note: t('steps.founderNote',  { pct: founderPct  }) },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        {t('title')}
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 32, fontSize: 15 }}>
        {t('subtitle')}
      </p>

      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
        {Object.entries(SCENARIOS).map(([key, sc]) => (
          <button key={key} onClick={() => { if (!sc.disabled) setScenario(key) }} disabled={sc.disabled} style={{
            padding: '8px 20px', borderRadius: 6, fontSize: 12, cursor: sc.disabled ? 'not-allowed' : 'pointer',
            background: scenario === key ? sc.color : 'transparent',
            border: `1px solid ${sc.color}`,
            opacity: sc.disabled ? 0.4 : 1,
            color: scenario === key ? '#0A0A0F' : sc.color,
            fontWeight: scenario === key ? 600 : 400,
            transition: 'all 0.15s',
          }}>{sc.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>

        {/* Waterfall steps */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
            {t('steps.header')}
          </div>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ width: 3, height: 36, background: step.color, borderRadius: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--cream)', marginBottom: 2 }}>{step.label}</div>
                <div style={{ fontSize: 10, color: 'var(--cream-dim)' }}>{step.note}</div>
              </div>
              <div style={{
                fontSize: 16, fontFamily: "'DM Serif Display', serif",
                color: step.amount < 0 ? '#E53935' : step.color,
              }}>
                {step.amount < 0 ? '−' : ''}{fmt(Math.abs(step.amount))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>
            {t('summary.header')}
          </div>

          <div className="card-highlight" style={{ padding: 24 }}>
            <div style={{ fontSize: 10, color: 'var(--gold-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('summary.totalReturn')}
            </div>
            <div className="serif" style={{ fontSize: 36, color: 'var(--gold)', marginBottom: 4 }}>
              {fmt(w.totalInvestor)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--cream-dim)' }}>
              {t('summary.totalReturnNote', { pct: investorPct })}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <Row label={t('summary.cashOnCash')} value={`${(w.coc * 100).toFixed(1)}%`} gold />
            <Row label={t('summary.paybackPeriod')} value={t('summary.paybackYears', { n: w.totalInvestor > 0 ? (fundingAmount / w.totalInvestor).toFixed(2) : 'N/A' })} />
            <Row label={t('summary.onInvested', { amount: fmt(fundingAmount) })} value={fmt(fundingAmount)} gold={fundingIsLocked} />
            <Row label={t('summary.equityDividend', { pct: investorPct })} value={fmt(w.investorDiv)} gold />
            <Row label={t('summary.distributionTiming')} value={t('summary.sameAsFounder')} />
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('summary.founderPosition')}
            </div>
            <Row label={t('summary.founderEquity', { pct: founderPct })} value={fmt(w.founderDiv)} />
            <Row label={t('summary.paid')} value={t('summary.paidNote')} />
          </div>

          <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6, padding: '4px 0' }}>
            {t('summary.footnote')}
          </div>
        </div>
      </div>

      {/* Priority rules callout — what comes out of profit, in what order */}
      <DistributionPriorityNote floor={reserveFloor} target={reserveTarget} />

      {/* Distribution Process — working-capital-first model */}
      <DistributionProcess floor={reserveFloor} target={reserveTarget} />

      {/* 12-month Distribution Calendar — quarterly dividends */}
      <DistributionCalendar
        investment={fundingAmount}
        investorEq={DEAL.investorEq}
        founderEq={DEAL.founderEq}
        reserveTarget={reserveTarget}
        fmt={fmt}
      />

      {/* 5-Year Share Payout Breakdown */}
      <FiveYearPayoutBreakdown investment={fundingAmount} isLocked={fundingIsLocked} fmt={fmt} />
    </div>
  )
}

// ─── Distribution Priority callout ───────────────────────────────────
// Plain-language priority order so an investor understands what comes
// out of profit first, second, third, etc. Mirrors the Hackney pattern;
// numbers come from the Borough rent-prepay snap + £15k cushion.
function DistributionPriorityNote({ floor, target }) {
  return (
    <div style={{
      marginTop: 32, padding: '16px 18px',
      background: 'rgba(34,211,238,0.06)',
      border: '1px solid rgba(34,211,238,0.3)',
      borderRadius: 8,
      fontSize: 13, color: '#A5F3FC', lineHeight: 1.65,
    }}>
      <div style={{ fontSize: 10, color: '#22D3EE', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
        Distribution priority · how money leaves the business each quarter
      </div>
      <ol style={{ margin: 0, paddingLeft: 22 }}>
        <li style={{ marginBottom: 6 }}>
          <strong style={{ color: 'var(--cream)' }}>Director salary first</strong> — budgeted inside the cost base. This is a budget for whichever director the business needs, not specifically the founder. Paid before any dividend.
        </li>
        <li style={{ marginBottom: 6 }}>
          <strong style={{ color: 'var(--cream)' }}>Working-capital reserve</strong> — bank balance must reach the {fmtK(floor)}–{fmtK(target)} safe zone before investor dividends start. {fmtK(floor)} is the locked rent prepay (your Use of Funds choice); {fmtK(target)} adds a {fmtK(target - floor)} cushion for VAT bills and supplier swings.
        </li>
        <li style={{ marginBottom: 6 }}>
          <strong style={{ color: 'var(--cream)' }}>Founder draws every quarter regardless</strong> — the founder cannot wait for the reserve to build. Their pro-rata share is paid each calendar quarter from positive trading profit.
        </li>
        <li style={{ marginBottom: 6 }}>
          <strong style={{ color: 'var(--cream)' }}>Investor draws once the reserve hits the floor</strong> — quarters where the closing balance is below {fmtK(floor)} have the investor's share <em>deferred</em> rather than paid out. No clawback from the founder.
        </li>
        <li>
          <strong style={{ color: 'var(--cream)' }}>Catch-up once the reserve is fully built</strong> — once the bank balance is at or above {fmtK(target)}, the deferred investor balance is paid down on top of the normal quarterly share, so long-run pro-rata equality is preserved.
        </li>
      </ol>
      <div style={{ fontSize: 11, color: '#22D3EE', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(34,211,238,0.2)' }}>
        See the <strong>Business Explorer · Cashflow Forecast</strong> tab for the month-by-month closing-balance projection — the chart shows when the reserve builds up enough to release investor dividends.
      </div>
    </div>
  )
}

// ─── Distribution Process — 5-step priority diagram ──────────────────
// Visual companion to DistributionPriorityNote. Each step is a card
// with a coloured number bubble, an arrow connecting to the next step.
function DistributionProcess({ floor, target }) {
  const steps = [
    {
      n: '1',
      title: 'Director Salary',
      sub: 'Inside the cost base · paid first',
      detail: 'Budget for whichever director the business needs (not specifically the founder). Already deducted before "Operating Profit" is calculated.',
      colour: '#94A3B8',
    },
    {
      n: '2',
      title: `Working Capital · ${fmtK(floor)}–${fmtK(target)}`,
      sub: 'Safe-zone reserve',
      detail: `${fmtK(floor)} floor (the locked rent prepay) and ${fmtK(target)} target (floor + ${fmtK(target - floor)} cushion for VAT bills, supplier swings, repairs). The bank balance refills toward this band before any investor dividend pays out.`,
      colour: '#10B981',
    },
    {
      n: '3',
      title: 'Founder Quarterly Draw',
      sub: 'Every quarter · regardless of reserve',
      detail: 'The founder draws their pro-rata share every calendar quarter from positive trading profit. They cannot wait for the working-capital pot to build.',
      colour: '#A78BFA',
    },
    {
      n: '4',
      title: 'Investor Quarterly Draw',
      sub: `Only once balance ≥ ${fmtK(floor)}`,
      detail: `Investor's pro-rata share pays out only when the closing balance is at or above the ${fmtK(floor)} floor. Quarters below the floor are deferred (not lost — see step 5).`,
      colour: '#C9A84C',
    },
    {
      n: '5',
      title: 'Investor Catch-Up',
      sub: `Once balance ≥ ${fmtK(target)}`,
      detail: `Once the reserve is fully built (${fmtK(target)}), missed investor quarters are paid down on top of the normal quarterly share. Long-run pro-rata equality is preserved.`,
      colour: '#22D3EE',
    },
  ]
  return (
    <div style={{ marginTop: 24 }}>
      <h3 className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginBottom: 8, lineHeight: 1.25 }}>
        Distribution Process · Priority Order
      </h3>
      <p style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, marginBottom: 20 }}>
        How operating profit becomes a dividend cheque. Director salary first, then the {fmtK(floor)}–{fmtK(target)} working-capital reserve, then quarterly distributions — founder paid every quarter, investor paid once the reserve hits the floor with deferred quarters caught up later.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{
            position: 'relative',
            background: 'var(--ink-2)',
            border: `1px solid ${s.colour}40`,
            borderLeft: `3px solid ${s.colour}`,
            borderRadius: 8, padding: '16px 14px',
          }}>
            <div style={{
              position: 'absolute', top: -10, right: 14,
              width: 22, height: 22, borderRadius: '50%',
              background: s.colour, color: 'var(--ink)',
              fontSize: 11, fontWeight: 700, lineHeight: '22px',
              textAlign: 'center', letterSpacing: '0',
            }}>{s.n}</div>
            <div style={{ fontSize: 13, color: s.colour, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{s.sub}</div>
            <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.55 }}>{s.detail}</div>
            {i < steps.length - 1 && (
              <div style={{
                position: 'absolute', right: -10, top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 18, color: 'var(--gold-dim)', zIndex: 1,
              }}>→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 12-Month Distribution Calendar — quarterly dividends ────────────
// Per-month visualisation: operating profit → reserve fill → surplus
// → quarter-end dividend payout. Reads computeBoroughDistributionCalendar
// from data.js, which scales MONTHLY_PROFIT (2025 actuals) up to the
// FORECAST.profit 2026 base case so seasonality is preserved.
function DistributionCalendar({ investment, investorEq, founderEq, reserveTarget, fmt }) {
  const dist = computeBoroughDistributionCalendar({ reserveTarget, investorEq, founderEq })
  const { calendar, quarterly, summary } = dist
  const investorAnnualPct = investment > 0 ? (summary.totalInvestor / investment) * 100 : 0

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
          12-Month Distribution Calendar · Y1 2026
        </div>
        <div style={{ fontSize: 10, color: 'var(--cream-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Driven by 2025 monthly seasonality scaled to 2026 forecast
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, marginBottom: 16 }}>
        Each month's operating profit refills the £{summary.reserveTarget.toLocaleString('en-GB')} working-capital reserve first. Once the reserve is full, surplus profit accrues for three months and pays out at the end of the calendar quarter. Reserve hit full in <strong style={{ color: 'var(--cream)' }}>{summary.reserveFullMonth}</strong>.
      </p>

      {/* Reserve build-up bar — shows month-by-month fill */}
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--gold-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Reserve fill — £{summary.reserveTarget.toLocaleString('en-GB')} target</span>
          <span style={{ fontSize: 12, color: 'var(--teal)', fontVariantNumeric: 'tabular-nums' }}>Year-end balance: {fmt(summary.yearEndReserve)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
          {calendar.map((m, i) => (
            <div key={m.month} style={{ position: 'relative' }}>
              <div style={{ fontSize: 9, color: 'var(--cream-dim)', textTransform: 'uppercase', textAlign: 'center', marginBottom: 4, letterSpacing: '0.04em' }}>{m.month}</div>
              <div style={{ height: 56, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: `${m.reservePct * 100}%`,
                  background: m.reservePct >= 1 ? 'linear-gradient(180deg, #10B981, rgba(16,185,129,0.6))' : 'linear-gradient(180deg, var(--teal), rgba(45,212,191,0.5))',
                  transition: 'height 0.2s',
                }} />
                {m.isQuarterEnd && (
                  <div style={{
                    position: 'absolute', top: 2, left: 2, right: 2,
                    fontSize: 8, color: 'var(--gold)',
                    background: 'rgba(201,168,76,0.18)',
                    borderRadius: 2, padding: '1px 0',
                    textAlign: 'center', letterSpacing: '0.06em', fontWeight: 600,
                  }}>{`Q${Math.floor(i / 3) + 1}`}</div>
                )}
              </div>
              <div style={{ fontSize: 9, color: 'var(--cream-dim)', textAlign: 'center', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(m.reservePct * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-month detail table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(201,168,76,0.3)', fontSize: 10, color: 'var(--gold-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <span>Month</span>
          <span style={{ textAlign:'right' }}>Op Profit</span>
          <span style={{ textAlign:'right' }}>Reserve Δ</span>
          <span style={{ textAlign:'right' }}>Reserve Bal.</span>
          <span style={{ textAlign:'right' }}>Surplus</span>
          <span style={{ textAlign:'right' }}>Dividend (Q-end)</span>
        </div>
        {calendar.map(m => (
          <div key={m.month} style={{
            display: 'grid', gridTemplateColumns: '0.6fr 1fr 1fr 1fr 1fr 1fr',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: 12, fontVariantNumeric: 'tabular-nums',
            background: m.isQuarterEnd ? 'rgba(201,168,76,0.06)' : 'transparent',
          }}>
            <span style={{ color: m.isQuarterEnd ? 'var(--gold)' : 'var(--cream)', fontWeight: m.isQuarterEnd ? 600 : 400 }}>
              {m.month}{m.isQuarterEnd ? ' ●' : ''}
            </span>
            <span style={{ textAlign: 'right', color: m.profit >= 0 ? 'var(--cream)' : '#E53935' }}>
              {m.profit >= 0 ? '' : '−'}{fmt(Math.abs(m.profit))}
            </span>
            <span style={{ textAlign: 'right', color: m.reserveAdd >= 0 ? 'var(--teal)' : '#F87171' }}>
              {m.reserveAdd >= 0 ? '+' : '−'}{fmt(Math.abs(m.reserveAdd))}
            </span>
            <span style={{ textAlign: 'right', color: 'var(--cream-dim)' }}>{fmt(m.reserveBalance)}</span>
            <span style={{ textAlign: 'right', color: m.surplus >= 0 ? 'var(--gold-dim)' : '#F87171' }}>
              {m.surplus >= 0 ? '' : '−'}{fmt(Math.abs(m.surplus))}
            </span>
            <span style={{ textAlign: 'right', color: m.dividendPaid > 0 ? 'var(--gold)' : 'var(--ink-3)', fontWeight: m.dividendPaid > 0 ? 600 : 400 }}>
              {m.dividendPaid > 0 ? fmt(m.dividendPaid) : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Four quarter summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {quarterly.map((q) => (
          <div key={q.quarter} style={{
            background: q.dividend > 0 ? 'rgba(201,168,76,0.06)' : 'var(--ink-2)',
            border: `1px solid ${q.dividend > 0 ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10, padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{q.quarter}</span>
              <span style={{ fontSize: 10, color: 'var(--cream-dim)' }}>End of {q.endMonth}</span>
            </div>
            <div className="serif" style={{ fontSize: 22, color: q.dividend > 0 ? 'var(--gold)' : 'var(--cream-dim)', marginBottom: 4 }}>
              {q.dividend > 0 ? fmt(q.dividend) : '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.5 }}>
              {q.dividend > 0
                ? <>Investor <strong style={{ color: 'var(--gold)' }}>{fmt(q.investorShare)}</strong> · Founder {fmt(q.founderShare)}</>
                : 'No surplus this quarter'}
            </div>
          </div>
        ))}
      </div>

      {/* Annual summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <SummaryTile label="Annual operating profit" value={fmt(summary.annualProfit)} sub="Sum of 12 monthly forecasts" />
        <SummaryTile label="Total Y1 dividends" value={fmt(summary.totalDividends)} sub={`After £${reserveTarget.toLocaleString('en-GB')} reserve refill`} />
        <SummaryTile label="Investor 50% share" value={fmt(summary.totalInvestor)} sub={`${investorAnnualPct.toFixed(1)}% cash-on-cash on ${fmt(investment)}`} colour="#10B981" />
        <SummaryTile label="Founder 50% share" value={fmt(summary.totalFounder)} sub="Paid alongside investor" />
      </div>
    </div>
  )
}

// ─── 5-Year share payout schedule + cumulative tracker ───────────────
// Shows year-by-year how the investor stake gets paid back via pro-rata
// dividends + Year 5 exit. Y1-Y5 profit + share figures come from
// BOROUGH_INVESTOR_RETURNS in data.js (Y1 = FORECAST.profit, Y2-Y5 at
// +10% YoY compounding — placeholder until the workbook ships a multi-
// year P&L). Live MoM, CoC and IRR cascade off the locked investment.
function FiveYearPayoutBreakdown({ investment, isLocked, fmt }) {
  const r = BOROUGH_INVESTOR_RETURNS
  const cashFlows = [-investment, ...r.fiveYear.map((y, i) =>
    i === r.fiveYear.length - 1 ? y.investorShare + r.exit.investorProceeds : y.investorShare
  )]
  const totalReturned   = r.cumulativeDividends + r.exit.investorProceeds
  const multipleOfMoney = investment > 0 ? totalReturned / investment : 0
  const irr             = computeIRR(cashFlows)
  let cumInv = 0
  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
        5-Year Share Payout Schedule{isLocked ? ' · Locked' : ''}
      </div>
      <p style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, marginBottom: 16 }}>
        How the £{investment.toLocaleString('en-GB')} investor stake gets paid back. Each year's profit splits 50/50 with the founder. Year 5 exit at 4× EBITDA returns the equity holding alongside the final dividend. No preferred return, no priority tiers — investor and founder track exactly together.
      </p>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(201,168,76,0.3)', fontSize: 10, color: 'var(--gold-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <span>Year</span>
          <span style={{ textAlign:'right' }}>Revenue</span>
          <span style={{ textAlign:'right' }}>Profit</span>
          <span style={{ textAlign:'right' }}>Investor 50%</span>
          <span style={{ textAlign:'right' }}>Founder 50%</span>
          <span style={{ textAlign:'right' }}>Cumulative paid</span>
        </div>
        {r.fiveYear.map(y => {
          cumInv += y.investorShare
          return (
            <div key={y.year} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ color: 'var(--cream)' }}>{y.year}</span>
              <span style={{ color: 'var(--cream-dim)', textAlign:'right' }}>{fmt(y.revenue)}</span>
              <span style={{ color: 'var(--cream)', textAlign:'right' }}>{fmt(y.profit)}</span>
              <span style={{ color: 'var(--gold)', textAlign:'right' }}>{fmt(y.investorShare)}</span>
              <span style={{ color: 'var(--cream-dim)', textAlign:'right' }}>{fmt(y.founderShare)}</span>
              <span style={{ color: 'var(--gold)', textAlign:'right' }}>{fmt(cumInv)}</span>
            </div>
          )
        })}
        {/* Year 5 exit row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(201,168,76,0.3)', fontSize: 13, fontVariantNumeric: 'tabular-nums', background: 'rgba(45,212,191,0.04)' }}>
          <span style={{ color: 'var(--cream)' }}>Y5 Exit (4× EBITDA)</span>
          <span style={{ color: 'var(--cream-dim)', textAlign:'right' }}>—</span>
          <span style={{ color: 'var(--cream-dim)', textAlign:'right' }}>{fmt(r.exit.businessValue)}</span>
          <span style={{ color: '#2DD4BF', textAlign:'right' }}>{fmt(r.exit.investorProceeds)}</span>
          <span style={{ color: 'var(--cream-dim)', textAlign:'right' }}>{fmt(r.exit.founderProceeds)}</span>
          <span style={{ color: '#2DD4BF', textAlign:'right' }}>{fmt(cumInv + r.exit.investorProceeds)}</span>
        </div>
        {/* Total row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 16px', fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ color: 'var(--cream)' }}>Total returned</span>
          <span></span>
          <span></span>
          <span className="serif" style={{ color: 'var(--gold)', fontSize: 18, textAlign:'right' }}>{fmt(totalReturned)}</span>
          <span style={{ color: 'var(--cream-dim)', textAlign:'right' }}>{fmt(r.cumulativeDividends + r.exit.founderProceeds)}</span>
          <span className="serif" style={{ color: 'var(--gold)', fontSize: 18, textAlign:'right' }}>{multipleOfMoney.toFixed(2)}× MoM</span>
        </div>
      </div>

      {/* Headline summary cards under the table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
        <SummaryTile label="Cumulative dividends Y1–Y5"  value={fmt(r.cumulativeDividends)}    sub="Pure pro-rata, paid annually" />
        <SummaryTile label="Y5 exit proceeds"             value={fmt(r.exit.investorProceeds)} sub={`50% of £${(r.exit.businessValue/1000).toFixed(0)}k business value`} />
        <SummaryTile label="Total returned · MoM"         value={`${multipleOfMoney.toFixed(2)}×`} sub={`${fmt(totalReturned)} on ${fmt(investment)}`} colour="#10B981" />
        <SummaryTile label="IRR"                          value={isFinite(irr) ? `${(irr*100).toFixed(1)}%` : '—'} sub="5-year internal rate of return" colour="#10B981" />
      </div>
    </div>
  )
}

function SummaryTile({ label, value, sub, colour }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div className="serif" style={{ fontSize: 'clamp(1.3rem, 2vw, 1.6rem)', color: colour || 'var(--gold)', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{sub}</div>
    </div>
  )
}

function Row({ label, value, gold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 12, color: 'var(--cream-dim)' }}>{label}</span>
      <span style={{ fontSize: 13, color: gold ? 'var(--gold)' : 'var(--cream)' }}>{value}</span>
    </div>
  )
}
