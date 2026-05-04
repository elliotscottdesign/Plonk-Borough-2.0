import React, { useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceArea, Cell,
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
  WAGE_RATES_ROTA_RAW_2025,
  PL_WAGE_BASE,
  ROTA_TOTAL,
  WAGE_OVERHEAD_MULT,
  computeDealFromInvestment,
  HACKNEY_SCENARIO_LEVERS,
  HACKNEY_OFFICE_COST_ITEMS,
  HACKNEY_OFFICE_COSTS_2026_DEFAULTS,
  sumHackneyOfficeCosts,
  HACKNEY_FIXED_COST_ITEMS,
  HACKNEY_FIXED_COSTS_2026_DEFAULTS,
  sumHackneyFixedCostsAnnual,
  HACKNEY_DMN_SKUS_ONLINE_2025,
  WORKBOOK_URL,
} from '../../data/hackney.js'
import { HACKNEY_2025_TILL_SALES, HACKNEY_2025_DISCOUNTS, HACKNEY_2025_DISCOUNT_CODES } from '../../data/hackney2025TillSales.js'
import { HACKNEY_PREV_TILL_SALES, HACKNEY_PREV_TILL_YEAR_TOTALS, HACKNEY_PREV_TILL_YEARS, HACKNEY_GOLF_CATEGORIES, hackneyTotalsForYear } from '../../data/hackneyPrevTillSales.js'
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
  { key: 'tillsales2025',   label: '2025 Till Sales' },
  { key: 'prevtillsales',   label: 'Till Sales 2020–2024' },
  { key: 'performance2026', label: '2026 Performance' },
  { key: 'cashflow',        label: 'Cashflow Forecast' },
]

// Section subheading — serif font (matches the main tab headings) at ~18px in
// cream/white. Replaces the original tiny gold uppercase label which was hard
// to read against the dark backgrounds.
function STitle({ children }) {
  return <div className="serif" style={{ fontSize:20, color:'var(--cream)', marginBottom:14, lineHeight:1.25 }}>{children}</div>
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

      <WageReconciliation />
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

// ─── DonutWithLegend ──────────────────────────────────────────────────
// Tight donut chart on the left + per-row legend on the right with
// name · £ amount · % share. Replaces the two horizontal-bar charts in
// the 2025 Performance tab (Income by Source + Costs by Category).
function DonutWithLegend({ rows, total, eyebrow, centreLabel = 'Total' }) {
  const data = rows.map(r => ({ ...r, share: total ? (r.amount / total) * 100 : 0 }))

  // SVG donut geometry — viewBox 220×220, outer R 90, inner R 56.
  const R_OUT = 90, R_IN = 56, CX = 110, CY = 110
  let cumAngle = -Math.PI / 2
  const arcs = data.map((d) => {
    const frac = total > 0 ? d.amount / total : 0
    const start = cumAngle
    const end = cumAngle + frac * Math.PI * 2
    cumAngle = end
    const large = end - start > Math.PI ? 1 : 0
    const sx = CX + R_OUT * Math.cos(start), sy = CY + R_OUT * Math.sin(start)
    const ex = CX + R_OUT * Math.cos(end),   ey = CY + R_OUT * Math.sin(end)
    const sxi = CX + R_IN * Math.cos(end),   syi = CY + R_IN * Math.sin(end)
    const exi = CX + R_IN * Math.cos(start), eyi = CY + R_IN * Math.sin(start)
    return {
      d: `M ${sx} ${sy} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${ex} ${ey} L ${sxi} ${syi} A ${R_IN} ${R_IN} 0 ${large} 0 ${exi} ${eyi} Z`,
      color: d.color,
      row: d,
    }
  })

  return (
    <div className="card" style={{ padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <span style={{ fontSize:11, color:'var(--cream-dim)' }}>{eyebrow}</span>
        <span style={{ fontSize:13, color:'var(--gold)', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(total)} aggregate</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:24, alignItems:'center' }}>
        {/* Donut */}
        <svg viewBox="0 0 220 220" style={{ width:'100%', height:'auto' }}>
          {arcs.map((a, i) => (
            <path key={i} d={a.d} fill={a.color} stroke="var(--ink-2)" strokeWidth="1.5">
              <title>{`${a.row.name} · ${fmtMoney(a.row.amount)} (${a.row.share.toFixed(1)}%)`}</title>
            </path>
          ))}
          <text x="110" y="103" textAnchor="middle" fontSize="10" fill="var(--cream-dim)" letterSpacing="0.1em">
            {centreLabel.toUpperCase()}
          </text>
          <text x="110" y="124" textAnchor="middle" fontSize="18" fill="var(--cream)" fontWeight="700" fontFamily="DM Serif Display, serif">
            {fmtMoney(total)}
          </text>
        </svg>

        {/* Legend / info array */}
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {data.map(r => (
            <div key={r.name} style={{
              display:'grid', gridTemplateColumns:'1fr 90px 50px', gap:10, alignItems:'baseline',
              padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12,
            }}>
              <span style={{ color:'var(--cream)', display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                <span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:r.color, flexShrink:0 }} />
                <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name}</span>
              </span>
              <span style={{ color:'var(--cream)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(r.amount)}</span>
              <span style={{ color:'var(--gold)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.share.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 2025 — Income by Source (donut + legend) ─────────────────────────
function IncomeBySourceChart() {
  const total = INCOME_SOURCES.reduce((s, r) => s + (r.amount || 0), 0)
  return (
    <DonutWithLegend
      rows={INCOME_SOURCES}
      total={total}
      eyebrow={`${INCOME_SOURCES.length} sources · 2025 weekly P&L (Weekly Merged tab)`}
      centreLabel="Income"
    />
  )
}

// ─── 2025 — Costs by Category (donut + legend) ────────────────────────
function CostsByCategoryChart() {
  const total = COST_CATEGORIES.reduce((s, r) => s + (r.amount || 0), 0)
  return (
    <DonutWithLegend
      rows={COST_CATEGORIES}
      total={total}
      eyebrow={`${COST_CATEGORIES.length} categories · category-header rows from Weekly Merged`}
      centreLabel="Costs"
    />
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
              contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8, color:'var(--cream)' }}
              labelStyle={{ color:'var(--cream)', fontWeight:600, marginBottom:4 }}
              itemStyle={{ color:'var(--cream)' }}
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
              contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8, color:'var(--cream)' }}
              labelStyle={{ color:'var(--cream)', fontWeight:600, marginBottom:4 }}
              itemStyle={{ color:'var(--cream)' }}
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

// ─── Wage Reconciliation — collapsible investor fact-check panel ──────
// Closed by default — most investors won't need this level of detail,
// but it sits ready for anyone doing forensic fact-checking. Clicking
// the header expands to reveal the full reconciliation: raw rota →
// manual salaried correction → financial truth from Weekly Merged
// 2024-2026.
function WageReconciliation() {
  const [open, setOpen] = useState(false)
  const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
  const rows = WAGE_RATES_ROTA_RAW_2025
  const totalRaw      = rows.reduce((s, r) => s + r.hoursRaw, 0)
  const totalAdjusted = rows.reduce((s, r) => s + r.hoursAdjusted, 0)
  const netAdd        = totalAdjusted - totalRaw
  const adjustedGross = rows.reduce((s, r) => s + r.rate * r.hoursAdjusted, 0)
  const impliedLoading = PL_WAGE_BASE / adjustedGross - 1
  const correctedRows = rows.filter(r => r.salaried)

  return (
    <div style={{
      background: 'var(--ink-2)',
      border: '1px solid rgba(201,168,76,0.18)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Mid-sized title — clickable header that expands the panel */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 22px',
          background: 'transparent',
          border: 'none',
          borderBottom: open ? '1px solid rgba(201,168,76,0.18)' : 'none',
          cursor: 'pointer',
          transition: 'background 0.15s',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.04)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <div>
          <div className="serif" style={{ fontSize: 18, color: 'var(--cream)', lineHeight: 1.2, marginBottom: 4 }}>
            Wage Reconciliation
          </div>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)', letterSpacing: '0.04em' }}>
            For investor fact-check · click to {open ? 'hide' : 'show'} the rota cloud → financial truth chain
          </div>
        </div>
        <span style={{
          fontSize: 18,
          color: 'var(--gold)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          flexShrink: 0,
          marginLeft: 16,
        }}>▾</span>
      </button>

      {/* Collapsed by default. Body only renders when open so investors
          who don't expand the panel never see the detail. */}
      {!open && null}
      {open && (
    <div style={{ padding:'18px 22px' }}>
      {/* Lead disclaimer */}
      <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:16, padding:'10px 14px', background:'rgba(234,179,8,0.06)', borderLeft:'3px solid #EAB308', borderRadius:4 }}>
        <strong style={{ color:'#EAB308' }}>For investor fact-check.</strong> If you pull the live rota Google Sheet directly you will see fewer hours than the Hours Rota Reference card above. The two numbers reconcile here: <strong style={{ color:'var(--cream)' }}>Manager + Asst. Manager are salaried</strong>, and the rota cloud only logs their on-floor scheduled shifts — not management / admin / supplier / HR time. Their salaries already cover full-time work and the financial wage line on Weekly Merged reflects that, so we set both roles to <strong style={{ color:'var(--cream)' }}>40 × 52 = 2,080 hrs</strong> as the contracted basis. Hourly-paid roles (Bar Staff, Supervisor) stay at the rota-recorded figure.
      </div>

      {/* Block 1: Raw rota */}
      <div className="serif" style={{ fontSize:18, color:'var(--cream)', marginBottom:10, lineHeight:1.25 }}>1 · Rota cloud — as recorded in 2025</div>
      <div style={{ display:'grid', gridTemplateColumns:'2.4fr 1fr 1.5fr', gap:12, fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', paddingBottom:8, borderBottom:'1px solid rgba(201,168,76,0.15)' }}>
        <span>Role</span><span style={{ textAlign:'right' }}>Hours (raw)</span><span style={{ textAlign:'right' }}>Note</span>
      </div>
      {rows.map(r => (
        <div key={r.role} style={{ display:'grid', gridTemplateColumns:'2.4fr 1fr 1.5fr', gap:12, padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13, alignItems:'baseline' }}>
          <span style={{ color:'var(--cream)' }}>
            <span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:r.color, marginRight:8 }} />{r.role}
          </span>
          <span style={{ color:'var(--cream)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.hoursRaw.toLocaleString('en-GB')}</span>
          <span style={{ color: r.salaried ? '#EAB308' : 'var(--cream-dim)', textAlign:'right', fontSize:11 }}>
            {r.salaried ? '⚠ rota under-records salaried' : 'hourly · rota is truth'}
          </span>
        </div>
      ))}
      <div style={{ display:'grid', gridTemplateColumns:'2.4fr 1fr 1.5fr', gap:12, padding:'12px 0 4px', fontSize:14, fontWeight:600 }}>
        <span style={{ color:'var(--cream)' }}>Rota cloud total</span>
        <span style={{ color:'var(--cream)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{totalRaw.toLocaleString('en-GB')} hrs</span>
        <span></span>
      </div>

      {/* Block 2: Manual salaried correction */}
      <div className="serif" style={{ fontSize:18, color:'var(--cream)', margin:'24px 0 10px', lineHeight:1.25 }}>2 · Manual correction — salaried roles to 40 × 52</div>
      <div style={{ display:'grid', gridTemplateColumns:'2.4fr 1fr 1fr 0.8fr', gap:12, fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', paddingBottom:8, borderBottom:'1px solid rgba(201,168,76,0.15)' }}>
        <span>Role</span><span style={{ textAlign:'right' }}>Raw</span><span style={{ textAlign:'right' }}>Adjusted</span><span style={{ textAlign:'right' }}>Δ</span>
      </div>
      {correctedRows.map(r => {
        const delta = r.hoursAdjusted - r.hoursRaw
        return (
          <div key={r.role} style={{ display:'grid', gridTemplateColumns:'2.4fr 1fr 1fr 0.8fr', gap:12, padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13, alignItems:'baseline' }}>
            <span style={{ color:'var(--cream)' }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:r.color, marginRight:8 }} />{r.role}
            </span>
            <span style={{ color:'var(--cream-dim)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.hoursRaw.toLocaleString('en-GB')}</span>
            <span style={{ color:'var(--cream)', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.hoursAdjusted.toLocaleString('en-GB')}</span>
            <span style={{ color:'#10B981', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>+{delta.toLocaleString('en-GB', { maximumFractionDigits: 1 })}</span>
          </div>
        )
      })}
      <div style={{ display:'grid', gridTemplateColumns:'2.4fr 1fr 1fr 0.8fr', gap:12, padding:'12px 0 4px', fontSize:14, fontWeight:600 }}>
        <span style={{ color:'var(--cream)' }}>Net add</span>
        <span></span><span></span>
        <span style={{ color:'#10B981', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>+{netAdd.toLocaleString('en-GB', { maximumFractionDigits: 1 })} hrs</span>
      </div>

      {/* Block 3: Adjusted basis + reconciliation to financial truth */}
      <div className="serif" style={{ fontSize:18, color:'var(--cream)', margin:'24px 0 10px', lineHeight:1.25 }}>3 · Adjusted basis · reconciliation to financial truth</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        <ReconTile label="Adjusted hours total"  value={`${totalAdjusted.toLocaleString('en-GB', { maximumFractionDigits: 1 })} hrs`} sub="Used in calculator + 2025 reference" colour="var(--gold)" />
        <ReconTile label="Adjusted gross (rate × hours)" value={fmt(adjustedGross)} sub="Sum of role-by-role rota basis" colour="var(--cream)" />
        <ReconTile label="Weekly Merged G15 (financial truth)" value={fmt(PL_WAGE_BASE)} sub={`Implied loading +${(impliedLoading * 100).toFixed(1)}% (NIC + pension + holiday)`} colour="#10B981" />
      </div>

      {/* Footnote */}
      <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(45,212,191,0.04)', borderLeft:'3px solid #2DD4BF', borderRadius:4, fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>
        <strong style={{ color:'#2DD4BF' }}>Bottom line:</strong> the rota cloud's <strong style={{ color:'var(--cream)' }}>{totalRaw.toLocaleString('en-GB')}</strong> raw hours and the deck's <strong style={{ color:'var(--cream)' }}>{totalAdjusted.toLocaleString('en-GB', { maximumFractionDigits:1 })}</strong> adjusted hours both ladder to the same {fmt(PL_WAGE_BASE)} financial-truth wage line on the 2025 P&L. The +{netAdd.toLocaleString('en-GB', { maximumFractionDigits:1 })} hrs adjustment isn't a number we've invented — it's the salaried element of management pay that the rota tool simply doesn't track. Investor verification path: Weekly Merged 2024-2026 (rows 14–24) sums to £179,872 regardless of which view you take of the rota.
      </div>
    </div>
      )}
    </div>
  )
}

function ReconTile({ label, value, sub, colour }) {
  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:14 }}>
      <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
      <div className="serif" style={{ fontSize:'clamp(1.1rem, 1.8vw, 1.4rem)', color: colour || 'var(--cream)', lineHeight:1, marginBottom:6, fontVariantNumeric:'tabular-nums' }}>{value}</div>
      <div style={{ fontSize:10, color:'var(--cream-dim)', lineHeight:1.4 }}>{sub}</div>
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

// ─── 2026 Performance · Section keys for left-side TOC ────────────────
const PERF_SECTIONS = [
  { id: 'tickets',  label: 'Ticket Price',    icon: '🎟' },
  { id: 'income',   label: 'Income',          icon: '💰' },
  { id: 'opcosts',  label: 'Operating Costs', icon: '💸' },
  { id: 'fixed',    label: 'Fixed Costs',     icon: '🏠' },
  { id: 'wages',    label: 'Wages',           icon: '👥' },
  { id: 'office',   label: 'Office Costs',    icon: '🏢' },
]

// 2026 cost donut palette — high-contrast, readable on dark background.
const COST_2026_COLORS = ['#F87171','#FB923C','#C084FC','#F472B6','#9CA3AF','#FCA5A5','#FDBA74','#FBBF24','#A78BFA']

// ─── compute2026Scenario · canonical 2026 P&L from the forecast state ─
// Single source of truth for the 2026 numbers — feeds the KPI cards,
// the income & cost donuts, and the monthly chart. Reads:
//   • forecast.growth     — 4 levers (bar / office / tournament / pool)
//   • forecast.fixedCosts — line-by-line fixed-cost overrides
//   • forecast.officeCosts — line-by-line office-cost overrides
//   • wagesOverride       — locked Wage Calculator total (or null)
function compute2026Scenario(forecastValues, wagesOverride) {
  const growth = forecastValues?.growth ?? {}

  const incomeLines = HACKNEY_SCENARIO_LEVERS.map(l => {
    const g = growth[l.key] ?? 0
    return {
      key: l.key,
      label: l.labelKey,
      color: l.color,
      base: l.base,
      growth: g,
      value: Math.round(l.base * (1 + g / 100)),
    }
  })
  const totalIncome     = incomeLines.reduce((s, l) => s + l.value, 0)
  const baseTotalIncome = HACKNEY_SCENARIO_LEVERS.reduce((s, l) => s + l.base, 0)
  const aggGrowth       = baseTotalIncome > 0 ? ((totalIncome - baseTotalIncome) / baseTotalIncome) * 100 : 0
  const mult            = baseTotalIncome > 0 ? totalIncome / baseTotalIncome : 1
  const incomeWithPct   = incomeLines.map(l => ({ ...l, pct: totalIncome > 0 ? +(l.value / totalIncome * 100).toFixed(1) : 0 }))

  // Wages — locked calculator if present, else PL_WAGE_BASE.
  const wages = Number.isFinite(wagesOverride) && wagesOverride > 0 ? wagesOverride : PL_WAGE_BASE

  // Fixed costs — editor matrix annual total + Y1 lease rent (£43,333).
  const fixedFromMatrix = sumHackneyFixedCostsAnnual(forecastValues?.fixedCosts ?? {})
  const rent            = FORECAST_RULES.rentY1
  const fixedLine       = fixedFromMatrix + rent

  // Office costs — editor matrix annual total.
  const officeCostsTotal = sumHackneyOfficeCosts(forecastValues?.officeCosts ?? {})

  // Variable lines scale with revenue mult.
  const baseDrinks   = COST_CATEGORIES.find(c => c.name === 'Drinks & Gas')?.amount ?? 134123
  const baseCleaning = COST_CATEGORIES.find(c => c.name === 'Cleaning')?.amount     ?? 16492
  const baseDjs      = COST_CATEGORIES.find(c => c.name === 'DJs')?.amount          ?? 10300
  const baseArcades  = COST_CATEGORIES.find(c => c.name === 'Arcades')?.amount      ?? 8202
  const baseFood     = COST_CATEGORIES.find(c => c.name === 'Food')?.amount         ?? 7887
  const drinksLine   = Math.round(baseDrinks   * mult)
  const cleaningLine = Math.round(baseCleaning * mult)
  const djsLine      = Math.round(baseDjs      * mult)
  const arcadesLine  = Math.round(baseArcades  * mult)
  const foodLine     = Math.round(baseFood     * mult)

  // Net VAT — Output VAT (revenue × 1/6) minus Input VAT (vatable costs × 1/6).
  // Vatable costs: fixed + drinks + cleaning. Zero-rated: wages, food, arcades.
  const VAT_FRACTION = 1 / 6
  const vatableCosts = fixedLine + drinksLine + cleaningLine
  const outputVat    = totalIncome * VAT_FRACTION
  const inputVat     = vatableCosts * VAT_FRACTION
  const netVat       = Math.round(outputVat - inputVat)

  const costsRaw = [
    { key: 'wages',    label: 'Wages',         value: wages,            note: 'Calculator-driven · PL_WAGE_BASE if unlocked' },
    { key: 'fixed',    label: 'Fixed Costs',   value: fixedLine,        note: `Editor matrix + £${rent.toLocaleString('en-GB')} Y1 lease rent` },
    { key: 'office',   label: 'Office Costs',  value: officeCostsTotal, note: 'Apps + AI + Accounting + Director matrix' },
    { key: 'drinks',   label: 'Drinks & Gas',  value: drinksLine,       note: 'Scales with revenue' },
    { key: 'vat',      label: 'VAT (Net)',     value: netVat,           note: 'Output VAT − Input VAT (1/6 each)' },
    { key: 'cleaning', label: 'Cleaning',      value: cleaningLine,     note: 'Scales with revenue' },
    { key: 'arcades',  label: 'Arcades',       value: arcadesLine,      note: 'Scales with revenue' },
    { key: 'djs',      label: 'DJs',           value: djsLine,          note: 'Scales with revenue' },
    { key: 'food',     label: 'Food',          value: foodLine,         note: 'Scales with revenue' },
  ]
  const totalCosts   = costsRaw.reduce((s, c) => s + c.value, 0)
  const costs2026    = costsRaw.map((c, i) => ({
    ...c,
    color: COST_2026_COLORS[i] || '#9CA3AF',
    pct: totalCosts > 0 ? +(c.value / totalCosts * 100).toFixed(1) : 0,
  }))

  // EBITDA excludes net VAT (operating measure); profit-after-VAT is the
  // bottom line. Both shown as KPI tiles.
  const ebitda              = totalIncome - (totalCosts - netVat)
  const profitAfterVat      = totalIncome - totalCosts
  const margin              = totalIncome > 0 ? ebitda / totalIncome : 0
  const profitAfterVatMargin = totalIncome > 0 ? profitAfterVat / totalIncome : 0

  return {
    incomeLines: incomeWithPct,
    totalIncome, baseTotalIncome, aggGrowth, mult,
    costs2026, totalCosts, netVat,
    rent, fixedLine, fixedFromMatrix, officeCostsTotal, wages,
    ebitda, profitAfterVat, margin, profitAfterVatMargin,
  }
}

// ─── compute2026Monthly · 12 months scaled by mult ────────────────────
// Preserves 2025 month-to-month seasonality and applies the scenario
// revenue multiplier. Wages scale by their own override factor so the
// locked Wage Calculator cascades. Fixed / office / VAT distributed
// evenly across the year for the chart visualisation.
function compute2026Monthly(forecastValues, wagesOverride) {
  const sc = compute2026Scenario(forecastValues, wagesOverride)
  const mult = sc.mult
  const targetWageAnnual = Number.isFinite(wagesOverride) && wagesOverride > 0 ? wagesOverride : PL_WAGE_BASE
  const wageScale = PL_WAGE_BASE > 0 ? targetWageAnnual / PL_WAGE_BASE : 1
  const fixedShare  = sc.fixedLine / 12
  const officeShare = sc.officeCostsTotal / 12
  const vatShare    = sc.netVat / 12

  return MONTHLY_INCOME.map((row, i) => {
    const mc = MONTHLY_COSTS[i]
    const income     = row.amount * mult
    const wages      = mc.wages * wageScale
    const drinks     = mc.drinks * mult
    const cleaning   = mc.cleaning * mult
    const djs        = mc.djs * mult
    const arcades    = mc.arcades * mult
    const food       = mc.food * mult
    const totalCost  = wages + drinks + cleaning + djs + arcades + food + fixedShare + officeShare + vatShare
    return {
      month: row.month,
      income,
      profit: income - totalCost,
      wages, fixed: fixedShare, office: officeShare, vat: vatShare,
      drinks, cleaning, djs, arcades, food,
    }
  })
}

// ─── KpiCard2026 ──────────────────────────────────────────────────────
function KpiCard2026({ label, value, sub, color }) {
  return (
    <div style={{ background:'var(--ink-2)', border:`1px solid ${color}33`, borderTop:`3px solid ${color}`, borderRadius:10, padding:16 }}>
      <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{label}</div>
      <div className="serif" style={{ fontSize:'clamp(1.3rem, 2.4vw, 1.7rem)', color, lineHeight:1, marginBottom:6, fontVariantNumeric:'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.4 }}>{sub}</div>}
    </div>
  )
}

// ─── ForecastLockBar ──────────────────────────────────────────────────
// Header strip — scenario preset buttons (Bear / Base / Bull / Custom)
// + Lock / Unlock + Reset for the 2026 forecast cycle. All gated on the
// founder flag from sessionStorage.
function ForecastLockBar() {
  const {
    forecastValues, forecastSnapshot, isForecastLocked, isFounder, canEditForecast,
    setGrowthAll, lockForecast, unlockForecast, resetForecast,
  } = useLockedUseOfFunds()
  const PRESETS = [
    { key:'bear',   label:'Conservative', sub:'+10% on 2025', pct:10, colour:'#F87171' },
    { key:'base',   label:'Base Case',    sub:'+15% on 2025', pct:15, colour:'#C9A84C' },
    { key:'bull',   label:'Optimistic',   sub:'+20% on 2025', pct:20, colour:'#2DD4BF' },
    { key:'custom', label:'Custom',       sub:'Drag levers',  pct:null, colour:'var(--gold)' },
  ]
  const allEqualPct = (() => {
    const vals = Object.values(forecastValues.growth || {})
    if (!vals.length) return null
    const first = vals[0]
    return vals.every(v => v === first) ? first : null
  })()
  const activeKey = allEqualPct === 10 ? 'bear' : allEqualPct === 15 ? 'base' : allEqualPct === 20 ? 'bull' : 'custom'
  const lockedAt = forecastSnapshot?.lockedAt
    ? new Date(forecastSnapshot.lockedAt).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' })
    : null

  return (
    <div style={{ background:'var(--ink-2)', border:`1px solid ${isForecastLocked ? 'rgba(16,185,129,0.4)' : 'rgba(201,168,76,0.2)'}`, borderRadius:10, padding:16, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, flex:1, minWidth:280 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:12, background: isForecastLocked ? 'rgba(16,185,129,0.12)' : 'rgba(201,168,76,0.08)', border:`1px solid ${isForecastLocked ? 'rgba(16,185,129,0.4)' : 'rgba(201,168,76,0.2)'}`, fontSize:10, color: isForecastLocked ? '#10B981' : 'var(--gold-dim)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
          <span style={{ fontSize:9 }}>{isForecastLocked ? '🔒' : '○'}</span>
          {isForecastLocked ? 'Locked · forecast frozen' : 'Live preview'}
        </span>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => { if (canEditForecast && p.pct !== null) setGrowthAll(p.pct) }}
              disabled={!canEditForecast || p.pct === null}
              style={{
                padding:'6px 14px', borderRadius:6, fontSize:11,
                border:`1px solid ${activeKey === p.key ? p.colour : 'rgba(201,168,76,0.25)'}`,
                background: activeKey === p.key ? `${p.colour}22` : 'transparent',
                color: activeKey === p.key ? p.colour : 'var(--cream-dim)',
                cursor: (canEditForecast && p.pct !== null) ? 'pointer' : 'not-allowed',
                opacity: (canEditForecast && p.pct !== null) ? 1 : 0.5,
                fontWeight: activeKey === p.key ? 600 : 400, transition:'all 0.15s', textAlign:'center',
              }}
            >
              {p.label}
              <span style={{ display:'block', fontSize:9, color:'var(--cream-dim)', marginTop:2 }}>{p.sub}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {isFounder && <button onClick={resetForecast} style={btnSmall(false)}>Reset</button>}
        {isFounder && (isForecastLocked
          ? <button onClick={unlockForecast} style={btnSmall(true, true)}>🔓 Unlock</button>
          : <button onClick={lockForecast} style={btnSmall(true, false)}>🔒 Lock</button>
        )}
      </div>
      {isForecastLocked && lockedAt && (
        <div style={{ width:'100%', fontSize:10, color:'#10B981', marginTop:4 }}>✓ Locked {lockedAt}</div>
      )}
    </div>
  )
}

function btnSmall(prominent = false, isUnlock = false) {
  return {
    padding:'6px 14px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
    letterSpacing:'0.06em', textTransform:'uppercase', transition:'all 0.15s',
    background: prominent && !isUnlock ? 'var(--gold)' : 'transparent',
    color:      prominent && !isUnlock ? 'var(--ink)' : 'var(--gold)',
    border:    `1px solid ${prominent ? 'var(--gold)' : 'rgba(201,168,76,0.3)'}`,
  }
}

// ─── SidebarTOC ───────────────────────────────────────────────────────
function SidebarTOC({ active, onChange }) {
  return (
    <div style={{ position:'sticky', top:16, background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:8 }}>
      <div style={{ fontSize:10, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.1em', padding:'6px 8px 10px' }}>2026 Performance · Index</div>
      {PERF_SECTIONS.map(s => {
        const isActive = active === s.id
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            style={{
              display:'flex', alignItems:'center', gap:10, width:'100%',
              padding:'10px 12px', marginBottom:4,
              background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(201,168,76,0.35)' : '1px solid transparent',
              borderRadius:6,
              color: isActive ? 'var(--gold)' : 'var(--cream)',
              fontSize:12, fontWeight: isActive ? 700 : 500,
              cursor:'pointer', textAlign:'left',
              letterSpacing:'0.04em', transition:'all 0.15s',
            }}
          >
            <span style={{ fontSize:14, opacity:0.85 }}>{s.icon}</span>
            <span style={{ flex:1 }}>{s.label}</span>
            {isActive && <span style={{ color:'var(--gold)', fontSize:10 }}>●</span>}
          </button>
        )
      })}
    </div>
  )
}

// ─── Section placeholders (Phase 3+ will fill these in) ───────────────
function SectionPlaceholder({ title, phase, children }) {
  return (
    <div style={{ background:'var(--ink-2)', border:'1px dashed rgba(201,168,76,0.35)', borderRadius:10, padding:24 }}>
      <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:12 }}>{title}</div>
      <div style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6 }}>
        {children || <>This section ships in Phase {phase}. Layout shell + KPIs + scenario controls + lock cycle are live now.</>}
      </div>
    </div>
  )
}

function WagesSection() {
  return <WageCalculator />
}

// ─── DonutChart · custom SVG ──────────────────────────────────────────
function DonutChart({ data, total, size = 220, label = '2026 Forecast' }) {
  const cx = size / 2, cy = size / 2
  const ro = size / 2 - 6
  const ri = ro * 0.58
  const fmtCentre = (n) => {
    const v = Math.abs(n)
    if (v >= 1000000) return '£' + (n / 1000000).toFixed(2) + 'M'
    if (v >= 1000)    return '£' + Math.round(n / 1000) + 'k'
    return '£' + Math.round(n).toLocaleString('en-GB')
  }
  const toRad = (a) => (a * Math.PI) / 180
  let cum = -90
  const slices = (data || []).filter(d => d.value > 0).map(d => {
    const sweep = total > 0 ? (d.value / total) * 360 : 0
    const start = cum
    const end = cum + sweep
    cum = end
    return { ...d, start, end }
  })
  const arcD = (start, end) => {
    if (end - start >= 359.999) {
      const mid = (start + end) / 2
      return arcD(start, mid) + arcD(mid, end)
    }
    const sx1 = cx + ro * Math.cos(toRad(start)), sy1 = cy + ro * Math.sin(toRad(start))
    const sx2 = cx + ro * Math.cos(toRad(end)),   sy2 = cy + ro * Math.sin(toRad(end))
    const sx3 = cx + ri * Math.cos(toRad(end)),   sy3 = cy + ri * Math.sin(toRad(end))
    const sx4 = cx + ri * Math.cos(toRad(start)), sy4 = cy + ri * Math.sin(toRad(start))
    const large = (end - start) > 180 ? 1 : 0
    return `M ${sx1} ${sy1} A ${ro} ${ro} 0 ${large} 1 ${sx2} ${sy2} L ${sx3} ${sy3} A ${ri} ${ri} 0 ${large} 0 ${sx4} ${sy4} Z`
  }
  return (
    <svg width={size} height={size} role="img" aria-label="forecast donut chart" style={{ display:'block' }}>
      {slices.map((s, i) => <path key={i} d={arcD(s.start, s.end)} fill={s.color} stroke="var(--ink)" strokeWidth={1} />)}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--cream)" style={{ fontFamily:"'DM Serif Display',serif", fontSize:20 }}>{fmtCentre(total)}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="var(--cream-dim)" style={{ fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase' }}>{label}</text>
    </svg>
  )
}

// ─── Stacked2026 · monthly stacked / single-bar chart ─────────────────
function Stacked2026({ monthly, kind = 'income' }) {
  const tip = {
    contentStyle: { background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8, color:'var(--cream)' },
    labelStyle:   { color:'var(--cream)', fontWeight:600, marginBottom:4 },
    itemStyle:    { color:'var(--cream)' },
  }
  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={monthly} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
          <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={10} tickLine={false} />
          <YAxis stroke="var(--cream-dim)" fontSize={10} tickFormatter={(v) => '£' + Math.round(v/1000) + 'k'} width={48} />
          <Tooltip cursor={{ fill: 'rgba(201,168,76,0.06)' }} {...tip} formatter={(v, n) => [fmtMoney(v), n]} />
          {kind === 'income' ? (
            <Bar dataKey="income" name="Revenue" fill="#22D3EE" radius={[3,3,0,0]} maxBarSize={36} />
          ) : (
            // Stacked cost bars · maxBarSize must match across every segment
            // (otherwise the segment with the smaller cap renders narrower
            // and you get a visible "leg" sticking out below the stack).
            <>
              <Bar dataKey="wages"    name="Wages"        stackId="a" fill={COST_2026_COLORS[0]} maxBarSize={36} />
              <Bar dataKey="fixed"    name="Fixed Costs"  stackId="a" fill={COST_2026_COLORS[1]} maxBarSize={36} />
              <Bar dataKey="office"   name="Office Costs" stackId="a" fill={COST_2026_COLORS[2]} maxBarSize={36} />
              <Bar dataKey="drinks"   name="Drinks & Gas" stackId="a" fill={COST_2026_COLORS[3]} maxBarSize={36} />
              <Bar dataKey="vat"      name="VAT (Net)"    stackId="a" fill={COST_2026_COLORS[4]} maxBarSize={36} />
              <Bar dataKey="cleaning" name="Cleaning"     stackId="a" fill={COST_2026_COLORS[5]} maxBarSize={36} />
              <Bar dataKey="arcades"  name="Arcades"      stackId="a" fill={COST_2026_COLORS[6]} maxBarSize={36} />
              <Bar dataKey="djs"      name="DJs"          stackId="a" fill={COST_2026_COLORS[7]} maxBarSize={36} />
              <Bar dataKey="food"     name="Food"         stackId="a" fill={COST_2026_COLORS[8]} maxBarSize={36} radius={[3,3,0,0]} />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── ScenarioLeversCard · 4 income-lever sliders ──────────────────────
function ScenarioLeversCard() {
  const { forecastEffective, canEditForecast, setGrowth } = useLockedUseOfFunds()
  const growth = forecastEffective.growth || {}
  return (
    <div className="card" style={{ padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <span style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Custom scenario · 4 levers</span>
        <span style={{ fontSize:11, color:'var(--cream-dim)' }}>Drag each line · matches a preset when all four are equal</span>
      </div>
      {HACKNEY_SCENARIO_LEVERS.map(l => {
        const pct = growth[l.key] ?? 0
        const projected = Math.round(l.base * (1 + pct / 100))
        const delta = projected - l.base
        return (
          <div key={l.key} style={{ display:'grid', gridTemplateColumns:'2fr 3fr 1.4fr', gap:12, alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:l.color, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:13, color:'var(--cream)' }}>{l.labelKey}</div>
                <div style={{ fontSize:10, color:'var(--cream-dim)' }}>2025 base · {fmtMoney(l.base)}</div>
              </div>
            </div>
            <div>
              <input type="range" min={-30} max={50} step={1} value={pct}
                onChange={(e) => setGrowth(l.key, +e.target.value)}
                disabled={!canEditForecast}
                style={{ width:'100%', accentColor:l.color, cursor: canEditForecast ? 'pointer' : 'not-allowed', opacity: canEditForecast ? 1 : 0.55 }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--cream-dim)', marginTop:2 }}>
                <span>−30%</span><span>0%</span><span>+50%</span>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div className="serif" style={{ fontSize:16, color:l.color, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
                {pct >= 0 ? '+' : ''}{pct}%
              </div>
              <div style={{ fontSize:11, color:'var(--cream)', fontVariantNumeric:'tabular-nums', marginTop:4 }}>{fmtMoney(projected)}</div>
              <div style={{ fontSize:10, color: delta >= 0 ? '#10B981' : '#F87171', fontVariantNumeric:'tabular-nums' }}>
                {delta >= 0 ? '+' : ''}{fmtMoney(Math.abs(delta) * (delta >= 0 ? 1 : -1))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── TicketsSection · non-golf DMN SKU breakdown ─────────────────────
// Splits HACKNEY_DMN_SKUS_ONLINE_2025 into two buckets:
//   • No-Dice-retained: pool tables, pool tournaments, brunches, drink
//     add-ons, arcade-token add-ons, seasonal events, AND Game & Drink
//     (the bundled drink revenue and the round-of-golf portion both
//     stay 100% with No Dice per the Plonk Operations agreement).
//   • Operator-bound: pure golf rounds and Golf + Tokens bundles. The
//     SKU itself moves to the operator P&L; the bundled-token value
//     still lands with No Dice (separately accounted on the Plonk
//     Golf Operations page).
//
// Projection driver: the Office growth lever (these SKUs are
// effectively bookings revenue). Per-SKU price/volume overrides
// could be added later via forecast.pricing — for Phase 8 we ship
// the read-side first; founder can iterate the editor controls in
// a follow-up.
function TicketsSection() {
  const { forecastEffective } = useLockedUseOfFunds()
  const officeGrowth = forecastEffective.growth?.office ?? 15

  const allSkus = (typeof HACKNEY_DMN_SKUS_ONLINE_2025 !== 'undefined' ? HACKNEY_DMN_SKUS_ONLINE_2025 : [])
  // Game & Drink stays with No Dice despite carrying a round — drink
  // component is bar revenue, full SKU is venue-retained.
  const isOperatorGolf = (s) => s.rounds > 0 && !/Game & Drink/i.test(s.sku)
  const nonGolf = allSkus.filter(s => !isOperatorGolf(s))
  const golf    = allSkus.filter(isOperatorGolf)

  const total2025 = nonGolf.reduce((s, x) => s + x.revenue, 0)
  const total2026 = total2025 * (1 + officeGrowth / 100)
  const totalGolf2025 = golf.reduce((s, x) => s + x.revenue, 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Operator-handover banner */}
      <div className="card" style={{ padding:14, background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.3)', borderLeft:'4px solid #F87171' }}>
        <div style={{ fontSize:11, color:'#F87171', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>Golf SKUs · Moved to operator</div>
        <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>
          <strong style={{ color:'var(--cream)' }}>{golf.length}</strong> golf SKUs — Adult / Under 18s rounds and Golf + Tokens bundles — totalled <strong style={{ color:'var(--cream)' }}>{fmtMoney(totalGolf2025)}</strong> in 2025 online sales. Under the new structure these belong to the golf operator entity. <strong style={{ color:'var(--cream)' }}>No Dice keeps 100% of token revenue inside any sold SKU</strong> — the SKU itself moves but the bundled-token value continues to land with No Dice (per the Plonk Golf Operations page). <strong style={{ color:'var(--cream)' }}>Game &amp; Drink</strong> bundles stay 100% with No Dice — the venue-drink component dwarfs the golf-round portion, so the whole SKU is retained.
        </div>
      </div>

      {/* Non-golf SKU table — these stay with No Dice */}
      <div className="card" style={{ padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
          <div style={{ fontSize:11, color:'#22D3EE', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Non-Golf Tickets · No Dice retains</div>
          <div style={{ fontSize:11, color:'var(--cream-dim)' }}>{nonGolf.length} SKUs · projected at office lever +{officeGrowth}%</div>
        </div>
        <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:14 }}>
          Pool reservations, pool tournaments, seasonal events (Pumpkin Carving, Valentine's deals, etc.), drink add-ons and arcade tokens. All retained 100% under the new operator structure. 2026 column scales 2025 sold quantities by the Office growth lever — drag that slider in the Income section to project.
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2.4fr 0.9fr 0.6fr 0.7fr 1fr 1fr', padding:'10px 0', borderBottom:'1px solid rgba(201,168,76,0.2)', fontSize:10, color:'var(--gold-dim)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
          <span>SKU</span>
          <span style={{ textAlign:'right' }}>Tokens</span>
          <span style={{ textAlign:'right' }}>£/unit</span>
          <span style={{ textAlign:'right' }}>2025 sold</span>
          <span style={{ textAlign:'right' }}>2025 £</span>
          <span style={{ textAlign:'right' }}>2026 £ (proj)</span>
        </div>

        {nonGolf.sort((a, b) => b.revenue - a.revenue).map(sku => {
          const proj2026 = sku.revenue * (1 + officeGrowth / 100)
          return (
            <div key={sku.sku} style={{ display:'grid', gridTemplateColumns:'2.4fr 0.9fr 0.6fr 0.7fr 1fr 1fr', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13, fontVariantNumeric:'tabular-nums', alignItems:'baseline' }}>
              <span style={{ color:'var(--cream)' }}>{sku.sku}</span>
              <span style={{ textAlign:'right', color: sku.tokens > 0 ? '#EAB308' : 'var(--cream-dim)' }}>{sku.tokens > 0 ? sku.tokens : '—'}</span>
              <span style={{ textAlign:'right', color:'var(--cream-dim)' }}>£{sku.price.toFixed(2)}</span>
              <span style={{ textAlign:'right', color:'var(--cream)' }}>{sku.sold.toLocaleString('en-GB')}</span>
              <span style={{ textAlign:'right', color:'var(--cream-dim)' }}>{fmtMoney(sku.revenue)}</span>
              <span style={{ textAlign:'right', color:'#22D3EE' }}>{fmtMoney(proj2026)}</span>
            </div>
          )
        })}

        <div style={{ display:'grid', gridTemplateColumns:'2.4fr 0.9fr 0.6fr 0.7fr 1fr 1fr', padding:'12px 0 4px', fontSize:14, fontVariantNumeric:'tabular-nums', fontWeight:600 }}>
          <span style={{ color:'var(--cream)' }}>Non-golf total</span>
          <span></span><span></span><span></span>
          <span className="serif" style={{ textAlign:'right', color:'var(--cream)', fontSize:16 }}>{fmtMoney(total2025)}</span>
          <span className="serif" style={{ textAlign:'right', color:'#22D3EE', fontSize:16 }}>{fmtMoney(total2026)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── OfficeCostsSection · 8-row annual £ editor ──────────────────────
// Apps + AI + Accounting + Director comp. Sliders use per-line step
// sized to the line's magnitude (Xero £25 step, Director £500 step) so
// every slider feels precise without being laggy.
function OfficeCostsSection() {
  const { forecastEffective, canEditForecast, setForecastValue } = useLockedUseOfFunds()
  const overrides = forecastEffective.officeCosts || {}
  const annualTotal = sumHackneyOfficeCosts(overrides)
  const monthlyTotal = annualTotal / 12

  const setLine = (key, val) => {
    setForecastValue('officeCosts', { ...overrides, [key]: val })
  }

  return (
    <div className="card" style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <div style={{ fontSize:11, color:'#C084FC', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Office Costs · Editor</div>
        <div style={{ fontSize:13, color:'#C084FC', fontWeight:600 }}>{fmtMoney(annualTotal)}/yr</div>
      </div>
      <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:14 }}>
        Subscriptions, AI, accounting, and director compensation. Defaults reflect current spend ranges. Annual £ sliders below; total flows into the Op Costs donut as a single Office Costs line.
      </div>

      {HACKNEY_OFFICE_COST_ITEMS.map(item => {
        const def = HACKNEY_OFFICE_COSTS_2026_DEFAULTS[item.id]
        const value = overrides[item.id] ?? def
        const max = Math.max(def * 3, 500)
        const step = Math.max(10, Math.round(def / 40 / 5) * 5) || 25
        const monthly = value / 12
        return (
          <div key={item.id} style={{ display:'grid', gridTemplateColumns:'2fr 3fr 1.4fr', gap:12, alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <div style={{ fontSize:13, color:'var(--cream)' }}>{item.label}</div>
              <div style={{ fontSize:10, color:'var(--cream-dim)' }}>{item.note} · default {fmtMoney(def)}</div>
            </div>
            <div>
              <input type="range" min={0} max={max} step={step} value={value}
                onChange={(e) => setLine(item.id, +e.target.value)}
                disabled={!canEditForecast}
                style={{ width:'100%', accentColor:'#C084FC', cursor: canEditForecast ? 'pointer' : 'not-allowed', opacity: canEditForecast ? 1 : 0.55 }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--cream-dim)', marginTop:2 }}>
                <span>£0</span>
                <span>{fmtMoney(def)}</span>
                <span>{fmtMoney(max)}</span>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div className="serif" style={{ fontSize:16, color: value === def ? 'var(--cream)' : (value > def ? '#F87171' : '#10B981'), fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
                {fmtMoney(value)}
              </div>
              <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:4 }}>£{Math.round(monthly).toLocaleString('en-GB')}/mo</div>
            </div>
          </div>
        )
      })}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'12px 0 4px', borderTop:'2px solid rgba(192,132,252,0.3)', marginTop:10, fontWeight:600 }}>
        <div>
          <div style={{ fontSize:12, color:'var(--cream)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Office Costs · 2026</div>
          <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:2 }}>£{Math.round(monthlyTotal).toLocaleString('en-GB')} per month</div>
        </div>
        <span className="serif" style={{ fontSize:18, color:'#C084FC' }}>{fmtMoney(annualTotal)}</span>
      </div>
    </div>
  )
}

// ─── FixedCostsSection · 9-row annual £ editor ───────────────────────
// One slider per fixed-cost line (rates + 8 utilities). Defaults are
// 2025 actual × 1.10 inflation. Range 0 → 3× default in £100 steps.
// Annual total at the bottom + read-only Y1 lease rent block (rent is
// driven by FORECAST_RULES.rentY1, not editable here per founder
// direction). Disabled when the forecast is locked.
function FixedCostsSection() {
  const { forecastEffective, canEditForecast, setForecastValue } = useLockedUseOfFunds()
  const overrides = forecastEffective.fixedCosts || {}
  const editorTotal = sumHackneyFixedCostsAnnual(overrides)
  const rent = FORECAST_RULES.rentY1
  const grandTotal = editorTotal + rent

  const setLine = (key, val) => {
    setForecastValue('fixedCosts', { ...overrides, [key]: val })
  }

  return (
    <div className="card" style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <div style={{ fontSize:11, color:'#FB923C', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Fixed Costs · Editor</div>
        <div style={{ fontSize:13, color:'#FB923C', fontWeight:600 }}>{fmtMoney(grandTotal)}/yr</div>
      </div>
      <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:14 }}>
        Drag each annual figure. Defaults are 2025 actuals × 1.10 inflation. Y1 lease rent ({fmtMoney(rent)}) is fixed by the lease schedule and shown as a separate read-only line — not editable here.
      </div>

      {HACKNEY_FIXED_COST_ITEMS.map(item => {
        const def = HACKNEY_FIXED_COSTS_2026_DEFAULTS[item.id]
        const value = overrides[item.id] ?? def
        const max = Math.max(def * 3, 1000)
        const monthly = value / 12
        return (
          <div key={item.id} style={{ display:'grid', gridTemplateColumns:'2fr 3fr 1.4fr', gap:12, alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <div style={{ fontSize:13, color:'var(--cream)' }}>{item.label}</div>
              <div style={{ fontSize:10, color:'var(--cream-dim)' }}>{item.note} · default {fmtMoney(def)}</div>
            </div>
            <div>
              <input type="range" min={0} max={max} step={100} value={value}
                onChange={(e) => setLine(item.id, +e.target.value)}
                disabled={!canEditForecast}
                style={{ width:'100%', accentColor:'#FB923C', cursor: canEditForecast ? 'pointer' : 'not-allowed', opacity: canEditForecast ? 1 : 0.55 }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--cream-dim)', marginTop:2 }}>
                <span>£0</span>
                <span>{fmtMoney(def)}</span>
                <span>{fmtMoney(max)}</span>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div className="serif" style={{ fontSize:16, color: value === def ? 'var(--cream)' : (value > def ? '#F87171' : '#10B981'), fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
                {fmtMoney(value)}
              </div>
              <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:4 }}>£{Math.round(monthly).toLocaleString('en-GB')}/mo</div>
            </div>
          </div>
        )
      })}

      {/* Read-only Y1 lease rent line */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 3fr 1.4fr', gap:12, alignItems:'center', padding:'12px 0 4px', background:'rgba(248,113,113,0.04)', borderRadius:6, marginTop:8 }}>
        <div>
          <div style={{ fontSize:13, color:'var(--cream)', fontWeight:500 }}>Rent (Y1, lease schedule)</div>
          <div style={{ fontSize:10, color:'var(--cream-dim)' }}>£65k+VAT pa · 4-mo rent-free Y1 · 8 paying months × £65k/12</div>
        </div>
        <div style={{ fontSize:11, color:'var(--cream-dim)', fontStyle:'italic' }}>Not editable · lease-driven</div>
        <div style={{ textAlign:'right' }}>
          <div className="serif" style={{ fontSize:16, color:'#F87171', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{fmtMoney(rent)}</div>
          <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:4 }}>£{Math.round(rent/12).toLocaleString('en-GB')}/mo avg</div>
        </div>
      </div>

      {/* Grand total */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'12px 0 4px', borderTop:'2px solid rgba(248,113,113,0.3)', marginTop:10, fontWeight:600 }}>
        <span style={{ fontSize:12, color:'var(--cream)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Fixed Costs · 2026</span>
        <span className="serif" style={{ fontSize:18, color:'#FB923C' }}>{fmtMoney(grandTotal)}</span>
      </div>
    </div>
  )
}

// ─── OpCostsSection · 9-line cost donut + monthly stacked bar ────────
function OpCostsSection({ sc, monthly }) {
  return (
    <div className="card" style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <div style={{ fontSize:11, color:'#A78BFA', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Operating Costs · 2026</div>
        <div style={{ fontSize:13, color:'#A78BFA', fontWeight:600 }}>{fmtMoney(sc.totalCosts)}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'center', marginBottom:8 }}>
        <DonutChart data={sc.costs2026} total={sc.totalCosts} size={210} label="Annual costs" />
        <div>
          {sc.costs2026.map(c => (
            <div key={c.key} style={{ padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
                <span style={{ width:10, height:10, borderRadius:2, background:c.color, flexShrink:0 }} />
                <span style={{ flex:1, color:'var(--cream)' }}>{c.label}</span>
                <span style={{ color:'var(--cream)', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(c.value)}</span>
                <span style={{ color:'var(--cream-dim)', fontSize:11, width:50, textAlign:'right' }}>{c.pct.toFixed(1)}%</span>
              </div>
              {c.note && <div style={{ fontSize:10, color:'var(--cream-dim)', paddingLeft:20, marginTop:2 }}>{c.note}</div>}
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 4px', fontSize:13, fontWeight:600 }}>
            <span style={{ color:'var(--cream)', textTransform:'uppercase', letterSpacing:'0.06em', fontSize:11 }}>Total costs</span>
            <span className="serif" style={{ color:'#A78BFA', fontSize:16 }}>{fmtMoney(sc.totalCosts)}</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop:16 }}>
        <div style={{ fontSize:10, color:'var(--cream-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Monthly costs · 2026 · stacked</div>
        <Stacked2026 monthly={monthly} kind="costs" />
      </div>
    </div>
  )
}

// ─── BarPriceUpliftCalculator ────────────────────────────────────────
// The only price-side growth driver. Sized here against 2025 verified
// bar takings (£484,684 from Weekly Merge); the resulting % uplift
// surfaces read-only on the Growth Drivers slide and contributes to
// the Custom scenario when locked.
function BarPriceUpliftCalculator() {
  const ctx = useLockedUseOfFunds()
  const pct = ctx.forecastEffective.barPriceUplift || 0
  // 2025 bar takings — Weekly Merge income source aggregate, bar-only line.
  const BAR_2025 = 484684
  const annualUplift = BAR_2025 * (pct / 100)

  // Bar-price lock — independent of the broader forecast lock so the
  // founder can pin just this slider while everything else stays
  // editable. Slider is editable only when (a) the forecast lock allows
  // it AND (b) the bar-price lock isn't pinned.
  const isBarPriceLocked = ctx.isBarPriceLocked
  const isFounder        = ctx.isFounder
  const canEdit          = ctx.canEditForecast && !isBarPriceLocked
  const lockedAtLabel    = ctx.barPriceLock?.lockedAt
    ? new Date(ctx.barPriceLock.lockedAt).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' })
    : null

  return (
    <div className="card" style={{
      padding: 22,
      border: isBarPriceLocked ? '1px solid rgba(16,185,129,0.4)' : undefined,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 4, gap:12, flexWrap:'wrap' }}>
        <span style={{ fontSize:11, color:'#FBBF24', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>
          Bar Price Uplift Calculator
        </span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {/* Founder-set lock pill — visible to everyone when active. */}
          {isBarPriceLocked && (
            <span style={{
              fontSize:9, padding:'3px 9px', borderRadius:10, fontWeight:700,
              letterSpacing:'0.08em', textTransform:'uppercase',
              background:'rgba(16,185,129,0.12)', color:'#10B981',
              border:'1px solid rgba(16,185,129,0.4)', whiteSpace:'nowrap',
            }}>
              🔒 Locked{lockedAtLabel ? ` · ${lockedAtLabel}` : ''}
            </span>
          )}
          {/* Founder-only Lock / Unlock toggle */}
          {isFounder && (
            <button
              onClick={() => isBarPriceLocked ? ctx.unlockBarPrice() : ctx.lockBarPrice(pct)}
              disabled={!isBarPriceLocked && !ctx.canEditForecast}
              style={{
                padding:'5px 11px', fontSize:10, fontWeight:700,
                letterSpacing:'0.08em', textTransform:'uppercase',
                borderRadius:6, cursor: (!isBarPriceLocked && !ctx.canEditForecast) ? 'not-allowed' : 'pointer',
                background: isBarPriceLocked ? 'transparent' : 'rgba(251,191,36,0.15)',
                color: isBarPriceLocked ? '#10B981' : '#FBBF24',
                border: `1px solid ${isBarPriceLocked ? 'rgba(16,185,129,0.5)' : 'rgba(251,191,36,0.5)'}`,
                whiteSpace:'nowrap', transition:'all 0.15s',
                opacity: (!isBarPriceLocked && !ctx.canEditForecast) ? 0.45 : 1,
              }}
              title={
                isBarPriceLocked
                  ? 'Unlock the Bar Price Uplift'
                  : (ctx.canEditForecast
                      ? 'Lock this value so every visitor sees it'
                      : 'Unlock the broader forecast first')
              }
            >
              {isBarPriceLocked ? '🔓 Unlock' : '🔒 Lock'}
            </button>
          )}
          <span style={{ fontSize:10, color:'var(--cream-dim)', letterSpacing:'0.06em' }}>
            Feeds the Growth Drivers slide
          </span>
        </span>
      </div>
      <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:14 }}>
        How much would a price uplift on bar SKUs lift annual revenue, applied to the 2025 bar baseline of <strong style={{ color:'var(--cream)' }}>{fmtMoney(BAR_2025)}</strong>? This is the only price-side lever in the growth model — every other driver lifts volume.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:18 }}>
        <KpiCard2026 label="Price Uplift"          value={`+${pct.toFixed(1)}%`}              sub={isBarPriceLocked ? '🔒 Locked' : 'Drag the slider below'} color="#FBBF24" />
        <KpiCard2026 label="2025 Bar Baseline"     value={fmtMoney(BAR_2025)}                  sub="Verified — Weekly Merge"  color="#9CA3AF" />
        <KpiCard2026 label="Annual £ Uplift (Y1)"  value={fmtMoney(Math.round(annualUplift))}  sub="At unchanged volume"      color="#10B981" />
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <span style={{ fontSize:10, color:'var(--cream-dim)' }}>0%</span>
        <input
          type="range" min={0} max={15} step={0.5}
          value={pct} disabled={!canEdit}
          onChange={(e) => ctx.setBarPriceUplift(+e.target.value)}
          style={{
            flex:1, accentColor:'#FBBF24',
            cursor: canEdit ? 'pointer' : 'not-allowed',
            opacity: canEdit ? 1 : 0.5,
          }}
        />
        <span style={{ fontSize:10, color:'var(--cream-dim)' }}>+15%</span>
      </div>
      <div style={{ marginTop:10, fontSize:11, color:'var(--cream-dim)', lineHeight:1.55 }}>
        Typical hospitality price reviews land 3–6% per cycle without measurable elasticity impact. Above 8% starts to test customer tolerance — model it but stress-test against repeat-rate metrics.
      </div>
    </div>
  )
}

// ─── IncomeSection ────────────────────────────────────────────────────
function IncomeSection({ sc, monthly }) {
  return (
    <>
      <ScenarioLeversCard />
      <BarPriceUpliftCalculator />
      <div className="card" style={{ padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
          <div style={{ fontSize:11, color:'#22D3EE', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Income · 2026</div>
          <div style={{ fontSize:13, color:'#22D3EE', fontWeight:600 }}>{fmtMoney(sc.totalIncome)}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'center', marginBottom:8 }}>
          <DonutChart data={sc.incomeLines} total={sc.totalIncome} size={210} label="Annual revenue" />
          <div>
            {sc.incomeLines.map(l => (
              <div key={l.key} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
                <span style={{ width:10, height:10, borderRadius:2, background:l.color, flexShrink:0 }} />
                <span style={{ flex:1, color:'var(--cream)' }}>{l.label}</span>
                <span style={{ color:'var(--cream)', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(l.value)}</span>
                <span style={{ color:'var(--cream-dim)', fontSize:11, width:50, textAlign:'right' }}>{l.pct.toFixed(1)}%</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 4px', fontSize:13, fontWeight:600 }}>
              <span style={{ color:'var(--cream)', textTransform:'uppercase', letterSpacing:'0.06em', fontSize:11 }}>Total revenue</span>
              <span className="serif" style={{ color:'#22D3EE', fontSize:16 }}>{fmtMoney(sc.totalIncome)}</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:10, color:'var(--cream-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Monthly revenue · 2026</div>
          <Stacked2026 monthly={monthly} kind="income" />
        </div>
      </div>
    </>
  )
}

// ─── Tab2026 ──────────────────────────────────────────────────────────
function Tab2026() {
  const ctx = useLockedUseOfFunds()
  const [activeSection, setActiveSection] = useState('income')
  const wagesOverride = ctx.isWageLocked ? ctx.wageEffective.loadedAnnual : null
  const sc = compute2026Scenario(ctx.forecastEffective, wagesOverride)
  const monthly = compute2026Monthly(ctx.forecastEffective, wagesOverride)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Eyebrow + slide title */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
        <span style={{ width:32, height:32, display:'inline-flex', alignItems:'center', justifyContent:'center', background:'rgba(34,211,238,0.12)', border:'1px solid rgba(34,211,238,0.3)', borderRadius:8, fontSize:16 }}>📊</span>
        <div>
          <div style={{ fontSize:11, color:'#22D3EE', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>Forecast Calculator</div>
          <div style={{ fontSize:12, color:'#9CA3AF' }}>Drag the levers (or pick a preset) — every figure across the deck cascades live until the founder locks the snapshot.</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
        <KpiCard2026 label="Adjusted Revenue"    value={fmtMoney(sc.totalIncome)}    sub={`Aggregate growth ${sc.aggGrowth >= 0 ? '+' : ''}${sc.aggGrowth.toFixed(1)}%`} color="#22D3EE" />
        <KpiCard2026 label="Adjusted EBITDA"     value={fmtMoney(sc.ebitda)}         sub={`${(sc.margin*100).toFixed(1)}% margin`} color={sc.ebitda > 0 ? '#A78BFA' : '#EF4444'} />
        <KpiCard2026 label="Profit After VAT"    value={fmtMoney(sc.profitAfterVat)} sub={`${(sc.profitAfterVatMargin*100).toFixed(1)}% margin · Net VAT ${fmtMoney(sc.netVat)}`} color={sc.profitAfterVat > 0 ? '#2DD4BF' : '#EF4444'} />
      </div>

      {/* Scenario presets + lock */}
      <ForecastLockBar />

      {/* Sidebar + content */}
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:16, alignItems:'flex-start' }}>
        <SidebarTOC active={activeSection} onChange={setActiveSection} />
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {activeSection === 'income'  && <IncomeSection sc={sc} monthly={monthly} />}
          {activeSection === 'opcosts' && <OpCostsSection sc={sc} monthly={monthly} />}
          {activeSection === 'fixed'   && <FixedCostsSection />}
          {activeSection === 'wages'   && <WagesSection />}
          {activeSection === 'office'  && <OfficeCostsSection />}
          {activeSection === 'tickets' && <TicketsSection />}
        </div>
      </div>
    </div>
  )
}


// ─── Cashflow Forecast — May 2026 → Apr 2027 ──────────────────────────
// Mirrors the Borough Cashflow Forecast tab layout exactly: header card
// with scenario tabs + workbook link, 4-card KPI strip, SVG line chart
// with threshold markers, monthly breakdown table.
//
// Hackney data feeds:
//   • compute2026Scenario(...) — gives totalIncome + totalCosts + rent
//     under each scenario (Conservative +10% on 2025 == growth=10,
//     Base +15% == growth=15, Optimistic +20% == growth=20, Custom =
//     locked forecast snapshot).
//   • HACKNEY_CASH.safetyFloor / .safetyTarget — working-capital
//     thresholds (£30k floor, £45k fully-built target). These replace
//     Borough's "rent reserve" / "investor capital" thresholds since
//     Hackney already pays rent monthly (no quarterly prepay) and the
//     working-capital build is the relevant gate.
//
// Cashflow logic per month:
//   - Inflow:    revenue × seasonal weight / 12
//   - Operating: (totalCosts − rent) × seasonal weight / 12
//   - Rent:      paid monthly during the 8 paying months (Sep 26 →
//                Apr 27); £0 during the 4-month rent-free period
//                (May–Aug 26 per the lease).
//   - Net:       inflow − operating − rent
//   - Cumulative: running total starting at £0 (Day-1 raise excluded —
//                 that's modelled separately on Use of Funds).

const HACKNEY_CASHFLOW_MONTHS   = ['May 26','Jun 26','Jul 26','Aug 26','Sep 26','Oct 26','Nov 26','Dec 26','Jan 27','Feb 27','Mar 27','Apr 27']
const HACKNEY_CASHFLOW_SEASONAL = [0.90, 0.85, 1.00, 1.05, 1.05, 1.10, 1.20, 1.40, 0.85, 0.95, 1.00, 0.95]
// Lease: 4 months rent-free (May 26 – Aug 26 = indexes 0..3); rent
// payable monthly for the remaining 8 (Sep 26 – Apr 27 = indexes 4..11).
const HACKNEY_RENT_FREE_MONTHS  = new Set([0, 1, 2, 3])

function buildHackneyCashflow({ revenue, totalCosts, rentAnnual }) {
  const nonRentCosts = Math.max(0, totalCosts - rentAnnual)
  const payingMonths = 12 - HACKNEY_RENT_FREE_MONTHS.size
  const monthlyRent  = payingMonths > 0 ? rentAnnual / payingMonths : 0
  const out = []
  let cumulative = 0
  for (let i = 0; i < 12; i++) {
    const w       = HACKNEY_CASHFLOW_SEASONAL[i]
    const inflow  = Math.round(revenue * w / 12)
    const opex    = Math.round(nonRentCosts * w / 12)
    const rent    = HACKNEY_RENT_FREE_MONTHS.has(i) ? 0 : Math.round(monthlyRent)
    const outflow = opex + rent
    const net     = inflow - outflow
    cumulative   += net
    out.push({ month: HACKNEY_CASHFLOW_MONTHS[i], inflow, opex, rent, outflow, net, cumulative })
  }
  return out
}

const cfTh = (align) => ({ padding:'10px 14px', fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, textAlign:align, whiteSpace:'nowrap' })
const cfTd = (align, color, weight=400) => ({ padding:'10px 14px', fontSize:12.5, color, fontWeight:weight, textAlign:align, whiteSpace:'nowrap' })

function TabCashflow() {
  const ctx = useLockedUseOfFunds()
  const { forecastEffective, isForecastLocked, forecastSnapshot, isWageLocked, wageEffective } = ctx
  const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
  const fmtKShort = (n) => '£' + Math.round(n / 1000) + 'k'

  const FLOOR  = HACKNEY_CASH.safetyFloor
  const TARGET = HACKNEY_CASH.safetyTarget

  // Scenario set — Conservative = +10% growth, Base = +15%,
  // Optimistic = +20%. Custom uses the locked forecast snapshot if
  // present (otherwise disabled).
  const SCENARIOS = {
    conservative: { label: 'Conservative +10%', growth: 10, color: '#94A3B8' },
    base:         { label: 'Base +15%',         growth: 15, color: '#C9A84C' },
    optimistic:   { label: 'Optimistic +20%',   growth: 20, color: '#2DD4BF' },
    custom:       { label: 'Custom (Locked)',   growth: null, color: 'var(--gold)', disabled: !isForecastLocked },
  }
  const [active, setActive] = useState('base')
  const sc = SCENARIOS[active]?.disabled ? SCENARIOS.base : SCENARIOS[active]
  const activeKey = SCENARIOS[active]?.disabled ? 'base' : active

  // Compute revenue + costs for the selected scenario via the existing
  // canonical compute2026Scenario helper, then bucket it into months
  // with the seasonal weights.
  const wagesOverride = isWageLocked ? wageEffective.loadedAnnual : null
  const scenarioForecast = (() => {
    if (activeKey === 'custom' && forecastSnapshot) {
      return compute2026Scenario(forecastSnapshot, wagesOverride)
    }
    const uniformGrowth = HACKNEY_SCENARIO_LEVERS.reduce((acc, l) => ({ ...acc, [l.key]: sc.growth }), {})
    return compute2026Scenario({ growth: uniformGrowth, fixedCosts: {}, officeCosts: {} }, wagesOverride)
  })()

  const cf = buildHackneyCashflow({
    revenue:    scenarioForecast.totalIncome,
    totalCosts: scenarioForecast.totalCosts,
    rentAnnual: scenarioForecast.rent,
  })

  const closingCash   = cf[cf.length - 1].cumulative
  const minCash       = Math.min(0, ...cf.map(m => m.cumulative))
  const maxCash       = Math.max(closingCash, FLOOR, TARGET, ...cf.map(m => m.cumulative))
  const peakMonth     = cf.reduce((best, m) => m.cumulative > best.cumulative ? m : best, cf[0])
  const floorCrossed  = cf.find(m => m.cumulative >= FLOOR)
  const targetCrossed = cf.find(m => m.cumulative >= TARGET)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      {/* Header — eyebrow + note + scenario tabs + workbook link */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:18 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>Cashflow Forecast · May 2026 → Apr 2027</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>Monthly inflows, outflows and cumulative cash position. Rent-free May–Aug 2026 per the new lease; £65k pa rent payable monthly Sep 26 → Apr 27. For the full detailed model see the workbook.</div>
          </div>
          {WORKBOOK_URL && (
            <a href={WORKBOOK_URL} target="_blank" rel="noopener noreferrer" style={{
              display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:6, fontSize:11, fontWeight:700,
              letterSpacing:'0.06em', textTransform:'uppercase', textDecoration:'none', whiteSpace:'nowrap',
              background:'rgba(201,168,76,0.10)', border:'1px solid rgba(201,168,76,0.35)', color:'var(--gold)',
            }}>
              <span>↗</span><span>Open in Workbook</span>
            </a>
          )}
        </div>

        {/* Scenario tabs */}
        <div style={{ display:'flex', gap:6 }}>
          {Object.entries(SCENARIOS).map(([key, s]) => (
            <button
              key={key}
              onClick={() => { if (!s.disabled) setActive(key) }}
              disabled={s.disabled}
              title={s.disabled ? 'Lock the 2026 Performance forecast to populate the Custom scenario.' : undefined}
              style={{
                padding:'7px 16px', fontSize:11, borderRadius:6,
                cursor: s.disabled ? 'not-allowed' : 'pointer',
                background: activeKey === key ? `${s.color}22` : 'transparent',
                border: `1px solid ${activeKey === key ? s.color : '#2A2F3A'}`,
                color: activeKey === key ? s.color : 'var(--cream-dim)',
                fontWeight: activeKey === key ? 700 : 400,
                letterSpacing:'0.06em', textTransform:'uppercase',
                opacity: s.disabled ? 0.45 : 1,
                transition:'all 0.15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        <KpiCard2026 label="Closing Cash · Apr 2027"      value={fmt(Math.round(closingCash))} sub="after 12 months trading" color={closingCash > 0 ? '#2DD4BF' : '#EF4444'} />
        <KpiCard2026 label="Peak Cash Position"           value={fmt(Math.round(peakMonth.cumulative))} sub={peakMonth.month} color="#22D3EE" />
        <KpiCard2026 label="Hit Working-Capital Floor"    value={floorCrossed ? floorCrossed.month : 'Not in window'} sub={`= ${fmt(FLOOR)}`} color={floorCrossed ? '#10B981' : '#EF4444'} />
        <KpiCard2026 label="Hit Working-Capital Target"   value={targetCrossed ? targetCrossed.month : 'Not in window'} sub={`= ${fmt(TARGET)}`} color={targetCrossed ? 'var(--gold)' : '#9CA3AF'} />
      </div>

      {/* Line chart with threshold markers */}
      <CashflowLineChart cf={cf} sc={sc} minCash={minCash} maxCash={maxCash} floor={FLOOR} target={TARGET} fmt={fmt} fmtK={fmtKShort} />

      {/* Monthly breakdown table */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase' }}>Monthly Breakdown</div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'rgba(255,255,255,0.02)' }}>
              <th style={cfTh('left')}>Month</th>
              <th style={cfTh('right')}>Inflow</th>
              <th style={cfTh('right')}>Operating</th>
              <th style={cfTh('right')}>Rent</th>
              <th style={cfTh('right')}>Net</th>
              <th style={cfTh('right')}>Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {cf.map(m => (
              <tr key={m.month} style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                <td style={cfTd('left', '#D1D5DB')}>{m.month}</td>
                <td style={cfTd('right', '#9CA3AF')}>{fmt(m.inflow)}</td>
                <td style={cfTd('right', '#9CA3AF')}>{fmt(-m.opex)}</td>
                <td style={cfTd('right', m.rent > 0 ? '#A78BFA' : '#6B7280')}>{m.rent > 0 ? fmt(-m.rent) : '—'}</td>
                <td style={cfTd('right', m.net >= 0 ? '#2DD4BF' : '#EF4444', 600)}>{m.net >= 0 ? '+' : ''}{fmt(m.net)}</td>
                <td style={cfTd('right', m.cumulative >= 0 ? 'var(--gold)' : '#EF4444', 700)}>{fmt(Math.round(m.cumulative))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CashflowLineChart({ cf, sc, minCash, maxCash, floor, target, fmt, fmtK }) {
  // SVG line chart — 12 months × cumulative cash position, with the
  // working-capital floor (£30k) and target (£45k) drawn as dashed
  // horizontal threshold lines.
  const W = 760
  const H = 280
  const padL = 60, padR = 30, padT = 24, padB = 36
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const yMin = Math.min(0, minCash) - Math.abs(minCash * 0.05 || 1000)
  const yMax = maxCash + Math.abs(maxCash * 0.05 || 1000)
  const yRange = yMax - yMin
  const x = (i) => padL + (i / (cf.length - 1)) * innerW
  const y = (v) => padT + innerH - ((v - yMin) / yRange) * innerH

  const yFloor  = y(floor)
  const yTarget = y(target)
  const yZero   = y(0)

  const points = cf.map((m, i) => `${x(i)},${y(m.cumulative)}`).join(' ')

  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:18 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase' }}>Cumulative Cash Position</div>
        <div style={{ display:'flex', gap:14, fontSize:10.5, color:'#9CA3AF' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:14, height:2, background:sc.color }} />
            Cumulative cash
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:14, height:1, borderTop:'1px dashed #F87171' }} />
            Working-capital floor ({fmtK(floor)})
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:14, height:1, borderTop:'1px dashed var(--gold)' }} />
            Fully-built target ({fmtK(target)})
          </span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
        {/* Zero baseline */}
        <line x1={padL} x2={W-padR} y1={yZero} y2={yZero} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
        {/* Threshold lines */}
        <line x1={padL} x2={W-padR} y1={yFloor}  y2={yFloor}  stroke="#F87171"   strokeWidth={1} strokeDasharray="6 4" opacity={0.7} />
        <line x1={padL} x2={W-padR} y1={yTarget} y2={yTarget} stroke="#C9A84C"   strokeWidth={1} strokeDasharray="6 4" opacity={0.7} />
        {/* Cumulative line */}
        <polyline points={points} fill="none" stroke={sc.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {/* Data points */}
        {cf.map((m, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(m.cumulative)} r={3} fill={sc.color} />
            <title>{`${m.month}\nCumulative ${fmt(Math.round(m.cumulative))}\nNet ${m.net >= 0 ? '+' : ''}${fmt(m.net)}`}</title>
          </g>
        ))}
        {/* X-axis labels */}
        {cf.map((m, i) => (
          <text key={i} x={x(i)} y={H - padB + 16} fontSize="9.5" fill="#9CA3AF" textAnchor="middle">
            {m.month.slice(0, 3)}
          </text>
        ))}
        {/* Y-axis labels */}
        <text x={padL - 8} y={yZero + 4}    fontSize="9.5" fill="#6B7280" textAnchor="end">£0</text>
        <text x={padL - 8} y={yFloor + 4}   fontSize="9.5" fill="#F87171" textAnchor="end">{fmtK(floor)}</text>
        <text x={padL - 8} y={yTarget + 4}  fontSize="9.5" fill="#C9A84C" textAnchor="end">{fmtK(target)}</text>
      </svg>
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
      {/* Section eyebrow + loaded annual total — matches the Fixed Costs editor pattern */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Wages · Editor</div>
        <div style={{ fontSize:13, color:'var(--gold)', fontWeight:600 }}>{fmt(loadedTotal)}/yr</div>
      </div>

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

// ─── 2025 Till Sales — Hackney / London Fields only ──────────────────
// Read-only summary of the cleaned Goodtill till export
// (data/hackney_2025_till_sales.csv). Hackney's only till from
// 1 Jan → 23 Sep 2025 was Goodtill — single-venue export, no other
// venue mixed in. From 24 Sep 2025 the venue migrated to Lightspeed
// so the dataset stops on that date.
//
// IMPORTANT: this is a TILL view, NOT a financial view. Numbers are
// gross customer payments through the till (inc-VAT, post-discount,
// pre any subsequent refund/comp/restatement). For the canonical
// financial figures use the Weekly Merge 2024-2026 sheet — these
// drive the 2025 Performance tab and the published P&L.
const TILL_CAT_PALETTE = [
  '#C9A84C','#D4B86E','#22D3EE','#0EA5E9','#7DD3FC','#A78BFA','#C4B5FD',
  '#F472B6','#FB7185','#FDA4AF','#FCD34D','#FBBF24','#34D399','#6EE7B7',
  '#A3E635','#FACC15','#FB923C','#F87171','#94A3B8','#CBD5E1',
  '#E2E8F0','#FCA5A5','#67E8F9','#86EFAC','#A5F3FC','#DDD6FE','#F5D0FE','#FEF3C7',
]

function TabTillSales2025() {
  const [discOpen, setDiscOpen] = useState(false)
  const [showMinor, setShowMinor] = useState(false)
  const [tillNoteOpen, setTillNoteOpen] = useState(false)
  const [gapNoteOpen, setGapNoteOpen] = useState(false)
  const data = HACKNEY_2025_TILL_SALES
  const disc = HACKNEY_2025_DISCOUNTS
  const codes = HACKNEY_2025_DISCOUNT_CODES
  const { categories, months, monthlyTotals, totalRevenue, totalTxns, lastDate } = data
  const avgSpend = totalRevenue / Math.max(1, totalTxns)
  const peakIdx = monthlyTotals.reduce((bi, v, i, arr) => v > arr[bi] ? i : bi, 0)
  const peakMonth = months[peakIdx]
  const peakValue = monthlyTotals[peakIdx]
  const fmtN = (n) => n.toLocaleString('en-GB')

  // Donut: small categories (<1%) folded into "Other"
  const threshold = totalRevenue * 0.01
  const major = categories.filter(c => c.total >= threshold)
  const minor = categories.filter(c => c.total < threshold)
  const minorTotal = minor.reduce((s, c) => s + c.total, 0)
  const donutCats = minorTotal > 0
    ? [...major, { name: 'Other (<1% combined)', total: minorTotal, qty: minor.reduce((s,c)=>s+c.qty,0) }]
    : major
  const donutTotal = donutCats.reduce((s, c) => s + c.total, 0)
  // Donut promoted to the hero visual — bigger radius, more breathing room
  const R_OUT = 140, R_IN = 86, CX = 160, CY = 160
  let cumAngle = -Math.PI / 2
  const arcs = donutCats.map((c, i) => {
    const frac = c.total / donutTotal
    const start = cumAngle
    const end = cumAngle + frac * Math.PI * 2
    cumAngle = end
    const large = end - start > Math.PI ? 1 : 0
    const sx = CX + R_OUT * Math.cos(start), sy = CY + R_OUT * Math.sin(start)
    const ex = CX + R_OUT * Math.cos(end),   ey = CY + R_OUT * Math.sin(end)
    const sxi = CX + R_IN * Math.cos(end),   syi = CY + R_IN * Math.sin(end)
    const exi = CX + R_IN * Math.cos(start), eyi = CY + R_IN * Math.sin(start)
    return {
      d: `M ${sx} ${sy} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${ex} ${ey} L ${sxi} ${syi} A ${R_IN} ${R_IN} 0 ${large} 0 ${exi} ${eyi} Z`,
      color: TILL_CAT_PALETTE[i % TILL_CAT_PALETTE.length],
      cat: c,
    }
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Slide title — serif, white, mixed-case (matches the new STitle treatment) */}
      <div style={{ marginBottom:4 }}>
        <div className="serif" style={{ fontSize:24, color:'var(--cream)', lineHeight:1.2 }}>Hackney 2025 · Till Sales by Category</div>
        <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>No Dice Hackney · London Fields, E8 · Goodtill till data, COMPLETED orders only, 1 Jan → 23 Sep 2025</div>
      </div>

      {/* Two compact alert bars — headline + one-line summary visible at all
          times; full explanation expands on click. Keeps the top of the page
          scannable while preserving the detail for anyone who wants it. */}

      {/* TILL ≠ FINANCIALS — the single most important caveat on the slide */}
      <div style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.4)', borderRadius:6, overflow:'hidden' }}>
        <button
          onClick={() => setTillNoteOpen(o => !o)}
          style={{ width:'100%', padding:'12px 16px', background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:14, textAlign:'left' }}
        >
          <div style={{ fontSize:18, color:'#FBBF24', flexShrink:0 }}>ⓘ</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#FCD34D' }}>
              Till figures, not P&amp;L revenue
            </div>
            <div style={{ fontSize:12, color:'#FDE68A', marginTop:2 }}>
              Useful for product mix · canonical revenue lives in the 2025 Performance tab
            </div>
          </div>
          <span style={{ fontSize:18, color:'#FCD34D', transform:tillNoteOpen?'rotate(90deg)':'rotate(0deg)', transition:'transform 0.15s', flexShrink:0 }}>›</span>
        </button>
        {tillNoteOpen && (
          <div style={{ padding:'0 18px 14px 48px', fontSize:12, color:'#FDE68A', lineHeight:1.6 }}>
            Numbers below are gross customer payments through the till — inclusive of VAT, after discounts at the till, before any subsequent refund / comp / accounting restatement. For audited / P&amp;L revenue see the <strong>2025 Performance</strong> tab (sourced from Weekly Merge 2024–2026). Expect the till total here to read higher than the Weekly Merge figure (VAT layer + restatements + refunds + golf-line split — full reconciliation in the Discounts section below).
          </div>
        )}
      </div>

      {/* Data gap · 23 Sep 2025 till migration */}
      <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.35)', borderRadius:6, overflow:'hidden' }}>
        <button
          onClick={() => setGapNoteOpen(o => !o)}
          style={{ width:'100%', padding:'12px 16px', background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:14, textAlign:'left' }}
        >
          <div style={{ fontSize:18, color:'#F87171', flexShrink:0 }}>⚠</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#FCA5A5' }}>
              Data ends 23 Sep 2025 · Till migration to Lightspeed
            </div>
            <div style={{ fontSize:12, color:'#FECACA', marginTop:2 }}>
              September bar is partial · Q4 lives in Lightspeed, not here
            </div>
          </div>
          <span style={{ fontSize:18, color:'#FCA5A5', transform:gapNoteOpen?'rotate(90deg)':'rotate(0deg)', transition:'transform 0.15s', flexShrink:0 }}>›</span>
        </button>
        {gapNoteOpen && (
          <div style={{ padding:'0 18px 14px 48px', fontSize:12, color:'#FECACA', lineHeight:1.6 }}>
            No till data is available from 24 Sep 2025 onwards. Hackney migrated off Goodtill to Lightspeed on that date — Q4 2025 figures live in Lightspeed reports, not in this dataset. The September bar in any monthly chart is partial (1–23 Sep only).
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        <KpiCard2026 label="Gross till sales" value={fmtMoney(totalRevenue)} sub="Jan → 23 Sep 2025 · inc-VAT" color="var(--gold)" />
        <KpiCard2026 label="Transactions"     value={fmtN(totalTxns)}        sub={`${fmtMoney(Math.round(avgSpend))} avg spend`} color="#22D3EE" />
        <KpiCard2026 label="Peak month"       value={peakMonth}              sub={fmtMoney(peakValue)} color="#A78BFA" />
        <KpiCard2026 label="Coverage"         value="Goodtill only"           sub={`ends ${lastDate}`} color="#F87171" />
      </div>

      {/* Donut hero + category table — donut promoted as the main visual */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(360px, 480px) 1fr', gap:32, alignItems:'flex-start' }}>
        {/* Hero donut */}
        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:8, padding:'24px 20px' }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14, textAlign:'center', fontWeight:600 }}>
            Category mix
          </div>
          <svg viewBox="0 0 320 320" style={{ width:'100%', height:'auto' }}>
            {arcs.map((a, i) => (
              <path key={i} d={a.d} fill={a.color} stroke="var(--ink-2)" strokeWidth="1.5">
                <title>{`${a.cat.name} · ${fmtMoney(a.cat.total)} (${((a.cat.total/totalRevenue)*100).toFixed(1)}%)`}</title>
              </path>
            ))}
            {/* Centre label sits well inside the donut hole so it doesn't clip
                the surrounding arc band. The dating moves below the SVG. */}
            <text x="160" y="155" textAnchor="middle" fontSize="11" fill="#9CA3AF" letterSpacing="0.12em">TOTAL TILL SALES</text>
            <text x="160" y="185" textAnchor="middle" fontSize="26" fill="var(--cream)" fontWeight="700" fontFamily="DM Serif Display, serif">{fmtMoney(totalRevenue)}</text>
          </svg>
          <div style={{ textAlign:'center', marginTop:8, fontSize:11, color:'#9CA3AF', letterSpacing:'0.04em' }}>
            Jan → 23 Sep 2025 · inc-VAT
          </div>
          {/* Top 3 callout strip below donut */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginTop:18 }}>
            {donutCats.slice(0, 3).map((c, i) => (
              <div key={c.name} style={{ padding:'8px 10px', background:'rgba(255,255,255,0.02)', borderLeft:`3px solid ${TILL_CAT_PALETTE[i]}`, borderRadius:'3px 6px 6px 3px' }}>
                <div style={{ fontSize:9, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {c.name}
                </div>
                <div style={{ fontSize:13, color:'var(--cream)', fontWeight:600, fontVariantNumeric:'tabular-nums', marginTop:2 }}>
                  {fmtMoney(c.total)}
                </div>
                <div style={{ fontSize:10, color:TILL_CAT_PALETTE[i], fontVariantNumeric:'tabular-nums' }}>
                  {((c.total/totalRevenue)*100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category table — only major rows by default */}
        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:6, padding:'14px 18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>By category · descending</div>
            <div style={{ fontSize:10, color:'#6B7280' }}>
              {showMinor ? `${categories.length} categories` : `${major.length} of ${categories.length} · over 1% only`}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {(showMinor ? categories : major).map((c, i) => {
              const pct = (c.total / totalRevenue) * 100
              const barW = (c.total / categories[0].total) * 100
              const isMinor = c.total < threshold
              const color = isMinor
                ? '#475569'
                : TILL_CAT_PALETTE[major.indexOf(c) % TILL_CAT_PALETTE.length]
              return (
                <div key={c.name} style={{ display:'grid', gridTemplateColumns:'1fr 90px 60px 60px', gap:10, alignItems:'center', fontSize:11 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                    <div style={{ width:8, height:8, background:color, borderRadius:2, flexShrink:0 }} />
                    <div style={{ color:'var(--cream)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                  </div>
                  <div style={{ height:6, background:'rgba(255,255,255,0.04)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${barW}%`, height:'100%', background:color }} />
                  </div>
                  <div style={{ textAlign:'right', color:'var(--cream)', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{fmtMoney(c.total)}</div>
                  <div style={{ textAlign:'right', color:'#9CA3AF', fontVariantNumeric:'tabular-nums' }}>{pct.toFixed(1)}%</div>
                </div>
              )
            })}
          </div>

          {/* Show / hide the long tail of <1% categories */}
          {minor.length > 0 && (
            <button
              onClick={() => setShowMinor(s => !s)}
              style={{
                width:'100%', marginTop:10, padding:'8px 10px',
                background:'rgba(201,168,76,0.06)',
                border:'1px dashed rgba(201,168,76,0.35)',
                borderRadius:4,
                cursor:'pointer',
                fontSize:10, color:'var(--gold-dim)',
                letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}
            >
              <span style={{ transform:showMinor?'rotate(90deg)':'rotate(0deg)', transition:'transform 0.15s', display:'inline-block' }}>›</span>
              {showMinor
                ? `Hide ${minor.length} smaller categories`
                : `Show ${minor.length} smaller categories (under 1% — ${fmtMoney(minorTotal)} combined)`}
            </button>
          )}
          <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid rgba(201,168,76,0.12)', display:'grid', gridTemplateColumns:'1fr 90px 60px 60px', gap:10, fontSize:11, fontWeight:700 }}>
            <div style={{ color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total</div>
            <div />
            <div style={{ textAlign:'right', color:'var(--cream)', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(totalRevenue)}</div>
            <div style={{ textAlign:'right', color:'#9CA3AF' }}>100%</div>
          </div>
        </div>
      </div>

      {/* ─── Discounts (collapsible) ──────────────────────────── */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:6, overflow:'hidden' }}>
        <button
          onClick={() => setDiscOpen(o => !o)}
          style={{
            width:'100%', padding:'14px 18px', background:'transparent', border:'none',
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
            color:'var(--cream)', textAlign:'left',
          }}
        >
          <div style={{ display:'flex', alignItems:'baseline', gap:14 }}>
            <span style={{ fontSize:22, color:'var(--gold)', transform:discOpen?'rotate(90deg)':'rotate(0deg)', transition:'transform 0.15s', display:'inline-block' }}>›</span>
            <div>
              <div className="serif" style={{ fontSize:22, color:'var(--cream)', lineHeight:1.2 }}>
                Discounts
              </div>
              <div style={{ fontSize:12, color:'#9CA3AF', marginTop:4 }}>
                Cost against drink sales · {fmtMoney(Math.round(disc.totalDiscount))} discounted · {disc.discountRate.toFixed(2)}% of gross · {fmtN(disc.discountedOrders)} discounted orders of {fmtN(disc.totalOrders)}
              </div>
            </div>
          </div>
          <span style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.06em', textTransform:'uppercase' }}>
            {discOpen ? 'Hide' : 'Show'}
          </span>
        </button>

        {discOpen && (
          <div style={{ padding:'4px 18px 20px', borderTop:'1px solid rgba(201,168,76,0.12)' }}>
            {/* KPI strip */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginTop:14, marginBottom:18 }}>
              <KpiCard2026 label="Total discounted"    value={fmtMoney(Math.round(disc.totalDiscount))} sub={`${disc.discountRate.toFixed(2)}% of gross`} color="#F87171" />
              <KpiCard2026 label="Discounted orders"   value={fmtN(disc.discountedOrders)}              sub={`${disc.discountedOrderPct}% of orders`} color="#FB923C" />
              <KpiCard2026 label="Avg per disc. order" value={fmtMoney(Math.round(disc.avgDiscountPerDiscountedOrder))} sub="across discounted orders" color="#FBBF24" />
              <KpiCard2026 label="Peak window"         value="Apr–Jun" sub="~9% vs ~5% baseline" color="#A78BFA" />
            </div>

            {/* Monthly discount-rate strip */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                Discount rate by month (% of gross)
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80 }}>
                {disc.monthly.map((m,i) => {
                  const maxRate = Math.max(...disc.monthly.map(x=>x.rate))
                  const h = Math.round((m.rate / maxRate) * 70)
                  const hot = m.rate >= 8
                  return (
                    <div key={m.month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                      <div style={{ fontSize:9, color:hot?'#FCA5A5':'#9CA3AF', fontWeight:hot?700:400, fontVariantNumeric:'tabular-nums' }}>
                        {m.rate.toFixed(1)}%
                      </div>
                      <div style={{ width:'80%', height:h, background:hot?'#F87171':'rgba(248,113,113,0.35)', borderRadius:'2px 2px 0 0' }} />
                      <div style={{ fontSize:9, color:'#6B7280', marginTop:2 }}>{m.month}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize:10, color:'#9CA3AF', marginTop:8, fontStyle:'italic' }}>
                Apr–Jun spikes to ~9% — looks like a deliberate spring promo run
                (2-for-£12 doubles, January Deals carry-over). Worth confirming whether
                intentional vs operator slippage.
              </div>
            </div>

            {/* Category table */}
            <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
              Discount by category · sorted by £
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 80px', gap:10, fontSize:10, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6, paddingBottom:4, borderBottom:'1px solid rgba(201,168,76,0.1)' }}>
              <div>Category</div>
              <div style={{ textAlign:'right' }}>Gross</div>
              <div style={{ textAlign:'right' }}>Discount £</div>
              <div style={{ textAlign:'right' }}>Rate</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {disc.categories.map((c, i) => {
                const heat = c.rate >= 15 ? '#F87171' : c.rate >= 8 ? '#FB923C' : c.rate >= 4 ? '#FBBF24' : '#9CA3AF'
                const flag = c.rate >= 15 ? '🚨' : c.rate >= 8 ? '⚠' : ''
                return (
                  <div key={c.name} style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 80px', gap:10, alignItems:'center', fontSize:11, padding:'4px 0' }}>
                    <div style={{ color:'var(--cream)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {flag && <span style={{ marginRight:6 }}>{flag}</span>}
                      {c.name}
                    </div>
                    <div style={{ textAlign:'right', color:'#9CA3AF', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(c.gross)}</div>
                    <div style={{ textAlign:'right', color:'var(--cream)', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{fmtMoney(Math.round(c.discount))}</div>
                    <div style={{ textAlign:'right', color:heat, fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{c.rate.toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop:14, padding:'10px 12px', background:'rgba(251,146,60,0.08)', border:'1px solid rgba(251,146,60,0.25)', borderRadius:4, fontSize:11, color:'#FCD34D', lineHeight:1.55 }}>
              <strong style={{ color:'#FB923C' }}>Flags: </strong>
              🚨 ≥15% rate — outlier categories (TEQUILA & SHOTS 22.7%, BOTTLED BEER 17.2%, FOOD TACOS 26.2%)
              are likely promotional SKUs (2-for-£12 doubles, BOGOFs etc).
              ⚠ 8–15% rate is heavy-but-explainable. Confirm these are intentional rather than till-side errors.
            </div>

            {/* ─── What discount codes were used? ──────────────── */}
            <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid rgba(201,168,76,0.12)' }}>
              <div className="serif" style={{ fontSize:18, color:'var(--cream)', marginBottom:8, lineHeight:1.25 }}>
                What discount codes were used?
              </div>
              <div style={{ fontSize:11, color:'#9CA3AF', lineHeight:1.55, marginBottom:14 }}>
                {codes.note}
              </div>

              {/* Findings note — the takeaway in one read */}
              <div style={{
                padding:'12px 14px',
                background:'rgba(34,211,238,0.06)',
                border:'1px solid rgba(34,211,238,0.25)',
                borderRadius:6,
                fontSize:12, color:'#A5F3FC', lineHeight:1.65,
                marginBottom:18,
              }}>
                <div style={{ fontSize:10, color:'#22D3EE', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>
                  Findings
                </div>
                <ul style={{ margin:0, paddingLeft:18 }}>
                  <li style={{ marginBottom:4 }}>
                    <strong style={{ color:'var(--cream)' }}>~89% of discount £ is 2-for-1 / BOGOF</strong> —
                    £34,842 of the £39k total comes from rings where the discount is 50–100% of the line
                    price (i.e. the second item is free).
                  </li>
                  <li style={{ marginBottom:4 }}>
                    <strong style={{ color:'var(--cream)' }}>Cocktail BOGOFs lead</strong> — Tommys Margarita
                    rung free 253× (505 units), Mango Mojito 165× (328 units), spicy cucumber marg 120× (238 units).
                    These look like a happy-hour 2-for-1 menu.
                  </li>
                  <li style={{ marginBottom:4 }}>
                    <strong style={{ color:'var(--cream)' }}>Recurring £1 mixer deal</strong> — Tonic Water at
                    £1 rung 778× (vs Coke 554×). Tonic out in front by 220+ rings strongly implies a "spirit + £1
                    mixer = G&amp;T" promo line ran for most of 2025.
                  </li>
                  <li style={{ marginBottom:4 }}>
                    <strong style={{ color:'var(--cream)' }}>Free mixers / soft drinks comp generously</strong> —
                    Soda Water rung free 861× (870 units), Coke 696× (730 units). Some of these will be "mixer
                    with the spirit" comps; others may be staff drinks or comp-for-complaint situations.
                  </li>
                  <li>
                    <strong style={{ color:'var(--cream)' }}>The formal Promotion column is barely used</strong>
                    — only 87 rows out of 89,521 carry a Promotion tag, almost all "−£5". The vast majority of
                    discounts flow through the Sale Discount column (£38,937) or item-level free rings, not
                    through a named campaign.
                  </li>
                </ul>
              </div>

              {/* Magnitude — most discounts are 50–100% off (BOGOF) */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:18 }}>
                {codes.magnitudeBuckets.map(b => {
                  const pctOfTotal = (b.value / disc.totalDiscount) * 100
                  const isHero = b.bucket.includes('BOGOF')
                  return (
                    <div key={b.bucket} style={{ padding:'10px 12px', background:isHero?'rgba(248,113,113,0.08)':'rgba(255,255,255,0.02)', border:`1px solid ${isHero?'rgba(248,113,113,0.3)':'rgba(255,255,255,0.06)'}`, borderRadius:6 }}>
                      <div style={{ fontSize:10, color:isHero?'#FCA5A5':'#9CA3AF', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>
                        {b.bucket}
                      </div>
                      <div className="serif" style={{ fontSize:18, color:'var(--cream)', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
                        {fmtMoney(b.value)}
                      </div>
                      <div style={{ fontSize:10, color:'#9CA3AF', marginTop:4, fontVariantNumeric:'tabular-nums' }}>
                        {b.rows.toLocaleString('en-GB')} rows · {pctOfTotal.toFixed(0)}% of all discount £
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Promotion column */}
              <div className="serif" style={{ fontSize:14, color:'var(--cream)', marginTop:18, marginBottom:8 }}>
                Promotion column · the £ tags applied
              </div>
              <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:8 }}>
                The Goodtill <code style={{ background:'rgba(255,255,255,0.05)', padding:'1px 5px', borderRadius:3, color:'#A5F3FC' }}>Promotion</code> column captures the £ off, not a campaign name.
                Only used on {codes.promotionColumn.reduce((s,p)=>s+p.rows,0)} rows out of 89,521.
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {codes.promotionColumn.map(p => (
                  <div key={p.value} style={{ padding:'4px 10px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:14, fontSize:11, color:'var(--cream)', fontVariantNumeric:'tabular-nums' }}>
                    −£{p.value.replace('-','')} <span style={{ color:'#9CA3AF' }}>· {p.rows}×</span>
                  </div>
                ))}
              </div>

              {/* Free / BOGOF items — what staff rang at £0 */}
              <div className="serif" style={{ fontSize:14, color:'var(--cream)', marginTop:20, marginBottom:8 }}>
                Free items / 2-for-1 patterns · staff rang at £0
              </div>
              <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:10 }}>
                Top recurring zero-priced items in staff Item Notes — typically the BOGOF half of a happy-hour
                deal (free second cocktail) or a free mixer with a spirit.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {codes.freeMixers.map(x => (
                  <div key={x.name} style={{ display:'grid', gridTemplateColumns:'1fr 60px 60px', gap:8, padding:'4px 8px', background:'rgba(248,113,113,0.04)', borderLeft:'2px solid rgba(248,113,113,0.4)', borderRadius:'2px 4px 4px 2px', fontSize:11 }}>
                    <div style={{ color:'var(--cream)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{x.name}</div>
                    <div style={{ textAlign:'right', color:'#FCA5A5', fontVariantNumeric:'tabular-nums' }}>{x.rows}×</div>
                    <div style={{ textAlign:'right', color:'#9CA3AF', fontVariantNumeric:'tabular-nums' }}>{x.units} units</div>
                  </div>
                ))}
              </div>

              {/* £1 mixers */}
              <div className="serif" style={{ fontSize:14, color:'var(--cream)', marginTop:20, marginBottom:8 }}>
                £1 mixer special · the G&amp;T deal
              </div>
              <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:10 }}>
                Mixers rung at £1 — looks like a recurring "spirit + £1 mixer" combo. Tonic Water leads
                ({codes.onePoundMixers[0].rows} times), suggesting a gin-and-tonic promo line.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {codes.onePoundMixers.map(x => (
                  <div key={x.name} style={{ display:'grid', gridTemplateColumns:'1fr 60px 60px', gap:8, padding:'4px 8px', background:'rgba(251,191,36,0.04)', borderLeft:'2px solid rgba(251,191,36,0.4)', borderRadius:'2px 4px 4px 2px', fontSize:11 }}>
                    <div style={{ color:'var(--cream)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{x.name}</div>
                    <div style={{ textAlign:'right', color:'#FCD34D', fontVariantNumeric:'tabular-nums' }}>{x.rows}×</div>
                    <div style={{ textAlign:'right', color:'#9CA3AF', fontVariantNumeric:'tabular-nums' }}>{x.units} units</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reconciliation panel — answers "why doesn't this match Weekly Merge 2024-2026?" */}
            <div style={{ marginTop:18, padding:'12px 14px', background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.25)', borderRadius:4, fontSize:11, color:'#A5F3FC', lineHeight:1.6 }}>
              <div style={{ fontSize:10, color:'#22D3EE', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>
                Why doesn't this match the Weekly Merge 2024-2026 sheet?
              </div>
              <div style={{ color:'#CBD5E1' }}>
                Like-for-like Jan→Aug 2025: Goodtill till data <strong>£595k inc-VAT</strong> vs Monthly Summary
                <strong> £383k</strong> — gap ~£212k. Discounts (~£39k) account for only ~6% of the gap. The rest
                is structural: <strong>(1)</strong> Goodtill totals are gross of VAT (~£99k of the gap is the 20%
                layer); <strong>(2)</strong> Monthly Summary is post-restatement / re-categorisation; <strong>(3)</strong>
                Goodtill captures till-rung golf entries that Weekly Merge splits to a separate Online Golf line;
                <strong> (4)</strong> refunds / voids / comps recorded after COMPLETED. Bottom line: <strong>this
                till data is for product-mix and discount analytics — not for the P&amp;L</strong>. Weekly Merge
                2024-2026 stays the canonical revenue figure.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Source footnote */}
      <div style={{ fontSize:10, color:'#6B7280', lineHeight:1.6 }}>
        Source · data/hackney_2025_till_sales.csv (cleaned Goodtill export, 89,521 rows ·
        5,469 previously-blank categories filled by the recategorisation playbook).
        Single-venue till instance — Hackney / London Fields E8 only. No Borough or other
        venue data is mixed in.
      </div>
    </div>
  )
}

// ─── Till Sales 2020–2024 — historical aggregates ────────────────────
// Five-year category-level breakdown built from the Goodtill yearly
// exports. Year selector at the top lets investors flip between 2020
// (partial / COVID) → 2024 (most recent full year). Same till-vs-P&L
// caveat as the 2025 tab: this is operational volume data, not the
// canonical revenue figure.
function TabPrevTillSales() {
  const [year, setYear] = useState(2024)   // default to most recent full year
  const [showMinor, setShowMinor] = useState(false)
  const cats = HACKNEY_PREV_TILL_SALES[year] || []
  const summary = HACKNEY_PREV_TILL_YEAR_TOTALS[year]
  const totals = hackneyTotalsForYear(year)

  // Sort by qty desc; pick a colour palette aligned with the 2025 tab.
  const PALETTE = TILL_CAT_PALETTE
  const sorted = [...cats].sort((a, b) => b.qty - a.qty)
  const top10 = sorted.slice(0, 10)
  const rest = sorted.slice(10)
  const restTotal = rest.reduce((s, r) => s + r.qty, 0)

  // Donut by qty
  const donutCats = restTotal > 0
    ? [...top10, { name: `Other (${rest.length} smaller cats)`, qty: restTotal, total: rest.reduce((s,r)=>s+r.total,0) }]
    : top10
  const donutTotal = donutCats.reduce((s, c) => s + c.qty, 0)
  const R_OUT = 140, R_IN = 86, CX = 160, CY = 160
  let cumAngle = -Math.PI / 2
  const arcs = donutCats.map((c, i) => {
    const frac = c.qty / Math.max(1, donutTotal)
    const start = cumAngle, end = cumAngle + frac * Math.PI * 2
    cumAngle = end
    const large = end - start > Math.PI ? 1 : 0
    const sx = CX + R_OUT * Math.cos(start), sy = CY + R_OUT * Math.sin(start)
    const ex = CX + R_OUT * Math.cos(end),   ey = CY + R_OUT * Math.sin(end)
    const sxi = CX + R_IN * Math.cos(end),   syi = CY + R_IN * Math.sin(end)
    const exi = CX + R_IN * Math.cos(start), eyi = CY + R_IN * Math.sin(start)
    return {
      d: `M ${sx} ${sy} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${ex} ${ey} L ${sxi} ${syi} A ${R_IN} ${R_IN} 0 ${large} 0 ${exi} ${eyi} Z`,
      color: PALETTE[i % PALETTE.length],
      cat: c,
    }
  })

  // Year-over-year revenue trajectory for the trend strip
  const trajectory = HACKNEY_PREV_TILL_YEARS.map(y => ({
    year: y,
    revenue: HACKNEY_PREV_TILL_YEAR_TOTALS[y].revenue,
    orders: HACKNEY_PREV_TILL_YEAR_TOTALS[y].orders,
    isSelected: y === year,
  }))
  const maxRev = Math.max(...trajectory.map(t => t.revenue))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Slide title */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
        <span style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', background:'rgba(34,211,238,0.12)', border:'1px solid rgba(34,211,238,0.3)', borderRadius:8, fontSize:18 }}>📈</span>
        <div>
          <div className="serif" style={{ fontSize:24, color:'var(--cream)', lineHeight:1.2 }}>Hackney 2020–2024 · Till Sales History</div>
          <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>Five-year Goodtill category-level breakdown · click a year below to drill in</div>
        </div>
      </div>

      {/* Till ≠ financial figures reminder */}
      <div style={{ padding:'14px 18px', background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.4)', borderRadius:6, display:'flex', gap:14, alignItems:'flex-start' }}>
        <div style={{ fontSize:18, lineHeight:'18px', color:'#FBBF24' }}>ⓘ</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#FCD34D', marginBottom:4 }}>
            These are till figures, not financial figures
          </div>
          <div style={{ fontSize:13, color:'#FDE68A', lineHeight:1.55 }}>
            Numbers below show what was rung through the till — useful for understanding <strong>what we sold</strong> and <strong>category mix</strong>, not as canonical revenue. Till totals are inc-VAT, post-discount, pre-refund. For audited revenue see the Weekly Merge 2024–2026 sheet.
          </div>
        </div>
      </div>

      {/* Year-over-year revenue trajectory */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:8, padding:'18px 20px' }}>
        <div className="serif" style={{ fontSize:18, color:'var(--cream)', marginBottom:14, lineHeight:1.25 }}>
          Five-year revenue trajectory
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:14, height:160 }}>
          {trajectory.map((t, i) => {
            const h = Math.round((t.revenue / maxRev) * 130)
            const isSel = t.isSelected
            const prev = i > 0 ? trajectory[i-1].revenue : null
            const yoy = prev ? ((t.revenue / prev - 1) * 100) : null
            return (
              <button key={t.year} onClick={() => setYear(t.year)} style={{
                flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                background:'transparent', border:'none', cursor:'pointer', padding:0, height:160, justifyContent:'flex-end',
              }}>
                {yoy !== null && (
                  <div style={{ fontSize:10, color: yoy >= 0 ? '#10B981' : '#F87171', fontVariantNumeric:'tabular-nums', fontWeight:600 }}>
                    {yoy >= 0 ? '+' : ''}{yoy.toFixed(0)}%
                  </div>
                )}
                {yoy === null && <div style={{ fontSize:10, height:14 }}>&nbsp;</div>}
                <div style={{ fontSize:11, color: isSel ? 'var(--gold)' : 'var(--cream)', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
                  £{Math.round(t.revenue/1000)}k
                </div>
                <div style={{
                  width:'80%', height:h,
                  background: isSel
                    ? 'linear-gradient(180deg, var(--gold-light) 0%, var(--gold) 100%)'
                    : 'linear-gradient(180deg, rgba(34,211,238,0.5) 0%, rgba(34,211,238,0.3) 100%)',
                  border: isSel ? '1px solid var(--gold)' : '1px solid rgba(34,211,238,0.4)',
                  borderRadius:'3px 3px 0 0',
                  transition:'all 0.15s',
                }} />
                <div style={{ fontSize:11, color: isSel ? 'var(--gold)' : 'var(--cream-dim)', marginTop:4, fontWeight: isSel ? 700 : 400 }}>{t.year}</div>
                <div style={{ fontSize:9, color:'#6B7280', fontVariantNumeric:'tabular-nums' }}>{t.orders.toLocaleString('en-GB')} orders</div>
              </button>
            )
          })}
        </div>
        <div style={{ fontSize:11, color:'#9CA3AF', marginTop:12, fontStyle:'italic' }}>
          {summary.note} · Click any bar to switch the breakdown below.
        </div>
      </div>

      {/* KPI strip for the selected year */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        <KpiCard2026 label={`${year} · Revenue`}      value={fmtMoney(summary.revenue)} sub="inc-VAT · COMPLETED only" color="var(--gold)" />
        <KpiCard2026 label={`${year} · Orders`}       value={summary.orders.toLocaleString('en-GB')} sub={`${(summary.revenue/summary.orders).toFixed(2)} avg spend`} color="#22D3EE" />
        <KpiCard2026 label={`${year} · Units sold`}   value={totals.totalQty.toLocaleString('en-GB')} sub={`${cats.length} categories`} color="#A78BFA" />
        <KpiCard2026 label={`${year} · Zero-priced`}  value={`${totals.pctZero.toFixed(1)}%`} sub={`${totals.totalZeroLines.toLocaleString('en-GB')} of ${totals.totalLines.toLocaleString('en-GB')} lines`} color="#F87171" />
      </div>

      {/* Donut hero + category table — donut column promoted to equal width */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, alignItems:'flex-start' }}>
        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:8, padding:'32px 28px' }}>
          <div style={{ fontSize:13, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:18, textAlign:'center', fontWeight:600 }}>
            {year} · Top categories by units
          </div>
          <svg viewBox="0 0 320 320" style={{ width:'100%', height:'auto' }}>
            {arcs.map((a, i) => (
              <path key={i} d={a.d} fill={a.color} stroke="var(--ink-2)" strokeWidth="1.5">
                <title>{`${a.cat.name} · ${a.cat.qty.toLocaleString('en-GB')} units`}</title>
              </path>
            ))}
            <text x="160" y="150" textAnchor="middle" fontSize="12" fill="#9CA3AF" letterSpacing="0.12em">UNITS SOLD</text>
            <text x="160" y="190" textAnchor="middle" fontSize="36" fill="var(--cream)" fontWeight="700" fontFamily="DM Serif Display, serif">{totals.totalQty.toLocaleString('en-GB')}</text>
          </svg>
          <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:'#9CA3AF' }}>
            {year} · COMPLETED orders only
          </div>
        </div>

        {/* Category table — all rows */}
        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:6, padding:'14px 18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{year} · By category · descending</div>
            <div style={{ fontSize:10, color:'#6B7280' }}>{cats.length} categories</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 70px 80px 60px', gap:10, fontSize:10, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6, paddingBottom:4, borderBottom:'1px solid rgba(201,168,76,0.1)' }}>
            <div>Category</div>
            <div style={{ textAlign:'right' }}>Units</div>
            <div style={{ textAlign:'right' }}>Total inc-VAT</div>
            <div style={{ textAlign:'right' }}>% Zero</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {(showMinor ? sorted : top10).map((c, i) => {
              const isGolf = HACKNEY_GOLF_CATEGORIES.includes(c.name)
              const isMinor = i >= top10.length
              const color = isMinor ? '#475569' : PALETTE[i % PALETTE.length]
              return (
                <div key={c.name} style={{ display:'grid', gridTemplateColumns:'1fr 70px 80px 60px', gap:10, alignItems:'center', fontSize:11, padding:'3px 0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                    <div style={{ width:8, height:8, background:color, borderRadius:2, flexShrink:0 }} />
                    <div style={{ color: isGolf ? '#FCD34D' : 'var(--cream)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight: isGolf ? 600 : 400 }}>
                      {isGolf ? '⛳ ' : ''}{c.name}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', color:'var(--cream)', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{c.qty.toLocaleString('en-GB')}</div>
                  <div style={{ textAlign:'right', color:'var(--cream)', fontVariantNumeric:'tabular-nums' }}>£{Math.round(c.total).toLocaleString('en-GB')}</div>
                  <div style={{ textAlign:'right', color: c.pctZero >= 25 ? '#F87171' : c.pctZero >= 10 ? '#FBBF24' : '#9CA3AF', fontVariantNumeric:'tabular-nums' }}>
                    {c.pctZero.toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </div>

          {/* Show / hide the smaller categories beyond the top 10 */}
          {rest.length > 0 && (
            <button
              onClick={() => setShowMinor(s => !s)}
              style={{
                width:'100%', marginTop:10, padding:'8px 10px',
                background:'rgba(201,168,76,0.06)',
                border:'1px dashed rgba(201,168,76,0.35)',
                borderRadius:4,
                cursor:'pointer',
                fontSize:10, color:'var(--gold-dim)',
                letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}
            >
              <span style={{ transform:showMinor?'rotate(90deg)':'rotate(0deg)', transition:'transform 0.15s', display:'inline-block' }}>›</span>
              {showMinor
                ? `Hide ${rest.length} smaller categories`
                : `Show ${rest.length} smaller categories (${restTotal.toLocaleString('en-GB')} units combined)`}
            </button>
          )}

          <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid rgba(201,168,76,0.12)', display:'grid', gridTemplateColumns:'1fr 70px 80px 60px', gap:10, fontSize:11, fontWeight:700 }}>
            <div style={{ color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total</div>
            <div style={{ textAlign:'right', color:'var(--cream)', fontVariantNumeric:'tabular-nums' }}>{totals.totalQty.toLocaleString('en-GB')}</div>
            <div style={{ textAlign:'right', color:'var(--cream)', fontVariantNumeric:'tabular-nums' }}>£{Math.round(totals.totalGross).toLocaleString('en-GB')}</div>
            <div style={{ textAlign:'right', color:'#9CA3AF' }}>{totals.pctZero.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Source footnote */}
      <div style={{ fontSize:10, color:'#6B7280', lineHeight:1.6 }}>
        Source · 5 yearly Goodtill workbooks merged into the project workbook via Apps Script,
        then aggregated into the Category Aggregates tab. Units / lines / zero-priced counts
        from COMPLETED orders only. Single-venue till instance — Hackney / London Fields E8.
      </div>
    </div>
  )
}

export default function BusinessExplorer() {
  const [tab, setTab] = useState('performance2025')
  const tabComponents = {
    performance2025: <Tab2025 />,
    tillsales2025:   <TabTillSales2025 />,
    prevtillsales:   <TabPrevTillSales />,
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
