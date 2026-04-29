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
  HACKNEY_FIXED_COSTS_2025,
  USE_OF_FUNDS,
  WAGE_RATES,
  PL_WAGE_BASE,
  ROTA_TOTAL,
  WAGE_OVERHEAD_MULT,
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

      <STitle>Hours — 2025 Rota Reference (4-role bar-only)</STitle>
      <WageRotaReference />
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
    // Bar-only entity, no depreciation line ⇒ Operating Profit = EBITDA.
    // Surfaced as "Operating Profit" so it reads as profit at a glance;
    // EBITDA shown as a sub-label for investors who think in those terms.
    { label: 'Operating Profit', value: ACTUALS_2025.profit,        colour: '#10B981', sub: '= EBITDA · no D&A line' },
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10 }}>
      {cards.map(c => (
        <div key={c.label} className="card" style={{ padding:14 }}>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{c.label}</div>
          <div className="serif" style={{ fontSize:'clamp(1.2rem, 2.2vw, 1.6rem)', color: c.colour, lineHeight:1 }}>{fmtMoney(c.value)}</div>
          {c.sub && <div style={{ fontSize:10, color:'var(--cream-dim)', marginTop:6 }}>{c.sub}</div>}
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

// ─── Hours — 2025 rota reference (bar-only, 4 roles) ──────────────────
// Operational hours only. Per methodology rule, the rota Google Sheet
// is the source for HOURS / DATE / TIME / ROLE — no £ figures shown
// here. The financial-truth wage line (£179,872 / yr) lives on the
// 2025 top-line cards above, sourced from Weekly Merged 2024-2026
// (Monthly Summary G15).
function WageRotaReference() {
  const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
  const totalHours = WAGE_RATES.reduce((s, r) => s + r.hours, 0)
  return (
    <div className="card" style={{ padding:18 }}>
      <div style={{ display:'grid', gridTemplateColumns:'2.4fr 1fr 0.8fr', gap:12, fontSize:11, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', paddingBottom:8, borderBottom:'1px solid rgba(201,168,76,0.15)' }}>
        <span>Role</span><span style={{ textAlign:'right' }}>Hours (yr)</span><span style={{ textAlign:'right' }}>Share</span>
      </div>
      {WAGE_RATES.map(r => {
        const share = totalHours > 0 ? r.hours / totalHours : 0
        return (
          <div key={r.role} style={{ display:'grid', gridTemplateColumns:'2.4fr 1fr 0.8fr', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13, alignItems:'baseline' }}>
            <span style={{ color:'var(--cream)' }}><span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:r.color, marginRight:8 }} />{r.role}</span>
            <span style={{ color:'var(--cream)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.hours.toLocaleString('en-GB')}</span>
            <span style={{ color:'var(--gold-dim)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{(share * 100).toFixed(1)}%</span>
          </div>
        )
      })}
      <div style={{ display:'grid', gridTemplateColumns:'2.4fr 1fr 0.8fr', gap:12, padding:'12px 0 4px', fontSize:14, fontWeight:600 }}>
        <span style={{ color:'var(--cream)' }}>Total hours · 2025</span>
        <span style={{ color:'var(--gold)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{totalHours.toLocaleString('en-GB')}</span>
        <span style={{ color:'var(--gold-dim)', textAlign:'right' }}>100.0%</span>
      </div>
      <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:10, lineHeight:1.6 }}>
        Source: live rota Google Sheet · 2025 bar-only shifts (Bar Staff, Supervisor, Asst. Manager, Manager — Golf Host + Kitchen excluded). <strong style={{ color:'var(--cream)' }}>Operational data only — no £ values attributed at the rota level.</strong> Total bar wage spend for 2025 ({fmt(PL_WAGE_BASE)}) is shown on the top-line cards above; that figure is the financial truth, sourced from Weekly Merged 2024-2026 / Monthly Summary G15.
      </div>
    </div>
  )
}


// ─── 2026 cost-model rules (user-defined, April 2026) ─────────────────
// Per user direction:
//   • Revenue growth:    +15% (base case)
//   • Stock / variable:  +10% on every variable line (drinks, food, cleaning, djs, arcades)
//   • Fixed costs:       +10% on the non-rent, non-rates lines
//   • Rent:              NEW lease — £65,000 + VAT per annum (net in P&L).
//                        4-month rent-free start. Y1 = 8 paying months ×
//                        £65k/12 = £43,333. Y2 steady = £65,000.
//                        Y3+ compounds at +3% annual lease uplift.
//                        Deposit £19,500 inc VAT (3 mo × £6,500), paid in
//                        3 monthly instalments from operating cash during
//                        the rent-free period — does NOT consume the raise.
//   • Business rates:    £16,830 (2025 × 1.10) — Hackney Council confirm.
//   • Wages:             driven by the wage calculator (default = PL_WAGE_BASE).
const FORECAST_RULES = {
  revenueGrowth:   0.15,
  variableUplift:  0.10,
  fixedUplift:     0.10,    // applied to non-rent, non-rates fixed lines
  rentAnnualNet:   65000,   // £65,000 + VAT pa (net in P&L)
  rentY1:          43333,   // 8 paying months × £65k/12 (4 months rent-free per lease)
  rentSteady:      65000,   // Y2 full year
  rentUplift:      0.03,    // 3% annual uplift on rent (Y3+ compounds)
  rates:           16830,   // 2025 actual £15,300 × 1.10 — pending council confirm
}

// Build forecast figures by applying the rules to 2025 actuals + Weekly
// Merged sub-line breakdowns. Fixed costs are computed from the explicit
// 2025 sub-line breakdown (HACKNEY_FIXED_COSTS_2025) so we can replace
// rent and rates with the new figures while uplifting the rest by +10%.
function buildForecast(wagesOverride) {
  const r = 1 + FORECAST_RULES.revenueGrowth
  const v = 1 + FORECAST_RULES.variableUplift
  const f = 1 + FORECAST_RULES.fixedUplift

  const revenue = ACTUALS_2025.revenue * r
  // Wages: locked wage-calculator total cascades in here when present;
  // otherwise fall back to PL_WAGE_BASE (2025 verified actual).
  const wages   = Number.isFinite(wagesOverride) && wagesOverride > 0 ? wagesOverride : PL_WAGE_BASE
  const stockCats = ['Drinks & Gas', 'Food']
  const otherVarCats = ['Cleaning', 'DJs', 'Arcades']
  const stock = COST_CATEGORIES.filter(c => stockCats.includes(c.name)).reduce((s,c) => s + c.amount, 0) * v
  const otherVar = COST_CATEGORIES.filter(c => otherVarCats.includes(c.name)).reduce((s,c) => s + c.amount, 0) * v

  // New fixed cost build:
  //   rent (Y1):  £14,664 (replaces 2025 £94,146)
  //   rates:      £16,830 (2025 £15,300 × 1.10)
  //   other:      sum of other fixed lines × 1.10
  const otherFixed2025 = HACKNEY_FIXED_COSTS_2025
    .filter(l => l.key !== 'rent' && l.key !== 'rates')
    .reduce((s, l) => s + l.amount, 0)
  const rent  = FORECAST_RULES.rentY1
  const rates = FORECAST_RULES.rates
  const otherFixed = otherFixed2025 * f
  const fixed = rent + rates + otherFixed

  const vatNet = ACTUALS_2025.vatNet * r
  const director = 15885
  const opCosts = wages + stock + otherVar + fixed + vatNet + director
  const opProfit = revenue - opCosts
  const margin = revenue ? opProfit / revenue : 0
  return { revenue, wages, stock, otherVar, rent, rates, otherFixed, fixed, vatNet, director, opCosts, opProfit, margin, r, v, f }
}

// Forecast monthly arrays — apply growth to 2025 monthly income + uplifts
// to monthly costs (preserving 2025 month-to-month seasonality). Rent +
// rates are split out and allocated separately: rent is £0 for the first
// 4 months (rent-free per lease) then £65k/12 ≈ £5,417/mo thereafter;
// rates split evenly month-to-month.
function buildForecastMonthly(wagesOverride) {
  const r = 1 + FORECAST_RULES.revenueGrowth
  const v = 1 + FORECAST_RULES.variableUplift
  const f = 1 + FORECAST_RULES.fixedUplift
  const monthlyRates = FORECAST_RULES.rates / 12                   // £16,830 / 12 ≈ £1,402

  // Other fixed (excl. rent + rates) — derive monthly share from 2025 split.
  // Approximation: distribute the 2025 monthly fixed line proportionally.
  const otherFixed2025Total = HACKNEY_FIXED_COSTS_2025
    .filter(l => l.key !== 'rent' && l.key !== 'rates')
    .reduce((s, l) => s + l.amount, 0)
  const monthlyFixedTotal2025 = MONTHLY_COSTS.reduce((s, m) => s + m.fixed, 0)
  // Each month's non-rent, non-rates share = mc.fixed × (otherFixed2025Total / monthlyFixedTotal2025) × 1.10

  // When the wage calculator is locked at a different annual total, scale
  // the per-month 2025 wage shares proportionally so the seasonality is
  // preserved but the totals match the locked calculator figure.
  const targetWageAnnual = Number.isFinite(wagesOverride) && wagesOverride > 0 ? wagesOverride : PL_WAGE_BASE
  const wageScale = PL_WAGE_BASE > 0 ? targetWageAnnual / PL_WAGE_BASE : 1

  return MONTHLY_INCOME.map((row, i) => {
    const mc = MONTHLY_COSTS[i]
    const variable = (mc.drinks + mc.cleaning + mc.djs + mc.arcades + mc.food) * v

    // Fixed split: replace 2025 monthly fixed with new components.
    const otherFixedShare = monthlyFixedTotal2025 > 0
      ? mc.fixed * (otherFixed2025Total / monthlyFixedTotal2025) * f
      : 0
    // Rent: forecast year is May 2026 → Apr 2027. The user's monthly array
    // uses Jan–Dec calendar months from 2025 actuals. For the visualisation,
    // we distribute the Y1 rent figure (8 paying months × £65k/12 =
    // £43,333) evenly across 12 months ≈ £3,611 / mo average. (Cash Flow
    // Forecast tab handles the May–Apr trading-year detail with the actual
    // 4-month rent-free start.)
    const monthlyRentAvg = FORECAST_RULES.rentY1 / 12
    const fixed = otherFixedShare + monthlyRentAvg + monthlyRates
    const wages = mc.wages * wageScale
    const totalCost = variable + fixed + wages
    const income = row.amount * r

    return {
      month: row.month,
      income,
      profit: income - totalCost,
      wages, fixed,
      rent: monthlyRentAvg,
      rates: monthlyRates,
      drinks: mc.drinks * v, cleaning: mc.cleaning * v,
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

// Build forecasted cost-by-category list with rule-based uplifts. Fixed
// Costs is replaced with the rebuilt total (new rent + rates + other × 1.10),
// not a flat × 1.10 on the 2025 line — the lease change drops it materially.
function buildForecastCosts(fixedNew) {
  const v = 1 + FORECAST_RULES.variableUplift
  const isFixed = (n) => n === 'Fixed Costs'
  const isWages = (n) => n === 'Wages'
  return COST_CATEGORIES.map(c => {
    if (isWages(c.name)) return { ...c }                      // wages: calculator-driven
    if (isFixed(c.name)) return { ...c, amount: fixedNew }   // replace with rebuilt total
    return { ...c, amount: c.amount * v }                    // variable / stock: × 1.10
  })
}

function Tab2026() {
  // Locked wage calculator total cascades into the forecast wage line.
  // When unlocked, buildForecast falls back to PL_WAGE_BASE.
  const { isWageLocked, wageEffective } = useLockedUseOfFunds()
  const wagesOverride = isWageLocked ? wageEffective.loadedAnnual : null
  const f = buildForecast(wagesOverride)
  const monthly = buildForecastMonthly(wagesOverride)
  const fcIncome = buildForecastIncome()
  const fcCosts = buildForecastCosts(f.fixed)
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
    { label: 'Revenue (forecast)',     value: f.revenue,             colour: '#4FC3F7' },
    { label: 'Wages (calculator)',     value: f.wages,               colour: '#E67E22' },
    { label: 'Variable +10%',          value: f.stock + f.otherVar,  colour: '#A78BFA' },
    { label: 'Fixed (new lease)',      value: f.fixed,               colour: '#F87171', sub: `Rent ${fmtMoney(f.rent)} (Y1, 8 mo) · Rates ${fmtMoney(f.rates)}` },
    { label: 'VAT (Net) + Director',   value: f.vatNet + f.director, colour: '#9CA3AF' },
    { label: 'Operating Profit',       value: f.opProfit,            colour: f.opProfit >= 0 ? '#10B981' : '#E53935', sub: `${(f.margin*100).toFixed(1)}% margin` },
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10 }}>
      {cards.map(c => (
        <div key={c.label} className="card" style={{ padding:14 }}>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{c.label}</div>
          <div className="serif" style={{ fontSize:'clamp(1.2rem, 2.2vw, 1.6rem)', color: c.colour, lineHeight:1 }}>{fmtMoney(c.value)}</div>
          {c.sub && <div style={{ fontSize:10, color:'var(--cream-dim)', marginTop:6 }}>{c.sub}</div>}
        </div>
      ))}
    </div>
  )
}

// ─── 2026 — Cost model rules panel ────────────────────────────────────
function ForecastRulesPanel({ f }) {
  const { isWageLocked } = useLockedUseOfFunds()
  const rentBase  = HACKNEY_FIXED_COSTS_2025.find(l => l.key === 'rent').amount
  const ratesBase = HACKNEY_FIXED_COSTS_2025.find(l => l.key === 'rates').amount
  const otherFixedBase = HACKNEY_FIXED_COSTS_2025
    .filter(l => l.key !== 'rent' && l.key !== 'rates')
    .reduce((s, l) => s + l.amount, 0)

  const rules = [
    { label: 'Revenue growth',         value: '+15%',                           base: ACTUALS_2025.revenue,       forecast: f.revenue,            colour: '#4FC3F7' },
    { label: 'Wages',                  value: isWageLocked ? '🔒 calculator (locked)' : 'calculator', base: PL_WAGE_BASE, forecast: f.wages, colour: '#E67E22', highlight: isWageLocked },
    { label: 'Stock + variable',       value: '+10%',                           base: ACTUALS_2025.variableCosts, forecast: f.stock + f.otherVar, colour: '#A78BFA' },
    { label: 'Rent (NEW lease)',       value: '£65k+VAT pa · 4-mo free · +3% pa',  base: rentBase,                   forecast: f.rent,               colour: '#F87171', highlight: true },
    { label: 'Business rates',         value: '+10% · TBC w/ council',          base: ratesBase,                  forecast: f.rates,              colour: '#F87171' },
    { label: 'Other fixed',            value: '+10%',                           base: otherFixedBase,             forecast: f.otherFixed,         colour: '#F87171' },
    { label: 'VAT (Net)',              value: 'scaled with revenue',            base: ACTUALS_2025.vatNet,        forecast: f.vatNet,             colour: '#9CA3AF' },
    { label: 'Director salary',        value: 'fixed',                          base: f.director,                 forecast: f.director,           colour: '#9CA3AF' },
  ]
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr 1fr 1fr', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(201,168,76,0.2)', fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        <span>Line</span>
        <span style={{ textAlign: 'right' }}>Rule</span>
        <span style={{ textAlign: 'right' }}>2025 base</span>
        <span style={{ textAlign: 'right' }}>2026 forecast</span>
      </div>
      {rules.map(r => (
        <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr 1fr 1fr', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, fontVariantNumeric: 'tabular-nums', background: r.highlight ? 'rgba(248,113,113,0.04)' : 'transparent' }}>
          <span style={{ color: r.colour }}>{r.label}</span>
          <span style={{ color: 'var(--cream-dim)', textAlign: 'right', fontStyle: 'italic' }}>{r.value}</span>
          <span style={{ color: 'var(--cream-dim)', textAlign: 'right' }}>{fmtMoney(r.base)}</span>
          <span style={{ color: r.colour, textAlign: 'right' }}>{fmtMoney(r.forecast)}</span>
        </div>
      ))}
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
        <strong style={{ color:'var(--teal)' }}>Lease headline:</strong> the new £65,000 + VAT per annum lease (with 4-month rent-free start) means Year 1 pays 8 months × £5,417 = £{f.rent.toLocaleString('en-GB')} — a {fmtMoney(rentBase - f.rent)} saving vs 2025's £{rentBase.toLocaleString('en-GB')}. Steady-state Y2 runs at the £65,000 headline (~£29k/yr saving vs the historic figure), then compounds at +3% per annum per the lease uplift clause. Deposit £19,500 inc VAT, paid in 3 monthly instalments during the rent-free period (funded from trading cash, not the raise).
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
  const { effective, isLocked, snapshot } = useLockedUseOfFunds()
  const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

  // Day-1 startup-cost rows always reflect the live context — slider
  // preview when not locked, snapshot when locked. Working Capital is
  // the residual the context already computes for us.
  const rentLabel = effective.rentMonths === 0
    ? 'Landlord — Rent Deposit (paid monthly)'
    : `Landlord — Rent Deposit (${effective.rentMonths} ${effective.rentMonths === 1 ? 'month' : 'months'})`
  const day1 = [
    { label: 'Stock Purchase — Liquidators',     amount: effective.stock },
    { label: rentLabel,                           amount: effective.rent },
    { label: 'Garden Refurbishment',             amount: effective.garden },
    { label: 'Interior Completion & Signage',    amount: effective.interior },
    { label: 'Marketing — Pre-launch & Year 1',  amount: effective.marketing },
    { label: 'Legals & Restart',                 amount: effective.legals },
    { label: 'Working Capital (residual)',       amount: effective.workingCapital ?? 0, residual: true },
  ]
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
      <Tbd>Wages, director salary, fixed overheads, accountancy, variable costs, rent (£0 for first 4 months, then £65k/12 ≈ £5,417/mo net), VAT output (quarterly).</Tbd>

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
// Per-role rate + hours sliders. Loaded annual = gross × WAGE_OVERHEAD_MULT
// (covers NIC + pension + holiday). Compares to 2025 rota baseline
// (PL_WAGE_BASE = £179,872). Founder can drag to stress-test a different
// staffing mix, then Lock — the locked loaded annual flows into
// buildForecast() as the wages line for the 2026 forecast (replaces
// PL_WAGE_BASE). Locked snapshot persists via LockedUseOfFundsContext
// so the figure waterfalls across reloads and to non-founder viewers.
function WageCalculator() {
  const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
  const {
    wageEffective, isWageLocked, isFounder, canEditWages,
    setWageRow, lockWages, unlockWages, resetWages,
    wageSnapshot,
  } = useLockedUseOfFunds()

  const rows = wageEffective.rows
  const grossTotal  = wageEffective.grossAnnual
  const loadedTotal = wageEffective.loadedAnnual
  const baselineDelta = loadedTotal - PL_WAGE_BASE
  const deltaPct = (baselineDelta / PL_WAGE_BASE) * 100

  const lockedAtLabel = wageSnapshot?.lockedAt
    ? new Date(wageSnapshot.lockedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : null

  return (
    <div className="card" style={{ padding:18, border: isWageLocked ? '1px solid rgba(16,185,129,0.4)' : undefined }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:14, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'3px 10px', borderRadius:12,
            background: isWageLocked ? 'rgba(16,185,129,0.12)' : 'rgba(201,168,76,0.08)',
            border: `1px solid ${isWageLocked ? 'rgba(16,185,129,0.4)' : 'rgba(201,168,76,0.2)'}`,
            fontSize:10, color: isWageLocked ? '#10B981' : 'var(--gold-dim)',
            letterSpacing:'0.08em', textTransform:'uppercase',
          }}>
            <span style={{ fontSize:9 }}>{isWageLocked ? '🔒' : '○'}</span>
            {isWageLocked ? 'Locked · cascades to 2026 forecast' : 'Live preview'}
          </span>
          <span style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.5 }}>
            Drag each role's rate and hours. Loaded total = gross × {WAGE_OVERHEAD_MULT.toFixed(3)} (NIC + pension + holiday). 2025 actual {fmt(PL_WAGE_BASE)}.
          </span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {isFounder && (
            <button onClick={resetWages} style={{ fontSize:11, padding:'5px 12px', borderRadius:4, background:'transparent', color:'var(--cream-dim)', border:'1px solid rgba(201,168,76,0.3)', cursor:'pointer' }}>Reset</button>
          )}
          {isFounder && (
            isWageLocked ? (
              <button onClick={unlockWages} style={{ fontSize:11, fontWeight:600, padding:'5px 14px', borderRadius:4, background:'transparent', color:'var(--gold)', border:'1px solid var(--gold)', cursor:'pointer', letterSpacing:'0.06em', textTransform:'uppercase' }}>🔓 Unlock</button>
            ) : (
              <button onClick={lockWages} style={{ fontSize:11, fontWeight:600, padding:'5px 14px', borderRadius:4, background:'var(--gold)', color:'var(--ink)', border:'1px solid var(--gold)', cursor:'pointer', letterSpacing:'0.06em', textTransform:'uppercase' }}>🔒 Lock</button>
            )
          )}
        </div>
      </div>

      {rows.map((r, i) => (
        <div key={r.role} style={{ display:'grid', gridTemplateColumns:'1.5fr 2fr 2fr 1fr', gap:12, alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ color:'var(--cream)', fontSize:13 }}>
            <span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:r.color, marginRight:8 }} />{r.role}
          </span>
          <div>
            <div style={{ fontSize:10, color:'var(--cream-dim)', marginBottom:2 }}>Rate · £{r.rate.toFixed(2)}/hr</div>
            <input type="range" min="10" max="25" step="0.10" value={r.rate} disabled={!canEditWages} onChange={e => setWageRow(i, 'rate', +e.target.value)} style={{ width:'100%', accentColor:r.color, cursor: canEditWages ? 'pointer' : 'not-allowed', opacity: canEditWages ? 1 : 0.55 }} />
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--cream-dim)', marginBottom:2 }}>Hours · {r.hours.toLocaleString('en-GB')}/yr</div>
            <input type="range" min="0" max="6000" step="50" value={r.hours} disabled={!canEditWages} onChange={e => setWageRow(i, 'hours', +e.target.value)} style={{ width:'100%', accentColor:r.color, cursor: canEditWages ? 'pointer' : 'not-allowed', opacity: canEditWages ? 1 : 0.55 }} />
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
          <div className="serif" style={{ fontSize:18, color: isWageLocked ? '#10B981' : 'var(--gold)' }}>{fmt(loadedTotal)}</div>
        </div>
        <div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>vs 2025 Actual</div>
          <div className="serif" style={{ fontSize:18, color: baselineDelta > 0 ? '#F87171' : '#10B981' }}>
            {baselineDelta >= 0 ? '+' : ''}{fmt(baselineDelta)}
          </div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', marginTop:2 }}>{deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%</div>
        </div>
      </div>

      {isWageLocked && (
        <div style={{ marginTop:12, padding:'8px 12px', background:'rgba(16,185,129,0.06)', borderRadius:6, fontSize:11, color:'#10B981' }}>
          ✓ Locked{lockedAtLabel ? ` · ${lockedAtLabel}` : ''} — {fmt(loadedTotal)} flows into the 2026 forecast wage line above (replaces the £{PL_WAGE_BASE.toLocaleString('en-GB')} default).
        </div>
      )}
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
