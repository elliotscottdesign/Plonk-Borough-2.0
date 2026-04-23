import React, { useState } from 'react'
import FinancialPerformance, { INCOME, COSTS, MONTHLY_INCOME, MONTHLY_COSTS, DonutChart } from '../slides/FinancialPerformance.jsx'
import ResetBtn from '../components/ResetBtn.jsx'

const TABS = ['Overview','2025 Performance','2026 Performance','Scenarios','Market Context','Wages']

const fmt = n => '£' + Math.round(n).toLocaleString()
const fmtK = n => '£' + Math.round(n/1000) + 'k'

function TabOverview() {
  const months = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr']
  const rev =    [52000,44000,53000,89000,71000,68000,97000,173326,36000,52000,60000,58000]
  const ebitda = [-7000,-4000,5000,23000,17000,15000,30000,98000,-3000,6000,3000,8000]
  const maxRev = Math.max(...rev)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, fontSize:13 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'INVESTMENT ASK', value:'£88,000 inc VAT', sub:'for 36% equity', color:'var(--gold)' },
          { label:'FY2025 ACTUAL REVENUE', value:'£742k', sub:'Verified financial model', color:'#4FC3F7' },
          { label:'FORECAST REVENUE Y1', value:'£853k', sub:'+15.0% on prior year', color:'#2DD4BF' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>Monthly Revenue & EBITDA Forecast · May 2026 – Apr 2027</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:140, marginBottom:8 }}>
          {months.map((m,i) => {
            const tip = `${m} · Revenue ${fmtK(rev[i])} · EBITDA ${fmtK(ebitda[i])}`
            return (
              <div key={m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }} title={tip}>
                <div style={{ width:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end', height:120 }}>
                  <div style={{ width:'100%', background:'#4FC3F7', borderRadius:'2px 2px 0 0', height:Math.max(2,(rev[i]/maxRev)*100)+'px', opacity:0.7 }} title={`${m} · Revenue ${fmtK(rev[i])}`} />
                  <div style={{ width:'100%', background:ebitda[i]>0?'#2DD4BF':'#EF4444', borderRadius:'2px 2px 0 0', height:Math.max(2,(Math.abs(ebitda[i])/maxRev)*100)+'px', marginTop:2 }} title={`${m} · EBITDA ${fmtK(ebitda[i])}`} />
                </div>
                <div style={{ fontSize:9, color:'#6B7280' }}>{m}</div>
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:10, height:10, background:'#4FC3F7', borderRadius:2 }} /><span style={{ fontSize:11, color:'#9CA3AF' }}>Revenue</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:10, height:10, background:'#2DD4BF', borderRadius:2 }} /><span style={{ fontSize:11, color:'#9CA3AF' }}>EBITDA</span></div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'Revenue Split', items:[{label:'Bar & Drinks',pct:49,c:'#1E40AF'},{label:'Activities',pct:28,c:'#2563EB'},{label:'Events & Hire',pct:23,c:'#60A5FA'}] },
          { label:'Y1 Forecast EBITDA', value:'£191k', sub:'22.4% EBITDA margin', color:'#2DD4BF' },
          { label:'Base Case Returns', value:'52.1% CoC', sub:'Cash-on-cash return Year 1', color:'#C9A84C' },
        ].map((s,i) => (
          <div key={i} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
            <div style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>{s.label}</div>
            {s.items ? s.items.map(item => (
              <div key={item.label} style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                  <span style={{ color:'var(--cream)' }}>{item.label}</span>
                  <span style={{ color:item.c, fontWeight:600 }}>{item.pct}%</span>
                </div>
                <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
                  <div style={{ height:'100%', width:item.pct+'%', background:item.c, borderRadius:2 }} />
                </div>
              </div>
            )) : <>
              <div style={{ fontSize:26, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
            </>}
          </div>
        ))}
      </div>
    </div>
  )
}

// 2026 Performance — scenario-adjusted forecast built from the 2025 figures on the
// Financial Performance sheet. Slider (with Bear/Base/Bull markers) drives income and
// costs: wages +10%, fixed +10%, drinks = 30% of bar revenue, hosting fixed £3,492,
// everything else scales with revenue. Palette shifted to teals (income) and purples
// (costs) to read as "forecast" vs the blue/red 2025 actuals.
const INCOME_2026_COLORS = ['#0E7490','#0891B2','#06B6D4','#22D3EE','#67E8F9','#A5F3FC']
const COSTS_2026_COLORS  = ['#4C1D95','#5B21B6','#6D28D9','#7C3AED','#8B5CF6','#A78BFA','#C4B5FD','#DDD6FE','#EDE9FE']
const PERF_GROWTH_MIN = -20
const PERF_GROWTH_MAX = 50
const PERF_MARKERS = [
  { label: 'Bear',   value: -10, color: '#EF4444' },
  { label: '2025',   value:   0, color: '#9CA3AF' },  // flat — same as 2025 actuals
  { label: 'Base',   value:  15, color: '#C9A84C' },
  { label: 'Bull',   value:  25, color: '#22D3EE' },
]
const perfGrowthToPct = g => ((g - PERF_GROWTH_MIN) / (PERF_GROWTH_MAX - PERF_GROWTH_MIN)) * 100

// Per-line growth map: the 4 breakdown sliders (Scenarios) drive 4 specific revenue
// lines. Service Charge + Pool scale by the simple average of the 4 (keeps the old
// "uniform" behaviour when all 4 sliders match).
function buildLineGrowths(g) {
  const avg = (g.bar + g.golf + g.hires + g.events) / 4
  return {
    'Spend at Bar': g.bar,
    'Online Golf Tickets': g.golf,
    'Bookings & Events': g.events,
    'Private Hires': g.hires,
    'Service Charge': avg,
    'Pool Tickets': avg,
  }
}

function TabPerformance({ growth }) {
  const lineGrowths = buildLineGrowths(growth)
  const BASE_TOTAL = INCOME.reduce((s, i) => s + i.value, 0)

  const income2026 = INCOME.map((i, idx) => {
    const g = lineGrowths[i.label] ?? 0
    return {
      label: i.label,
      value: Math.round(i.value * (1 + g / 100)),
      color: INCOME_2026_COLORS[idx] || INCOME_2026_COLORS[INCOME_2026_COLORS.length - 1],
    }
  })
  const totalIncome = income2026.reduce((s, i) => s + i.value, 0)
  const aggGrowth = BASE_TOTAL > 0 ? ((totalIncome - BASE_TOTAL) / BASE_TOTAL) * 100 : 0
  const mult = 1 + aggGrowth / 100   // for non-revenue-specific cost scaling
  const incomeWithPct = income2026.map(i => ({ ...i, pct: +(i.value / totalIncome * 100).toFixed(1) }))

  // Drinks COGS: 30% of bar revenue (2025 actual was 22.5% — models margin compression).
  const barRevenue2026 = income2026.find(x => x.label === 'Spend at Bar')?.value || 0
  const drinksGas2026 = Math.round(barRevenue2026 * 0.30)
  const costsRaw = [
    { label: 'Wages',            value: Math.round(242370 * 1.10), note: '+10% on 2025' },
    { label: 'Fixed Costs',      value: Math.round(165059 * 1.10), note: 'Rent, rates, utilities, insurance, internet, PRS · +10% on 2025' },
    { label: 'Drinks & Gas',     value: drinksGas2026,              note: '30% of bar revenue (2025 actual was 22.5%)' },
    { label: 'VAT (Net)',        value: Math.round(78851 * mult),   note: 'Scales with aggregate revenue' },
    { label: 'Cleaning',         value: Math.round(21842 * mult),   note: 'Scales with aggregate revenue' },
    { label: 'Arcades',          value: Math.round(17152 * mult),   note: 'Scales with aggregate revenue' },
    { label: 'Food',             value: Math.round(9101 * mult),    note: 'Scales with aggregate revenue' },
    { label: 'Hosting (Lithos)', value: 3492,                        note: 'Fixed — SEO/Ads now owned by Plonk Golf' },
    { label: 'Card Charges',     value: Math.round(5443 * mult),    note: 'Scales with aggregate revenue' },
  ]
  const totalCosts = costsRaw.reduce((s, c) => s + c.value, 0)
  const costs2026 = costsRaw.map((c, idx) => ({
    ...c,
    pct: +(c.value / totalCosts * 100).toFixed(1),
    color: COSTS_2026_COLORS[idx] || COSTS_2026_COLORS[COSTS_2026_COLORS.length - 1],
  }))
  const ebitda = totalIncome - totalCosts
  const margin = totalIncome > 0 ? ebitda / totalIncome : 0

  // Monthly 2026 — scale each line by its own growth rate
  const monthlyIncome2026 = MONTHLY_INCOME.map(m => ({
    m: m.m,
    bar:    Math.round(m.bar    * (1 + growth.bar    / 100)),
    golf:   Math.round(m.golf   * (1 + growth.golf   / 100)),
    events: Math.round(m.events * (1 + growth.events / 100)),
    hire:   Math.round(m.hire   * (1 + growth.hires  / 100)),
    sc:     Math.round(m.sc     * mult),
    pool:   Math.round(m.pool   * mult),
  }))
  const monthlyCosts2026 = MONTHLY_COSTS.map(m => {
    const mi = MONTHLY_INCOME.find(x => x.m === m.m)
    const mthBar2026 = mi ? Math.round(mi.bar * (1 + growth.bar / 100)) : 0
    return {
      m: m.m,
      wages: Math.round(m.wages * 1.10),
      fixed: Math.round(m.fixed * 1.10),
      drinks: Math.round(mthBar2026 * 0.30),
      vat: Math.round(m.vat * mult),
      other: Math.round((m.other || m.vat2 || 0) * mult),
    }
  })

  // Displayed slider value = aggregate growth (rounded). Dragging the slider snaps
  // all four breakdown sliders to that value — acts as a "uniform growth" shortcut.
  const sliderValue = Math.round(aggGrowth)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      {/* Slider card — stays at the top of the page per spec */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div>
            <div style={{ fontSize:11, color:'#22D3EE', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:2 }}>2026 Performance · Scenario-adjusted forecast</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>Aggregate of the four growth levers in Scenarios (Bar · Golf · Hires · Events). Dragging this slider snaps all four to the same value. Wages +10%, Fixed +10%, Drinks = 30% of bar, Hosting fixed, everything else scales.</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#22D3EE', minWidth:48, textAlign:'right' }}>{sliderValue>0?'+':''}{sliderValue}%</span>
            <ResetBtn onClick={()=>growth.setAll(15)} title="Reset all four levers to +15% (Base)" />
          </div>
        </div>
        <div style={{ position:'relative', marginTop:14, padding:'4px 0 26px' }}>
          <input type="range" min={PERF_GROWTH_MIN} max={PERF_GROWTH_MAX} value={sliderValue} onChange={e=>growth.setAll(Number(e.target.value))} style={{ width:'100%', accentColor:'#22D3EE' }} />
          {PERF_MARKERS.map(mk => (
            <button key={mk.label} onClick={()=>growth.setAll(mk.value)} style={{
              position:'absolute', left:`calc(${perfGrowthToPct(mk.value)}% - 26px)`, top:28,
              width:52, padding:'2px 0', borderRadius:3, cursor:'pointer',
              background: sliderValue === mk.value ? mk.color : 'transparent',
              border: `1px solid ${mk.color}`,
              color: sliderValue === mk.value ? '#0A0A0F' : mk.color,
              fontSize:10, fontWeight:700, letterSpacing:'0.05em', textAlign:'center', transition:'all 0.15s',
            }}>{mk.label} {mk.value>0?'+':''}{mk.value}%</button>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#6B7280', marginTop:2, padding:'0 2px' }}>
            <span>{PERF_GROWTH_MIN}%</span>
            <span>+{PERF_GROWTH_MAX}%</span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:20 }}>
          <KpiCard2026 label="Adjusted Revenue" value={fmtK(totalIncome)} color="#22D3EE" />
          <KpiCard2026 label="Adjusted EBITDA" value={fmtK(ebitda)} sub={`${(margin*100).toFixed(1)}% margin`} color={ebitda > 0 ? '#A78BFA' : '#EF4444'} />
          <KpiCard2026 label="Total Costs" value={fmtK(totalCosts)} color="#8B5CF6" />
        </div>
      </div>

      {/* 2-column income / costs — donut + list + monthly stacked bar on each side */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
            <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>Income · 2026 Forecast</div>
            <div style={{ fontSize:13, color:'#22D3EE', fontWeight:600 }}>{fmt(totalIncome)}</div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <DonutChart data={incomeWithPct} total={totalIncome} size={200} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {incomeWithPct.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width:10, height:10, borderRadius:2, background:item.color, flexShrink:0 }} />
                <div style={{ flex:1, fontSize:13, color:'#D1D5DB' }}>{item.label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#F5F0E8', minWidth:76, textAlign:'right' }}>{fmt(item.value)}</div>
                <div style={{ fontSize:12, color:'#6B7280', minWidth:40, textAlign:'right' }}>{item.pct}%</div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 4px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#F5F0E8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Income</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#22D3EE' }}>{fmt(totalIncome)}</div>
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:10, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Monthly Income 2026 — Scaled</div>
            <Stacked2026 monthly={monthlyIncome2026} kind="income" maxH={120} />
          </div>
        </div>

        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
            <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>Operating Costs · 2026 Forecast</div>
            <div style={{ fontSize:13, color:'#A78BFA', fontWeight:600 }}>{fmt(totalCosts)}</div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <DonutChart data={costs2026} total={totalCosts} size={200} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {costs2026.map((item, i) => (
              <div key={i} style={{ padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:item.color, flexShrink:0 }} />
                  <div style={{ flex:1, fontSize:13, color:'#D1D5DB' }}>{item.label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#F5F0E8', minWidth:76, textAlign:'right' }}>{fmt(item.value)}</div>
                  <div style={{ fontSize:12, color:'#6B7280', minWidth:40, textAlign:'right' }}>{item.pct}%</div>
                </div>
                {item.note && <div style={{ fontSize:11, color:'#6B7280', paddingLeft:20, marginTop:2 }}>{item.note}</div>}
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 4px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#F5F0E8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Costs</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#A78BFA' }}>{fmt(totalCosts)}</div>
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:10, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Monthly Costs 2026 — Scaled</div>
            <Stacked2026 monthly={monthlyCosts2026} kind="costs" maxH={120} />
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard2026({ label, value, sub, color }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${color}40`, borderRadius:8, padding:'12px 16px' }}>
      <div style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#9CA3AF', marginTop:4 }}>{sub}</div>}
    </div>
  )
}

function Stacked2026({ monthly, kind, maxH=120 }) {
  const palette = kind === 'income'
    ? ['#0E7490','#0891B2','#06B6D4','#22D3EE','#67E8F9','#A5F3FC']
    : ['#4C1D95','#6D28D9','#8B5CF6','#A78BFA','#C4B5FD']
  const LABELS = kind === 'income'
    ? ['Spend at Bar','Online Golf Tickets','Bookings & Events','Private Hires','Service Charge','Pool Tickets']
    : ['Wages','Fixed Costs','Drinks & Gas','VAT (Net)','Other']
  const getSegs = m => kind === 'income'
    ? [{ v:m.bar, c:palette[0] },{ v:m.golf, c:palette[1] },{ v:m.events, c:palette[2] },{ v:m.hire, c:palette[3] },{ v:m.sc, c:palette[4] },{ v:m.pool, c:palette[5] }]
    : [{ v:m.wages, c:palette[0] },{ v:m.fixed, c:palette[1] },{ v:m.drinks, c:palette[2] },{ v:m.vat, c:palette[3] },{ v:m.other, c:palette[4] }]
  const total = m => getSegs(m).reduce((s, x) => s + (x.v || 0), 0)
  const maxVal = Math.max(...monthly.map(total))
  const fmtTip = n => '£' + Math.round(n).toLocaleString()
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:maxH }}>
      {monthly.map((m,i) => {
        const t = total(m)
        const h = Math.round((t / maxVal) * maxH)
        const segs = getSegs(m)
        const monthTip = `${m.m} · Total ${fmtTip(t)}\n` + segs.map((s, k) => `  ${LABELS[k]}: ${fmtTip(s.v)}`).join('\n')
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', height:maxH }} title={monthTip}>
            <div style={{ width:'100%', height:h, display:'flex', flexDirection:'column', borderRadius:'2px 2px 0 0', overflow:'hidden' }}>
              {segs.map((s,j) => <div key={j} style={{ height:`${t > 0 ? (s.v / t) * 100 : 0}%`, background:s.c }} title={`${m.m} · ${LABELS[j]}: ${fmtTip(s.v)}`} />)}
            </div>
            <div style={{ fontSize:9, color:'#6B7280', textAlign:'center', marginTop:2 }}>{m.m}</div>
          </div>
        )
      })}
    </div>
  )
}

// Helper — applies the 2026 cost rules (wages +10pct, fixed +10pct, drinks 30pct of bar,
// hosting fixed, everything else scales with aggregate revenue) and returns the full
// scenario: revenue, operating profit, investor return (36.05pct pro-rata), CoC.
function computeScenario({ barG, golfG, eventsG, hiresG, opexMult = 1 }) {
  const avg = (barG + golfG + eventsG + hiresG) / 4
  const bar = 362836 * (1 + barG / 100)
  const golf = 210485 * (1 + golfG / 100)
  const events = 106023 * (1 + eventsG / 100)
  const hires = 44999 * (1 + hiresG / 100)
  const sc = 15102 * (1 + avg / 100)
  const pool = 2198 * (1 + avg / 100)
  const revenue = bar + golf + events + hires + sc + pool
  const mult = revenue / 741644 // aggregate growth multiplier

  const costs =
    242370 * 1.10                 // wages +10pct
    + 165059 * 1.10               // fixed +10pct
    + bar * 0.30                  // drinks = 30pct of bar
    + 78851 * mult                // VAT
    + 21842 * mult                // cleaning
    + 17152 * mult                // arcades
    + 9101 * mult                 // food
    + 3492                        // hosting fixed
    + 5443 * mult                 // card charges

  const adjustedCosts = costs * opexMult
  const profit = revenue - adjustedCosts
  const investorReturn = Math.max(0, profit) * 0.3605
  const coc = investorReturn / 88000 * 100
  return { revenue, profit, investorReturn, coc }
}

function TabScenarios({ growth }) {
  const [opex, setOpex] = useState(100)

  const sliders = [
    { key:'bar',    label:'Bar Increase',         value: growth.bar,    set: growth.setBar,    color:'#1D4ED8', base: 362836 },
    { key:'golf',   label:'Golf Ticket Increase', value: growth.golf,   set: growth.setGolf,   color:'#2563EB', base: 210485 },
    { key:'hires',  label:'Private Hires',        value: growth.hires,  set: growth.setHires,  color:'#3B82F6', base:  44999 },
    { key:'events', label:'Regular Events',       value: growth.events, set: growth.setEvents, color:'#60A5FA', base: 106023 },
  ]

  // Custom scenario = actual live state from the 4 sliders + OpEx overlay
  const custom = computeScenario({
    barG: growth.bar, golfG: growth.golf, eventsG: growth.events, hiresG: growth.hires,
    opexMult: opex / 100,
  })
  // Preset scenarios — uniform growth across all 4 levers, no OpEx overlay
  const buildPreset = pct => computeScenario({ barG: pct, golfG: pct, eventsG: pct, hiresG: pct })
  const presets = [
    { label:'CONSERVATIVE', pct:-10, ...buildPreset(-10) },
    { label:'BASE CASE',    pct: 15, ...buildPreset(15)  },
    { label:'OPTIMISTIC',   pct: 25, ...buildPreset(25)  },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      {/* 4 growth levers + OpEx */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Build Custom Scenario</div>
          <div style={{ fontSize:11, color:'#9CA3AF' }}>These four levers also drive the main 2026 Performance slider</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:16 }}>
          {sliders.map(s => (
            <div key={s.key}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                <span style={{ color:'var(--cream)' }}>{s.label} <span style={{ color:'#6B7280', marginLeft:4 }}>(2025: {fmtK(s.base)})</span></span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:s.color, fontWeight:600 }}>{s.value>0?'+':''}{s.value}%</span>
                  <ResetBtn onClick={()=>s.set(15)} title="Reset to +15%" />
                </span>
              </div>
              <input type="range" min={-20} max={50} value={s.value} onChange={e=>s.set(Number(e.target.value))} style={{ width:'100%', accentColor:s.color }} />
              <div style={{ fontSize:10, color:'#6B7280', marginTop:3 }}>New: {fmtK(s.base * (1 + s.value / 100))}</div>
            </div>
          ))}
        </div>
        {/* OpEx overlay — only affects the Custom card */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
            <span style={{ color:'var(--cream)' }}>OpEx vs Budget <span style={{ color:'#6B7280', marginLeft:4 }}>(costs multiplier for the Custom card only)</span></span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <span style={{ color:'#EA580C', fontWeight:600 }}>{opex}%</span>
              <ResetBtn onClick={()=>setOpex(100)} title="Reset to 100%" />
            </span>
          </div>
          <input type="range" min={70} max={130} value={opex} onChange={e=>setOpex(Number(e.target.value))} style={{ width:'100%', accentColor:'#EA580C' }} />
        </div>
      </div>

      {/* Preset + custom cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {presets.map(p => (
          <button key={p.label} onClick={()=>growth.setAll(p.pct)} title={`Apply ${p.pct>0?'+':''}${p.pct}% across all four levers`} style={{
            background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:16, cursor:'pointer', textAlign:'left', transition:'all 0.15s',
          }}>
            <div style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4, fontWeight:600 }}>{p.label}</div>
            <div style={{ fontSize:10, color:'#6B7280', marginBottom:10 }}>{p.pct>0?'+':''}{p.pct}% across all levers · click to apply</div>
            {[['Revenue',fmtK(p.revenue)],['Op Profit',fmtK(p.profit)],['Investor Return',fmt(Math.round(p.investorReturn))],['Cash-on-Cash',p.coc.toFixed(1)+'%']].map(([l,v],j) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:12 }}>
                <span style={{ color:'#9CA3AF' }}>{l}</span>
                <span style={{ color:j===3?'#2DD4BF':'var(--cream)', fontWeight:j===3?700:400 }}>{v}</span>
              </div>
            ))}
          </button>
        ))}
        <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, padding:16 }}>
          <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4, fontWeight:600 }}>CUSTOM</div>
          <div style={{ fontSize:10, color:'#6B7280', marginBottom:10 }}>Live from sliders above · OpEx {opex}%</div>
          {[['Revenue',fmtK(custom.revenue)],['Op Profit',fmtK(custom.profit)],['Investor Return',fmt(Math.round(custom.investorReturn))],['Cash-on-Cash',custom.coc.toFixed(1)+'%']].map(([l,v],j) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:12 }}>
              <span style={{ color:'#9CA3AF' }}>{l}</span>
              <span style={{ color:j===3?'#2DD4BF':'var(--cream)', fontWeight:j===3?700:400 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabMarketContext() {
  const tailwinds = [
    { icon:'📱', title:'Social Media Discovery', text:'Experiential venues generate organic UGC at 5× the rate of traditional hospitality. Plonk’s visual format drives free acquisition.' },
    { icon:'🏢', title:'Corporate Demand', text:'Post-pandemic, team-building and offsites are structural demand. City of London proximity means Plonk Borough targets this without incremental spend.' },
    { icon:'💰', title:'Recession Resilience', text:'Domestic leisure spend is sticky. Experience venues priced below £30/head replace overseas alternatives during economic downturns.' },
    { icon:'🎂', title:'Occasions & Celebrations', text:'Birthday, hen and stag parties are high-value bookings with structured spend. Activity venues capture the full occasion — entry, drinks and food.' },
    { icon:'🔄', title:'Repeat Visit Model', text:'Multi-activity format with regular event programme drives repeat visitation. Bar-led experience venues see 2–3× the repeat rate of single-activity venues.' },
    { icon:'📈', title:'Pricing Power', text:'+£1 across pool and golf at current volumes generates ~£15K incremental annual profit. Zero capex, zero churn risk at this price point.' },
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { value:'+31.1%', label:'Experience Leisure Growth', sub:'2025 YoY — fastest growing hospitality sub-sector', color:'#2DD4BF' },
          { value:'15–20M', label:'Borough Market Visitors', sub:'Annual visitors to the area', color:'#4FC3F7' },
          { value:'130K+', label:'London Bridge Commuters', sub:'Daily station passengers — primary catchment', color:'#C9A84C' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, marginBottom:6 }}>{s.value}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--cream)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>SE1 Demographics</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[['Aged 25–44','48%','#4FC3F7'],['Median HH Income','£57K','#C9A84C'],['Uni-educated','62%','#2DD4BF'],['Office workers','71%','#8B5CF6']].map(([l,v,c]) => (
            <div key={l} style={{ textAlign:'center', padding:14, background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
              <div style={{ fontSize:20, fontWeight:700, color:c, marginBottom:4 }}>{v}</div>
              <div style={{ fontSize:11, color:'#9CA3AF' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Tailwinds & Positioning</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {tailwinds.map(t => (
            <div key={t.title} style={{ display:'flex', gap:12, padding:14, background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
              <div style={{ fontSize:20, flexShrink:0 }}>{t.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--cream)', marginBottom:4 }}>{t.title}</div>
                <div style={{ fontSize:12, color:'#9CA3AF', lineHeight:1.5 }}>{t.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabWages() {
  const [barRate, setBarRate] = useState(13.85)
  const [supRate, setSupRate] = useState(14.35)
  const [amRate, setAmRate] = useState(15.38)
  const [mgrRate, setMgrRate] = useState(18.00)
  const roles = [
    { label:'Bar Staff', hours:4967, rate:barRate, setRate:setBarRate, plan:13.85, min:12.21, max:18 },
    { label:'Supervisor', hours:2156, rate:supRate, setRate:setSupRate, plan:14.35, min:13.85, max:20 },
    { label:'Asst Manager', hours:1847, rate:amRate, setRate:setAmRate, plan:15.38, min:14.35, max:22 },
    { label:'Manager', hours:1073, rate:mgrRate, setRate:setMgrRate, plan:18.00, min:15.38, max:25 },
  ]
  const totalWages = Math.round(roles.reduce((s,r)=>s+r.hours*r.rate,0))
  const planWages = 242370
  const delta = totalWages - planWages
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'Total Wage Bill 2025', value:fmt(242370), sub:'Verified rota data', color:'#C9A84C' },
          { label:'Total Hours Worked', value:'10,043 hrs', sub:'23 employees · fully tagged roles', color:'#4FC3F7' },
          { label:'Wages as % Revenue', value:'20.8%', sub:'£242,370 ÷ £741,644 · target ≤22%', color:'#2DD4BF' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Sliding Wage Rate Calculator — 2026 Planning</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:16 }}>
          {roles.map(r => (
            <div key={r.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontWeight:600, color:'var(--cream)' }}>{r.label}</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'var(--gold)', fontWeight:700 }}>£{r.rate.toFixed(2)}/hr</span>
                  <ResetBtn onClick={()=>r.setRate(r.plan)} title={`Reset to £${r.plan.toFixed(2)}/hr`} />
                </span>
              </div>
              <input type="range" min={r.min} max={r.max} step={0.01} value={r.rate} onChange={e=>r.setRate(Number(e.target.value))} style={{ width:'100%', accentColor:'var(--gold)', marginBottom:6 }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#6B7280' }}>
                <span>{r.hours.toLocaleString()} hrs</span>
                <span>Annual: {fmt(Math.round(r.hours*r.rate))}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>Projected Wage Bill</div>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--gold)' }}>{fmt(totalWages)}</div>
          </div>
          <div style={{ background:delta>0?'rgba(239,68,68,0.08)':'rgba(45,212,191,0.08)', border:`1px solid ${delta>0?'rgba(239,68,68,0.2)':'rgba(45,212,191,0.2)'}`, borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>Delta vs 2025</div>
            <div style={{ fontSize:20, fontWeight:800, color:delta>0?'#EF4444':'#2DD4BF' }}>{delta>0?'+':''}{fmt(delta)}</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>Wages % Forecast</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#4FC3F7' }}>{(totalWages/852891*100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BusinessExplorer() {
  const [tab, setTab] = useState('Overview')

  // Shared 2026 growth state — the four line-specific growth levers drive both the
  // 2026 Performance tab's main slider (which displays the aggregate) and the
  // Scenarios tab's breakdown sliders. Keeps them synced so one surface informs the other.
  const [barGrowth, setBarGrowth]       = useState(15)
  const [golfGrowth, setGolfGrowth]     = useState(15)
  const [hiresGrowth, setHiresGrowth]   = useState(15)
  const [eventsGrowth, setEventsGrowth] = useState(15)
  const setAllGrowth = v => {
    setBarGrowth(v); setGolfGrowth(v); setHiresGrowth(v); setEventsGrowth(v)
  }
  const growth = {
    bar: barGrowth, setBar: setBarGrowth,
    golf: golfGrowth, setGolf: setGolfGrowth,
    hires: hiresGrowth, setHires: setHiresGrowth,
    events: eventsGrowth, setEvents: setEventsGrowth,
    setAll: setAllGrowth,
  }

  const tabComponents = {
    'Overview': <TabOverview />,
    '2025 Performance': <FinancialPerformance />,
    '2026 Performance': <TabPerformance growth={growth} />,
    'Scenarios': <TabScenarios growth={growth} />,
    'Market Context': <TabMarketContext />,
    'Wages': <TabWages />,
  }
  return (
    <div style={{ minHeight:'100%', background:'var(--ink)', color:'var(--cream)' }}>
      <div style={{ padding:'20px 32px 0', borderBottom:'1px solid rgba(201,168,76,0.12)' }}>
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 16px', fontSize:11, cursor:'pointer', border:'none', background:'transparent', letterSpacing:'0.06em', textTransform:'uppercase', borderBottom:`2px solid ${tab===t?'var(--gold)':'transparent'}`, color:tab===t?'var(--gold)':'var(--cream-dim)', transition:'all 0.15s', whiteSpace:'nowrap' }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:'24px 32px 24px', fontSize:13 }}>{tabComponents[tab]}</div>
      <div style={{ padding:'20px 32px 32px', borderTop:'1px solid rgba(201,168,76,0.12)', marginTop:12 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>No Dice Borough Ltd</div>
        <div style={{ fontSize:14, color:'var(--cream-dim)' }}>Business Explorer · Borough Market SE1</div>
      </div>
    </div>
  )
}