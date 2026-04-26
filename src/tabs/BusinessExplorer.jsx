import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import FinancialPerformance, { INCOME, COSTS, MONTHLY_INCOME, MONTHLY_COSTS, DonutChart } from '../slides/FinancialPerformance.jsx'
import ResetBtn from '../components/ResetBtn.jsx'
import { useChartTooltip } from '../components/ChartTooltip.jsx'
import { formatCurrency, formatNumber } from '../i18n/format.js'
import { DEAL, ACTUALS_2025, FORECAST, WAGE_RATES, WAGE_OVERHEAD_MULT, PL_WAGE_BASE } from '../data.js'

const TAB_KEYS = ['overview','performance2025','performance2026','scenarios','market','wages']

function useFmt() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const fmt = (n) => formatCurrency(n, lang)
  const fmtK = (n) => '£' + Math.round(n/1000) + 'k'
  const fmtNum = (n) => formatNumber(n, lang)
  return { fmt, fmtK, fmtNum, lang }
}

function TabOverview() {
  const { t } = useTranslation('explorer')
  const { t: tc } = useTranslation('common')
  const { fmt, fmtK } = useFmt()
  const months = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr']
  const rev =    [52000,44000,53000,89000,71000,68000,97000,173326,36000,52000,60000,58000]
  const ebitda = [-7000,-4000,5000,23000,17000,15000,30000,98000,-3000,6000,3000,8000]
  const maxRev = Math.max(...rev)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, fontSize:13 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:t('overview.stats.ask.label'),      value:`${fmt(DEAL.investment)} inc VAT`, sub:t('overview.stats.ask.sub'),      color:'var(--gold)' },
          { label:t('overview.stats.fy2025.label'),   value:fmtK(ACTUALS_2025.revenue),         sub:t('overview.stats.fy2025.sub'),   color:'#4FC3F7' },
          { label:t('overview.stats.forecast.label'), value:fmtK(FORECAST.revenue),             sub:t('overview.stats.forecast.sub'), color:'#2DD4BF' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>{t('overview.forecastChart')}</div>
        <OverviewMonthlyChart months={months} rev={rev} ebitda={ebitda} maxRev={maxRev} fmtK={fmtK} />
        <div style={{ display:'flex', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:10, height:10, background:'#4FC3F7', borderRadius:2 }} /><span style={{ fontSize:11, color:'#9CA3AF' }}>{tc('labels.revenue')}</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:10, height:10, background:'#2DD4BF', borderRadius:2 }} /><span style={{ fontSize:11, color:'#9CA3AF' }}>{tc('labels.ebitda')}</span></div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:t('overview.revenueSplitHeader'), items:[
            { label:t('overview.splits.bar'), pct:49, c:'#1E40AF' },
            { label:t('overview.splits.activities'), pct:28, c:'#2563EB' },
            { label:t('overview.splits.events'), pct:23, c:'#60A5FA' },
          ]},
          { label:t('overview.y1Ebitda'), value:'£191k', sub:t('overview.y1Margin'), color:'#2DD4BF' },
          { label:t('overview.baseReturns'), value:t('overview.cocLabel'), sub:t('overview.cocNote'), color:'#C9A84C' },
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

const perfGrowthToPct = g => ((g - PERF_GROWTH_MIN) / (PERF_GROWTH_MAX - PERF_GROWTH_MIN)) * 100

// Custom Scenario lever definitions. One entry per commercial revenue line —
// keys match the growth state shape (`bar`, `golf`, `events`, `hires`, `pool`)
// and `setSuffix` matches the React setter naming (`setBar`, `setGolf`, etc.).
// Bases pulled from INCOME (= 2025 actuals), so they stay in lockstep with
// the 2026 income breakdown chart. Colors use the INCOME_2026_COLORS palette
// so the slider color matches the chart segment color one-for-one.
// Service Charge is intentionally excluded — it's a derived line, not a lever.
const SCENARIO_LEVERS = [
  { key:'bar',    setSuffix:'Bar',    incomeKey:'bar',          color: INCOME_2026_COLORS[0], base: INCOME.find(i => i.labelKey === 'bar')?.value          ?? 362836 },
  { key:'golf',   setSuffix:'Golf',   incomeKey:'onlineGolf',   color: INCOME_2026_COLORS[1], base: INCOME.find(i => i.labelKey === 'onlineGolf')?.value   ?? 210485 },
  { key:'events', setSuffix:'Events', incomeKey:'bookings',     color: INCOME_2026_COLORS[2], base: INCOME.find(i => i.labelKey === 'bookings')?.value     ?? 106023 },
  { key:'hires',  setSuffix:'Hires',  incomeKey:'privateHires', color: INCOME_2026_COLORS[3], base: INCOME.find(i => i.labelKey === 'privateHires')?.value ??  44999 },
  { key:'pool',   setSuffix:'Pool',   incomeKey:'poolTickets',  color: INCOME_2026_COLORS[5], base: INCOME.find(i => i.labelKey === 'poolTickets')?.value  ??   2198 },
]

// Per-line growth map: the 5 breakdown sliders (Scenarios) drive 5 specific revenue
// lines (Bar / Online Golf / Bookings & Events / Private Hires / Pool Tickets).
// Service Charge has no slider — it scales by the simple average of the 5
// (it's a derived line, not a commercial lever).
function buildLineGrowths(g) {
  const avg = (g.bar + g.golf + g.hires + g.events + g.pool) / 5
  return {
    bar: g.bar,
    onlineGolf: g.golf,
    bookings: g.events,
    privateHires: g.hires,
    poolTickets: g.pool,
    serviceCharge: avg,
  }
}

function TabPerformance({ growth, wages, opex, setOpex }) {
  const { t } = useTranslation('explorer')
  const { t: tc } = useTranslation('common')
  const { fmt, fmtK, fmtNum } = useFmt()
  const lineGrowths = buildLineGrowths(growth)
  const BASE_TOTAL = INCOME.reduce((s, i) => s + i.value, 0)

  const income2026 = INCOME.map((i, idx) => {
    const g = lineGrowths[i.labelKey] ?? 0
    return {
      labelKey: i.labelKey,
      label: t(`incomeSources.${i.labelKey}`),
      value: Math.round(i.value * (1 + g / 100)),
      color: INCOME_2026_COLORS[idx] || INCOME_2026_COLORS[INCOME_2026_COLORS.length - 1],
    }
  })
  const totalIncome = income2026.reduce((s, i) => s + i.value, 0)
  const aggGrowth = BASE_TOTAL > 0 ? ((totalIncome - BASE_TOTAL) / BASE_TOTAL) * 100 : 0
  const mult = 1 + aggGrowth / 100
  const incomeWithPct = income2026.map(i => ({ ...i, pct: +(i.value / totalIncome * 100).toFixed(1) }))

  // 2026 wage bill — computed from wage sliders × WAGE_RATES.hours, then
  // scaled by the 2025 P&L:Rota overhead multiplier (~1.586) to cover NICs,
  // pension, holiday pay, etc. Replaces the old "242370 × 1.10" rule.
  const rota2026 = (
    wages.bar * WAGE_RATES[0].hours +
    wages.sup * WAGE_RATES[1].hours +
    wages.am  * WAGE_RATES[2].hours +
    wages.mgr * WAGE_RATES[3].hours
  )
  const wageBill2026 = Math.round(rota2026 * WAGE_OVERHEAD_MULT)

  const barRevenue2026 = income2026.find(x => x.labelKey === 'bar')?.value || 0
  const drinksGas2026 = Math.round(barRevenue2026 * 0.30)
  const hostingNote = t('performance2026.costNotes.hostingNote')
  const scalesNote = t('performance2026.costNotes.scales')
  const costsRaw = [
    { labelKey: 'wages',     value: wageBill2026,                note: t('performance2026.costNotes.wagesDriven') },
    { labelKey: 'fixed',     value: Math.round(165647 * 1.10), note: t('performance2026.costNotes.fixed') },
    { labelKey: 'drinks',    value: drinksGas2026,              note: t('performance2026.costNotes.drinks') },
    { labelKey: 'vat',       value: Math.round(78851 * mult),   note: scalesNote },
    { labelKey: 'cleaning',  value: Math.round(22965 * mult),   note: scalesNote },
    { labelKey: 'arcades',   value: Math.round(17152 * mult),   note: scalesNote },
    { labelKey: 'food',      value: Math.round(9101 * mult),    note: scalesNote },
    { labelKey: 'hosting',   value: 3492,                        note: hostingNote, customLabel: t('performance2026.costNotes.hosting') },
    { labelKey: 'cardCharges', value: Math.round(5443 * mult),  note: scalesNote },
  ]
  // OpEx multiplier scales the entire cost base (e.g. for stress-test scenarios).
  // Default 100% = pure model output; higher % = cost overrun stress test.
  const opexMult = opex / 100
  const rawTotalCosts = costsRaw.reduce((s, c) => s + c.value, 0)
  const totalCosts = Math.round(rawTotalCosts * opexMult)
  const costs2026 = costsRaw.map((c, idx) => ({
    ...c,
    value: Math.round(c.value * opexMult),
    label: c.customLabel || t(`costCategories.${c.labelKey}`),
    pct: +(Math.round(c.value * opexMult) / totalCosts * 100).toFixed(1),
    color: COSTS_2026_COLORS[idx] || COSTS_2026_COLORS[COSTS_2026_COLORS.length - 1],
  }))
  const ebitda = totalIncome - totalCosts
  const margin = totalIncome > 0 ? ebitda / totalIncome : 0

  const monthlyIncome2026 = MONTHLY_INCOME.map(m => ({
    m: m.m,
    bar:    Math.round(m.bar    * (1 + growth.bar    / 100)),
    golf:   Math.round(m.golf   * (1 + growth.golf   / 100)),
    events: Math.round(m.events * (1 + growth.events / 100)),
    hire:   Math.round(m.hire   * (1 + growth.hires  / 100)),
    pool:   Math.round(m.pool   * (1 + growth.pool   / 100)),
    sc:     Math.round(m.sc     * mult),
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

  const sliderValue = Math.round(aggGrowth)

  const perfMarkers = [
    { labelKey: 'bear',  value: -10, color: '#EF4444' },
    { labelKey: 'y2025', value:   0, color: '#9CA3AF' },
    { labelKey: 'base',  value:  15, color: '#C9A84C' },
    { labelKey: 'bull',  value:  25, color: '#22D3EE' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      {/* Slider card — READ-ONLY indicator. The slider's position is derived from
          the 5 growth levers + wage sliders below; preset buttons (Bear/2025/Base/Bull)
          still snap the levers. The user can't drag this slider directly. */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div>
            <div style={{ fontSize:11, color:'#22D3EE', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:2 }}>{t('performance2026.header')}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{t('performance2026.sliderDesc')}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#22D3EE', minWidth:48, textAlign:'right' }}>{sliderValue>0?'+':''}{sliderValue}%</span>
            <ResetBtn onClick={()=>growth.setAll(15)} title={t('performance2026.resetLevers')} />
          </div>
        </div>
        <div style={{ position:'relative', marginTop:14, padding:'4px 0 26px' }}>
          <input
            type="range"
            min={PERF_GROWTH_MIN} max={PERF_GROWTH_MAX} value={sliderValue}
            readOnly
            disabled
            tabIndex={-1}
            aria-label={t('performance2026.header')}
            style={{ width:'100%', accentColor:'#22D3EE', opacity:0.85, pointerEvents:'none', cursor:'default' }}
          />
          {perfMarkers.map(mk => (
            <button key={mk.labelKey} onClick={()=>growth.setAll(mk.value)} style={{
              position:'absolute', left:`calc(${perfGrowthToPct(mk.value)}% - 26px)`, top:28,
              width:52, padding:'2px 0', borderRadius:3, cursor:'pointer',
              background: sliderValue === mk.value ? mk.color : 'transparent',
              border: `1px solid ${mk.color}`,
              color: sliderValue === mk.value ? '#0A0A0F' : mk.color,
              fontSize:10, fontWeight:700, letterSpacing:'0.05em', textAlign:'center', transition:'all 0.15s',
            }}>{t(`performance2026.labels.${mk.labelKey}`)} {mk.value>0?'+':''}{mk.value}%</button>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#6B7280', marginTop:2, padding:'0 2px' }}>
            <span>{PERF_GROWTH_MIN}%</span>
            <span>+{PERF_GROWTH_MAX}%</span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:20 }}>
          <KpiCard2026 label={t('performance2026.adjustedRevenue')} value={fmtK(totalIncome)} color="#22D3EE" />
          <KpiCard2026 label={t('performance2026.adjustedEbitda')} value={fmtK(ebitda)} sub={`${(margin*100).toFixed(1)}% ${t('performance2026.margin')}`} color={ebitda > 0 ? '#A78BFA' : '#EF4444'} />
          <KpiCard2026 label={t('performance2025.totalCosts')} value={fmtK(totalCosts)} color="#8B5CF6" />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
            <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('performance2026.income2026')}</div>
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
              <div style={{ fontSize:12, fontWeight:700, color:'#F5F0E8', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t('performance2025.totalIncome')}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#22D3EE' }}>{fmt(totalIncome)}</div>
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:10, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{t('performance2026.monthlyIncome2026')}</div>
            <Stacked2026 monthly={monthlyIncome2026} kind="income" maxH={120} fmt={fmt} t={t} />
          </div>
        </div>

        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
            <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('performance2026.costs2026')}</div>
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
              <div style={{ fontSize:12, fontWeight:700, color:'#F5F0E8', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t('performance2025.totalCosts')}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#A78BFA' }}>{fmt(totalCosts)}</div>
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:10, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{t('performance2026.monthlyCosts2026')}</div>
            <Stacked2026 monthly={monthlyCosts2026} kind="costs" maxH={120} fmt={fmt} t={t} />
          </div>
        </div>
      </div>

      {/* ─── BUILD CUSTOM SCENARIO ─── 5 growth levers + OpEx, drives the slider above */}
      <ScenarioLeversCard growth={growth} opex={opex} setOpex={setOpex} />

      {/* ─── SLIDING WAGE RATE CALCULATOR ─── 4 wage sliders, drives the wage line above */}
      <WageCalculatorCard wages={wages} totalIncome={totalIncome} />

    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
// Build Custom Scenario card — 5 growth levers + OpEx vs Budget slider.
// Same state as TabScenarios (lifted in BusinessExplorer parent), so this
// card and the standalone Scenarios tab show identical values in real time.
// ───────────────────────────────────────────────────────────────────────
function ScenarioLeversCard({ growth, opex, setOpex }) {
  const { t } = useTranslation('explorer')
  const { t: tc } = useTranslation('common')
  const { fmt, fmtK } = useFmt()

  // Sliders mirror the 2026 income breakdown lines (excluding Service Charge,
  // which is a derived passive scaler). Bases pulled from INCOME (= 2025 actuals).
  const sliders = SCENARIO_LEVERS.map(l => ({
    key: l.key,
    labelKey: l.key,
    value: growth[l.key],
    set: growth['set' + l.setSuffix],
    color: l.color,
    base: l.base,
  }))

  const custom = computeScenario({ barG: growth.bar, golfG: growth.golf, eventsG: growth.events, hiresG: growth.hires, poolG: growth.pool, opexMult: opex / 100 })
  const buildPreset = pct => computeScenario({ barG: pct, golfG: pct, eventsG: pct, hiresG: pct, poolG: pct })
  const presets = [
    { labelKey:'conservative', pct:-10, ...buildPreset(-10) },
    { labelKey:'base',         pct: 15, ...buildPreset(15)  },
    { labelKey:'optimistic',   pct: 25, ...buildPreset(25)  },
  ]

  const revenueLabel = tc('labels.revenue')
  const opProfit  = t('scenarios.opProfit')
  const investorRet = t('scenarios.investorReturn')
  const cocLabel = tc('labels.cashOnCash')

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      {/* Levers */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('scenarios.buildCustom')}</div>
          <div style={{ fontSize:11, color:'#9CA3AF' }}>{t('scenarios.leverNote')}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:16 }}>
          {sliders.map(s => (
            <div key={s.key}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                <span style={{ color:'var(--cream)' }}>{t(`scenarios.levers.${s.labelKey}`)} <span style={{ color:'#6B7280', marginLeft:4 }}>(2025: {fmtK(s.base)})</span></span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:s.color, fontWeight:600 }}>{s.value>0?'+':''}{s.value}%</span>
                  <ResetBtn onClick={()=>s.set(15)} title={t('scenarios.resetTo15')} />
                </span>
              </div>
              <input type="range" min={-20} max={50} value={s.value} onChange={e=>s.set(Number(e.target.value))} style={{ width:'100%', accentColor:s.color }} />
              <div style={{ fontSize:10, color:'#6B7280', marginTop:3 }}>{t('scenarios.newLabel')} {fmtK(s.base * (1 + s.value / 100))}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
            <span style={{ color:'var(--cream)' }}>{t('scenarios.opex')} <span style={{ color:'#6B7280', marginLeft:4 }}>{t('scenarios.opexHint')}</span></span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <span style={{ color:'#EA580C', fontWeight:600 }}>{opex}%</span>
              <ResetBtn onClick={()=>setOpex(100)} title={t('scenarios.resetTo100')} />
            </span>
          </div>
          <input type="range" min={70} max={130} value={opex} onChange={e=>setOpex(Number(e.target.value))} style={{ width:'100%', accentColor:'#EA580C' }} />
        </div>
      </div>

      {/* Scenario cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {presets.map(p => (
          <button key={p.labelKey} onClick={()=>growth.setAll(p.pct)} title={`Apply ${p.pct>0?'+':''}${p.pct}%`} style={{
            background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:16, cursor:'pointer', textAlign:'left', transition:'all 0.15s',
          }}>
            <div style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4, fontWeight:600 }}>{t(`scenarios.cards.${p.labelKey}`)}</div>
            <div style={{ fontSize:10, color:'#6B7280', marginBottom:10 }}>{p.pct>0?'+':''}{p.pct}%</div>
            {[[revenueLabel,fmtK(p.revenue)],[opProfit,fmtK(p.profit)],[investorRet,fmt(Math.round(p.investorReturn))],[cocLabel,p.coc.toFixed(1)+'%']].map(([l,v],j) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:12 }}>
                <span style={{ color:'#9CA3AF' }}>{l}</span>
                <span style={{ color:j===3?'#2DD4BF':'var(--cream)', fontWeight:j===3?700:400 }}>{v}</span>
              </div>
            ))}
          </button>
        ))}
        <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, padding:16 }}>
          <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4, fontWeight:600 }}>{t('scenarios.cards.custom')}</div>
          <div style={{ fontSize:10, color:'#6B7280', marginBottom:10 }}>OpEx {opex}%</div>
          {[[revenueLabel,fmtK(custom.revenue)],[opProfit,fmtK(custom.profit)],[investorRet,fmt(Math.round(custom.investorReturn))],[cocLabel,custom.coc.toFixed(1)+'%']].map(([l,v],j) => (
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

// ───────────────────────────────────────────────────────────────────────
// Sliding Wage Rate Calculator card — 4 role-rate sliders (Bar / Sup / AM / Mgr)
// using 2026 hours (Bar 4,967 / Sup 1,000 / AM 2,000 / Mgr 2,000). Computes the
// 2026 P&L wage bill = (rate × hours summed) × WAGE_OVERHEAD_MULT (~1.586).
// Same state as the standalone Wages tab — slider changes here flow through
// to the 2026 cost calculation above and to the Wages tab.
// ───────────────────────────────────────────────────────────────────────
function WageCalculatorCard({ wages, totalIncome }) {
  const { t } = useTranslation('explorer')
  const { fmt, fmtNum } = useFmt()

  const roles = [
    { labelKey:'bar',         hours: WAGE_RATES[0].hours, rate: wages.bar, setRate: wages.setBar, plan: WAGE_RATES[0].rate, min:12.21, max:18 },
    { labelKey:'supervisor',  hours: WAGE_RATES[1].hours, rate: wages.sup, setRate: wages.setSup, plan: WAGE_RATES[1].rate, min:13.85, max:20 },
    { labelKey:'asstManager', hours: WAGE_RATES[2].hours, rate: wages.am,  setRate: wages.setAm,  plan: WAGE_RATES[2].rate, min:14.35, max:22 },
    { labelKey:'manager',     hours: WAGE_RATES[3].hours, rate: wages.mgr, setRate: wages.setMgr, plan: WAGE_RATES[3].rate, min:15.38, max:25 },
  ]
  const totalHours = roles.reduce((s, r) => s + r.hours, 0)
  const rotaCost   = Math.round(roles.reduce((s, r) => s + r.hours * r.rate, 0))
  const plWage2026 = Math.round(rotaCost * WAGE_OVERHEAD_MULT)
  const delta      = plWage2026 - PL_WAGE_BASE
  const pctOfRev   = totalIncome > 0 ? (plWage2026 / totalIncome) * 100 : 0

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      {/* Top stat strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:t('wages.total'),     value:fmt(PL_WAGE_BASE),                       sub:t('wages.totalNote'), color:'#C9A84C' },
          { label:t('wages.hours'),     value:fmtNum(totalHours) + ' ' + t('wages.hrs'), sub:t('wages.hoursNote'), color:'#4FC3F7' },
          { label:t('wages.pct'),       value:'20.8%',                                 sub:t('wages.pctNote'),   color:'#2DD4BF' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Calculator */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('wages.calculatorHeader')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:16 }}>
          {roles.map(r => (
            <div key={r.labelKey} style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontWeight:600, color:'var(--cream)' }}>{t(`wages.roles.${r.labelKey}`)}</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'var(--gold)', fontWeight:700 }}>£{r.rate.toFixed(2)}/hr</span>
                  <ResetBtn onClick={()=>r.setRate(r.plan)} title={`Reset £${r.plan.toFixed(2)}/hr`} />
                </span>
              </div>
              <input type="range" min={r.min} max={r.max} step={0.01} value={r.rate} onChange={e=>r.setRate(Number(e.target.value))} style={{ width:'100%', accentColor:'var(--gold)', marginBottom:6 }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#6B7280' }}>
                <span>{fmtNum(r.hours)} {t('wages.hrs')}</span>
                <span>{t('wages.annual')} {fmt(Math.round(r.hours*r.rate))}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>{t('wages.projected')}</div>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--gold)' }}>{fmt(plWage2026)}</div>
            <div style={{ fontSize:10, color:'#6B7280', marginTop:4 }}>incl. NICs / pension / cover</div>
          </div>
          <div style={{ background:delta>0?'rgba(239,68,68,0.08)':'rgba(45,212,191,0.08)', border:`1px solid ${delta>0?'rgba(239,68,68,0.2)':'rgba(45,212,191,0.2)'}`, borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>{t('wages.delta')}</div>
            <div style={{ fontSize:20, fontWeight:800, color:delta>0?'#EF4444':'#2DD4BF' }}>{delta>0?'+':''}{fmt(delta)}</div>
            <div style={{ fontSize:10, color:'#6B7280', marginTop:4 }}>vs 2025 actual</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>{t('wages.forecastPct')}</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#4FC3F7' }}>{pctOfRev.toFixed(1)}%</div>
            <div style={{ fontSize:10, color:'#6B7280', marginTop:4 }}>of 2026 revenue</div>
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

function OverviewMonthlyChart({ months, rev, ebitda, maxRev, fmtK }) {
  const { containerProps, segmentProps, overlay } = useChartTooltip()
  return (
    <div {...containerProps} style={{ display:'flex', alignItems:'flex-end', gap:6, height:140, marginBottom:8, position:'relative' }}>
      {months.map((m,i) => (
        <div key={m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
          <div style={{ width:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end', height:120 }}>
            <div
              style={{ width:'100%', background:'#4FC3F7', borderRadius:'2px 2px 0 0', height:Math.max(2,(rev[i]/maxRev)*100)+'px', opacity:0.7, cursor:'default' }}
              {...segmentProps(`${m}\nRevenue ${fmtK(rev[i])}`)}
            />
            <div
              style={{ width:'100%', background:ebitda[i]>0?'#2DD4BF':'#EF4444', borderRadius:'2px 2px 0 0', height:Math.max(2,(Math.abs(ebitda[i])/maxRev)*100)+'px', marginTop:2, cursor:'default' }}
              {...segmentProps(`${m}\nEBITDA ${fmtK(ebitda[i])}`)}
            />
          </div>
          <div style={{ fontSize:9, color:'#6B7280' }}>{m}</div>
        </div>
      ))}
      {overlay}
    </div>
  )
}

function Stacked2026({ monthly, kind, maxH=120, fmt, t }) {
  const { containerProps, segmentProps, overlay } = useChartTooltip()
  const palette = kind === 'income'
    ? ['#0E7490','#0891B2','#06B6D4','#22D3EE','#67E8F9','#A5F3FC']
    : ['#4C1D95','#6D28D9','#8B5CF6','#A78BFA','#C4B5FD']
  const LABELS = kind === 'income'
    ? [t('incomeSources.bar'), t('incomeSources.onlineGolf'), t('incomeSources.bookings'), t('incomeSources.privateHires'), t('incomeSources.serviceCharge'), t('incomeSources.poolTickets')]
    : [t('costCategories.wages'), t('costCategories.fixed'), t('costCategories.drinks'), t('costCategories.vat'), t('performance2026.costNotes.other')]
  const getSegs = m => kind === 'income'
    ? [{ v:m.bar, c:palette[0] },{ v:m.golf, c:palette[1] },{ v:m.events, c:palette[2] },{ v:m.hire, c:palette[3] },{ v:m.sc, c:palette[4] },{ v:m.pool, c:palette[5] }]
    : [{ v:m.wages, c:palette[0] },{ v:m.fixed, c:palette[1] },{ v:m.drinks, c:palette[2] },{ v:m.vat, c:palette[3] },{ v:m.other, c:palette[4] }]
  const total = m => getSegs(m).reduce((s, x) => s + (x.v || 0), 0)
  const maxVal = Math.max(...monthly.map(total))
  return (
    <div {...containerProps} style={{ display:'flex', alignItems:'flex-end', gap:3, height:maxH, position:'relative' }}>
      {monthly.map((m,i) => {
        const tot = total(m)
        const h = Math.round((tot / maxVal) * maxH)
        const segs = getSegs(m)
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', height:maxH }}>
            <div style={{ width:'100%', height:h, display:'flex', flexDirection:'column', borderRadius:'2px 2px 0 0', overflow:'hidden' }}>
              {segs.map((s,j) => (
                <div key={j} style={{ height:`${tot > 0 ? (s.v / tot) * 100 : 0}%`, background:s.c, cursor:'default' }} {...segmentProps(`${m.m} · ${LABELS[j]}\n${fmt(s.v)}`)} />
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

function computeScenario({ barG, golfG, eventsG, hiresG, poolG, opexMult = 1 }) {
  // Service Charge is the only derived line — it scales by the average of
  // the 5 commercial levers since it tracks aggregate covers.
  const avg = (barG + golfG + eventsG + hiresG + poolG) / 5
  const bar = 362836 * (1 + barG / 100)
  const golf = 210485 * (1 + golfG / 100)
  const events = 106023 * (1 + eventsG / 100)
  const hires = 44999 * (1 + hiresG / 100)
  const pool = 2198 * (1 + poolG / 100)
  const sc = 15102 * (1 + avg / 100)
  const revenue = bar + golf + events + hires + sc + pool
  const mult = revenue / 741644

  const costs =
    242370 * 1.10
    + 165647 * 1.10
    + bar * 0.30
    + 78851 * mult
    + 22965 * mult
    + 17152 * mult
    + 9101 * mult
    + 3492
    + 5443 * mult

  const adjustedCosts = costs * opexMult
  const profit = revenue - adjustedCosts
  const investorReturn = Math.max(0, profit) * 0.50
  const coc = investorReturn / 79000 * 100
  return { revenue, profit, investorReturn, coc }
}

function TabScenarios({ growth, opex, setOpex }) {
  const { t } = useTranslation('explorer')
  const { t: tc } = useTranslation('common')
  const { fmt, fmtK } = useFmt()

  const sliders = SCENARIO_LEVERS.map(l => ({
    key: l.key,
    labelKey: l.key,
    value: growth[l.key],
    set: growth['set' + l.setSuffix],
    color: l.color,
    base: l.base,
  }))

  const custom = computeScenario({
    barG: growth.bar, golfG: growth.golf, eventsG: growth.events, hiresG: growth.hires, poolG: growth.pool,
    opexMult: opex / 100,
  })
  const buildPreset = pct => computeScenario({ barG: pct, golfG: pct, eventsG: pct, hiresG: pct, poolG: pct })
  const presets = [
    { labelKey:'conservative', pct:-10, ...buildPreset(-10) },
    { labelKey:'base',         pct: 15, ...buildPreset(15)  },
    { labelKey:'optimistic',   pct: 25, ...buildPreset(25)  },
  ]

  const revenueLabel = tc('labels.revenue')
  const opProfit = t('scenarios.opProfit')
  const investorRet = t('scenarios.investorReturn')
  const cocLabel = tc('labels.cashOnCash')

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('scenarios.buildCustom')}</div>
          <div style={{ fontSize:11, color:'#9CA3AF' }}>{t('scenarios.leverNote')}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:16 }}>
          {sliders.map(s => (
            <div key={s.key}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                <span style={{ color:'var(--cream)' }}>{t(`scenarios.levers.${s.labelKey}`)} <span style={{ color:'#6B7280', marginLeft:4 }}>(2025: {fmtK(s.base)})</span></span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:s.color, fontWeight:600 }}>{s.value>0?'+':''}{s.value}%</span>
                  <ResetBtn onClick={()=>s.set(15)} title={t('scenarios.resetTo15')} />
                </span>
              </div>
              <input type="range" min={-20} max={50} value={s.value} onChange={e=>s.set(Number(e.target.value))} style={{ width:'100%', accentColor:s.color }} />
              <div style={{ fontSize:10, color:'#6B7280', marginTop:3 }}>{t('scenarios.newLabel')} {fmtK(s.base * (1 + s.value / 100))}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
            <span style={{ color:'var(--cream)' }}>{t('scenarios.opex')} <span style={{ color:'#6B7280', marginLeft:4 }}>{t('scenarios.opexHint')}</span></span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <span style={{ color:'#EA580C', fontWeight:600 }}>{opex}%</span>
              <ResetBtn onClick={()=>setOpex(100)} title={t('scenarios.resetTo100')} />
            </span>
          </div>
          <input type="range" min={70} max={130} value={opex} onChange={e=>setOpex(Number(e.target.value))} style={{ width:'100%', accentColor:'#EA580C' }} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {presets.map(p => (
          <button key={p.labelKey} onClick={()=>growth.setAll(p.pct)} title={`Apply ${p.pct>0?'+':''}${p.pct}%`} style={{
            background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:16, cursor:'pointer', textAlign:'left', transition:'all 0.15s',
          }}>
            <div style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4, fontWeight:600 }}>{t(`scenarios.cards.${p.labelKey}`)}</div>
            <div style={{ fontSize:10, color:'#6B7280', marginBottom:10 }}>{p.pct>0?'+':''}{p.pct}%</div>
            {[[revenueLabel,fmtK(p.revenue)],[opProfit,fmtK(p.profit)],[investorRet,fmt(Math.round(p.investorReturn))],[cocLabel,p.coc.toFixed(1)+'%']].map(([l,v],j) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:12 }}>
                <span style={{ color:'#9CA3AF' }}>{l}</span>
                <span style={{ color:j===3?'#2DD4BF':'var(--cream)', fontWeight:j===3?700:400 }}>{v}</span>
              </div>
            ))}
          </button>
        ))}
        <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, padding:16 }}>
          <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4, fontWeight:600 }}>{t('scenarios.cards.custom')}</div>
          <div style={{ fontSize:10, color:'#6B7280', marginBottom:10 }}>OpEx {opex}%</div>
          {[[revenueLabel,fmtK(custom.revenue)],[opProfit,fmtK(custom.profit)],[investorRet,fmt(Math.round(custom.investorReturn))],[cocLabel,custom.coc.toFixed(1)+'%']].map(([l,v],j) => (
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
  const { t } = useTranslation('explorer')
  const tailwindKeys = ['social','corporate','recession','occasions','repeat','pricing']
  const tailwindIcons = { social:'📱', corporate:'🏢', recession:'💰', occasions:'🎂', repeat:'🔄', pricing:'📈' }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { value:'+31.1%', label:t('market.header'), sub:t('market.growthNote'), color:'#2DD4BF' },
          { value:'15–20M', label:t('market.visitors'), sub:t('market.visitorsNote'), color:'#4FC3F7' },
          { value:'130K+',  label:t('market.commuters'), sub:t('market.commutersNote'), color:'#C9A84C' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, marginBottom:6 }}>{s.value}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--cream)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>{t('market.demographics')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[[t('market.age'),'48%','#4FC3F7'],[t('market.income'),'£57K','#C9A84C'],[t('market.edu'),'62%','#2DD4BF'],[t('market.office'),'71%','#8B5CF6']].map(([l,v,c]) => (
            <div key={l} style={{ textAlign:'center', padding:14, background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
              <div style={{ fontSize:20, fontWeight:700, color:c, marginBottom:4 }}>{v}</div>
              <div style={{ fontSize:11, color:'#9CA3AF' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('market.tailwinds')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {tailwindKeys.map(k => (
            <div key={k} style={{ display:'flex', gap:12, padding:14, background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
              <div style={{ fontSize:20, flexShrink:0 }}>{tailwindIcons[k]}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--cream)', marginBottom:4 }}>{t(`market.items.${k}.title`)}</div>
                <div style={{ fontSize:12, color:'#9CA3AF', lineHeight:1.5 }}>{t(`market.items.${k}.text`)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabWages({ wages }) {
  const { t } = useTranslation('explorer')
  const { fmt, fmtNum } = useFmt()
  // Hours come from data.js WAGE_RATES (2026 plan); rates from lifted state.
  const roles = [
    { labelKey:'bar',         hours: WAGE_RATES[0].hours, rate: wages.bar, setRate: wages.setBar, plan: WAGE_RATES[0].rate, min:12.21, max:18 },
    { labelKey:'supervisor',  hours: WAGE_RATES[1].hours, rate: wages.sup, setRate: wages.setSup, plan: WAGE_RATES[1].rate, min:13.85, max:20 },
    { labelKey:'asstManager', hours: WAGE_RATES[2].hours, rate: wages.am,  setRate: wages.setAm,  plan: WAGE_RATES[2].rate, min:14.35, max:22 },
    { labelKey:'manager',     hours: WAGE_RATES[3].hours, rate: wages.mgr, setRate: wages.setMgr, plan: WAGE_RATES[3].rate, min:15.38, max:25 },
  ]
  const totalWages = Math.round(roles.reduce((s,r)=>s+r.hours*r.rate,0))
  const planWages = PL_WAGE_BASE
  const delta = totalWages - planWages
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:t('wages.total'),     value:fmt(242370), sub:t('wages.totalNote'), color:'#C9A84C' },
          { label:t('wages.hours'),     value:t('wages.hoursValue'), sub:t('wages.hoursNote'), color:'#4FC3F7' },
          { label:t('wages.pct'),       value:'20.8%',    sub:t('wages.pctNote'),    color:'#2DD4BF' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('wages.calculatorHeader')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:16 }}>
          {roles.map(r => (
            <div key={r.labelKey} style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontWeight:600, color:'var(--cream)' }}>{t(`wages.roles.${r.labelKey}`)}</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'var(--gold)', fontWeight:700 }}>£{r.rate.toFixed(2)}/hr</span>
                  <ResetBtn onClick={()=>r.setRate(r.plan)} title={`Reset £${r.plan.toFixed(2)}/hr`} />
                </span>
              </div>
              <input type="range" min={r.min} max={r.max} step={0.01} value={r.rate} onChange={e=>r.setRate(Number(e.target.value))} style={{ width:'100%', accentColor:'var(--gold)', marginBottom:6 }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#6B7280' }}>
                <span>{fmtNum(r.hours)} {t('wages.hrs')}</span>
                <span>{t('wages.annual')} {fmt(Math.round(r.hours*r.rate))}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>{t('wages.projected')}</div>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--gold)' }}>{fmt(totalWages)}</div>
          </div>
          <div style={{ background:delta>0?'rgba(239,68,68,0.08)':'rgba(45,212,191,0.08)', border:`1px solid ${delta>0?'rgba(239,68,68,0.2)':'rgba(45,212,191,0.2)'}`, borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>{t('wages.delta')}</div>
            <div style={{ fontSize:20, fontWeight:800, color:delta>0?'#EF4444':'#2DD4BF' }}>{delta>0?'+':''}{fmt(delta)}</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>{t('wages.forecastPct')}</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#4FC3F7' }}>{(totalWages/852891*100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BusinessExplorer() {
  const { t } = useTranslation('explorer')
  const { t: tc } = useTranslation('common')
  const [tab, setTab] = useState('overview')

  const [barGrowth, setBarGrowth]       = useState(15)
  const [golfGrowth, setGolfGrowth]     = useState(15)
  const [hiresGrowth, setHiresGrowth]   = useState(15)
  const [eventsGrowth, setEventsGrowth] = useState(15)
  const [poolGrowth, setPoolGrowth]     = useState(15)
  const setAllGrowth = v => {
    setBarGrowth(v); setGolfGrowth(v); setHiresGrowth(v); setEventsGrowth(v); setPoolGrowth(v)
  }
  const growth = {
    bar: barGrowth, setBar: setBarGrowth,
    golf: golfGrowth, setGolf: setGolfGrowth,
    hires: hiresGrowth, setHires: setHiresGrowth,
    events: eventsGrowth, setEvents: setEventsGrowth,
    pool: poolGrowth, setPool: setPoolGrowth,
    setAll: setAllGrowth,
  }

  // OpEx multiplier lifted so 2026 Performance + Scenarios tabs share a value.
  const [opex, setOpex] = useState(100)

  // Wage rates lifted to parent so the 2026 Performance tab and the standalone
  // Wages tab share the same state — moving a slider in either reflects in both.
  // Defaults match WAGE_RATES (2025 actual rates). Hours come from data.js.
  const [barRate, setBarRate] = useState(WAGE_RATES[0].rate)
  const [supRate, setSupRate] = useState(WAGE_RATES[1].rate)
  const [amRate,  setAmRate]  = useState(WAGE_RATES[2].rate)
  const [mgrRate, setMgrRate] = useState(WAGE_RATES[3].rate)
  const wages = {
    bar: barRate, setBar: setBarRate,
    sup: supRate, setSup: setSupRate,
    am:  amRate,  setAm:  setAmRate,
    mgr: mgrRate, setMgr: setMgrRate,
    resetAll: () => {
      setBarRate(WAGE_RATES[0].rate); setSupRate(WAGE_RATES[1].rate)
      setAmRate(WAGE_RATES[2].rate);  setMgrRate(WAGE_RATES[3].rate)
    },
  }

  const tabComponents = {
    overview: <TabOverview />,
    performance2025: <FinancialPerformance />,
    performance2026: <TabPerformance growth={growth} wages={wages} opex={opex} setOpex={setOpex} />,
    scenarios: <TabScenarios growth={growth} opex={opex} setOpex={setOpex} />,
    market: <TabMarketContext />,
    wages: <TabWages wages={wages} />,
  }
  return (
    <div style={{ minHeight:'100%', background:'var(--ink)', color:'var(--cream)' }}>
      <div style={{ padding:'20px 32px 0', borderBottom:'1px solid rgba(201,168,76,0.12)' }}>
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TAB_KEYS.map(k => (
            <button key={k} onClick={()=>setTab(k)} style={{ padding:'8px 16px', fontSize:11, cursor:'pointer', border:'none', background:'transparent', letterSpacing:'0.06em', textTransform:'uppercase', borderBottom:`2px solid ${tab===k?'var(--gold)':'transparent'}`, color:tab===k?'var(--gold)':'var(--cream-dim)', transition:'all 0.15s', whiteSpace:'nowrap' }}>{t(`tabs.${k}`)}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:'24px 32px 24px', fontSize:13 }}>{tabComponents[tab]}</div>
      <div style={{ padding:'20px 32px 32px', borderTop:'1px solid rgba(201,168,76,0.12)', marginTop:12 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>{tc('shell.brand')}</div>
        <div style={{ fontSize:14, color:'var(--cream-dim)' }}>{t('header')}</div>
      </div>
    </div>
  )
}
