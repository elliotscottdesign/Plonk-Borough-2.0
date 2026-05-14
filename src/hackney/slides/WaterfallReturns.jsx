import React, { useState } from 'react'
import {
  DEAL, HACKNEY_INVESTOR_RETURNS, computeDealFromInvestment, computeInvestorDividend, PL_WAGE_BASE,
  computeDistributionCalendar, HACKNEY_WORKING_CAPITAL_RESERVE,
  HACKNEY_WORKING_CAPITAL_FLOOR, HACKNEY_WORKING_CAPITAL_TARGET,
} from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

// WaterfallReturns — clones Borough's structure: 4-button scenario selector +
// 3-step waterfall (Operating Profit → B-class Preferred → Pro-rata Residual)
// + summary cards (Total Return / Cash-on-Cash / Founder Position).
//
// Round 1 mechanic: B-class shareholders receive a £5,000/yr preferred
// dividend (pro-rata to each B holder's slice of the B-class) BEFORE the
// residual profit is shared pro-rata across all equity. The investor
// calculator below routes through computeInvestorDividend() so the
// headline figures reflect the preferred uplift.

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

function calcWaterfall(profit, deal) {
  // New investor's dividend (preferred + pro-rata residual)
  const investorDiv = computeInvestorDividend(profit, deal.investorEq)
  // Everyone-else's dividend = profit - new investor's dividend
  // (this bundles founder 70% + Investor #1 5% B-share, both of which
  // also receive a slice of the preferred but stay outside the slider
  // calculator).
  const founderDiv = Math.max(0, profit - investorDiv)
  const totalInvestor = investorDiv
  const coc = deal.investment > 0 ? totalInvestor / deal.investment : 0
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

export default function WaterfallReturns() {
  const { effective: ctxEffective, isLocked, isWageLocked, wageEffective } = useLockedUseOfFunds()
  // Build a deal-shape struct from the live context investment — DEAL
  // governance fields (investor/founder equity etc.) overlaid with
  // pre/post-money + implied multiple computed from the slider value.
  const effective = { ...DEAL, ...computeDealFromInvestment(ctxEffective.investment) }

  // Scenario profit figures use the new 2026 cost model with the
  // £65k+VAT pa lease (Y1 rent £48,750 net, 9 paying months; rates
  // £16,830; +10% on other fixed and stock). Revenue, variable and VAT
  // scale together; wages, other fixed and director are held flat
  // across scenarios. Default profits below assume PL_WAGE_BASE wages;
  // if the founder has locked the Wage Calculator at a different total,
  // every scenario shifts down by that wage delta (wages reduce profit
  // 1:1 since they're a flat line per scenario).
  const wageDelta = isWageLocked ? wageEffective.loadedAnnual - PL_WAGE_BASE : 0
  // Scenario op-profit deltas (May 2026 lease change): rent-free period
  // dropped from 4 months to 3 months, adding £5,417 of Y1 rent across
  // every scenario. Each base figure below is the prior value minus the
  // £5,417 rent uplift (rent doesn't scale with revenue, so all three
  // scenarios shift by the same flat amount).
  const SCENARIOS = {
    bear:   { label: 'Conservative +10%', badge: 'Conservative scenario',                                          profit:  68995 - wageDelta,       color: '#E53935' },
    base:   { label: 'Base Case +15%',    badge: 'Base case scenario',                                              profit:  85181 - wageDelta,       color: '#C9A84C' },
    bull:   { label: 'Optimistic +20%',   badge: 'Optimistic scenario',                                             profit: 101373 - wageDelta,       color: '#2DD4BF' },
    custom: {
      label:    'Custom',
      badge:    isLocked ? 'Live from locked Use of Funds' : 'Lock the Use of Funds slider tool to populate',
      profit:    85181 - wageDelta,
      color:    'var(--gold)',
      disabled: !isLocked,
    },
  }

  const [scenario, setScenario] = useState(isLocked ? 'custom' : 'base')
  const s = SCENARIOS[scenario]
  const w = calcWaterfall(s.profit, effective)

  const investorPct = (effective.investorEq * 100).toFixed(1)
  const founderPct = (effective.founderEq * 100).toFixed(1)

  const steps = [
    { label: 'Operating Profit',                          amount: s.profit,    color: '#1565C0', note: s.badge },
    { label: `Investor Dividend (${investorPct}%)`,       amount: w.investorDiv, color: '#C9A84C', note: `${investorPct}% × operating profit · paid pro-rata` },
    { label: `Founder Dividend (${founderPct}%)`,         amount: w.founderDiv,  color: '#4A5568', note: `${founderPct}% × operating profit · paid pro-rata` },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        Investor Returns
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 32, fontSize: 15 }}>
        Pure pro-rata 50/50 between the founder side and the investor pool. <strong style={{ color: 'var(--cream)' }}>Within the investor pool, two share classes</strong> — A-shares (≥ £10k cheques · full voting · paid first) and B-shares (&lt; £10k cheques · limited voting · paid after the A-share allocation completes). Founder draws their 50% pro-rata share each quarter regardless.{isLocked ? ` Live from locked Use of Funds: ${fmt(effective.investment)} raise.` : ''}
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

      {/* Hero metrics strip — equal-width 4-card row. Mirrors Borough
          WaterfallReturns. Total Return is the gold highlighted card,
          the other three carry supporting ratios. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <div className="card-highlight" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 10, color: 'var(--gold-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Total Return
          </div>
          <div className="serif" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: 'var(--gold)', lineHeight: 1, marginBottom: 8 }}>
            {fmt(w.totalInvestor)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.5 }}>
            {investorPct}% pro-rata dividend on operating profit
          </div>
        </div>

        <HeroStat
          label="Cash-on-Cash"
          value={`${(w.coc * 100).toFixed(1)}%`}
          sub={`On ${fmt(effective.investment)} invested`}
          gold
        />
        <HeroStat
          label="Payback Period"
          value={w.totalInvestor > 0 ? `${(effective.investment / w.totalInvestor).toFixed(2)} years` : 'N/A'}
          sub="Distribution timing: same as founder"
        />
        <HeroStat
          label={`Founder Position (${founderPct}%)`}
          value={fmt(w.founderDiv)}
          sub="Paid alongside investor, pro-rata"
          muted
        />
      </div>

      {/* Distribution Waterfall — 3-card horizontal row showing how
          operating profit splits. Visually distinct from the hero strip
          via a coloured left border on each card. */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>
          Distribution Waterfall
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {steps.map((step, i) => (
            <div key={i} className="card" style={{ padding: '18px 20px', borderLeft: `3px solid ${step.color}` }}>
              <div style={{ fontSize: 11, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {step.label}
              </div>
              <div className="serif" style={{
                fontSize: 'clamp(1.4rem, 2.4vw, 1.8rem)', lineHeight: 1, marginBottom: 8,
                color: step.amount < 0 ? '#E53935' : step.color,
              }}>
                {step.amount < 0 ? '−' : ''}{fmt(Math.abs(step.amount))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.55 }}>
                {step.note}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6, marginBottom: 4 }}>
        Cash-flow driven — no exit required for investor to receive full return. Payback from Year 1 trading distributions only.
      </div>

      {/* Distribution Process — working-capital-first model. Replaces the
          old DistributionPriorityNote cyan callout: same 5-rule content,
          better visual treatment (numbered step cards with arrows). */}
      <DistributionProcess />

      {/* 12-month Distribution Calendar — quarterly dividends */}
      <DistributionCalendar
        wagesOverride={isWageLocked ? wageEffective.loadedAnnual : null}
        investment={effective.investment}
        investorEq={effective.investorEq}
        founderEq={effective.founderEq}
        isWageLocked={isWageLocked}
      />

      {/* 5-Year Share Payout Breakdown */}
      <FiveYearPayoutBreakdown investment={effective.investment} isLocked={isLocked} />
    </div>
  )
}

// ─── Distribution Process — explanatory waterfall flow ────────────────
// Shows the 5-step rule book in plain language so an investor understands
// the priority order:
//   1) Director salary       → already inside the cost base; paid first
//   2) Working-capital pot   → refilled to a £30k–£45k safe-zone band
//   3) Founder quarterly draw → founder takes their share every quarter
//                                regardless (cannot wait for the pot to
//                                build)
//   4) Investor quarterly draw → only paid once the pot is at or above
//                                the £30k floor; otherwise the investor's
//                                share for that quarter is deferred
//   5) Investor catch-up      → once the pot reaches £45k target, the
//                                deferred quarters are paid down so
//                                long-run pro-rata equality is preserved
const FLOOR  = HACKNEY_WORKING_CAPITAL_FLOOR    // £30,000
const TARGET = HACKNEY_WORKING_CAPITAL_TARGET   // £45,000
const fmtK   = (n) => '£' + Math.round(n / 1000) + 'k'

function DistributionProcess() {
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
      title: `Working Capital · ${fmtK(FLOOR)}–${fmtK(TARGET)}`,
      sub: 'Safe-zone reserve',
      detail: `${fmtK(FLOOR)} floor (≈ 3 months' rent) and ${fmtK(TARGET)} target (floor + ${fmtK(TARGET-FLOOR)} cushion for VAT bills, supplier swings, repairs). The bank balance refills toward this band before any investor dividend pays out.`,
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
      sub: `Only once balance ≥ ${fmtK(FLOOR)}`,
      detail: `Investor's pro-rata share pays out only when the closing balance is at or above the ${fmtK(FLOOR)} floor. Quarters below the floor are deferred (not lost — see step 5).`,
      colour: '#C9A84C',
    },
    {
      n: '5',
      title: 'Investor Catch-Up',
      sub: `Once balance ≥ ${fmtK(TARGET)}`,
      detail: `Once the reserve is fully built (${fmtK(TARGET)}), missed investor quarters are paid down on top of the normal quarterly share. Long-run pro-rata equality is preserved.`,
      colour: '#22D3EE',
    },
  ]
  return (
    <div style={{ marginTop: 24 }}>
      <h3 className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginBottom: 8, lineHeight: 1.25 }}>
        Distribution Process · Priority Order
      </h3>
      <p style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, marginBottom: 20 }}>
        How operating profit becomes a dividend cheque. Director salary first, then the {fmtK(FLOOR)}–{fmtK(TARGET)} working-capital reserve, then quarterly distributions — founder paid every quarter, investor paid once the reserve hits the floor with deferred quarters caught up later.
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

// ─── 12-Month Distribution Calendar — quarterly dividends ─────────────
// Per-month visualisation: operating profit → reserve fill → surplus
// → quarter-end dividend payout. Reads the same buildForecastMonthly
// logic that powers the 2026 Performance tab, so monthly figures are
// consistent end-to-end. Surfaces the reserve build timeline + four
// quarter cards so investors see exactly when each dividend lands.
function DistributionCalendar({ wagesOverride, investment, investorEq, founderEq, isWageLocked }) {
  const dist = computeDistributionCalendar(wagesOverride, { investorEq, founderEq })
  const { calendar, quarterly, summary } = dist
  const investorAnnualPct = investment > 0 ? (summary.totalInvestor / investment) * 100 : 0
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginTop: 40 }}>
      <CollapsibleHeader
        open={open}
        onToggle={() => setOpen(o => !o)}
        title={<>12-Month Distribution Calendar <span style={{ color: 'var(--gold-dim)' }}>· Y1 2026/27</span></>}
        meta={`Driven by 2026 Performance monthly forecast${isWageLocked ? ' · 🔒 wages locked' : ''}`}
      />
      {open && <>
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
        {quarterly.map((q, i) => (
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
        <SummaryTile label="Total Y1 dividends" value={fmt(summary.totalDividends)} sub="After £30k reserve refill" />
        <SummaryTile label="Investor 50% share" value={fmt(summary.totalInvestor)} sub={`${investorAnnualPct.toFixed(1)}% cash-on-cash on ${fmt(investment)}`} colour="#10B981" />
        <SummaryTile label="Founder 50% share" value={fmt(summary.totalFounder)} sub="Paid alongside investor" />
      </div>
      </>}
    </div>
  )
}

// ─── 5-Year share payout schedule + cumulative tracker ────────────────
// Shows year-by-year how the investor stake gets paid back via pro-rata
// dividends + Year 5 exit. Investor's £-share of each year's profit is
// fixed (50% of operating profit, independent of investment size), so
// dividend rows stay constant — only MoM, CoC and IRR scale with the
// locked investment amount. Mirrors Borough's payout-schedule layout.
function FiveYearPayoutBreakdown({ investment, isLocked }) {
  const r = HACKNEY_INVESTOR_RETURNS
  // Recompute investor-side metrics live from the locked investment so
  // MoM / CoC / IRR cascade from the Use-of-Funds slider. Y1–Y5 share
  // amounts are baked into HACKNEY_INVESTOR_RETURNS (50/50 split holds
  // regardless of investment, so they don't change).
  const cashFlows = [-investment, ...r.fiveYear.map((y, i) =>
    i === r.fiveYear.length - 1 ? y.investorShare + r.exit.investorProceeds : y.investorShare
  )]
  const totalReturned   = r.cumulativeDividends + r.exit.investorProceeds
  const multipleOfMoney = investment > 0 ? totalReturned / investment : 0
  const irr             = computeIRR(cashFlows)
  const [open, setOpen] = useState(false)
  let cumInv = 0
  return (
    <div style={{ marginTop: 40 }}>
      <CollapsibleHeader
        open={open}
        onToggle={() => setOpen(o => !o)}
        title={<>5-Year Share Payout Schedule{isLocked ? <span style={{ color: 'var(--gold-dim)' }}> · Locked</span> : null}</>}
      />
      {open && <>
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
        <SummaryTile label="Total returned · MoM"          value={`${multipleOfMoney.toFixed(2)}×`}             sub={`${fmt(totalReturned)} on ${fmt(investment)}`} colour="#10B981" />
        <SummaryTile label="IRR"                            value={isFinite(irr) ? `${(irr*100).toFixed(1)}%` : '—'} sub="5-year internal rate of return" colour="#10B981" />
      </div>
      </>}
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

// Compact hero stat — used in the top-of-page metrics strip alongside
// the gold Total Return card. Mirrors Borough's HeroStat.
function HeroStat({ label, value, sub, gold, muted }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div className="serif" style={{
        fontSize: 'clamp(1.4rem, 2.4vw, 1.8rem)', lineHeight: 1, marginBottom: 6,
        color: gold ? 'var(--gold)' : muted ? 'var(--cream-dim)' : 'var(--cream)',
      }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{sub}</div>
    </div>
  )
}

// Reusable header for collapsible sections — mirrors Borough's
// CollapsibleHeader. Large rotating arrow on the left, serif h3 title,
// optional UPPERCASE meta tag on the right. Click anywhere toggles.
function CollapsibleHeader({ open, onToggle, title, meta }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', gap: 14, marginBottom: 12,
        background: 'transparent', border: 'none', padding: 0,
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <span style={{
          fontSize: 28, color: 'var(--gold)', lineHeight: 1, flexShrink: 0,
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 0.2s ease',
          display: 'inline-block', width: 24, textAlign: 'center',
        }}>▾</span>
        <h3 className="serif" style={{
          fontSize: 22, color: 'var(--cream)', lineHeight: 1.25, margin: 0,
        }}>
          {title}
        </h3>
      </span>
      {meta && (
        <span style={{ fontSize: 10, color: 'var(--cream-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
          {meta}
        </span>
      )}
    </button>
  )
}
