import React from 'react'
import { DEAL, ACTUALS_2025, FORECAST, BUSINESS } from '../data.js'

const fmt = (n) => '£' + n.toLocaleString()

export default function Cover() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ marginBottom: 56 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
          Series A · Seed Investment · April 2026
        </div>
        <h1 className="serif" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', lineHeight: 1, color: 'var(--cream)', marginBottom: 20 }}>
          No Dice<br/>Borough
        </h1>
        <p style={{ fontSize: 18, color: 'var(--cream-dim)', maxWidth: 520, lineHeight: 1.6 }}>
          A proven Borough Market experience venue — mini golf, bar, pool, arcades and board games.
          Generating £741,644 verified 2025 revenue, acquired at distressed pricing.
        </p>
      </div>

      <div className="gold-rule" style={{ marginBottom: 48 }} />

      {/* Key metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 48 }}>
        <Metric label="Seeking" value={fmt(DEAL.investment)} sub="49% equity · 51% retained by founder" gold />
        <Metric label="2025 Verified Revenue" value={fmt(ACTUALS_2025.revenue)} sub="Real trading history — not a projection" />
        <Metric label="Year 1 Investor Return" value={fmt(DEAL.totalInvestorReturn)} sub={`${(DEAL.coc*100).toFixed(1)}% cash-on-cash · payback ${DEAL.payback} yrs`} />
        <Metric label="Preferred Return" value={fmt(DEAL.preferred) + '/yr'} sub="8% annual · paid first before distributions" />
        <Metric label="Forecast Revenue" value={fmt(FORECAST.revenue)} sub="Base case +15% · May 2026–Apr 2027" />
        <Metric label="Valuation Entry" value={`${DEAL.multiple.toFixed(2)}×`} sub="EBITDA · distressed acquisition pricing" />
      </div>

      {/* Location + confidential */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: 'var(--cream-dim)' }}>
          📍 {BUSINESS.location} · {BUSINESS.description}
        </div>
        <div style={{ fontSize: 10, color: 'var(--gold-dim)', letterSpacing: '0.08em' }}>
          CONFIDENTIAL · NOT FOR DISTRIBUTION
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, sub, gold }) {
  return (
    <div className={gold ? 'card-highlight' : 'card'} style={{ padding: 24 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 12 }}>
        {label}
      </div>
      <div className="serif" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: gold ? 'var(--gold)' : 'var(--cream)', lineHeight: 1, marginBottom: 8 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.4 }}>
        {sub}
      </div>
    </div>
  )
}
