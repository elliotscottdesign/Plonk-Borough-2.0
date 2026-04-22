import React, { useState } from 'react'
import { DEAL } from '../data.js'
import ResetBtn from '../components/ResetBtn.jsx'

const fmt = (n) => '£' + Math.round(n).toLocaleString()
const pct = (n) => (n * 100).toFixed(1) + '%'

export default function InvestmentSummary() {
  const [amount, setAmount] = useState(88000)

  // Pure pro-rata distribution — no preferred, no A-share priority.
  // Investor's dividend = operating profit × their equity share.
  const OPERATING_PROFIT_BASE = 190945
  const equity = amount / DEAL.postMoney
  const dividend = OPERATING_PROFIT_BASE * equity
  const total = dividend
  const coc = total / amount
  const isAShare = equity >= 0.05

  // Recalculate based on slider
  const divCalc = OPERATING_PROFIT_BASE * equity
  const totalCalc = divCalc
  const cocCalc = totalCalc / amount

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        Investment Summary
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 40, fontSize: 15 }}>
        What you own, what you earn, and how your money is protected.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>

        {/* Left — deal terms */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 }}>
            Deal Structure
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Term label="Investment" value={fmt(DEAL.investment)} />
            <Term label="Investor Equity" value={pct(DEAL.investorEq)} />
            <Term label="Founder Retains" value={pct(DEAL.founderEq)} />
            <Term label="Pre-Money Valuation" value={fmt(DEAL.preMoney)} />
            <Term label="Valuation Multiple" value={`${DEAL.multiple.toFixed(2)}× EBITDA`} />
            <Term label="Share Class" value="A Shares — full voting rights" gold />
            <Term label="Governance" value="Simple majority · 75% reserved matters" />
          </div>
        </div>

        {/* Right — returns */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 }}>
            Year 1 Returns (Base Case)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Term label={`Equity Dividend (${pct(DEAL.investorEq)})`} value={fmt(DEAL.investorDividend)} />
            <Term label="Distribution Model" value="Pro-rata · no tiers" gold />
            <Term label="Total Year 1 Return" value={fmt(DEAL.totalInvestorReturn)} gold large />
            <Term label="Cash-on-Cash" value={`${(DEAL.coc*100).toFixed(1)}%`} gold />
            <Term label="Payback Period" value={`${DEAL.payback} years`} />
            <Term label="A-Share Threshold" value={`≥5% equity · ${fmt(DEAL.aShareThreshold)} minimum`} />
          </div>
        </div>
      </div>

      {/* Interactive return calculator */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 }}>
          Explore Your Return
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--cream-dim)' }}>Investment Amount</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--gold)' }}>{fmt(amount)}</span>
              <ResetBtn onClick={() => setAmount(88000)} />
            </span>
          </div>
          <input
            type="range" min={10000} max={155000} step={5000}
            value={amount} onChange={e => setAmount(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--gold)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--gold-dim)', marginTop: 4 }}>
            <span>£10,000</span>
            <span>£155,000 · 50% equity cap</span>
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
          {isAShare ? 'A Shares · Full Voting Rights' : 'B Shares · Economic Rights Only'}
          <span style={{ color: 'var(--cream-dim)', marginLeft: 4 }}>
            {pct(equity)} equity
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <CalcResult label="Ownership" value={pct(equity)} />
          <CalcResult label="Equity Dividend" value={fmt(divCalc)} />
          <CalcResult label="Total Year 1" value={fmt(totalCalc)} gold />
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--cream-dim)' }}>
          Cash-on-Cash: <span style={{ color: 'var(--gold)' }}>{(cocCalc * 100).toFixed(1)}%</span>
          {' · '}Payback: <span style={{ color: 'var(--gold)' }}>{(amount / totalCalc).toFixed(2)} years</span>
          {' · '}Minimum for A shares: <span style={{ color: 'var(--cream-dim)' }}>£{DEAL.aShareThreshold.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

function Term({ label, value, gold, large }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 12, color: 'var(--cream-dim)' }}>{label}</span>
      <span style={{ fontSize: large ? 16 : 13, fontWeight: large ? 500 : 400,
        color: gold ? 'var(--gold)' : 'var(--cream)' }}>{value}</span>
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
