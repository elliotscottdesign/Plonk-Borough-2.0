import React, { useState } from 'react'
import { DEAL, computeDealFromInvestment } from '../../data/hackney.js'
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

  // TBD: replace these scenario profit figures with Hackney's calibrated
  // Conservative/Base/Optimistic numbers once the bar-only cost model is
  // restated for 2026/27. Current values from Excel Scenario Planning rows
  // 110-111 (profit after director salary).
  const SCENARIOS = {
    bear:   { label: 'Conservative −10%', badge: 'Conservative scenario',                                          profit: 30345,        color: '#E53935' },
    base:   { label: 'Base Case +15%',     badge: 'Base case scenario',                                              profit: 45632,        color: '#C9A84C' },
    bull:   { label: 'Optimistic +20%',    badge: 'Optimistic scenario',                                             profit: 63512,        color: '#2DD4BF' },
    custom: {
      label:    'Custom',
      badge:    isLocked ? 'Live from locked Use of Funds' : 'Lock the Use of Funds slider tool to populate',
      profit:   45632,
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
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        Investor Returns
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 32, fontSize: 15 }}>
        Pure pro-rata — all shareholders paid at the same time by equity %. No preferred return, no priority tiers.
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
