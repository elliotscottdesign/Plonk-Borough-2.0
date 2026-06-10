import React, { useState } from 'react'
import {
  DEAL, HACKNEY_INVESTOR_RETURNS, computeDealFromInvestment, computeInvestorDividend, PL_WAGE_BASE,
  computeDistributionCalendar, HACKNEY_WORKING_CAPITAL_RESERVE,
  HACKNEY_WORKING_CAPITAL_FLOOR, HACKNEY_WORKING_CAPITAL_TARGET,
  computeBuybackValue,
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
  // Per-share dividend × the investor's share count. Founder shares are
  // all A-class (76 total) and external are B-class — but the £X
  // declared per share is the same for both classes. The class
  // distinction is purely voting + dilution-protection.
  const investorDiv = computeInvestorDividend(profit, deal.investment)
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
  const totalShares = DEAL.totalShares || 100
  const investorShares = Math.round((effective.investment || 0) / (DEAL.pricePerShare || 1000))
  const founderShares  = totalShares - investorShares - 5 /* Leonie intended */
  const perShareY1 = totalShares > 0 ? s.profit / totalShares : 0

  const steps = [
    { label: 'Operating Profit',                                            amount: s.profit,      color: '#1565C0', note: s.badge },
    { label: `Per-Share Dividend (£${perShareY1.toFixed(2)})`,               amount: s.profit,      color: '#10B981', note: `Directors declare £X per share · all 100 shares get the same rate · Y1 indicative ${fmt(perShareY1)} per share` },
    { label: `Your Slice (${investorShares} shares)`,                       amount: w.investorDiv, color: '#C9A84C', note: `${investorShares} shares × £${perShareY1.toFixed(2)} per share · paid at the 12-month review` },
    { label: `Founder Slice (${founderShares} shares)`,                     amount: w.founderDiv,  color: '#4A5568', note: `${founderShares} A+B shares × same £${perShareY1.toFixed(2)} per share · same review window` },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        Investor Returns
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 32, fontSize: 15 }}>
        The company issues <strong style={{ color: 'var(--cream)' }}>100 shares at £1,000 each</strong> (£100k post-money). Dividends are declared by the <strong style={{ color: 'var(--cream)' }}>directors as £X per share</strong> at each review date, based on the trailing 12 months of trading. <strong style={{ color: 'var(--cream)' }}>Year 1</strong>: single declaration at the 12-month mark. <strong style={{ color: 'var(--cream)' }}>Year 2 onwards</strong>: reviewed every 6 months. Every share (A or B) is entitled to the same per-share amount — your dividend = shares held × £X declared. Conditions: director salary first, working-capital reserve at or above £{HACKNEY_WORKING_CAPITAL_FLOOR.toLocaleString('en-GB')} floor at the review date. Founder retains a Y3 buyback right (CALL OPTION) at market value × your equity %.{isLocked ? ` Live from locked Use of Funds: ${fmt(effective.investment)} raise.` : ''}
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
            {investorShares} shares × £{perShareY1.toFixed(2)} per share · declared at the 12-month review
          </div>
        </div>

        <HeroStat
          label="Cash-on-Cash"
          value={`${(w.coc * 100).toFixed(1)}%`}
          sub={`Annual entitlement on ${fmt(effective.investment)} invested`}
          gold
        />
        <HeroStat
          label="Payback Period"
          value={w.totalInvestor > 0 ? `${(effective.investment / w.totalInvestor).toFixed(2)} years` : 'N/A'}
          sub="Entitlement basis (cash arrives at month-12 declaration, then every 6 months)"
        />
        <HeroStat
          label={`Founder Position (${founderShares} shares)`}
          value={fmt(w.founderDiv)}
          sub="Same £/share rate · all 100 shares equal"
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

      {/* Y3 Buyback Right — put-option card. Capped at multiple-of-money. */}
      <BuybackRightsCard
        investment={effective.investment}
        investorEq={effective.investorEq}
      />

      {/* Future rounds + pre-emption rights — Round 2 dilution mechanics */}
      <FutureRoundsCard investment={effective.investment} />

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
//   1) Director salary        → already inside the cost base; paid first
//   2) Working-capital pot    → refilled to a £30k–£45k safe-zone band
//   3) Investor quarterly draw → investor's pro-rata share pays out first
//                                each quarter, but only once the closing
//                                balance is at or above the £30k floor;
//                                quarters below the floor are deferred
//   4) Founder quarterly draw → founder takes their pro-rata share AFTER
//                                the investor has been paid. Investor
//                                priority sits ahead of the founder in
//                                the dividend queue.
//   5) Investor catch-up      → once the pot reaches £45k target, the
//                                deferred investor quarters are paid down
//                                so long-run pro-rata equality is preserved
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
      sub: 'Reserve must be at floor',
      detail: `${fmtK(FLOOR)} floor (≈ 3 months' rent) and ${fmtK(TARGET)} target (floor + ${fmtK(TARGET-FLOOR)} cushion for VAT bills, supplier swings, repairs). All Y1 operating profit accrues into this reserve. Reserve must be at or above the floor at any review date for the directors to declare a dividend.`,
      colour: '#10B981',
    },
    {
      n: '3',
      title: 'Directors Review',
      sub: 'Y1 at month 12 · Y2+ every 6 months',
      detail: 'At each review date the directors look at the trailing 12 months of trading + outlook. Y1 has a single review at the 12-month mark; Y2 onwards reviews twice a year (months 18, 24, 30, 36, …). The dividend is announced shortly before the review date.',
      colour: '#C9A84C',
    },
    {
      n: '4',
      title: '£X Per-Share Dividend',
      sub: '100 shares · every share equal',
      detail: 'The directors declare a £X-per-share dividend for the period. Every share — 76 Founder A and 24 external B alike — is entitled to the same £X. Your payout = the number of shares you hold × £X. No preferred class, no within-window priority.',
      colour: '#A78BFA',
    },
    {
      n: '5',
      title: 'Y3 Founder Call',
      sub: 'Optional buyback at market value',
      detail: 'At end of Y3 the Founder may call back any external B holder. Buyback price = Y3 fair market value × shares held (no multiple-of-money cap). Investor keeps every dividend already paid; Round-2 conversion makes shares non-callable.',
      colour: '#22D3EE',
    },
  ]
  return (
    <div style={{ marginTop: 24 }}>
      <h3 className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginBottom: 8, lineHeight: 1.25 }}>
        Distribution Process · From profit to a per-share dividend
      </h3>
      <p style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, marginBottom: 20 }}>
        Director salary first, then the {fmtK(FLOOR)}–{fmtK(TARGET)} working-capital reserve must be at or above the floor. Directors then review trailing-12-month trading and declare a £X-per-share dividend — Y1 at the 12-month mark, Y2 onwards every 6 months. Every share gets the same £X. Below-floor reviews are skipped.
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

// ─── Y3 Founder Buyback Right — CALL OPTION at market rate ────────────
// The Founder may call back any external B-share holder at the end of
// Y3. Buyback price = Y3 fair market value × investor's shares held.
// NO multiple-of-money cap — pure market rate. Investor receives full
// fair value when bought back early.
//
// Investor protections: cumulative dividends Y1-Y3 are not clawed back;
// fair-value mechanism gives full upside if business is strong;
// Round-2 conversion makes shares non-callable.
function BuybackRightsCard({ investment, investorEq }) {
  // Y3 fair value = Y3 profit × exit multiple (consistent with Y5 model)
  const y3 = HACKNEY_INVESTOR_RETURNS.fiveYear[2]   // Y3 row
  const y3FairValue = y3.profit * (DEAL.exitMultiple || 4)
  const perShareY3 = (DEAL.totalShares || 100) > 0 ? y3FairValue / (DEAL.totalShares || 100) : 0
  const investorShares = Math.round((investment || 0) / (DEAL.pricePerShare || 1000))

  // Investor's personal buyback math (driven by locked investment)
  const bb = computeBuybackValue(investment, y3FairValue, { investorEq })

  // Worst-case cash-out at Y3 if founder calls everyone (5 Leonie + 19 new = 24 shares × per-share Y3 value)
  const totalExternalCommitted = (DEAL.commitments || [])
    .filter(c => c.type === 'external')
    .reduce((s, c) => s + (c.amount || 0), 0)
  const totalExternalRound = totalExternalCommitted + investment
  const totalExternalShares = totalExternalRound / (DEAL.pricePerShare || 1000)
  const worstCaseLiability = totalExternalShares * perShareY3
  const monthlyDrain = worstCaseLiability / (DEAL.founderBuybackStaggerMonths || DEAL.buybackStaggerMonths || 12)

  return (
    <div style={{ marginTop: 32 }}>
      <h3 className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginBottom: 8, lineHeight: 1.25 }}>
        Y{DEAL.buybackYear} Founder Buyback Right · Call Option at Market Rate
      </h3>
      <p style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, marginBottom: 18 }}>
        At the end of Year {DEAL.buybackYear}, the <strong style={{ color: 'var(--cream)' }}>Founder</strong> may call back any external B-share holder. Price = <strong style={{ color: 'var(--cream)' }}>Y3 fair market value × shares held</strong>. <strong style={{ color: 'var(--gold)' }}>No multiple-of-money cap</strong> — pure market rate. Investor receives full fair value at the Y3 valuation. Year 5 pro-rata exit only applies if the founder chose not to call at Y3.
      </p>

      {/* Investor's exposure at the locked slider position */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div className="card-highlight" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 10, color: 'var(--gold-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Your Y{DEAL.buybackYear} buyback payout (if called)
          </div>
          <div className="serif" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: 'var(--gold)', lineHeight: 1, marginBottom: 8 }}>
            {fmt(bb.payout)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.5 }}>
            On {fmt(investment)} invested · {investorShares} shares × £{perShareY3.toFixed(2)} per share at Y3 fair value
          </div>
        </div>
        <SummaryTile
          label="Per-share Y3 value"
          value={`£${perShareY3.toFixed(2)}`}
          sub={`Y${DEAL.buybackYear} fair value ${fmt(y3FairValue)} ÷ ${DEAL.totalShares || 100} shares`}
        />
        <SummaryTile
          label="Y3 fair value (basis)"
          value={fmt(y3FairValue)}
          sub={`Y${DEAL.buybackYear} EBITDA ${fmt(y3.profit)} × ${DEAL.exitMultiple || 4}× exit multiple`}
        />
      </div>

      {/* Protective clauses */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--gold-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>
          Pricing formula + protective clauses
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.7 }}>
          <div style={{ marginBottom: 10 }}>
            <strong style={{ color: 'var(--gold)' }}>Founder Call price = </strong>
            Y3 fair-market value × investor's shares held ÷ 100 (no cap)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--cream)' }}>Simultaneous-exercise stagger.</strong> If the founder calls multiple investors in the same window, payments stagger over up to <strong style={{ color: 'var(--cream)' }}>{DEAL.founderBuybackStaggerMonths || DEAL.buybackStaggerMonths || 12} months</strong>. Worst-case Round-1 cash-out ≈ <strong style={{ color: 'var(--gold)' }}>{fmt(worstCaseLiability)}</strong> (all external shares × Y3 per-share value) → max ≈ <strong style={{ color: 'var(--cream)' }}>{fmt(monthlyDrain)}/month</strong> from operating cash.
            </div>
            <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--cream)' }}>Round-2 conversion waiver.</strong> {(DEAL.founderBuybackWaiverOnRound2 ?? DEAL.buybackWaiverOnRound2) ? 'An investor who converts their Round-1 B-class into Round-2 equity is no longer callable under this clause — the founder\'s call right falls away. Investor keeps the upside if they roll into Round 2.' : 'No waiver — shares remain callable even after Round-2 conversion.'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
        Decision tree at Y{DEAL.buybackYear}: <strong style={{ color: 'var(--cream)' }}>founder calls</strong> → investor exits for {fmt(bb.payout)} (Y3 fair value × shares) plus everything already paid in Y1-Y3 dividends; <strong style={{ color: 'var(--cream)' }}>founder doesn't call</strong> → investor holds to Y5 for the pro-rata exit at sector-multiple business value. Either way, dividends paid Y1-Y3 are not clawed back.
      </div>

      {/* Cross-reference: Company general repurchase right (separate to Y3 Founder Call) */}
      <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.65, marginTop: 14, padding: '12px 16px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.22)', borderRadius: 8 }}>
        <strong style={{ color: '#C4B5FD' }}>Note · Company general repurchase right.</strong> Independent of the Y3 Founder Call above, the <strong style={{ color: 'var(--cream)' }}>Company itself</strong> (acting through the Board) retains a separate right — but not the obligation — to repurchase all or any portion of an investor's shares at any time after the trigger event the parties agree. Repurchase price = <strong style={{ color: 'var(--cream)' }}>fair market value</strong> at the date of the notice, determined in good faith by the Board, with an independent chartered-accountant valuation as the dispute-resolution backstop. Subject to UK company-law requirements on the purchase of own shares. See the Investors' Agreement for the full clause.
      </div>
    </div>
  )
}

// ─── Future Rounds & Pre-emption Rights ──────────────────────────────
// Explains Round 2 dilution mechanics + the existing B-holder
// pre-emption right. Worked example uses the locked investment amount
// to illustrate what happens to a £19k investor's stake under a
// hypothetical Round 2 at 2× the current per-share price.
function FutureRoundsCard({ investment }) {
  const totalShares = DEAL.totalShares || 100
  const price = DEAL.pricePerShare || 1000
  const investorShares = Math.round((investment || 0) / price)
  // Hypothetical Round 2 scenario: 30 new shares issued at 2× price.
  const newSharesIssued = 30
  const newPrice = price * 2
  const newRoundRaise = newSharesIssued * newPrice
  const enlargedShareCount = totalShares + newSharesIssued
  // Investor's stake if they DON'T participate in pre-emption
  const noParticipatePct = investorShares / enlargedShareCount * 100
  const startingPct = investorShares / totalShares * 100
  // Investor's stake if they DO exercise pre-emption to maintain %
  // (buy newSharesIssued × startingPct / 100 new shares)
  const preemptShares = (newSharesIssued * startingPct) / 100
  const preemptCost = preemptShares * newPrice

  return (
    <div style={{ marginTop: 32 }}>
      <h3 className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginBottom: 8, lineHeight: 1.25 }}>
        Future Rounds · Dilution · Pre-emption Rights
      </h3>
      <p style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, marginBottom: 18 }}>
        If the Company proposes to issue any new equity securities (Round 2 onwards), each Shareholder gets a <strong style={{ color: 'var(--gold)' }}>pre-emption right</strong> — the right (not the obligation) to subscribe for those new securities <strong style={{ color: 'var(--cream)' }}>on a pro-rata basis</strong>, in proportion to their existing percentage of issued share capital, in order to maintain their ownership %. The Company gives written notice setting out the class, price, terms, maximum entitlement and an election period of <strong style={{ color: 'var(--cream)' }}>not less than 14 days</strong>. Any unsubscribed securities may then be offered to other persons on terms <strong style={{ color: 'var(--cream)' }}>no more favourable</strong> than those offered to existing Shareholders. The Founder's <strong style={{ color: 'var(--cream)' }}>A-class voting shares preserve voting control</strong> through any dilution.
      </p>

      {/* Worked example — hypothetical Round 2 at 2× price */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--gold-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>
          Worked example · hypothetical Round 2 at {((newPrice / price)).toFixed(0)}× per-share price
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.7, marginBottom: 14 }}>
          The Company issues <strong style={{ color: 'var(--cream)' }}>{newSharesIssued}</strong> new B-shares at <strong style={{ color: 'var(--cream)' }}>{fmt(newPrice)}</strong> per share (raising <strong style={{ color: 'var(--cream)' }}>{fmt(newRoundRaise)}</strong>). Total share count grows from {totalShares} to <strong style={{ color: 'var(--cream)' }}>{enlargedShareCount}</strong>. Two paths for the existing {fmt(investment)} ({investorShares} shares = {startingPct.toFixed(1)}%) investor:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ padding: '16px 18px', background: 'rgba(229,57,53,0.06)', border: '1px solid rgba(229,57,53,0.25)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#FCA5A5', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
              Option A · Don't participate
            </div>
            <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.65 }}>
              Investor keeps their <strong style={{ color: 'var(--cream)' }}>{investorShares} shares</strong> but ownership shrinks from <strong style={{ color: 'var(--cream)' }}>{startingPct.toFixed(1)}%</strong> to <strong style={{ color: '#FCA5A5' }}>{noParticipatePct.toFixed(1)}%</strong> of the enlarged company. The per-share dividend continues on the existing {investorShares} shares — economic value of each share may rise with the higher Round-2 valuation, but the % is diluted.
            </div>
          </div>
          <div style={{ padding: '16px 18px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#34D399', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
              Option B · Exercise pre-emption
            </div>
            <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.65 }}>
              Investor subscribes for an extra <strong style={{ color: 'var(--cream)' }}>{preemptShares.toFixed(1)} shares</strong> at {fmt(newPrice)} each (= <strong style={{ color: 'var(--cream)' }}>{fmt(preemptCost)}</strong>). Maintains their <strong style={{ color: '#34D399' }}>{startingPct.toFixed(1)}%</strong> stake in the enlarged company. Subject to the 14-day notice period from the Company.
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
        Round-2 timing, total raise, per-share price and any specific mechanics are decided by the <strong style={{ color: 'var(--cream)' }}>directors + A-class holders</strong> at the time, subject to Reserved Matters Consent (75% of total issued share capital voting together). Pre-emption rights apply equally to every B-class holder.
      </div>
    </div>
  )
}

// ─── 12-Month Distribution Calendar — semi-annual + Y1 lockup ─────────
// Per-month visualisation: operating profit → reserve fill → surplus
// → end-of-Y1 distribution window. Under the May 2026 restructure there
// is exactly ONE distribution window in Y1 (month 12 = Dec, end of
// trading year), followed by semi-annual windows from month 18 onwards
// (not shown in this Y1-only calendar — see HACKNEY_INVESTOR_RETURNS.
// fiveYear for the multi-year schedule). Reads the same
// buildForecastMonthly logic that powers the 2026 Performance tab.
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
        Each month's operating profit refills the £{summary.reserveTarget.toLocaleString('en-GB')} working-capital reserve first. Surplus profit accrues across the full year and pays out in a single end-of-Y1 distribution window (semi-annual cadence from month 18 onwards). Reserve hit full in <strong style={{ color: 'var(--cream)' }}>{summary.reserveFullMonth}</strong>.
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
        <SummaryTile label="Total Y1 dividends" value={fmt(summary.totalDividends)} sub="Paid at end-of-Y1 window (after £30k reserve refill)" />
        <SummaryTile label={`Investor ${(investorEq*100).toFixed(0)}% share`} value={fmt(summary.totalInvestor)} sub={`${investorAnnualPct.toFixed(1)}% cash-on-cash on ${fmt(investment)} · paid at end-of-Y1 window`} colour="#10B981" />
        <SummaryTile label={`Founder ${(founderEq*100).toFixed(0)}% share`} value={fmt(summary.totalFounder)} sub="Same window · pro-rata to equity" />
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
        How the £{investment.toLocaleString('en-GB')} investor stake gets paid back under the 76/24 cap table. Founder 76 A-class voting shares and external 24 B-class non-voting shares all draw the same £X per share at each declaration, with a hard Y1 lockup (first window = end of Y1). Year 5 exit at 4× EBITDA returns the equity holding alongside the final dividend — unless the Founder has called the shares back at Y3 under the buyback right above.
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
        <SummaryTile label="Cumulative dividends Y1–Y5"  value={fmt(r.cumulativeDividends)}    sub="Investor paid first each quarter" />
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
