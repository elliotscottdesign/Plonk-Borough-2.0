import React from 'react'
import { USE_OF_FUNDS, DEAL } from '../data.js'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#C9A84C','#8A6E2F','#E8C96A','#4A3A1A','#6B5A30']
const fmt = (n) => '£' + n.toLocaleString()

export default function UseOfFunds() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        Use of Funds
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 40, fontSize: 15 }}>
        How the £150,000 investment is deployed on Day 1.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 40, alignItems: 'center' }}>

        {/* Donut */}
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={USE_OF_FUNDS} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                dataKey="amount" paddingAngle={2}>
                {USE_OF_FUNDS.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{
                background: 'var(--ink-3)', border: '1px solid var(--gold-dim)',
                borderRadius: 8, color: 'var(--cream)', fontSize: 12,
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Line items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {USE_OF_FUNDS.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i], flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--cream)', marginBottom: 3 }}>{item.item}</div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{item.note}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 15, color: 'var(--gold)', fontFamily: "'DM Serif Display', serif" }}>
                  {fmt(item.amount)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--cream-dim)' }}>{item.pct.toFixed(1)}%</div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', marginTop: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--cream-dim)' }}>Total Investment</span>
            <span className="serif" style={{ fontSize: 20, color: 'var(--gold)' }}>{fmt(DEAL.investment)}</span>
          </div>
        </div>
      </div>

      {/* Day 1 note */}
      <div className="card" style={{ padding: 20, marginTop: 36 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>
          Day 1 Deployment
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: 12, color: 'var(--cream-dim)' }}>
          <div>
            <span style={{ color: 'var(--cream)' }}>£108,000</span> covers all hard costs — hardware,
            IP, stock and rent deposit. Deployed immediately on reopening.
          </div>
          <div>
            <span style={{ color: 'var(--cream)' }}>£14,922</span> working capital staged into
            the business per cash flow forecast. Not drawn upfront.
          </div>
          <div>
            The <span style={{ color: 'var(--cream)' }}>£27,078</span> landlord deposit covers
            3 months rent (May–Jul 2026) — no rent cash payments until August.
          </div>
        </div>
      </div>
    </div>
  )
}
