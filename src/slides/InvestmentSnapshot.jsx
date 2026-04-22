import React, { useState } from 'react'
import { DEAL, ACTUALS_2025, FORECAST, WATERFALL } from '../data.js'

const fmt = (n) => '£' + Math.round(n).toLocaleString()
const SCENARIOS = {
  conservative: { label: 'Conservative', sub: '+10% on 2025', multiplier: 1.10 },
  base:         { label: 'Base Case',    sub: '+15% on 2025', multiplier: 1.15 },
  optimistic:   { label: 'Optimistic',  sub: '+25% on 2025', multiplier: 1.25 },
}

function calcReturns(multiplier) {
  // Pure pro-rata: operating profit splits directly by equity %. No preferred, no A-share priority.
  const revenue = ACTUALS_2025.revenue * multiplier
  const opProfit = revenue * 0.224
  const investorDiv = opProfit * DEAL.investorEq
  const total = investorDiv
  const coc = total / DEAL.investment
  const payback = DEAL.investment / total
  return { revenue, opProfit, investorDiv, total, coc, payback }
}

export default function InvestmentSnapshot() {
  const [scenario, setScenario] = useState('base')
  const s = SCENARIOS[scenario]
  const r = calcReturns(s.multiplier)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', color:'var(--cream)', marginBottom:8 }}>
        Investment Snapshot
      </h2>
      <p style={{ color:'var(--cream-dim)', marginBottom:28, fontSize:14 }}>
        At-a-glance deal structure, returns and financials
      </p>

      {/* Scenario selector */}
      <div style={{ display:'flex', gap:6, marginBottom:28 }}>
        {Object.entries(SCENARIOS).map(([key, sc]) => (
          <button key={key} onClick={() => setScenario(key)} style={{
            padding:'7px 18px', fontSize:11, borderRadius:6, cursor:'pointer',
            background: scenario === key ? 'rgba(201,168,76,0.15)' : 'transparent',
            border: `1px solid ${scenario === key ? 'var(--gold)' : 'rgba(201,168,76,0.25)'}`,
            color: scenario === key ? 'var(--gold)' : 'var(--cream-dim)',
            transition:'all 0.15s',
          }}>
            {sc.label}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:24 }}>
        <Section title="🏢 Deal Structure" items={[
          ['Investor Equity', `${(DEAL.investorEq*100).toFixed(2)}%`],
          ['Founder Equity', `${(DEAL.founderEq*100).toFixed(2)}%`],
          ['Pre-Money Valuation', fmt(DEAL.preMoney)],
          ['Post-Money Valuation', fmt(DEAL.postMoney)],
          ['Valuation Multiple', `${DEAL.multiple.toFixed(2)}× EBITDA`],
        ]} />
        <Section title="📊 Financial Performance" items={[
          ['2025 Actual Revenue', fmt(ACTUALS_2025.revenue)],
          ['Forecast Revenue', fmt(r.revenue)],
          ['Revenue Growth', `+${Math.round((s.multiplier-1)*100)}%`],
          ['Forecast Op Profit', fmt(r.opProfit)],
          ['2025 EBITDA', fmt(ACTUALS_2025.ebitda)],
        ]} />
        <Section title="💰 Investor Returns" items={[
          ['Distribution Model', 'Pro-rata · no tiers', true],
          [`Equity Dividend (${(DEAL.investorEq*100).toFixed(1)}%)`, fmt(r.investorDiv), true],
          ['Total Year 1 Return', fmt(r.total), true],
          ['Cash-on-Cash', `${(r.coc*100).toFixed(1)}%`, true],
          ['Payback Period', `${r.payback.toFixed(1)} years`],
        ]} />
      </div>

      {/* Top 3 highlights */}
      <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>
        Top 3 Investment Highlights
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[
          `${fmt(r.total)} Year 1 investor return · ${(r.coc*100).toFixed(1)}% cash-on-cash on ${fmt(DEAL.investment)} invested`,
          `Proven Borough Market venue — ${fmt(ACTUALS_2025.revenue)} verified 2025 revenue · 77,801 organic search sessions · 58% organic traffic`,
          `DJ nights, corporate bookings & Google Ads add incremental revenue at ${s.sub} scenario`,
        ].map((text, i) => (
          <div key={i} className="card" style={{ display:'flex', gap:16, padding:'14px 18px', alignItems:'flex-start' }}>
            <span className="serif" style={{ fontSize:18, color:'var(--gold)', flexShrink:0, lineHeight:1 }}>0{i+1}</span>
            <span style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.5 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, items }) {
  return (
    <div className="card" style={{ padding:20 }}>
      <div style={{ fontSize:11, color:'var(--gold)', marginBottom:14, fontWeight:500 }}>{title}</div>
      {items.map(([label, value, gold]) => (
        <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
          borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:11 }}>
          <span style={{ color:'var(--cream-dim)' }}>{label}</span>
          <span style={{ color: gold ? 'var(--gold)' : 'var(--cream)' }}>{value}</span>
        </div>
      ))}
    </div>
  )
}
