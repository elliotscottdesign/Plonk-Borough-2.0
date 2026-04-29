import React, { useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Cell,
} from 'recharts'
import {
  ACTUALS_2025,
  INCOME_SOURCES,
  COST_CATEGORIES,
  MONTHLY_INCOME,
  MONTHLY_PROFIT,
  MONTHLY_COSTS,
  HACKNEY_CASHFLOW,
  HACKNEY_CASH,
  USE_OF_FUNDS,
  WAGE_RATES,
  PL_WAGE_BASE,
  ROTA_TOTAL,
  WAGE_OVERHEAD_MULT,
  HACKNEY_WAGE_MODEL,
  computeDealFromInvestment,
} from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

const fmtMoney = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const fmtK     = (n) => '£' + Math.round(n/1000) + 'k'

// BusinessExplorer — clones Borough's 3-sub-tab structure:
//   • 2025 Performance — verified actuals + breakdowns
//   • 2026 Performance — locked editable forecast (founder edits, investors view)
//   • Cashflow Forecast — month-by-month cash projection
//
// Each sub-tab is a SKELETON for the framework — section headers preserved,
// content TBD until Hackney's bar-only restated data is wired in. Borough's
// equivalents in src/tabs/BusinessExplorer.jsx are 1,650+ lines of detail —
// when Hackney equivalents land, mirror that structure section-for-section.

const TABS = [
  { key: 'performance2025', label: '2025 Performance' },
  { key: 'performance2026', label: '2026 Performance' },
  { key: 'cashflow',        label: 'Cashflow Forecast' },
]

function STitle({ children }) {
  return <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>{children}</div>
}

function Tbd({ children }) {
  return (
    <div style={{ padding:'14px 18px', borderRadius:10, background:'rgba(201,168,76,0.06)', border:'1px dashed rgba(201,168,76,0.35)', color:'var(--cream-dim)', fontSize:12, lineHeight:1.6 }}>
      <span style={{ color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginRight:8, fontWeight:600 }}>TBD</span>
      {children}
    </div>
  )
}

function Tab2025() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>2025 Verified Actuals — Bar Only</STitle>
      <TopLineCards />

      <STitle>Income by Source</STitle>
      <IncomeBySourceChart />

      <STitle>Costs by Category</STitle>
      <CostsByCategoryChart />

      <STitle>Monthly Performance</STitle>
      <MonthlyPerformanceChart />

      <STitle>Wages — 2025 Rota Reference (4-role bar-only)</STitle>
      <WageRotaReference />

      <STitle>Wages — Modelled Full Build-Out (12 roles)</STitle>
      <WageModelBreakdown />
    </div>
  )
}

// ─── 2025 — Top-line summary cards ─────────────────────────────────────
function TopLineCards() {
  const cards = [
    { label: 'Revenue',          value: ACTUALS_2025.revenue,       colour: '#4FC3F7' },
    { label: 'Wages',            value: ACTUALS_2025.wages,         colour: '#E67E22' },
    { label: 'Variable Costs',   value: ACTUALS_2025.variableCosts, colour: '#A78BFA' },
    { label: 'Fixed Costs',      value: ACTUALS_2025.fixedCosts,    colour: '#F87171' },
    { label: 'VAT (Net)',        value: ACTUALS_2025.vatNet,        colour: '#9CA3AF' },
    { label: 'EBITDA',           value: ACTUALS_2025.ebitda,        colour: '#10B981' },
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10 }}>
      {cards.map(c => (
        <div key={c.label} className="card" style={{ padding:14 }}>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{c.label}</div>
          <div className="serif" style={{ fontSize:'clamp(1.2rem, 2.2vw, 1.6rem)', color: c.colour, lineHeight:1 }}>{fmtMoney(c.value)}</div>
        </div>
      ))}
    </div>
  )
}

// ─── 2025 — Income by Source (horizontal bar + table) ─────────────────
function IncomeBySourceChart() {
  const total = INCOME_SOURCES.reduce((s, r) => s + (r.amount || 0), 0)
  const data = INCOME_SOURCES.map(r => ({ ...r, share: total ? (r.amount/total)*100 : 0 }))
  return (
    <div className="card" style={{ padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <span style={{ fontSize:11, color:'var(--cream-dim)' }}>{INCOME_SOURCES.length} sources · 2025 weekly P&amp;L (Weekly Merged tab)</span>
        <span style={{ fontSize:13, color:'var(--gold)', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(total)} aggregate</span>
      </div>
      <div style={{ height: 230 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
            <CartesianGrid stroke="rgba(201,168,76,0.08)" horizontal={false} />
            <XAxis type="number" tickFormatter={fmtK} stroke="var(--cream-dim)" fontSize={11} />
            <YAxis dataKey="name" type="category" width={170} stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(201,168,76,0.06)' }}
              contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
              formatter={(v) => fmtMoney(v)} />
            <Bar dataKey="amount" radius={[0,4,4,0]}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 8 }}>
        {data.map(r => (
          <div key={r.name} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 }}>
            <span style={{ color:'var(--cream)' }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:r.color, marginRight:8 }} />{r.name}
            </span>
            <span style={{ color:'var(--cream)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(r.amount)}</span>
            <span style={{ color:'var(--gold)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.share.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 2025 — Costs by Category (horizontal bar) ────────────────────────
function CostsByCategoryChart() {
  const total = COST_CATEGORIES.reduce((s, r) => s + (r.amount || 0), 0)
  const data = COST_CATEGORIES.map(r => ({ ...r, share: total ? (r.amount/total)*100 : 0 }))
  return (
    <div className="card" style={{ padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <span style={{ fontSize:11, color:'var(--cream-dim)' }}>{COST_CATEGORIES.length} categories · category-header rows from Weekly Merged</span>
        <span style={{ fontSize:13, color:'var(--gold)', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(total)} aggregate</span>
      </div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
            <CartesianGrid stroke="rgba(201,168,76,0.08)" horizontal={false} />
            <XAxis type="number" tickFormatter={fmtK} stroke="var(--cream-dim)" fontSize={11} />
            <YAxis dataKey="name" type="category" width={130} stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(248,113,113,0.06)' }}
              contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
              formatter={(v) => fmtMoney(v)} />
            <Bar dataKey="amount" radius={[0,4,4,0]}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 8 }}>
        {data.map(r => (
          <div key={r.name} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 }}>
            <span style={{ color:'var(--cream)' }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:r.color, marginRight:8 }} />{r.name}
            </span>
            <span style={{ color:'var(--cream)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(r.amount)}</span>
            <span style={{ color:'var(--gold)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.share.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 2025 — Monthly Performance (income bars + profit line) ───────────
function MonthlyPerformanceChart() {
  // Combine MONTHLY_INCOME and MONTHLY_PROFIT (already share month keys);
  // also overlay monthly cost-stack via MONTHLY_COSTS for the lower chart.
  const data = MONTHLY_INCOME.map((m, i) => ({
    month:  m.month,
    income: m.amount,
    profit: MONTHLY_PROFIT[i].profit,
    ...MONTHLY_COSTS[i],
  }))
  return (
    <div className="card" style={{ padding:18 }}>
      <div style={{ fontSize:11, color:'var(--cream-dim)', marginBottom:12 }}>
        Monthly bars = revenue · line = profit after VAT.
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <YAxis tickFormatter={fmtK} stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(201,168,76,0.06)' }}
              contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
              formatter={(v) => fmtMoney(v)} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
            <Bar dataKey="income" name="Income"  fill="var(--gold)" radius={[3,3,0,0]} />
            <Line type="monotone" dataKey="profit" name="Profit (after VAT)" stroke="var(--teal)" strokeWidth={2} dot={{ r:3, fill:'var(--teal)' }} />
            <Legend wrapperStyle={{ fontSize:11, color:'var(--cream-dim)' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize:11, color:'var(--cream-dim)', margin:'18px 0 8px' }}>Monthly cost stack — by category (gross, Weekly Merged categorisation):</div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <YAxis tickFormatter={fmtK} stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(248,113,113,0.06)' }}
              contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
              formatter={(v) => fmtMoney(v)} />
            <Legend wrapperStyle={{ fontSize:11, color:'var(--cream-dim)' }} />
            <Bar dataKey="wages"        name="Wages"        stackId="a" fill="#4A0000" />
            <Bar dataKey="drinks"       name="Drinks & Gas" stackId="a" fill="#7B0000" />
            <Bar dataKey="fixed"        name="Fixed Costs"  stackId="a" fill="#B71C1C" />
            <Bar dataKey="cleaning"     name="Cleaning"     stackId="a" fill="#C62828" />
            <Bar dataKey="djs"          name="DJs"          stackId="a" fill="#E53935" />
            <Bar dataKey="arcades"      name="Arcades"      stackId="a" fill="#D84315" />
            <Bar dataKey="food"         name="Food"         stackId="a" fill="#EF6C00" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Wages — 2025 rota reference (bar-only, 4 roles) ──────────────────
function WageRotaReference() {
  const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
  const totalHours = WAGE_RATES.reduce((s, r) => s + r.hours, 0)
  const grossTotal = WAGE_RATES.reduce((s, r) => s + r.rate * r.hours, 0)
  const loadedTotal = grossTotal * WAGE_OVERHEAD_MULT
  return (
    <div className="card" style={{ padding:18 }}>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:8, fontSize:11, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', paddingBottom:8, borderBottom:'1px solid rgba(201,168,76,0.15)' }}>
        <span>Role</span><span style={{ textAlign:'right' }}>Avg rate</span><span style={{ textAlign:'right' }}>Hours (yr)</span><span style={{ textAlign:'right' }}>Gross</span>
      </div>
      {WAGE_RATES.map(r => (
        <div key={r.role} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:8, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
          <span style={{ color:'var(--cream)' }}><span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:r.color, marginRight:8 }} />{r.role}</span>
          <span style={{ color:'var(--cream)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>£{r.rate.toFixed(2)}</span>
          <span style={{ color:'var(--cream)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.hours.toLocaleString('en-GB')}</span>
          <span style={{ color:'var(--gold)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmt(r.rate * r.hours)}</span>
        </div>
      ))}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:8, padding:'10px 0 4px', fontSize:13, fontWeight:600 }}>
        <span style={{ color:'var(--cream)' }}>Total · gross</span>
        <span></span>
        <span style={{ color:'var(--cream)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{totalHours.toLocaleString('en-GB')}</span>
        <span style={{ color:'var(--gold)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmt(grossTotal)}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:8, padding:'2px 0', fontSize:12, color:'var(--cream-dim)' }}>
        <span>Fully-loaded × {WAGE_OVERHEAD_MULT.toFixed(3)} (NIC + pension + holiday)</span>
        <span></span><span></span>
        <span style={{ color:'var(--gold)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmt(loadedTotal)}</span>
      </div>
      <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:8, lineHeight:1.5 }}>
        Source: Wages Breakdown · 2025 Rota Reference Rates. Cross-checks to Monthly Summary G15 wage line ({fmt(PL_WAGE_BASE)}). Rota total {fmt(ROTA_TOTAL)} pre-loading.
      </div>
    </div>
  )
}

// ─── Wages — modelled full build-out (5 groups, 12 roles) ─────────────
function WageModelBreakdown() {
  const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
  const m = HACKNEY_WAGE_MODEL
  return (
    <div className="card" style={{ padding:18 }}>
      <div style={{ fontSize:11, color:'var(--cream-dim)', marginBottom:14, lineHeight:1.5 }}>
        Modelled staffing for the venue at full operational capacity — what wages would cost if every role is filled. Differs from 2025 actuals ({fmt(PL_WAGE_BASE)}) because the venue is currently running leaner. Reference only — NOT in the forecast.
      </div>
      {m.groups.map(g => (
        <div key={g.key} style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(201,168,76,0.15)', fontSize:12, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            <span>{g.title}</span><span>{fmt(g.subtotal)}/yr</span>
          </div>
          {g.roles.map(r => (
            <div key={r.role} style={{ display:'grid', gridTemplateColumns:'2.4fr 0.5fr 0.6fr 0.7fr 0.8fr', gap:8, padding:'5px 0', fontSize:12, color:'var(--cream-dim)' }}>
              <span style={{ color:'var(--cream)' }}>{r.role}</span>
              <span style={{ textAlign:'right' }}>×{r.headcount}</span>
              <span style={{ textAlign:'right' }}>{r.hours === 'salary' ? 'salary' : `${r.hours}h/wk`}</span>
              <span style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.rate ? `£${r.rate.toFixed(2)}` : '—'}</span>
              <span style={{ textAlign:'right', color:'var(--cream)', fontVariantNumeric:'tabular-nums' }}>{fmt(r.annual)}</span>
            </div>
          ))}
        </div>
      ))}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:14, paddingTop:12, borderTop:'1px solid rgba(201,168,76,0.2)' }}>
        <div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Gross weekly</div>
          <div className="serif" style={{ fontSize:18, color:'var(--cream)' }}>{fmt(m.totals.grossWeekly)}</div>
        </div>
        <div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Gross annual</div>
          <div className="serif" style={{ fontSize:18, color:'var(--cream)' }}>{fmt(m.totals.grossAnnual)}</div>
        </div>
        <div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Fully-loaded annual</div>
          <div className="serif" style={{ fontSize:18, color:'var(--gold)' }}>{fmt(m.totals.loadedAnnual)}</div>
        </div>
      </div>
    </div>
  )
}

// ─── 2026 cost-model rules (user-defined) ─────────────────────────────
// Per user direction:
//   • Revenue growth:    +15% (base case)
//   • Stock / variable:  +10% on every variable line (drinks, food, cleaning, djs, arcades)
//   • Fixed costs:       +8%
//   • Wages:             driven by the wage calculator (default sums to PL_WAGE_BASE)
const FORECAST_RULES = {
  revenueGrowth:   0.15,
  variableUplift:  0.10,
  fixedUplift:     0.08,
}

// Build forecast figures by applying the rules to 2025 actuals + Weekly Merged
// category breakdowns. Variable-cost categories are the 2025 splits; fixed
// costs come from the Monthly Summary annual line; wages from PL_WAGE_BASE.
function buildForecast() {
  const r = 1 + FORECAST_RULES.revenueGrowth
  const v = 1 + FORECAST_RULES.variableUplift
  const f = 1 + FORECAST_RULES.fixedUplift

  const revenue = ACTUALS_2025.revenue * r
  const wages   = PL_WAGE_BASE                                 // calculator-driven; default = 2025 baseline
  const stockCats = ['Drinks & Gas', 'Food']
  const otherVarCats = ['Cleaning', 'DJs', 'Arcades']
  const stock = COST_CATEGORIES.filter(c => stockCats.includes(c.name)).reduce((s,c) => s + c.amount, 0) * v
  const otherVar = COST_CATEGORIES.filter(c => otherVarCats.includes(c.name)).reduce((s,c) => s + c.amount, 0) * v
  const fixed = ACTUALS_2025.fixedCosts * f                    // Monthly Summary fixed line × 1.08
  const vatNet = ACTUALS_2025.vatNet * r                       // VAT scales with revenue
  const opCosts = wages + stock + otherVar + fixed + vatNet
  const opProfit = revenue - opCosts
  const margin = revenue ? opProfit / revenue : 0
  return { revenue, wages, stock, otherVar, fixed, vatNet, opCosts, opProfit, margin, r, v, f }
}

// Forecast monthly arrays — apply growth to 2025 monthly income + uplifts
// to monthly costs (preserving 2025 month-to-month seasonality).
function buildForecastMonthly() {
  const r = 1 + FORECAST_RULES.revenueGrowth
  const v = 1 + FORECAST_RULES.variableUplift
  const f = 1 + FORECAST_RULES.fixedUplift
  return MONTHLY_INCOME.map((row, i) => {
    const mc = MONTHLY_COSTS[i]
    const variable = (mc.drinks + mc.cleaning + mc.djs + mc.arcades + mc.food) * v
    const fixed    = mc.fixed * f
    const wages    = mc.wages              // calculator-driven; mirror 2025 monthly distribution
    const totalCost = variable + fixed + wages
    const income = row.amount * r
    return {
      month: row.month,
      income,
      profit: income - totalCost,
      wages, fixed, drinks: mc.drinks * v, cleaning: mc.cleaning * v,
      djs: mc.djs * v, arcades: mc.arcades * v, food: mc.food * v,
    }
  })
}

// Build forecasted income-by-source list (2025 sources × revenue growth).
function buildForecastIncome() {
  const r = 1 + FORECAST_RULES.revenueGrowth
  const total = INCOME_SOURCES.reduce((s, c) => s + (c.amount || 0), 0) * r
  return INCOME_SOURCES.map(c => ({ ...c, amount: (c.amount || 0) * r, pct: total ? (c.amount * r / total * 100) : 0 }))
}

// Build forecasted cost-by-category list with rule-based uplifts per category.
function buildForecastCosts() {
  const v = 1 + FORECAST_RULES.variableUplift
  const f = 1 + FORECAST_RULES.fixedUplift
  const isFixed = (n) => n === 'Fixed Costs'
  const isWages = (n) => n === 'Wages'
  return COST_CATEGORIES.map(c => {
    const mult = isWages(c.name) ? 1 : (isFixed(c.name) ? f : v)
    const newAmount = c.amount * mult
    return { ...c, amount: newAmount }
  })
}

function Tab2026() {
  const f = buildForecast()
  const monthly = buildForecastMonthly()
  const fcIncome = buildForecastIncome()
  const fcCosts = buildForecastCosts()
  // Re-pct fcCosts after individual scaling
  const fcCostsTotal = fcCosts.reduce((s, c) => s + c.amount, 0)
  const fcCostsPctd = fcCosts.map(c => ({ ...c, pct: fcCostsTotal ? (c.amount / fcCostsTotal * 100) : 0 }))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>2026 Forecast — Base Case +15%</STitle>
      <ForecastTopLineCards f={f} />

      <STitle>Cost Model — 2026 Rules</STitle>
      <ForecastRulesPanel f={f} />

      <STitle>Income by Source — Forecast</STitle>
      <ForecastIncomeChart sources={fcIncome} />

      <STitle>Costs by Category — Forecast</STitle>
      <ForecastCostsChart cats={fcCostsPctd} />

      <STitle>Monthly Performance — Forecast</STitle>
      <ForecastMonthlyChart data={monthly} />

      <STitle>Locked Snapshot — Founder Edit / Investor View</STitle>
      <Tbd>Borough's LockedForecastContext lets the founder edit values then click Lock — the snapshot becomes the Custom scenario in Investment Summary and Waterfall Returns. Wire the same provider into HackneyApp once the underlying inputs are finalised.</Tbd>

      <STitle>Wage Calculator</STitle>
      <WageCalculator />

      <STitle>Income Levers — Scenario Builder</STitle>
      <Tbd>Per-source revenue lever (bar uplift, bookings uplift, private hires, etc.) feeding the Custom scenario. Borough has 6 levers; Hackney's lever list TBD pending the income-source split.</Tbd>
    </div>
  )
}

// ─── 2026 — Top-line forecast cards ───────────────────────────────────
function ForecastTopLineCards({ f }) {
  const cards = [
    { label: 'Revenue (forecast)',  value: f.revenue,  colour: '#4FC3F7' },
    { label: 'Wages (calculator)',  value: f.wages,    colour: '#E67E22' },
    { label: 'Variable +10%',       value: f.stock + f.otherVar, colour: '#A78BFA' },
    { label: 'Fixed +8%',           value: f.fixed,    colour: '#F87171' },
    { label: 'VAT (Net)',           value: f.vatNet,   colour: '#9CA3AF' },
    { label: 'Operating Profit',    value: f.opProfit, colour: f.opProfit >= 0 ? '#10B981' : '#E53935' },
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10 }}>
      {cards.map(c => (
        <div key={c.label} className="card" style={{ padding:14 }}>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{c.label}</div>
          <div className="serif" style={{ fontSize:'clamp(1.2rem, 2.2vw, 1.6rem)', color: c.colour, lineHeight:1 }}>{fmtMoney(c.value)}</div>
        </div>
      ))}
    </div>
  )
}

// ─── 2026 — Cost model rules panel ────────────────────────────────────
function ForecastRulesPanel({ f }) {
  const rules = [
    { label: 'Revenue growth',  value: '+15%',  base: ACTUALS_2025.revenue,    forecast: f.revenue,            colour: '#4FC3F7' },
    { label: 'Wages',           value: 'calculator',  base: PL_WAGE_BASE,      forecast: f.wages,              colour: '#E67E22' },
    { label: 'Stock (variable)',value: '+10%',  base: ACTUALS_2025.variableCosts, forecast: f.stock + f.otherVar,colour: '#A78BFA' },
    { label: 'Fixed costs',     value: '+8%',   base: ACTUALS_2025.fixedCosts, forecast: f.fixed,              colour: '#F87171' },
    { label: 'VAT (Net)',       value: 'scaled with revenue', base: ACTUALS_2025.vatNet, forecast: f.vatNet,    colour: '#9CA3AF' },
  ]
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(201,168,76,0.2)', fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        <span>Line</span>
        <span style={{ textAlign: 'right' }}>Rule</span>
        <span style={{ textAlign: 'right' }}>2025 base</span>
        <span style={{ textAlign: 'right' }}>2026 forecast</span>
      </div>
      {rules.map(r => (
        <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ color: r.colour }}>{r.label}</span>
          <span style={{ color: 'var(--cream-dim)', textAlign: 'right', fontStyle: 'italic' }}>{r.value}</span>
          <span style={{ color: 'var(--cream-dim)', textAlign: 'right' }}>{fmtMoney(r.base)}</span>
          <span style={{ color: r.colour, textAlign: 'right' }}>{fmtMoney(r.forecast)}</span>
        </div>
      ))}
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
        Variable cost categories (Drinks &amp; Gas, Cleaning, DJs, Arcades, Food) all uplift by +10%. Fixed costs uplift by +8%. Wages tracked separately via the Wage Calculator below — drag rates and hours, the forecast tile updates live.
      </div>
    </div>
  )
}

// ─── 2026 — Income by Source forecast (mirrors 2025 layout) ───────────
function ForecastIncomeChart({ sources }) {
  const total = sources.reduce((s, r) => s + (r.amount || 0), 0)
  const data = sources.map(r => ({ ...r, share: total ? (r.amount/total)*100 : 0 }))
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{sources.length} sources · 2025 split × +15% revenue growth</span>
        <span style={{ fontSize: 13, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(total)} forecast</span>
      </div>
      <div style={{ height: 230 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
            <CartesianGrid stroke="rgba(201,168,76,0.08)" horizontal={false} />
            <XAxis type="number" tickFormatter={fmtK} stroke="var(--cream-dim)" fontSize={11} />
            <YAxis dataKey="name" type="category" width={170} stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(201,168,76,0.06)' }}
              contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
              formatter={(v) => fmtMoney(v)} />
            <Bar dataKey="amount" radius={[0,4,4,0]}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 8 }}>
        {data.map(r => (
          <div key={r.name} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 }}>
            <span style={{ color:'var(--cream)' }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:r.color, marginRight:8 }} />{r.name}
            </span>
            <span style={{ color:'var(--cream)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(r.amount)}</span>
            <span style={{ color:'var(--gold)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.share.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 2026 — Costs by Category forecast ────────────────────────────────
function ForecastCostsChart({ cats }) {
  const total = cats.reduce((s, r) => s + r.amount, 0)
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: 'var(--cream-dim)' }}>2026 cost split · variable +10% · fixed +8% · wages from calculator</span>
        <span style={{ fontSize: 13, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(total)} forecast</span>
      </div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={cats} layout="vertical" margin={{ left: 8, right: 12 }}>
            <CartesianGrid stroke="rgba(201,168,76,0.08)" horizontal={false} />
            <XAxis type="number" tickFormatter={fmtK} stroke="var(--cream-dim)" fontSize={11} />
            <YAxis dataKey="name" type="category" width={130} stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(248,113,113,0.06)' }}
              contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
              formatter={(v) => fmtMoney(v)} />
            <Bar dataKey="amount" radius={[0,4,4,0]}>
              {cats.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 8 }}>
        {cats.map(r => (
          <div key={r.name} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 }}>
            <span style={{ color:'var(--cream)' }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:r.color, marginRight:8 }} />{r.name}
            </span>
            <span style={{ color:'var(--cream)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(r.amount)}</span>
            <span style={{ color:'var(--gold)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 2026 — Monthly performance forecast ──────────────────────────────
function ForecastMonthlyChart({ data }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize:11, color:'var(--cream-dim)', marginBottom:12 }}>
        Monthly bars = forecast revenue (2025 actuals × +15%) · line = forecast operating profit (after variable +10%, fixed +8%, wages baseline).
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <YAxis tickFormatter={fmtK} stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(201,168,76,0.06)' }}
              contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
              formatter={(v) => fmtMoney(v)} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
            <Bar dataKey="income" name="Forecast income"  fill="var(--gold)" radius={[3,3,0,0]} />
            <Line type="monotone" dataKey="profit" name="Forecast profit" stroke="var(--teal)" strokeWidth={2} dot={{ r:3, fill:'var(--teal)' }} />
            <Legend wrapperStyle={{ fontSize:11, color:'var(--cream-dim)' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize:11, color:'var(--cream-dim)', margin:'18px 0 8px' }}>Monthly cost stack — forecast (2025 actuals × uplift rules):</div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <YAxis tickFormatter={fmtK} stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(248,113,113,0.06)' }}
              contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
              formatter={(v) => fmtMoney(v)} />
            <Legend wrapperStyle={{ fontSize:11, color:'var(--cream-dim)' }} />
            <Bar dataKey="wages"        name="Wages"        stackId="a" fill="#4A0000" />
            <Bar dataKey="drinks"       name="Drinks & Gas (+10%)" stackId="a" fill="#7B0000" />
            <Bar dataKey="fixed"        name="Fixed Costs (+8%)"   stackId="a" fill="#B71C1C" />
            <Bar dataKey="cleaning"     name="Cleaning (+10%)"     stackId="a" fill="#C62828" />
            <Bar dataKey="djs"          name="DJs (+10%)"          stackId="a" fill="#E53935" />
            <Bar dataKey="arcades"      name="Arcades (+10%)"      stackId="a" fill="#D84315" />
            <Bar dataKey="food"         name="Food (+10%)"         stackId="a" fill="#EF6C00" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TabCashflow() {
  const { snapshot, isLocked } = useLockedUseOfFunds()
  const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

  // Day-1 startup-cost rows: locked snapshot if present, else the static
  // USE_OF_FUNDS defaults. Total raise is fixed; Working Capital is the
  // residual that absorbs whatever's left after the six explicit allocations.
  const day1 = isLocked && snapshot
    ? [
        { label: 'Stock Purchase — Liquidators',     amount: snapshot.stock },
        { label: `Landlord — Rent Deposit (${snapshot.rentMonths} ${snapshot.rentMonths === 1 ? 'month' : 'months'})`, amount: snapshot.rent },
        { label: 'Garden Refurbishment',             amount: snapshot.garden },
        { label: 'Interior Completion & Signage',    amount: snapshot.interior },
        { label: 'Marketing — Pre-launch & Year 1',  amount: snapshot.marketing },
        { label: 'Legals & Restart',                 amount: snapshot.legals },
        { label: 'Working Capital (residual)',       amount: snapshot.workingCapital ?? 0, residual: true },
      ]
    : (() => {
        const explicit = USE_OF_FUNDS.map(u => ({ label: u.item, amount: u.amount }))
        const allocated = explicit.reduce((s, r) => s + r.amount, 0)
        const wc = Math.max(0, 100000 - allocated)   // HACKNEY_RAISE_TARGET = 100k
        return [...explicit, { label: 'Working Capital (residual)', amount: wc, residual: true }]
      })()
  const day1Total = day1.reduce((s, r) => s + r.amount, 0)
  const deal = computeDealFromInvestment(day1Total)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Cashflow Forecast — May 2026 to Apr 2027</STitle>
      <Tbd>Month-by-month opening / inflows / outflows / closing balance table. Headline numbers (peak £82,337 Aug 26 · low £39,250 Feb 27 · year-end £72,462 Apr 27) are rendered in the Net Position chart below; per-month per-line tabular detail is the next pass.</Tbd>

      <STitle>Cash Inflows — by Source</STitle>
      <Tbd>Investment receipt ({fmt(day1Total)} May 26), VAT reclaim (£13,458 May 26), monthly trading income. Mirror Borough's cashflow inflow table.</Tbd>

      {/* Day-1 startup costs — driven by the Use of Funds slider lock */}
      <div style={{ background:'var(--ink-2)', border: `1px solid ${isLocked ? 'rgba(16,185,129,0.4)' : 'rgba(201,168,76,0.12)'}`, borderRadius:10, padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <STitle>One-off Startup Costs (Day 1)</STitle>
          <span style={{ fontSize:11, color: isLocked ? '#10B981' : 'var(--gold-dim)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
            {isLocked ? '✓ Live from locked Use of Funds' : 'Default ask · founder can lock a smaller raise'}
          </span>
        </div>
        <div>
          {day1.map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13 }}>
              <span style={{ color: r.residual ? 'var(--teal)' : 'var(--cream-dim)' }}>{r.label}</span>
              <span style={{ color: r.residual ? 'var(--teal)' : (isLocked ? '#10B981' : 'var(--cream)'), fontVariantNumeric:'tabular-nums' }}>{fmt(r.amount)}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0', fontSize:14, fontWeight:600 }}>
            <span style={{ color:'var(--cream)' }}>Total raise</span>
            <span className="serif" style={{ color: isLocked ? '#10B981' : 'var(--gold)', fontSize:18 }}>{fmt(day1Total)}</span>
          </div>
        </div>
        <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(255,255,255,0.02)', borderRadius:6, fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>
          50/50 split locked. Pre-money {fmt(deal.preMoney)} · post-money {fmt(deal.postMoney)} · implied <strong style={{ color:'var(--cream)' }}>{deal.impliedMult.toFixed(2)}× EBITDA</strong> at this raise.
          {isLocked && snapshot?.lockedAt ? ` · Locked ${new Date(snapshot.lockedAt).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' })}.` : ''}
        </div>
      </div>

      <STitle>Monthly Operating Outflows</STitle>
      <Tbd>Wages, director salary, fixed overheads, accountancy, variable costs, rent (£0 for first 4 months, then £1,833/mo), VAT output (quarterly).</Tbd>

      <STitle>Net Position & Safety Floor</STitle>
      <CashflowChart />
    </div>
  )
}

// ─── Cashflow chart — closing balance per month + safety floor ────────
function CashflowChart() {
  return (
    <div className="card" style={{ padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
        <span style={{ fontSize:11, color:'var(--cream-dim)' }}>
          Peak {fmtMoney(HACKNEY_CASH.peak)} (Aug 26) · Low {fmtMoney(HACKNEY_CASH.low)} (Feb 27) · Year-end {fmtMoney(HACKNEY_CASH.yearEnd)}
        </span>
        <span style={{ fontSize:11, color:'#F87171' }}>
          Safety floor {fmtMoney(HACKNEY_CASH.safetyFloor)}
        </span>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={HACKNEY_CASHFLOW}>
            <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <YAxis tickFormatter={fmtK} stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
            <Tooltip cursor={{ stroke: 'rgba(201,168,76,0.2)' }}
              contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
              formatter={(v) => fmtMoney(v)} />
            <ReferenceLine y={HACKNEY_CASH.safetyFloor} stroke="#F87171" strokeDasharray="4 4" label={{ value:'Safety floor', position:'right', fill:'#F87171', fontSize:10 }} />
            <Line type="monotone" dataKey="closing" name="Closing balance" stroke="var(--gold)" strokeWidth={2} dot={{ r:3, fill:'var(--gold)' }} />
            <Line type="monotone" dataKey="net" name="Net flow" stroke="var(--teal)" strokeWidth={1.5} dot={{ r:2, fill:'var(--teal)' }} />
            <Legend wrapperStyle={{ fontSize:11, color:'var(--cream-dim)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Wage Calculator (2026 Performance) ───────────────────────────────
// Per-role rate slider + hours input. Live total recomputes against the
// 2025 rota baseline (PL_WAGE_BASE = £179,872). Differs from Borough's
// model because Hackney holds 2026 wages flat at 2025 actuals — no
// inflation assumption baked in. Founder can drag rates / hours to
// stress-test the wage budget against a different staffing mix.
function WageCalculator() {
  const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
  const [rows, setRows] = useState(() =>
    WAGE_RATES.map(r => ({ ...r }))   // shallow clone so sliders are mutable
  )
  const reset = () => setRows(WAGE_RATES.map(r => ({ ...r })))
  const setField = (idx, key, value) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r))

  const grossTotal = rows.reduce((s, r) => s + r.rate * r.hours, 0)
  const loadedTotal = grossTotal * WAGE_OVERHEAD_MULT
  const baselineDelta = loadedTotal - PL_WAGE_BASE
  const deltaPct = (baselineDelta / PL_WAGE_BASE) * 100

  return (
    <div className="card" style={{ padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <span style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.5 }}>
          Drag each role's rate and hours. Loaded total = gross × {WAGE_OVERHEAD_MULT.toFixed(3)} (NIC + pension + holiday). Compares to 2025 actual {fmt(PL_WAGE_BASE)}.
        </span>
        <button onClick={reset} style={{ fontSize:11, padding:'4px 12px', borderRadius:4, background:'transparent', color:'var(--cream-dim)', border:'1px solid rgba(201,168,76,0.3)', cursor:'pointer' }}>Reset</button>
      </div>

      {rows.map((r, i) => (
        <div key={r.role} style={{ display:'grid', gridTemplateColumns:'1.5fr 2fr 2fr 1fr', gap:12, alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ color:'var(--cream)', fontSize:13 }}>
            <span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:r.color, marginRight:8 }} />{r.role}
          </span>
          <div>
            <div style={{ fontSize:10, color:'var(--cream-dim)', marginBottom:2 }}>Rate · £{r.rate.toFixed(2)}/hr</div>
            <input type="range" min="10" max="25" step="0.10" value={r.rate} onChange={e => setField(i, 'rate', +e.target.value)} style={{ width:'100%', accentColor:r.color }} />
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--cream-dim)', marginBottom:2 }}>Hours · {r.hours.toLocaleString('en-GB')}/yr</div>
            <input type="range" min="0" max="6000" step="50" value={r.hours} onChange={e => setField(i, 'hours', +e.target.value)} style={{ width:'100%', accentColor:r.color }} />
          </div>
          <span style={{ color:r.color, textAlign:'right', fontSize:13, fontVariantNumeric:'tabular-nums' }}>{fmt(r.rate * r.hours)}</span>
        </div>
      ))}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginTop:16, paddingTop:14, borderTop:'1px solid rgba(201,168,76,0.2)' }}>
        <div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Gross / yr</div>
          <div className="serif" style={{ fontSize:18, color:'var(--cream)' }}>{fmt(grossTotal)}</div>
        </div>
        <div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Loaded / yr</div>
          <div className="serif" style={{ fontSize:18, color:'var(--gold)' }}>{fmt(loadedTotal)}</div>
        </div>
        <div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>vs 2025 Actual</div>
          <div className="serif" style={{ fontSize:18, color: baselineDelta > 0 ? '#F87171' : '#10B981' }}>
            {baselineDelta >= 0 ? '+' : ''}{fmt(baselineDelta)}
          </div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', marginTop:2 }}>{deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}

export default function BusinessExplorer() {
  const [tab, setTab] = useState('performance2025')
  const tabComponents = {
    performance2025: <Tab2025 />,
    performance2026: <Tab2026 />,
    cashflow:        <TabCashflow />,
  }
  return (
    <div style={{ minHeight:'100%', background:'var(--ink)', color:'var(--cream)' }}>
      <div style={{ padding:'20px 32px 0', borderBottom:'1px solid rgba(201,168,76,0.12)' }}>
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding:'8px 16px', fontSize:11, cursor:'pointer', border:'none', background:'transparent', letterSpacing:'0.06em', textTransform:'uppercase', borderBottom:`2px solid ${tab===t.key?'var(--gold)':'transparent'}`, color:tab===t.key?'var(--gold)':'var(--cream-dim)', transition:'all 0.15s', whiteSpace:'nowrap' }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:'24px 32px 24px', fontSize:13 }}>{tabComponents[tab]}</div>
    </div>
  )
}
