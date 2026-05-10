import React, { useState } from 'react'
import {
  HACKNEY_SCENARIO_LEVERS, HACKNEY_CASH, WORKBOOK_URL,
} from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'
import { compute2026Scenario, KpiCard2026 } from '../tabs/BusinessExplorer.jsx'

// ─── Cashflow Forecast — May 2026 → Apr 2027 ──────────────────────────
// Promoted from a Business Explorer sub-tab into a dedicated slide on
// the Investor Deck (sits after Use of Funds). Same logic as before;
// reads the locked forecast / wage / fixed-costs / office-costs
// surfaces from LockedUseOfFundsContext so any founder lock cascades
// into the cashflow projection.
//
// Hackney data feeds:
//   • compute2026Scenario(...) — totalIncome + totalCosts + rent
//     under each scenario (Conservative +10% on 2025 == growth=10,
//     Base +15% == growth=15, Optimistic +20% == growth=20, Custom =
//     locked forecast snapshot).
//   • HACKNEY_CASH.safetyFloor / .safetyTarget — working-capital
//     thresholds (£30k floor, £45k fully-built target).
//
// Cashflow logic per month:
//   - Inflow:    revenue × seasonal weight / 12
//   - Operating: (totalCosts − rent) × seasonal weight / 12
//   - Rent:      paid monthly during the 9 paying months (Aug 26 →
//                Apr 27); £0 during the 3-month rent-free period
//                (May–Jul 26 per the lease).
//   - Net:       inflow − operating − rent
//   - Cumulative: running total starting at £0 (Day-1 raise excluded —
//                 that's modelled separately on Use of Funds).

const HACKNEY_CASHFLOW_MONTHS   = ['May 26','Jun 26','Jul 26','Aug 26','Sep 26','Oct 26','Nov 26','Dec 26','Jan 27','Feb 27','Mar 27','Apr 27']
const HACKNEY_CASHFLOW_SEASONAL = [0.90, 0.85, 1.00, 1.05, 1.05, 1.10, 1.20, 1.40, 0.85, 0.95, 1.00, 0.95]
// Lease: 3 months rent-free (May 26 – Jul 26 = indexes 0..2); rent
// payable monthly for the remaining 9 (Aug 26 – Apr 27 = indexes 3..11).
const HACKNEY_RENT_FREE_MONTHS  = new Set([0, 1, 2])

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

export default function CashflowForecast() {
  const ctx = useLockedUseOfFunds()
  const { forecastEffective, isForecastLocked, forecastSnapshot, isWageLocked, wageEffective, isFixedCostsLocked, fixedCostsLock, isOfficeCostsLocked, officeCostsLock } = ctx
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
  // When the founder has independently locked the Fixed Costs or Office
  // Costs editor, those line overrides cascade into every scenario here
  // too — otherwise the synthetic per-scenario forecast would compute
  // costs from defaults and silently disagree with the headline tab.
  const wagesOverride = isWageLocked ? wageEffective.loadedAnnual : null
  const fixedCostsOverlay  = isFixedCostsLocked  && fixedCostsLock?.values  ? fixedCostsLock.values  : {}
  const officeCostsOverlay = isOfficeCostsLocked && officeCostsLock?.values ? officeCostsLock.values : {}
  const scenarioForecast = (() => {
    if (activeKey === 'custom' && forecastSnapshot) {
      return compute2026Scenario(forecastSnapshot, wagesOverride)
    }
    const uniformGrowth = HACKNEY_SCENARIO_LEVERS.reduce((acc, l) => ({ ...acc, [l.key]: sc.growth }), {})
    return compute2026Scenario({ growth: uniformGrowth, fixedCosts: fixedCostsOverlay, officeCosts: officeCostsOverlay }, wagesOverride)
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
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13, maxWidth:1100, margin:'0 auto' }}>
      {/* Header — eyebrow + note + scenario tabs + workbook link */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:18 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>Cashflow Forecast · May 2026 → Apr 2027</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>Monthly inflows, outflows and cumulative cash position. Rent-free May–Jul 2026 per the new lease; £65k pa rent payable monthly Aug 26 → Apr 27. For the full detailed model see the workbook.</div>
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
