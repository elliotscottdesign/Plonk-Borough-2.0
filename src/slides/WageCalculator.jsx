import React, { useState } from 'react'
import { WAGE_RATES, PL_WAGE_BASE, ROTA_TOTAL } from '../data.js'

const fmt = (n) => '£' + Math.round(n).toLocaleString()

export default function WageCalculator() {
  const [masterPct, setMasterPct] = useState(0)
  const [overrides, setOverrides] = useState({ 0: 13.85, 1: 14.35, 2: 15.38, 3: 18.00 })

  const effectiveRates = WAGE_RATES.map((r, i) => ({
    ...r,
    rate: masterPct !== 0 ? r.rate * (1 + masterPct / 100) : overrides[i],
  }))

  const totalWageBill = effectiveRates.reduce((sum, r) => sum + r.rate * r.hours, 0)
  const plWages = PL_WAGE_BASE
  const rotaWages = ROTA_TOTAL
  const variance = totalWageBill - plWages
  const variancePct = (variance / plWages * 100).toFixed(1)

  const setOverride = (i, val) => {
    setMasterPct(0)
    setOverrides(prev => ({ ...prev, [i]: parseFloat(val) || prev[i] }))
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        Wage Calculator
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 36, fontSize: 15 }}>
        2026 planning rates · adjust wages to model cost impact
      </p>

      {/* Master slider */}
      <div className="card-highlight" style={{ padding: 24, marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
          Master Rate Adjustment
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--cream-dim)' }}>Apply % change to all roles simultaneously</span>
          <span style={{ color: masterPct === 0 ? 'var(--cream-dim)' : masterPct > 0 ? '#E53935' : '#2DD4BF', fontWeight: 500 }}>
            {masterPct > 0 ? '+' : ''}{masterPct}%
          </span>
        </div>
        <input type="range" min={-10} max={20} step={0.5} value={masterPct}
          onChange={e => setMasterPct(+e.target.value)}
          style={{ width: '100%', accentColor: 'var(--gold)', marginBottom: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--gold-dim)' }}>
          <span>−10% (cost saving)</span><span>0% (2026 base)</span><span>+20% (NMW rise)</span>
        </div>
      </div>

      {/* Role breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {effectiveRates.map((r, i) => (
          <div key={i} className="card" style={{ padding: 18, display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 16, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--cream)', marginBottom: 2 }}>{r.role}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
                <span style={{ fontSize: 10, color: 'var(--cream-dim)' }}>{r.hours.toLocaleString()} hrs/yr</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--cream-dim)', marginBottom: 4 }}>Rate/hr</div>
              <input
                type="number" step="0.01" value={r.rate.toFixed(2)}
                onChange={e => setOverride(i, e.target.value)}
                style={{
                  width: '100%', padding: '6px 8px', fontSize: 13, borderRadius: 6,
                  background: 'var(--ink-3)', border: '1px solid rgba(201,168,76,0.2)',
                  color: 'var(--gold)', outline: 'none',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--cream-dim)', marginBottom: 4 }}>Annual cost</div>
              <div style={{ fontSize: 14, color: 'var(--cream)', fontFamily: "'DM Serif Display', serif" }}>
                {fmt(r.rate * r.hours)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--cream-dim)', marginBottom: 4 }}>vs NMW</div>
              <div style={{ fontSize: 12, color: r.rate >= 12.21 ? '#2DD4BF' : '#E53935' }}>
                {r.rate >= 12.21 ? '✓' : '✗'} £{Math.max(0, r.rate - 12.21).toFixed(2)} above
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--cream-dim)', marginBottom: 4 }}>% of total</div>
              <div style={{ fontSize: 12, color: 'var(--cream-dim)' }}>
                {((r.rate * r.hours / totalWageBill) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Wage Bill', value: fmt(totalWageBill), color: 'var(--gold)' },
          { label: '2025 P&L Wages', value: fmt(plWages), color: 'var(--cream)' },
          { label: 'Rota Wages', value: fmt(rotaWages), color: 'var(--cream)' },
          { label: 'Variance vs P&L', value: `${variancePct > 0 ? '+' : ''}${variancePct}%`, color: variance > 0 ? '#E53935' : '#2DD4BF' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--cream-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            <div className="serif" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
        NMW 2025: £12.21/hr (April 2025). 2026 base rates set above NMW across all roles.
        P&L wages include all staff costs from 52-week categorised actuals. Rota wages from 1,283 verified shifts.
      </div>
    </div>
  )
}
