import React, { useState } from 'react'
import { DEAL, HACKNEY_INVESTOR_RETURNS, computeDealFromInvestment } from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

// WaterfallReturns — clones Borough's structure: 4-button scenario selector +
// 3-step waterfall (Operating Profit → Investor Dividend → Founder Dividend) +
// summary cards (Total Return / Cash-on-Cash / Founder Position).
//
// Pure pro-rata. When the founder has locked the Use of Funds slider tool,
// the deal terms here recompute off the locked total — investor / founder
// equity %, total raise, cash-on-cash all flex. Otherwise the static DEAL
// constants in data/hackney.js carry the defaults.

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

function calcWaterfall(profit, deal) {
  const investorDiv = profit * deal.investorEq
  const founderDiv = profit * deal.founderEq
  const totalInvestor = investorDiv
  const coc = totalInvestor / deal.investment
  return { investorDiv, founderDiv, totalInvestor, coc }
}

export default function WaterfallReturns() {
  const { snapshot, isLocked } = useLockedUseOfFunds()
  const effective = isLocked && snapshot
    ? { ...DEAL, ...computeDealFromInvestment(snapshot.total) }
    : DEAL

  // Scenario profit figures use the new 2026 cost model (rent £14,664, rates
  // £16,830, +10% on other fixed and stock). VAT scales with revenue; wages
  // and other costs held flat at the +10% uplifted figure across scenarios.
  //   Conservative (+10%): rev £591,899 → profit £94,612
  //   Base (+15%):         rev £618,804 → profit £119,267
  //   Optimistic (+20%):   rev £645,708 → profit £143,921
  const SCENARIOS = {
    bear:   { label: 'Conservative +10%', badge: 'Conservative scenario',                                          profit:  94612,       color: '#E53935' },
    base:   { label: 'Base Case +15%',    badge: 'Base case scenario',                                              profit: 119267,       color: '#C9A84C' },
    bull:   { label: 'Optimistic +20%',   badge: 'Optimistic scenario',                                             profit: 143921,       color: '#2DD4BF' },
    custom: {
      label:    'Custom',
      badge:    isLocked ? 'Live from locked Use of Funds' : 'Lock the Use of Funds slider tool to populate',
      profit:   119267,
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
        Pure pro-rata 50/50 — investor and founder paid at the same time. No preferred return, no priority tiers, single share class.{isLocked ? ` Live from locked Use of Funds: ${fmt(effective.investment)} raise.` : ''}
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
            Distribution Waterfall
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
            Investor Summary
          </div>

          <div className="card-highlight" style={{ padding: 24 }}>
            <div style={{ fontSize: 10, color: 'var(--gold-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Total Investor Return
            </div>
            <div className="serif" style={{ fontSize: 36, color: 'var(--gold)', marginBottom: 4 }}>
              {fmt(w.totalInvestor)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--cream-dim)' }}>
              {investorPct}% pro-rata dividend on operating profit
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <Row label="Cash-on-Cash Return" value={`${(w.coc * 100).toFixed(1)}%`} gold />
            <Row label="Payback Period" value={`${(effective.investment / w.totalInvestor).toFixed(2)} years`} />
            <Row label={`On ${fmt(effective.investment)} invested`} value={fmt(effective.investment)} gold={isLocked} />
            <Row label={`Equity dividend (${investorPct}%)`} value={fmt(w.investorDiv)} gold />
            <Row label="Distribution timing" value="Same as founder" />
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Founder Position
            </div>
            <Row label={`Equity Dividend (${founderPct}%)`} value={fmt(w.founderDiv)} />
            <Row label="Paid" value="Alongside investor, pro-rata" />
          </div>

          <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6, padding: '4px 0' }}>
            Cash-flow driven — no exit required for investor to receive full return. Payback from Year 1 trading distributions only.
          </div>
        </div>
      </div>

      {/* 5-Year Share Payout Breakdown */}
      <FiveYearPayoutBreakdown />
    </div>
  )
}

// ─── 5-Year share payout schedule + cumulative tracker ────────────────
// Shows year-by-year how the £100k investor stake gets paid back via
// pro-rata dividends + Year 5 exit. Mirrors Borough's payout-schedule
// presentation: per-year revenue, profit, investor + founder share, and
// cumulative-back-to-investor tracker. Total returned, MoM, IRR at the
// bottom for the headline summary.
function FiveYearPayoutBreakdown() {
  const r = HACKNEY_INVESTOR_RETURNS
  const investment = 100000
  let cumInv = 0
  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
        5-Year Share Payout Schedule
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
          <span className="serif" style={{ color: 'var(--gold)', fontSize: 18, textAlign:'right' }}>{fmt(r.totalReturned)}</span>
          <span style={{ color: 'var(--cream-dim)', textAlign:'right' }}>{fmt(r.cumulativeDividends + r.exit.founderProceeds)}</span>
          <span className="serif" style={{ color: 'var(--gold)', fontSize: 18, textAlign:'right' }}>{r.multipleOfMoney.toFixed(2)}× MoM</span>
        </div>
      </div>

      {/* Headline summary cards under the table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
        <SummaryTile label="Cumulative dividends Y1–Y5"  value={fmt(r.cumulativeDividends)}    sub="Pure pro-rata, paid annually" />
        <SummaryTile label="Y5 exit proceeds"             value={fmt(r.exit.investorProceeds)} sub={`50% of £${(r.exit.businessValue/1000).toFixed(0)}k business value`} />
        <SummaryTile label="Total returned · MoM"          value={`${r.multipleOfMoney.toFixed(2)}×`}             sub={`${fmt(r.totalReturned)} on £100,000`} colour="#10B981" />
        <SummaryTile label="IRR"                            value={`${(r.irr*100).toFixed(1)}%`} sub="5-year internal rate of return" colour="#10B981" />
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
