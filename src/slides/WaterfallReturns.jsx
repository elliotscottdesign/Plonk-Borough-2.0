import React, { useState } from 'react'
import { WATERFALL, DEAL } from '../data.js'

const fmt = (n) => '£' + Math.round(n).toLocaleString()

const SCENARIOS = {
  base: { label: 'Base Case +15%', profit: 190945, color: '#C9A84C' },
  bear: { label: 'Bear Case −10%', profit: 117000, color: '#E53935' },
  bull: { label: 'Bull Case +25%', profit: 228000, color: '#2DD4BF' },
}

function calcWaterfall(profit) {
  const preferred = 12000
  const aShare = 44000
  const remaining = Math.max(0, profit - preferred - aShare)
  const investorDiv = remaining * 0.49
  const founderDiv = remaining * 0.51
  const totalInvestor = preferred + investorDiv
  const coc = totalInvestor / 150000
  return { preferred, aShare, remaining, investorDiv, founderDiv, totalInvestor, coc }
}

export default function WaterfallReturns() {
  const [scenario, setScenario] = useState('base')
  const s = SCENARIOS[scenario]
  const w = calcWaterfall(s.profit)

  const steps = [
    { label: 'Operating Profit', amount: s.profit, color: '#1565C0', note: `${scenario === 'base' ? '+15%' : scenario === 'bear' ? '−10%' : '+25%'} scenario` },
    { label: 'Less: Preferred Return', amount: -w.preferred, color: '#B71C1C', note: '8% × £150k · paid to investor first' },
    { label: 'Less: A-Share Priority', amount: -w.aShare, color: '#E67E22', note: 'Priority allocation to founder entity' },
    { label: 'Remaining Pool', amount: w.remaining, color: '#0D9488', note: 'Available for equity distribution' },
    { label: 'Investor Dividend (49%)', amount: w.investorDiv, color: '#C9A84C', note: '49% × remaining pool' },
    { label: 'Founder Dividend (51%)', amount: w.founderDiv, color: '#4A5568', note: '51% × remaining pool' },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        Investor Returns
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 32, fontSize: 15 }}>
        How distributions flow — preferred return first, then equity split.
      </p>

      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
        {Object.entries(SCENARIOS).map(([key, sc]) => (
          <button key={key} onClick={() => setScenario(key)} style={{
            padding: '8px 20px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: scenario === key ? sc.color : 'transparent',
            border: `1px solid ${sc.color}`,
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
              Preferred {fmt(w.preferred)} + Dividend {fmt(w.investorDiv)}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <Row label="Cash-on-Cash Return" value={`${(w.coc * 100).toFixed(1)}%`} gold />
            <Row label="Payback Period" value={`${(150000 / w.totalInvestor).toFixed(2)} years`} />
            <Row label="On £150,000 invested" value={fmt(150000)} />
            <Row label="Preferred (paid first)" value={fmt(w.preferred)} gold />
            <Row label="Equity dividend" value={fmt(w.investorDiv)} />
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Founder Position
            </div>
            <Row label="A-Share Priority" value={fmt(w.aShare)} />
            <Row label="Equity Dividend (51%)" value={fmt(w.founderDiv)} />
            <Row label="Total Founder" value={fmt(w.aShare + w.founderDiv)} />
          </div>

          <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6, padding: '4px 0' }}>
            Cash-flow driven — no exit required for investor to receive full return.
            Payback from Year 1 trading distributions only.
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
