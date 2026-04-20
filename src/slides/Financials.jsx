import React, { useState } from 'react'
import { INCOME_SOURCES, COST_CATEGORIES, MONTHLY_INCOME, MONTHLY_COSTS, MONTHLY_PROFIT, ACTUALS_2025 } from '../data.js'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line } from 'recharts'

const fmt = (n) => '£' + Math.abs(Math.round(n)).toLocaleString()
const fmtK = (n) => '£' + Math.round(Math.abs(n) / 1000) + 'k'

const TABS = ['Overview', 'Income', 'Costs', 'Monthly P&L']

export default function Financials() {
  const [tab, setTab] = useState(0)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        Financial Performance
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 28, fontSize: 15 }}>
        Jan–Dec 2025 · Verified from 52 weeks of categorised weekly P&amp;L data
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid rgba(201,168,76,0.15)', paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 18px', fontSize: 12, cursor: 'pointer', border: 'none',
            background: 'transparent', borderBottom: tab === i ? '2px solid var(--gold)' : '2px solid transparent',
            color: tab === i ? 'var(--gold)' : 'var(--cream-dim)', transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && <Overview />}
      {tab === 1 && <IncomeSplit />}
      {tab === 2 && <CostSplit />}
      {tab === 3 && <MonthlyPnL />}
    </div>
  )
}

function Overview() {
  const stats = [
    { label: 'Total Revenue 2025', value: '£741,644', sub: 'Verified 52-week actuals' },
    { label: 'Total Wages', value: '£242,370', sub: '32.7% of revenue' },
    { label: 'Net Profit 2025', value: '£111,177', sub: '15.0% margin' },
    { label: 'EBITDA', value: '£91,950', sub: 'Basis for valuation' },
    { label: 'Forecast Revenue', value: '£852,891', sub: 'Base case +15%' },
    { label: 'Forecast Profit', value: '£190,945', sub: '22.4% margin' },
  ]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 8 }}>{s.label}</div>
            <div className="serif" style={{ fontSize: 26, color: 'var(--gold)', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={MONTHLY_PROFIT}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#B8B0A0' }} />
            <YAxis tick={{ fontSize: 10, fill: '#B8B0A0' }} tickFormatter={fmtK} />
            <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ background: '#13131A', border: '1px solid #8A6E2F', borderRadius: 8, color: '#F5F0E8', fontSize: 12 }} />
            <Bar dataKey="income" fill="rgba(201,168,76,0.25)" name="Income" radius={[2,2,0,0]} />
            <Line type="monotone" dataKey="profit" stroke="#C9A84C" strokeWidth={2} dot={{ fill: '#C9A84C', r: 3 }} name="Profit" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function IncomeSplit() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 40, alignItems: 'start' }}>
      <div style={{ height: 260 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', marginBottom: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Income by Source</div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={INCOME_SOURCES} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="amount" paddingAngle={2}>
              {INCOME_SOURCES.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#13131A', border: '1px solid #8A6E2F', borderRadius: 8, color: '#F5F0E8', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        {INCOME_SOURCES.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: 'var(--cream)' }}>{s.name}</div>
            <div style={{ fontSize: 13, color: 'var(--gold)' }}>{fmt(s.amount)}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)', width: 40, textAlign: 'right' }}>{s.pct}%</div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--cream-dim)' }}>Total Revenue</span>
          <span className="serif" style={{ fontSize: 20, color: 'var(--gold)' }}>£741,644</span>
        </div>
      </div>
    </div>
  )
}

function CostSplit() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 40, alignItems: 'start' }}>
      <div style={{ height: 260 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', marginBottom: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Costs by Category</div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={COST_CATEGORIES} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="amount" paddingAngle={2}>
              {COST_CATEGORIES.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#13131A', border: '1px solid #8A6E2F', borderRadius: 8, color: '#F5F0E8', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        {COST_CATEGORIES.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: 'var(--cream)' }}>{s.name}</div>
            <div style={{ fontSize: 12, color: 'var(--cream)' }}>{fmt(s.amount)}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)', width: 40, textAlign: 'right' }}>{s.pct}%</div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--cream-dim)' }}>Total Costs</span>
          <span className="serif" style={{ fontSize: 20, color: 'var(--cream)' }}>£630,468</span>
        </div>
      </div>
    </div>
  )
}

function MonthlyPnL() {
  return (
    <div>
      <div style={{ height: 260, marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={MONTHLY_PROFIT}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#B8B0A0' }} />
            <YAxis tick={{ fontSize: 10, fill: '#B8B0A0' }} tickFormatter={fmtK} />
            <Tooltip formatter={(v) => [fmt(v)]} contentStyle={{ background: '#13131A', border: '1px solid #8A6E2F', borderRadius: 8, color: '#F5F0E8', fontSize: 12 }} />
            <Bar dataKey="income" fill="rgba(21,101,192,0.4)" name="Income" radius={[2,2,0,0]} />
            <Line type="monotone" dataKey="profit" stroke="#C9A84C" strokeWidth={2.5} dot={{ fill: '#C9A84C', r: 3 }} name="Profit" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {MONTHLY_PROFIT.map(m => (
          <div key={m.month} className="card" style={{ padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--cream-dim)', marginBottom: 4 }}>{m.month}</div>
            <div style={{ fontSize: 11, color: 'var(--gold)' }}>{fmtK(m.income)}</div>
            <div style={{ fontSize: 10, color: m.profit >= 0 ? '#2DD4BF' : '#E53935' }}>
              {m.profit >= 0 ? '+' : ''}{fmtK(m.profit)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
