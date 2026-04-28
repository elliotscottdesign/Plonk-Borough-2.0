import React, { useState } from 'react'
import { USE_OF_FUNDS, computeDealFromInvestment } from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

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
      <Tbd>Top-line summary cards (Revenue · Wages · Fixed Costs · Variable Costs · VAT · EBITDA). Verified totals are populated in <code>src/data/hackney.js</code> ACTUALS_2025; mirror Borough's snapshot cards layout here.</Tbd>

      <STitle>Income by Source</STitle>
      <Tbd>Donut chart + per-source table. Borough splits into 6 sources (Bar, Online Golf, Bookings, Private Hires, Service Charge, Pool). Hackney bar-only equivalent splits TBD — needs restated weekly P&L.</Tbd>

      <STitle>Costs by Category</STitle>
      <Tbd>Stacked bar + 9-line category breakdown (Wages, Fixed, Drinks/Gas, VAT Net, Cleaning, Arcades, Food, Marketing, Card Charges). Hackney workbook currently only splits four totals — sub-category breakdown TBD.</Tbd>

      <STitle>Monthly Performance</STitle>
      <Tbd>12-month income + profit chart + table. Income/profit per month already populated in MONTHLY_INCOME / MONTHLY_PROFIT. Cost-by-category-by-month TBD.</Tbd>

      <STitle>Wages — Role Breakdown</STitle>
      <Tbd>Role-by-role table (headcount, hours, rate, weekly/monthly/annual cost). Source: Wages Breakdown sheet of the Hackney workbook.</Tbd>
    </div>
  )
}

function Tab2026() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>2026 Forecast — Base Case +15%</STitle>
      <Tbd>Top-line forecast cards (Revenue · Profit · Margin) + the editable founder-only inputs (wages, fixed cost uplift, drinks ratio, rent rule, scenario selector).</Tbd>

      <STitle>Cost Model — 2026 Rules</STitle>
      <Tbd>Borough uses a per-line rule set (wages +10%, non-rent fixed +10%, drinks 30% of bar, rent 15% of turnover, etc.). Hackney's equivalent rule set is TBD pending the bar-only restated cost model.</Tbd>

      <STitle>Locked Snapshot — Founder Edit / Investor View</STitle>
      <Tbd>Borough's LockedForecastContext lets the founder edit values then click Lock — the snapshot becomes the Custom scenario in Investment Summary and Waterfall Returns. Wire the same provider into HackneyApp once the underlying inputs are finalised.</Tbd>

      <STitle>Wage Calculator</STitle>
      <Tbd>Per-role rate slider + hours input. Connects to PL_WAGE_BASE / ROTA_TOTAL / WAGE_OVERHEAD_MULT in data/hackney.js. Placeholder rates already in WAGE_RATES — replace with Hackney role/hour list from Wages Breakdown sheet.</Tbd>

      <STitle>Income Levers — Scenario Builder</STitle>
      <Tbd>Per-source revenue lever (bar uplift, bookings uplift, private hires, etc.) feeding the Custom scenario. Borough has 6 levers; Hackney's lever list TBD pending the income-source split.</Tbd>
    </div>
  )
}

function TabCashflow() {
  const { snapshot, isLocked } = useLockedUseOfFunds()
  const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

  // Day-1 startup-cost rows: locked snapshot if present, else the static
  // USE_OF_FUNDS defaults. The locked snapshot is the founder's chosen
  // minimum-viable raise from the Use of Funds slider tool.
  const day1 = isLocked && snapshot
    ? [
        { label: 'Stock Purchase — Liquidators',     amount: snapshot.stock },
        { label: `Landlord — Rent Deposit (${snapshot.rentMonths} ${snapshot.rentMonths === 1 ? 'month' : 'months'})`, amount: snapshot.rent },
        { label: 'Garden Refurbishment',             amount: snapshot.garden },
        { label: 'Interior Completion & Signage',    amount: snapshot.interior },
        { label: 'Marketing — Pre-launch & Year 1',  amount: snapshot.marketing },
        { label: 'Legals, Restart & Working Capital',amount: snapshot.legals },
      ]
    : USE_OF_FUNDS.map(u => ({ label: u.item, amount: u.amount }))
  const day1Total = day1.reduce((s, r) => s + r.amount, 0)
  const deal = computeDealFromInvestment(day1Total)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Cashflow Forecast — May 2026 to Apr 2027</STitle>
      <Tbd>Month-by-month opening / inflows / outflows / closing balance. Source: Cash Flow Forecast sheet — peak £82,337 (Aug 26), low £39,250 (Feb 27), year-end £72,462 (Apr 27). Verified figures available; chart + table TBD.</Tbd>

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
              <span style={{ color:'var(--cream-dim)' }}>{r.label}</span>
              <span style={{ color: isLocked ? '#10B981' : 'var(--cream)', fontVariantNumeric:'tabular-nums' }}>{fmt(r.amount)}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0', fontSize:14, fontWeight:600 }}>
            <span style={{ color:'var(--cream)' }}>Total Day-1 outflow</span>
            <span className="serif" style={{ color: isLocked ? '#10B981' : 'var(--gold)', fontSize:18 }}>{fmt(day1Total)}</span>
          </div>
        </div>
        <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(255,255,255,0.02)', borderRadius:6, fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>
          Investor equity at this raise: <strong style={{ color:'var(--cream)' }}>{(deal.investorEq*100).toFixed(1)}%</strong> on {fmt(deal.investment)} into a {fmt(deal.preMoney)} pre-money business — post-money {fmt(deal.postMoney)}.
          {isLocked && snapshot?.lockedAt ? ` · Locked ${new Date(snapshot.lockedAt).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' })}.` : ''}
        </div>
      </div>

      <STitle>Monthly Operating Outflows</STitle>
      <Tbd>Wages, director salary, fixed overheads, accountancy, variable costs, rent (£0 for first 4 months, then £1,833/mo), VAT output (quarterly).</Tbd>

      <STitle>Net Position & Safety Floor</STitle>
      <Tbd>Closing-balance line chart with the £25,000 safety floor reference line. Lowest month is Feb 27 at £39,250 (£14k above floor). Will recompute against locked Day-1 outflow once chart is wired.</Tbd>
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
