import React from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'
import {
  HACKNEY_ACTUALS_2025,
  HACKNEY_MONTHLY_2025,
} from '../../data/hackney.js'

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const fmtK = (n) => '£' + Math.round(n/1000) + 'k'

export default function TheBusiness() {
  const a = HACKNEY_ACTUALS_2025

  const costRows = [
    { label: 'Wages (fully-loaded inc NIC + pension + holiday)', value: a.wages },
    { label: 'Variable costs',                                    value: a.variableCosts },
    { label: 'Fixed costs',                                       value: a.fixedCosts },
    { label: 'VAT difference',                                    value: a.vatDiff },
  ]
  const totalCheck = costRows.reduce((s, r) => s + r.value, 0)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>The Business</div>
        <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05, color: 'var(--cream)', marginBottom: 14 }}>
          A trading bar in Hackney Wick — restated bar-only.
        </h2>
        <p style={{ fontSize: 17, color: 'var(--cream-dim)', maxWidth: 760, lineHeight: 1.6 }}>
          The 2025 figures are verified bar-only trading actuals — not a projection. Mini golf operations have been excluded from every line, removing a loss-making drag worth roughly £19,800 of net cost across the year.
        </p>
      </div>

      <div className="gold-rule" style={{ marginBottom: 28 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 28 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>2025 Bar-only P&amp;L</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 4 }}>Revenue</div>
              <div className="serif" style={{ fontSize: '2.2rem', color: 'var(--cream)', lineHeight: 1 }}>{fmt(a.revenue)}</div>
            </div>
            <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.15)', alignSelf: 'center' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 4 }}>EBITDA</div>
              <div className="serif" style={{ fontSize: '2.2rem', color: 'var(--gold)', lineHeight: 1 }}>{fmt(a.profit)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {costRows.map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
                <span style={{ color: 'var(--cream-dim)' }}>{r.label}</span>
                <span style={{ color: 'var(--cream)', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.value)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingTop: 6, color: 'var(--gold-dim)' }}>
              <span>Total deductions</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(totalCheck)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card-highlight" style={{ padding: 22 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Why bar-only</div>
            <div style={{ fontSize: 14, color: 'var(--cream)', lineHeight: 1.55 }}>
              The mini golf operation runs on different hours, staff and unit economics. Carving it out makes the bar cleaner to underwrite and raises EBITDA by removing a structurally loss-making line.
            </div>
          </div>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>What stays</div>
            <ul style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
              <li>Trading name, customer data, goodwill</li>
              <li>DJ &amp; events programme — Fri/Sat</li>
              <li>Garden, pool tables, arcades, board games</li>
              <li>Established footfall &amp; word-of-mouth</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>Monthly 2025 — verified actuals</div>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>Income (bars) · Profit (line)</div>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={HACKNEY_MONTHLY_2025} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={11} tickLine={false} axisLine={{ stroke:'rgba(201,168,76,0.15)' }} />
              <YAxis stroke="var(--cream-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtK} />
              <Tooltip
                cursor={{ fill: 'rgba(201,168,76,0.06)' }}
                contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
                formatter={(v) => fmt(v)}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
              <Bar dataKey="income" fill="var(--gold)" radius={[3,3,0,0]} />
              <Bar dataKey="profit" fill="var(--teal)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <img src="/hackney/garden/g1.jpg"   alt="Garden"   style={{ width:'100%', height:180, objectFit:'cover', borderRadius:10 }} />
        <img src="/hackney/cocktails/c1.jpg" alt="Cocktails" style={{ width:'100%', height:180, objectFit:'cover', borderRadius:10 }} />
        <img src="/hackney/pool/p1.jpg"    alt="Pool"     style={{ width:'100%', height:180, objectFit:'cover', borderRadius:10 }} />
      </div>
    </div>
  )
}
