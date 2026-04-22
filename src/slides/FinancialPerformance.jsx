import React, { useState } from 'react'
import {
  IP_LICENSING_SKUS_ONLINE_2025,
  IP_LICENSING_SKUS_OFFICE_2025,
  IP_LICENSING_MONTHLY_2025,
  IP_LICENSING_GRAND_2025,
} from '../data.js'

const INCOME = [
  { label:'Spend at Bar', value:362836, pct:48.9, color:'#1E40AF' },
  { label:'Online Golf Tickets', value:210485, pct:28.4, color:'#1D4ED8' },
  { label:'Bookings & Events', value:106023, pct:14.3, color:'#2563EB' },
  { label:'Private Hires', value:44999, pct:6.1, color:'#3B82F6' },
  { label:'Service Charge', value:15102, pct:2.0, color:'#60A5FA' },
  { label:'Pool Tickets', value:2198, pct:0.3, color:'#93C5FD' },
]

const COSTS = [
  { label:'Wages', value:242370, pct:38.4, color:'#991B1B', note:null },
  { label:'Fixed Costs', value:165059, pct:26.2, color:'#B91C1C', note:'Rent, rates, electricity, insurance, internet, PRS' },
  { label:'Drinks & Gas', value:81732, pct:13.0, color:'#DC2626', note:null },
  { label:'VAT (Net)', value:78851, pct:12.5, color:'#EF4444', note:'Net VAT paid to HMRC — VAT collected minus VAT reclaimed on purchases' },
  { label:'Cleaning', value:21842, pct:3.5, color:'#F87171', note:null },
  { label:'Arcades', value:17152, pct:2.7, color:'#EA580C', note:null },
  { label:'Food', value:9101, pct:1.4, color:'#F97316', note:null },
  { label:'Google/Digital', value:8918, pct:1.4, color:'#FB923C', note:'2025 historical Lithos/Google spend · under new IP & Licensing model all ad/SEO spend sits with Plonk Golf from 2026' },
  { label:'Card Charges', value:5443, pct:0.9, color:'#FCD34D', note:null },
]

const MONTHLY_INCOME = [
  { m:'Jan', bar:19305, golf:13455, events:7612, hire:2890, sc:1205, pool:183 },
  { m:'Feb', bar:17820, golf:12690, events:7014, hire:2665, sc:1112, pool:169 },
  { m:'Mar', bar:21560, golf:15234, events:8421, hire:3198, sc:1334, pool:203 },
  { m:'Apr', bar:20890, golf:14765, events:8156, hire:3098, sc:1292, pool:197 },
  { m:'May', bar:21438, golf:15156, events:8369, hire:3178, sc:1326, pool:202 },
  { m:'Jun', bar:18643, golf:13180, events:7281, hire:2766, sc:1154, pool:176 },
  { m:'Jul', bar:22145, golf:15659, events:8649, hire:3285, sc:1371, pool:209 },
  { m:'Aug', bar:36842, golf:26047, events:14387, hire:5466, sc:2282, pool:347 },
  { m:'Sep', bar:29340, golf:20751, events:11456, hire:4351, sc:1816, pool:276 },
  { m:'Oct', bar:28105, golf:19878, events:10974, hire:4168, sc:1739, pool:265 },
  { m:'Nov', bar:39975, golf:28264, events:15605, hire:5929, sc:2474, pool:376 },
  { m:'Dec', bar:59575, golf:34624, events:17442, hire:7399, sc:2497, pool:366 },
]

const MONTHLY_COSTS = [
  { m:'Jan', wages:20185, fixed:13755, drinks:6811, vat:6571, other:4278 },
  { m:'Feb', wages:18620, fixed:13755, drinks:6284, vat:6063, other:3948 },
  { m:'Mar', wages:22490, fixed:13755, drinks:7590, vat:7327, other:4773 },
  { m:'Apr', wages:21780, fixed:13755, drinks:7350, vat:7095, other:4623 },
  { m:'May', wages:22340, fixed:13755, drinks:7539, vat:7278, other:4742 },
  { m:'Jun', wages:19450, fixed:13755, drinks:6561, vat:6334, vat2:4127 },
  { m:'Jul', wages:23100, fixed:13755, drinks:7796, vat:7526, other:4902 },
  { m:'Aug', wages:38450, fixed:13755, drinks:12976, vat:12527, other:8160 },
  { m:'Sep', wages:30620, fixed:13755, drinks:10331, vat:9980, other:6502 },
  { m:'Oct', wages:29330, fixed:13755, drinks:9901, vat:9565, other:6232 },
  { m:'Nov', wages:41770, fixed:13755, drinks:14098, vat:13616, other:8873 },
  { m:'Dec', wages:62205, fixed:13755, drinks:20995, vat:20270, other:13207 },
]

const fmt = n => '£' + n.toLocaleString()
const fmtK = n => '£' + Math.round(n/1000) + 'k'

function DonutChart({ data, total, size=200 }) {
  const cx = size/2, cy = size/2, r = size*0.42, inner = size*0.26
  let angle = -Math.PI/2
  const slices = data.map((d,i) => {
    const slice = (d.value/total)*Math.PI*2
    const x1 = cx+r*Math.cos(angle), y1 = cy+r*Math.sin(angle)
    angle += slice
    const x2 = cx+r*Math.cos(angle), y2 = cy+r*Math.sin(angle)
    const large = slice > Math.PI ? 1 : 0
    return <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={d.color} stroke="#0A0A0F" strokeWidth={1} />
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices}
      <circle cx={cx} cy={cy} r={inner} fill="#0A0A0F" />
    </svg>
  )
}

function StackedBar({ monthly, maxH=120 }) {
  const maxVal = Math.max(...monthly.map(m => m.bar+m.golf+m.events+m.hire+m.sc+m.pool))
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:maxH }}>
      {monthly.map((m,i) => {
        const total = m.bar+m.golf+m.events+m.hire+m.sc+m.pool
        const h = Math.round((total/maxVal)*maxH)
        const segs = [
          { v:m.bar, c:'#1E40AF' }, { v:m.golf, c:'#1D4ED8' }, { v:m.events, c:'#2563EB' },
          { v:m.hire, c:'#3B82F6' }, { v:m.sc, c:'#60A5FA' }, { v:m.pool, c:'#93C5FD' }
        ]
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', height:maxH }}>
            <div style={{ width:'100%', height:h, display:'flex', flexDirection:'column', borderRadius:'2px 2px 0 0', overflow:'hidden' }}>
              {segs.map((s,j) => <div key={j} style={{ height:`${(s.v/total)*100}%`, background:s.c }} />)}
            </div>
            <div style={{ fontSize:9, color:'#6B7280', textAlign:'center', marginTop:2 }}>{m.m}</div>
          </div>
        )
      })}
    </div>
  )
}

function CostStackedBar({ monthly, maxH=120 }) {
  const maxVal = Math.max(...monthly.map(m => (m.wages||0)+(m.fixed||0)+(m.drinks||0)+(m.vat||0)+(m.other||m.vat2||0)))
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:maxH }}>
      {monthly.map((m,i) => {
        const total = (m.wages||0)+(m.fixed||0)+(m.drinks||0)+(m.vat||0)+(m.other||m.vat2||0)
        const h = Math.round((total/maxVal)*maxH)
        const segs = [
          { v:m.wages||0, c:'#991B1B' }, { v:m.fixed||0, c:'#B91C1C' },
          { v:m.drinks||0, c:'#DC2626' }, { v:m.vat||0, c:'#EF4444' }, { v:m.other||m.vat2||0, c:'#F87171' }
        ]
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', height:maxH }}>
            <div style={{ width:'100%', height:h, display:'flex', flexDirection:'column', borderRadius:'2px 2px 0 0', overflow:'hidden' }}>
              {segs.map((s,j) => <div key={j} style={{ height:`${total>0?(s.v/total)*100:0}%`, background:s.c }} />)}
            </div>
            <div style={{ fontSize:9, color:'#6B7280', textAlign:'center', marginTop:2 }}>{m.m}</div>
          </div>
        )
      })}
    </div>
  )
}

// --- Ticket breakdown (online vs office, Borough 2025) — from IP & Licensing dataset ---
function ChannelBars({ rows, accent, maxRev }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {rows.filter(r => r.sold > 0).map(r => {
        const w = (r.revenue / maxRev) * 100
        return (
          <div key={r.sku}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#D1D5DB', marginBottom:3 }}>
              <span style={{ flex:1, paddingRight:8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.sku}</span>
              <span style={{ color:'#9CA3AF', marginRight:8 }}>{r.sold.toLocaleString()}</span>
              <span style={{ color: accent, fontWeight:600, minWidth:62, textAlign:'right' }}>{fmt(r.revenue)}</span>
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
              <div style={{ height:'100%', width: w + '%', background: accent, borderRadius:2 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- 2026 FORECAST SECTION -----------------------------------------------
// Scenario-adjusted projection from 2025 actuals. Revenue growth slider drives
// every income + cost line. Bear / Base / Bull markers jump to -10% / +15% / +25%.
// Palette shifted to teals (income) and purples (costs) to distinguish from 2025.

const INCOME_2026_COLORS = ['#0E7490','#0891B2','#06B6D4','#22D3EE','#67E8F9','#A5F3FC']
const COSTS_2026_COLORS  = ['#4C1D95','#5B21B6','#6D28D9','#7C3AED','#8B5CF6','#A78BFA','#C4B5FD','#DDD6FE','#EDE9FE']
const GROWTH_MIN = -20
const GROWTH_MAX = 50
const MARKERS = [
  { label: 'Bear', value: -10, color: '#EF4444' },
  { label: 'Base', value:  15, color: '#C9A84C' },
  { label: 'Bull', value:  25, color: '#22D3EE' },
]
const growthToPct = g => ((g - GROWTH_MIN) / (GROWTH_MAX - GROWTH_MIN)) * 100

function Forecast2026({ mode }) {
  const [growth, setGrowth] = useState(15)
  const mult = 1 + growth / 100

  // Income 2026 — scale each 2025 line uniformly
  const income2026 = INCOME.map((i, idx) => ({
    label: i.label,
    value: Math.round(i.value * mult),
    color: INCOME_2026_COLORS[idx] || INCOME_2026_COLORS[INCOME_2026_COLORS.length - 1],
  }))
  const totalIncome = income2026.reduce((s, i) => s + i.value, 0)
  const incomeWithPct = income2026.map(i => ({ ...i, pct: +(i.value / totalIncome * 100).toFixed(1) }))

  // Costs 2026 per user-specified rules
  // Drinks COGS: 30% of bar revenue ("cost of sale for drinks at 30% of revenue" — bar revenue
  // is the drinks revenue line; 2025 actual was 22.5% so this represents ~7pp margin compression).
  const barRevenue2026 = income2026.find(x => x.label === 'Spend at Bar')?.value || 0
  const drinksGas2026 = Math.round(barRevenue2026 * 0.30)
  const costsRaw = [
    { label: 'Wages',            value: Math.round(242370 * 1.10), note: '+10% on 2025' },
    { label: 'Fixed Costs',      value: Math.round(165059 * 1.10), note: 'Rent, rates, utilities, insurance, internet, PRS · +10% on 2025 (rent same, other fixed lines inflated 10%)' },
    { label: 'Drinks & Gas',     value: drinksGas2026,              note: '30% of bar revenue (2025 actual was 22.5%)' },
    { label: 'VAT (Net)',        value: Math.round(78851 * mult),   note: 'Scales with revenue' },
    { label: 'Cleaning',         value: Math.round(21842 * mult),   note: 'Scales with revenue' },
    { label: 'Arcades',          value: Math.round(17152 * mult),   note: 'Scales with revenue' },
    { label: 'Food',             value: Math.round(9101 * mult),    note: 'Scales with revenue' },
    { label: 'Hosting (Lithos)', value: 3492,                        note: 'Fixed — SEO/Ads now owned by Plonk Golf, hosting-only Lithos line stays' },
    { label: 'Card Charges',     value: Math.round(5443 * mult),    note: 'Scales with revenue' },
  ]
  const totalCosts = costsRaw.reduce((s, c) => s + c.value, 0)
  const costs2026 = costsRaw.map((c, idx) => ({
    ...c,
    pct: +(c.value / totalCosts * 100).toFixed(1),
    color: COSTS_2026_COLORS[idx] || COSTS_2026_COLORS[COSTS_2026_COLORS.length - 1],
  }))

  const ebitda = totalIncome - totalCosts
  const margin = totalIncome > 0 ? ebitda / totalIncome : 0

  // Monthly 2026 — scale each line
  const monthlyIncome2026 = MONTHLY_INCOME.map(m => ({
    m: m.m,
    bar: Math.round(m.bar * mult),
    golf: Math.round(m.golf * mult),
    events: Math.round(m.events * mult),
    hire: Math.round(m.hire * mult),
    sc: Math.round(m.sc * mult),
    pool: Math.round(m.pool * mult),
  }))
  const monthlyCosts2026 = MONTHLY_COSTS.map(m => {
    const mi = MONTHLY_INCOME.find(x => x.m === m.m)
    const mthBar2026 = mi ? Math.round(mi.bar * mult) : 0
    return {
      m: m.m,
      wages: Math.round(m.wages * 1.10),
      fixed: Math.round(m.fixed * 1.10),
      drinks: Math.round(mthBar2026 * 0.30),   // 30% of monthly bar revenue
      vat: Math.round(m.vat * mult),
      other: Math.round((m.other || m.vat2 || 0) * mult),
    }
  })

  return (
    <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid rgba(201,168,76,0.2)' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:11, color:'#22D3EE', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>2026 Forecast · Scenario-adjusted</div>
          <div style={{ fontSize:13, color:'#9CA3AF' }}>Drag the growth lever or click Bear / Base / Bull · costs follow the rules: wages +10%, fixed costs +10%, drinks = 30% of revenue, everything else scales</div>
        </div>
        <div style={{ fontSize:13, color:'#22D3EE', fontWeight:700 }}>{growth > 0 ? '+' : ''}{growth}% vs 2025</div>
      </div>

      {/* Slider + Bear/Base/Bull markers */}
      <div style={{ position:'relative', marginBottom:28, padding:'4px 0 24px' }}>
        <input
          type="range" min={GROWTH_MIN} max={GROWTH_MAX} value={growth}
          onChange={e => setGrowth(Number(e.target.value))}
          style={{ width:'100%', accentColor:'#22D3EE' }}
        />
        {/* Tick labels */}
        {MARKERS.map(mk => (
          <button key={mk.label} onClick={() => setGrowth(mk.value)} style={{
            position:'absolute', left:`calc(${growthToPct(mk.value)}% - 24px)`, top:28,
            width:48, padding:'2px 0', borderRadius:3, cursor:'pointer',
            background: growth === mk.value ? mk.color : 'transparent',
            border: `1px solid ${mk.color}`,
            color: growth === mk.value ? '#0A0A0F' : mk.color,
            fontSize:10, fontWeight:700, letterSpacing:'0.05em', textAlign:'center',
            transition:'all 0.15s',
          }}>{mk.label} {mk.value > 0 ? '+' : ''}{mk.value}%</button>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#6B7280', marginTop:2, padding:'0 2px' }}>
          <span>{GROWTH_MIN}%</span>
          <span>+{GROWTH_MAX}%</span>
        </div>
      </div>

      {/* Headline KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        <KpiCard label="Adjusted Revenue" value={fmt(totalIncome)} color="#22D3EE" />
        <KpiCard label="Adjusted EBITDA" value={fmt(ebitda)} sub={`${(margin*100).toFixed(1)}% margin`} color={ebitda > 0 ? '#A78BFA' : '#EF4444'} />
        <KpiCard label="Total Costs" value={fmt(totalCosts)} color="#8B5CF6" />
      </div>

      {/* Two-column Income / Costs — mirrors 2025 layout above */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* LEFT: 2026 Income */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16 }}>
            <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>Income · 2026 Forecast</div>
            <div style={{ fontSize:13, color:'#22D3EE', fontWeight:600 }}>{fmt(totalIncome)}</div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
            <DonutChart data={incomeWithPct} total={totalIncome} size={220} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {incomeWithPct.map((item,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width:10, height:10, borderRadius:2, background:item.color, flexShrink:0 }} />
                <div style={{ flex:1, fontSize:13, color:'#D1D5DB' }}>{item.label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#F5F0E8', minWidth:80, textAlign:'right' }}>{fmt(item.value)}</div>
                <div style={{ fontSize:12, color:'#6B7280', minWidth:40, textAlign:'right' }}>{item.pct}%</div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', marginTop:4 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#F5F0E8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Income</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#22D3EE' }}>{fmt(totalIncome)}</div>
            </div>
          </div>
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:10, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Monthly Income 2026 — Scaled from 2025</div>
            <Stacked2026 monthly={monthlyIncome2026} kind="income" maxH={130} />
          </div>
        </div>

        {/* RIGHT: 2026 Costs */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16 }}>
            <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>Operating Costs · 2026 Forecast</div>
            <div style={{ fontSize:13, color:'#A78BFA', fontWeight:600 }}>{fmt(totalCosts)}</div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
            <DonutChart data={costs2026} total={totalCosts} size={220} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {costs2026.map((item,i) => (
              <div key={i} style={{ padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:item.color, flexShrink:0 }} />
                  <div style={{ flex:1, fontSize:13, color:'#D1D5DB' }}>{item.label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#F5F0E8', minWidth:80, textAlign:'right' }}>{fmt(item.value)}</div>
                  <div style={{ fontSize:12, color:'#6B7280', minWidth:40, textAlign:'right' }}>{item.pct}%</div>
                </div>
                {item.note && <div style={{ fontSize:11, color:'#6B7280', paddingLeft:20, marginTop:2 }}>{item.note}</div>}
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', marginTop:4 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#F5F0E8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Costs</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#A78BFA' }}>{fmt(totalCosts)}</div>
            </div>
          </div>
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:10, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Monthly Costs 2026 — Scaled</div>
            <Stacked2026 monthly={monthlyCosts2026} kind="costs" maxH={130} />
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background:'var(--ink-2)', border:`1px solid ${color}40`, borderRadius:10, padding:'14px 18px' }}>
      <div style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      <div className="serif" style={{ fontSize:26, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#9CA3AF', marginTop:4 }}>{sub}</div>}
    </div>
  )
}

// Stacked bar for 2026 — tints keyed off the new palette so it reads as "forecast" not "actuals"
function Stacked2026({ monthly, kind, maxH=120 }) {
  const palette = kind === 'income'
    ? ['#0E7490','#0891B2','#06B6D4','#22D3EE','#67E8F9','#A5F3FC']
    : ['#4C1D95','#6D28D9','#8B5CF6','#A78BFA','#C4B5FD']
  const getSegs = m => kind === 'income'
    ? [{ v:m.bar, c:palette[0] },{ v:m.golf, c:palette[1] },{ v:m.events, c:palette[2] },{ v:m.hire, c:palette[3] },{ v:m.sc, c:palette[4] },{ v:m.pool, c:palette[5] }]
    : [{ v:m.wages, c:palette[0] },{ v:m.fixed, c:palette[1] },{ v:m.drinks, c:palette[2] },{ v:m.vat, c:palette[3] },{ v:m.other, c:palette[4] }]
  const total = m => getSegs(m).reduce((s, x) => s + (x.v || 0), 0)
  const maxVal = Math.max(...monthly.map(total))
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:maxH }}>
      {monthly.map((m,i) => {
        const t = total(m)
        const h = Math.round((t / maxVal) * maxH)
        const segs = getSegs(m)
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', height:maxH }}>
            <div style={{ width:'100%', height:h, display:'flex', flexDirection:'column', borderRadius:'2px 2px 0 0', overflow:'hidden' }}>
              {segs.map((s,j) => <div key={j} style={{ height:`${t > 0 ? (s.v / t) * 100 : 0}%`, background:s.c }} />)}
            </div>
            <div style={{ fontSize:9, color:'#6B7280', textAlign:'center', marginTop:2 }}>{m.m}</div>
          </div>
        )
      })}
    </div>
  )
}

function TicketMonthlyStacked() {
  const data = IP_LICENSING_MONTHLY_2025
  const maxRev = Math.max(...data.map(d => d.onlineRev + d.officeRev))
  const maxH = 90
  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:maxH }}>
        {data.map((d, i) => {
          const total = d.onlineRev + d.officeRev
          const h = Math.round((total / maxRev) * maxH)
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              <div style={{ width:'100%', height:h, display:'flex', flexDirection:'column', borderRadius:'2px 2px 0 0', overflow:'hidden' }} title={`${d.month}: Online £${d.onlineRev.toLocaleString('en-GB', {minimumFractionDigits:2})} · Office £${d.officeRev.toLocaleString('en-GB', {minimumFractionDigits:2})}`}>
                <div style={{ height: total>0 ? `${(d.officeRev/total)*100}%` : 0, background:'#6B7280' }} />
                <div style={{ height: total>0 ? `${(d.onlineRev/total)*100}%` : 0, background:'#4FC3F7' }} />
              </div>
              <div style={{ fontSize:9, color:'#6B7280', textAlign:'center', marginTop:2 }}>{d.month}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function FinancialPerformance() {
  const totalIncome = INCOME.reduce((s,i)=>s+i.value,0)
  const totalCosts = COSTS.reduce((s,c)=>s+c.value,0)
  const g = IP_LICENSING_GRAND_2025
  const onlineMax = Math.max(...IP_LICENSING_SKUS_ONLINE_2025.map(r => r.revenue))
  const officeMax = Math.max(...IP_LICENSING_SKUS_OFFICE_2025.map(r => r.revenue), 1)
  const sharedMax = Math.max(onlineMax, officeMax)

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 4px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* LEFT: INCOME */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16 }}>
            <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>Income · Jan–Dec 2025</div>
            <div style={{ fontSize:13, color:'#3B82F6', fontWeight:600 }}>{fmt(totalIncome)} verified</div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
            <DonutChart data={INCOME} total={totalIncome} size={220} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {INCOME.map((item,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width:10, height:10, borderRadius:2, background:item.color, flexShrink:0 }} />
                <div style={{ flex:1, fontSize:13, color:'#D1D5DB' }}>{item.label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#F5F0E8', minWidth:80, textAlign:'right' }}>{fmt(item.value)}</div>
                <div style={{ fontSize:12, color:'#6B7280', minWidth:40, textAlign:'right' }}>{item.pct}%</div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', marginTop:4 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#F5F0E8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Income</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#3B82F6' }}>{fmt(totalIncome)}</div>
            </div>
          </div>
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:10, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Monthly Income — Stacked by Source</div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#6B7280', marginBottom:4 }}>
              {['£140k','£105k','£70k','£35k','£0k'].map((l,i)=><span key={i}>{l}</span>)}
            </div>
            <StackedBar monthly={MONTHLY_INCOME} maxH={130} />
          </div>
        </div>

        {/* RIGHT: COSTS */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16 }}>
            <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>Operating Costs · Jan–Dec 2025</div>
            <div style={{ fontSize:13, color:'#EF4444', fontWeight:600 }}>{fmt(totalCosts)} categorised</div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
            <DonutChart data={COSTS} total={totalCosts} size={220} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {COSTS.map((item,i) => (
              <div key={i} style={{ padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:item.color, flexShrink:0 }} />
                  <div style={{ flex:1, fontSize:13, color:'#D1D5DB' }}>{item.label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#F5F0E8', minWidth:80, textAlign:'right' }}>{fmt(item.value)}</div>
                  <div style={{ fontSize:12, color:'#6B7280', minWidth:40, textAlign:'right' }}>{item.pct}%</div>
                </div>
                {item.note && <div style={{ fontSize:11, color:'#6B7280', paddingLeft:20, marginTop:2 }}>{item.note}</div>}
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', marginTop:4 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#F5F0E8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Costs</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#EF4444' }}>{fmt(totalCosts)}</div>
            </div>
          </div>
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:10, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Monthly Costs — Stacked</div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#6B7280', marginBottom:4 }}>
              {['£80k','£60k','£40k','£20k','£0k'].map((l,i)=><span key={i}>{l}</span>)}
            </div>
            <CostStackedBar monthly={MONTHLY_COSTS} maxH={130} />
          </div>
        </div>

      </div>

      {/* TICKET BREAKDOWN — Online vs Office (sourced from IP & Licensing dataset) */}
      <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid rgba(201,168,76,0.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>Ticket Revenue Breakdown</div>
            <div style={{ fontSize:13, color:'#9CA3AF' }}>Borough 2025 · Online portal (actual) vs Office/till (imputed at list price)</div>
          </div>
          <div style={{ fontSize:13, color:'var(--gold)', fontWeight:700 }}>{fmt(g.totalRev)} combined</div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:20 }}>
          <div style={{ background:'rgba(79,195,247,0.08)', border:'1px solid rgba(79,195,247,0.3)', borderRadius:8, padding:'12px 16px' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Online Portal</div>
            <div style={{ fontSize:22, fontWeight:800, color:'#4FC3F7' }}>{fmt(g.onlineRev)}</div>
            <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{g.onlineQty.toLocaleString()} tickets · {(g.onlineRev/g.totalRev*100).toFixed(1)}% of total · actual</div>
          </div>
          <div style={{ background:'rgba(107,114,128,0.1)', border:'1px solid rgba(107,114,128,0.3)', borderRadius:8, padding:'12px 16px' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Office / Till</div>
            <div style={{ fontSize:22, fontWeight:800, color:'#9CA3AF' }}>{fmt(g.officeRev)}</div>
            <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{g.officeQty.toLocaleString()} tickets · {(g.officeRev/g.totalRev*100).toFixed(1)}% of total · imputed</div>
          </div>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.35)', borderRadius:8, padding:'12px 16px' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Combined</div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--gold)' }}>{fmt(g.totalRev)}</div>
            <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{g.totalQty.toLocaleString()} tickets total</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
              <div style={{ fontSize:11, color:'#4FC3F7', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Online · by SKU</div>
              <div style={{ fontSize:11, color:'#6B7280' }}>Status = complete</div>
            </div>
            <ChannelBars rows={IP_LICENSING_SKUS_ONLINE_2025} accent="#4FC3F7" maxRev={sharedMax} />
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
              <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Office · by SKU</div>
              <div style={{ fontSize:11, color:'#6B7280' }}>Status = external · imputed at list price</div>
            </div>
            <ChannelBars rows={IP_LICENSING_SKUS_OFFICE_2025} accent="#9CA3AF" maxRev={sharedMax} />
          </div>
        </div>

        <div style={{ marginTop:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
            <div style={{ fontSize:10, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase' }}>Monthly Ticket Revenue — Online + Office Stacked</div>
            <div style={{ display:'flex', gap:14, fontSize:10, color:'#9CA3AF' }}>
              <span><span style={{ display:'inline-block', width:9, height:9, background:'#4FC3F7', borderRadius:2, marginRight:5 }} />Online</span>
              <span><span style={{ display:'inline-block', width:9, height:9, background:'#6B7280', borderRadius:2, marginRight:5 }} />Office (imputed)</span>
            </div>
          </div>
          <TicketMonthlyStacked />
        </div>

        <div style={{ marginTop:14, fontSize:11, color:'#6B7280', lineHeight:1.6 }}>
          Sourced from the <strong style={{ color:'var(--cream)' }}>IP &amp; Licensing</strong> tab (2025 DMN transactions, Borough only). Online revenue is the actual portal take; office revenue is imputed as <em>units × SKU list price</em> because till payments don't flow through the online system. Swap in actual till takings when available.
        </div>
      </div>

      <Forecast2026 />
    </div>
  )
}