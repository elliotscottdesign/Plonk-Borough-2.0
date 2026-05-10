import React, { useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import {
  IP_LICENSING_SKUS_ONLINE_2025,
  IP_LICENSING_SKUS_OFFICE_2025,
  IP_LICENSING_MONTHLY_2025,
  IP_LICENSING_GRAND_2025,
} from '../data.js'
import { formatCurrency, formatNumber } from '../i18n/format.js'
import { useChartTooltip } from '../components/ChartTooltip.jsx'
import BoroughTillSales2025 from '../tabs/BoroughTillSales2025.jsx'

// Named exports — imported by BusinessExplorer's 2026 Performance tab as the 2025
// baseline for scenario-adjusted forecasts. `labelKey` points at
// explorer.incomeSources.* / explorer.costCategories.*.
export const INCOME = [
  { label:'Spend at Bar',         labelKey:'bar',           value:362836, pct:48.9, color:'#1E40AF' },
  { label:'Online Golf Tickets',  labelKey:'onlineGolf',    value:210485, pct:28.4, color:'#1D4ED8' },
  { label:'Bookings & Events',    labelKey:'bookings',      value:106023, pct:14.3, color:'#2563EB' },
  { label:'Private Hires',        labelKey:'privateHires',  value:44999,  pct:6.1,  color:'#3B82F6' },
  { label:'Service Charge',       labelKey:'serviceCharge', value:15102,  pct:2.0,  color:'#60A5FA' },
  { label:'Pool Tickets',         labelKey:'poolTickets',   value:2198,   pct:0.3,  color:'#93C5FD' },
]

export const COSTS = [
  { label:'Wages',          labelKey:'wages',       value:242370, pct:38.4, color:'#991B1B', noteKey:null },
  { label:'Fixed Costs',    labelKey:'fixed',       value:165647, pct:26.2, color:'#B91C1C', noteKey:'fixedDesc' },
  { label:'Drinks & Gas',   labelKey:'drinks',      value:80609,  pct:12.8, color:'#DC2626', noteKey:null },
  { label:'VAT (Net)',      labelKey:'vat',         value:78851,  pct:12.5, color:'#EF4444', noteKey:'vatDesc' },
  { label:'Cleaning',       labelKey:'cleaning',    value:22965,  pct:3.6,  color:'#F87171', noteKey:null },
  { label:'Arcades',        labelKey:'arcades',     value:17152,  pct:2.7,  color:'#EA580C', noteKey:null },
  { label:'Food',           labelKey:'food',        value:9101,   pct:1.4,  color:'#F97316', noteKey:null },
  { label:'Google/Digital', labelKey:'google',      value:8918,   pct:1.4,  color:'#FB923C', noteKey:'googleDesc' },
  { label:'Card Charges',   labelKey:'cardCharges', value:5443,   pct:0.9,  color:'#FCD34D', noteKey:null },
]

export const MONTHLY_INCOME = [
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

export const MONTHLY_COSTS = [
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

export function DonutChart({ data, total, size=200 }) {
  const { containerProps, segmentProps, overlay } = useChartTooltip()
  const cx = size/2, cy = size/2, r = size*0.42, inner = size*0.26
  let angle = -Math.PI/2
  const slices = data.map((d,i) => {
    const slice = (d.value/total)*Math.PI*2
    const x1 = cx+r*Math.cos(angle), y1 = cy+r*Math.sin(angle)
    angle += slice
    const x2 = cx+r*Math.cos(angle), y2 = cy+r*Math.sin(angle)
    const large = slice > Math.PI ? 1 : 0
    const pct = d.pct != null ? d.pct : ((d.value / total) * 100).toFixed(1)
    const tip = `${d.label || ''}\n£${Math.round(d.value).toLocaleString()} · ${pct}%`
    return (
      <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={d.color} stroke="#0A0A0F" strokeWidth={1} style={{ cursor:'default', transition:'opacity 0.15s' }} {...segmentProps(tip)}>
        <title>{tip}</title>
      </path>
    )
  })
  return (
    <div {...containerProps} style={{ display:'inline-block', position:'relative', lineHeight:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices}
        <circle cx={cx} cy={cy} r={inner} fill="#0A0A0F" />
      </svg>
      {overlay}
    </div>
  )
}

function StackedBar({ monthly, maxH=120, labels, fmt }) {
  const { containerProps, segmentProps, overlay } = useChartTooltip()
  const maxVal = Math.max(...monthly.map(m => m.bar+m.golf+m.events+m.hire+m.sc+m.pool))
  return (
    <div {...containerProps} style={{ display:'flex', alignItems:'flex-end', gap:3, height:maxH, position:'relative' }}>
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
              {segs.map((s,j) => (
                <div key={j} style={{ height:`${(s.v/total)*100}%`, background:s.c, cursor:'default' }} {...segmentProps(`${m.m} · ${labels[j]}\n${fmt(s.v)}`)} />
              ))}
            </div>
            <div style={{ fontSize:9, color:'#6B7280', textAlign:'center', marginTop:2 }}>{m.m}</div>
          </div>
        )
      })}
      {overlay}
    </div>
  )
}

function CostStackedBar({ monthly, maxH=120, labels, fmt }) {
  const { containerProps, segmentProps, overlay } = useChartTooltip()
  const maxVal = Math.max(...monthly.map(m => (m.wages||0)+(m.fixed||0)+(m.drinks||0)+(m.vat||0)+(m.other||m.vat2||0)))
  return (
    <div {...containerProps} style={{ display:'flex', alignItems:'flex-end', gap:3, height:maxH, position:'relative' }}>
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
              {segs.map((s,j) => (
                <div key={j} style={{ height:`${total>0?(s.v/total)*100:0}%`, background:s.c, cursor:'default' }} {...segmentProps(`${m.m} · ${labels[j]}\n${fmt(s.v)}`)} />
              ))}
            </div>
            <div style={{ fontSize:9, color:'#6B7280', textAlign:'center', marginTop:2 }}>{m.m}</div>
          </div>
        )
      })}
      {overlay}
    </div>
  )
}

// --- Ticket breakdown (online vs office, Borough 2025) — from IP & Licensing dataset ---
function ChannelBars({ rows, accent, maxRev, fmt, ticketsWord }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {rows.filter(r => r.sold > 0).map(r => {
        const w = (r.revenue / maxRev) * 100
        const tip = `${r.sku}\n  ${ticketsWord}: ${r.sold.toLocaleString()}\n  ${fmt(r.revenue)}`
        return (
          <div key={r.sku} title={tip}>
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

// ───────────────────────────────────────────────────────────────────────
// 2025 Performance — now structured as 5 indexed sections behind a
// left-hand vertical nav: Income · Outgoings · Till Sales · Discounts
// · Ticket Sales. Each section is its own sub-component below; the
// nav is sticky so it stays visible while scrolling the selected
// section's content.
// ───────────────────────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'income',      labelKey: 'performance2025.income',           fallback: 'Income',         icon: '↑', color: '#3B82F6' },
  { key: 'outgoings',   labelKey: 'performance2025.costs',            fallback: 'Outgoings',      icon: '↓', color: '#EF4444' },
  { key: 'tillsales',   labelKey: null,                                fallback: 'Till Sales',     icon: '🧾', color: 'var(--gold)' },
  { key: 'discounts',   labelKey: null,                                fallback: 'Discounts',      icon: '%', color: '#F87171' },
  { key: 'tickets',     labelKey: 'performance2025.ticketBreakdown',   fallback: 'Ticket Sales',   icon: '🎟', color: '#4FC3F7' },
]

export default function FinancialPerformance() {
  const { t, i18n } = useTranslation('explorer')
  const lang = i18n.language
  const fmt = (n) => formatCurrency(n, lang)
  const fmtNum = (n) => formatNumber(n, lang)
  const [section, setSection] = useState('income')

  // ── Shared data prep (used by Income / Outgoings / Ticket panels) ──
  const totalIncome = INCOME.reduce((s,i)=>s+i.value,0)
  const totalCosts  = COSTS.reduce((s,c)=>s+c.value,0)
  const g           = IP_LICENSING_GRAND_2025
  const onlineMax   = Math.max(...IP_LICENSING_SKUS_ONLINE_2025.map(r => r.revenue))
  const officeMax   = Math.max(...IP_LICENSING_SKUS_OFFICE_2025.map(r => r.revenue), 1)
  const sharedMax   = Math.max(onlineMax, officeMax)

  const incomeLocalised   = INCOME.map(i => ({ ...i, label: t(`incomeSources.${i.labelKey}`) }))
  const costsLocalised    = COSTS.map(c => ({ ...c, label: t(`costCategories.${c.labelKey}`) }))
  const incomeLabels      = incomeLocalised.map(i => i.label)
  const costMonthlyLabels = ['wages','fixed','drinks','vat'].map(k => t(`costCategories.${k}`)).concat([t('performance2026.costNotes.other')])

  return (
    <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 4px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:28, alignItems:'flex-start' }}>

        {/* LEFT-HAND INDEX NAV — sticky so it stays put while the
            section content scrolls. Each entry is a button with an
            accent left rail in the section's colour when active. */}
        <nav style={{ position:'sticky', top:16, alignSelf:'flex-start' }}>
          <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, marginBottom:10, padding:'0 4px' }}>
            2025 Performance
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {SECTIONS.map(s => {
              const active = section === s.key
              const label  = s.labelKey ? t(s.labelKey, s.fallback) : s.fallback
              return (
                <button
                  key={s.key}
                  onClick={() => setSection(s.key)}
                  style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'10px 12px',
                    background: active ? 'rgba(201,168,76,0.10)' : 'transparent',
                    border:'1px solid', borderColor: active ? 'rgba(201,168,76,0.35)' : 'transparent',
                    borderLeft: `3px solid ${active ? s.color : 'transparent'}`,
                    borderRadius: 4,
                    color: active ? 'var(--cream)' : 'var(--cream-dim)',
                    fontSize: 12, fontWeight: active ? 600 : 500,
                    textTransform:'uppercase', letterSpacing:'0.06em',
                    cursor:'pointer', textAlign:'left',
                    transition:'all 0.12s',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize:14, lineHeight:1, color: active ? s.color : '#6B7280', width:18, textAlign:'center' }}>{s.icon}</span>
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* RIGHT: SELECTED SECTION CONTENT */}
        <div>

          {section === 'income' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16 }}>
                <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('performance2025.income')}</div>
                <div style={{ fontSize:13, color:'#3B82F6', fontWeight:600 }}>{fmt(totalIncome)} {t('performance2025.verified')}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:32, alignItems:'flex-start' }}>
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <DonutChart data={incomeLocalised} total={totalIncome} size={220} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {incomeLocalised.map((item,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width:10, height:10, borderRadius:2, background:item.color, flexShrink:0 }} />
                      <div style={{ flex:1, fontSize:13, color:'#D1D5DB' }}>{item.label}</div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#F5F0E8', minWidth:80, textAlign:'right' }}>{fmt(item.value)}</div>
                      <div style={{ fontSize:12, color:'#6B7280', minWidth:40, textAlign:'right' }}>{item.pct}%</div>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', marginTop:4 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#F5F0E8', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t('performance2025.totalIncome')}</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#3B82F6' }}>{fmt(totalIncome)}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop:24 }}>
                <div style={{ fontSize:10, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{t('performance2025.monthlyIncome')}</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#6B7280', marginBottom:4 }}>
                  {['£140k','£105k','£70k','£35k','£0k'].map((l,i)=><span key={i}>{l}</span>)}
                </div>
                <StackedBar monthly={MONTHLY_INCOME} maxH={130} labels={incomeLabels} fmt={fmt} />
              </div>
            </div>
          )}

          {section === 'outgoings' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16 }}>
                <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('performance2025.costs')}</div>
                <div style={{ fontSize:13, color:'#EF4444', fontWeight:600 }}>{fmt(totalCosts)} {t('performance2025.categorised')}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:32, alignItems:'flex-start' }}>
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <DonutChart data={costsLocalised} total={totalCosts} size={220} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {costsLocalised.map((item,i) => (
                    <div key={i} style={{ padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:10, height:10, borderRadius:2, background:item.color, flexShrink:0 }} />
                        <div style={{ flex:1, fontSize:13, color:'#D1D5DB' }}>{item.label}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#F5F0E8', minWidth:80, textAlign:'right' }}>{fmt(item.value)}</div>
                        <div style={{ fontSize:12, color:'#6B7280', minWidth:40, textAlign:'right' }}>{item.pct}%</div>
                      </div>
                      {item.noteKey && <div style={{ fontSize:11, color:'#6B7280', paddingLeft:20, marginTop:2 }}>{t(`costCategories.${item.noteKey}`)}</div>}
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', marginTop:4 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#F5F0E8', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t('performance2025.totalCosts')}</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#EF4444' }}>{fmt(totalCosts)}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop:24 }}>
                <div style={{ fontSize:10, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{t('performance2025.monthlyCosts')}</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#6B7280', marginBottom:4 }}>
                  {['£80k','£60k','£40k','£20k','£0k'].map((l,i)=><span key={i}>{l}</span>)}
                </div>
                <CostStackedBar monthly={MONTHLY_COSTS} maxH={130} labels={costMonthlyLabels} fmt={fmt} />
              </div>
            </div>
          )}

          {section === 'tillsales'  && <BoroughTillSales2025 section="till" />}
          {section === 'discounts' && <BoroughTillSales2025 section="discounts" />}

          {section === 'tickets' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>{t('performance2025.ticketBreakdown')}</div>
                  <div style={{ fontSize:13, color:'#9CA3AF' }}>{t('performance2025.ticketSource')}</div>
                </div>
                <div style={{ fontSize:13, color:'var(--gold)', fontWeight:700 }}>{fmt(g.totalRev)} {t('performance2025.combined')}</div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:20 }}>
                <div style={{ background:'rgba(79,195,247,0.08)', border:'1px solid rgba(79,195,247,0.3)', borderRadius:8, padding:'12px 16px' }}>
                  <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{t('performance2025.onlinePortal')}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:'#4FC3F7' }}>{fmt(g.onlineRev)}</div>
                  <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{fmtNum(g.onlineQty)} tickets · {(g.onlineRev/g.totalRev*100).toFixed(1)}% of total · actual</div>
                </div>
                <div style={{ background:'rgba(107,114,128,0.1)', border:'1px solid rgba(107,114,128,0.3)', borderRadius:8, padding:'12px 16px' }}>
                  <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{t('performance2025.officeTill')}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:'#9CA3AF' }}>{fmt(g.officeRev)}</div>
                  <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{fmtNum(g.officeQty)} tickets · {(g.officeRev/g.totalRev*100).toFixed(1)}% of total · imputed</div>
                </div>
                <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.35)', borderRadius:8, padding:'12px 16px' }}>
                  <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{t('performance2025.combinedLbl')}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:'var(--gold)' }}>{fmt(g.totalRev)}</div>
                  <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{fmtNum(g.totalQty)} tickets total</div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'#4FC3F7', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>{t('performance2025.onlineBySku')}</div>
                    <div style={{ fontSize:11, color:'#6B7280' }}>{t('performance2025.onlineNote')}</div>
                  </div>
                  <ChannelBars rows={IP_LICENSING_SKUS_ONLINE_2025} accent="#4FC3F7" maxRev={sharedMax} fmt={fmt} ticketsWord="Units" />
                </div>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>{t('performance2025.officeBySku')}</div>
                    <div style={{ fontSize:11, color:'#6B7280' }}>{t('performance2025.officeNote')}</div>
                  </div>
                  <ChannelBars rows={IP_LICENSING_SKUS_OFFICE_2025} accent="#9CA3AF" maxRev={sharedMax} fmt={fmt} ticketsWord="Units" />
                </div>
              </div>

              <div style={{ marginTop:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
                  <div style={{ fontSize:10, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('performance2025.monthlyTicket')}</div>
                  <div style={{ display:'flex', gap:14, fontSize:10, color:'#9CA3AF' }}>
                    <span><span style={{ display:'inline-block', width:9, height:9, background:'#4FC3F7', borderRadius:2, marginRight:5 }} />{t('performance2025.online')}</span>
                    <span><span style={{ display:'inline-block', width:9, height:9, background:'#6B7280', borderRadius:2, marginRight:5 }} />{t('performance2025.office')}</span>
                  </div>
                </div>
                <TicketMonthlyStacked />
              </div>

              <div style={{ marginTop:14, fontSize:11, color:'#6B7280', lineHeight:1.6 }}>
                Sourced from the <strong style={{ color:'var(--cream)' }}>IP &amp; Licensing</strong> tab (2025 DMN transactions, Borough only). Online revenue is the actual portal take; office revenue is imputed as <em>units × SKU list price</em> because till payments don't flow through the online system. Swap in actual till takings when available.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
