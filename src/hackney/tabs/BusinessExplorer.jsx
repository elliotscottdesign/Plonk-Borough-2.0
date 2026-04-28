import React, { useState } from 'react'
import {
  USE_OF_FUNDS,
  WAGE_RATES,
  PL_WAGE_BASE,
  ROTA_TOTAL,
  WAGE_OVERHEAD_MULT,
  HACKNEY_WAGE_MODEL,
  computeDealFromInvestment,
} from '../../data/hackney.js'
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

      <STitle>Wages — 2025 Rota Reference (4-role bar-only)</STitle>
      <WageRotaReference />

      <STitle>Wages — Modelled Full Build-Out (12 roles)</STitle>
      <WageModelBreakdown />
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
      <WageCalculator />

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
          50/50 split locked. Pre-money {fmt(deal.preMoney)} · post-money {fmt(deal.postMoney)} · implied <strong style={{ color:'var(--cream)' }}>{deal.impliedMult.toFixed(2)}× EBITDA</strong> at this raise.
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
