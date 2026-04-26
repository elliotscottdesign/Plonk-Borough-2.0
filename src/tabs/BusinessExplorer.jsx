import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import FinancialPerformance, { INCOME, COSTS, MONTHLY_INCOME, MONTHLY_COSTS, DonutChart } from '../slides/FinancialPerformance.jsx'
import ResetBtn from '../components/ResetBtn.jsx'
import { useChartTooltip } from '../components/ChartTooltip.jsx'
import { formatCurrency, formatNumber } from '../i18n/format.js'
import { DEAL, ACTUALS_2025, FORECAST, WAGE_RATES, WAGE_OVERHEAD_MULT, PL_WAGE_BASE, IP_LICENSING_TOKEN_VALUE, IP_LICENSING_SKUS_ONLINE_2025, IP_LICENSING_SKUS_OFFICE_2025 } from '../data.js'
import { useLockedForecast } from '../components/LockedForecastContext.jsx'

const TAB_KEYS = ['overview','performance2025','performance2026']

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
// costs: wages +10%, fixed +10%, drinks = 30% of bar revenue, office driven by
// the OfficeCostsSection, everything else scales with revenue. Palette shifted to teals (income) and purples
// (costs) to read as "forecast" vs the blue/red 2025 actuals.
const INCOME_2026_COLORS = ['#0E7490','#0891B2','#06B6D4','#22D3EE','#67E8F9','#A5F3FC']
const COSTS_2026_COLORS  = ['#4C1D95','#5B21B6','#6D28D9','#7C3AED','#8B5CF6','#A78BFA','#C4B5FD','#D8B4FE','#DDD6FE','#EDE9FE']
const PERF_GROWTH_MIN = -20
const PERF_GROWTH_MAX = 50

const perfGrowthToPct = g => ((g - PERF_GROWTH_MIN) / (PERF_GROWTH_MAX - PERF_GROWTH_MIN)) * 100

// ─── Ticket economics constants ──────────────────────────────────────
// Each ticket carries:
//   - VAT: 20% of gross (= price × 1/6 output VAT to HMRC)
//   - Fixed-cost allocation: 16% of gross (rent + bills allocation)
//   - Token cost: tokens × £0.325 (paid to arcade operator)
//   - Margin: gross − VAT − fixed − token cost
// The Ticket Price Maker matrix lets users edit price + tokens per SKU;
// totals flow back into the Arcades cost line via matrix-driven token cost.
const TICKET_VAT_FRACTION   = 1 / 6        // output VAT as a fraction of gross
const TICKET_FIXED_COST_PCT = 0.16         // rent + bills allocation as % of gross

// Combined SKU list (online + till) — one row per SKU type, volumes
// summed across both channels. Used as the source of truth for the
// Ticket Price Maker matrix.
const TICKET_SKUS_2025 = IP_LICENSING_SKUS_ONLINE_2025.map(online => {
  const office = IP_LICENSING_SKUS_OFFICE_2025.find(o => o.sku === online.sku)
  return {
    sku: online.sku,
    rounds: online.rounds,
    tokens: online.tokens,
    price: online.price,
    sold: online.sold + (office?.sold || 0),
  }
})

// Default per-SKU pricing — used to seed the editable state and as the
// "baseline" for computing Arcades cost adjustments from matrix changes.
const TICKET_PRICING_DEFAULTS = TICKET_SKUS_2025.reduce((acc, s) => {
  acc[s.sku] = { tokens: s.tokens, price: s.price }
  return acc
}, {})

// Baseline 2025 token count across all SKUs at default attach rates.
// Used to compute the Arcades cost baseline when matrix tokens change.
const BASELINE_TOKENS_2025 = TICKET_SKUS_2025.reduce((sum, s) => sum + s.tokens * s.sold, 0)

// ─── Office costs (Apps · AI · Accounting · Director) ────────────────
// Forward-looking 2026 admin-overhead bucket. Recurring SaaS subs come
// from 2025 weekly P&L (£25/mo Xero, £25/mo Google) where available;
// RotaCloud sized up for 10 users (~£40/mo); Claude AI from current Pro
// pricing (£20/mo); accounting and director salary user-specified.
// Total flows to the cost donut as a new "Office & Admin" line.
const OFFICE_COST_ITEMS = [
  { id: 'xero',       monthlyHint: 25,   source: 'weekly2025' },
  { id: 'rotacloud',  monthlyHint: 40,   source: 'pricing'    },
  { id: 'claude',     monthlyHint: 20,   source: 'pricing'    },
  { id: 'google',     monthlyHint: 25,   source: 'weekly2025' },
  { id: 'webhosting', monthlyHint: 42,   source: 'pricing'    },
  { id: 'accounting', monthlyHint: null, source: 'specified'  },
  { id: 'director',   monthlyHint: null, source: 'estimated'  },
]

const OFFICE_COSTS_2026_DEFAULTS = {
  xero:        300,   // £25/mo × 12
  rotacloud:   480,   // ~£40/mo for 10 users × 12
  claude:      240,   // Claude Pro £20/mo × 12
  google:      300,   // £25/mo × 12
  webhosting:  500,   // basic shared hosting · annual prepay (~£42/mo equivalent)
  accounting: 3000,   // annual fees (user-specified)
  director:  30000,   // total directors' compensation budget — can be split
                      // across multiple directors. Aligned with other
                      // references throughout the deck.
}

const sumOfficeCosts = (state) => OFFICE_COST_ITEMS.reduce(
  (sum, item) => sum + (state[item.id] ?? OFFICE_COSTS_2026_DEFAULTS[item.id]),
  0,
)

// ─── Fixed costs (rent, rates, utilities) ────────────────────────────
// Sourced from rows 21–32 of "2025 WEEKLY CATEGORISED COSTS" in the
// authoritative weekly P&L workbook. The 12 reference annual values
// sum to £165,647 — exact match with COST_CATEGORIES.fixed in data.js.
// Defaults for the 2026 monthly editable state = (2025 annual / 12)
// × 1.10 inflation, so model behaviour at default is unchanged.
const FIXED_COST_ITEMS = [
  { id: 'rent',        ref2025Annual: 75000 },
  { id: 'rates',       ref2025Annual: 18000 },
  { id: 'electricity', ref2025Annual: 18000 },
  { id: 'gas',         ref2025Annual: 10000 },
  { id: 'water',       ref2025Annual:  4000 },
  { id: 'insurance',   ref2025Annual: 10000 },
  { id: 'internet',    ref2025Annual:  4000 },
  { id: 'prs',         ref2025Annual:  2500 },
  { id: 'waste',       ref2025Annual:  4500 },
  { id: 'pest',        ref2025Annual:  1500 },
  { id: 'maintenance', ref2025Annual: 14000 },
  { id: 'misc',        ref2025Annual:  4147 },
]

// Default 2026 monthly = 2025 monthly × 1.10 inflation, rounded to £.
const FIXED_COSTS_2026_DEFAULTS = FIXED_COST_ITEMS.reduce((acc, item) => {
  acc[item.id] = Math.round((item.ref2025Annual / 12) * 1.10)
  return acc
}, {})

const sumFixedCostsAnnual = (state) => FIXED_COST_ITEMS.reduce(
  (sum, item) => sum + (state[item.id] ?? FIXED_COSTS_2026_DEFAULTS[item.id]) * 12,
  0,
)

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

// Section keys for the 2026 Performance left-nav. Each maps to a content
// block rendered on the right when active. Order matters — it's the
// reading order an investor sees.
const PERF_SECTIONS = [
  { id: 'tickets', icon: '🎟' },
  { id: 'income',  icon: '💰' },
  { id: 'opcosts', icon: '💸' },
  { id: 'fixed',   icon: '🏠' },
  { id: 'wages',   icon: '👥' },
  { id: 'office',  icon: '🏢' },
]

function TabPerformance({ growth, wages, pricing, setPricing, officeCosts, setOfficeCosts, fixedCosts, setFixedCosts }) {
  const [activeSection, setActiveSection] = useState('tickets')
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
  const scalesNote = t('performance2026.costNotes.scales')

  // ─── Operating cost lines (no VAT) ─────────────────────────────────────
  // Hosting (Lithos) removed — under new IP & Licensing model, SEO/Ads
  // and the hosting fee sit with Plonk Golf, not the venue.
  // Fixed Costs now driven by the FixedCostsSection editable matrix.
  const fixedLine       = sumFixedCostsAnnual(fixedCosts)
  const cleaningLine    = Math.round(22965 * mult)
  const foodLine        = Math.round(9101 * mult)
  const cardChargesLine = Math.round(5443 * mult)

  // Arcades = baseline (volume-scaled) + matrix-driven token-cost delta.
  // Total tokens distributed in 2026 = sum across all SKUs of
  //   matrix-tokens(sku) × volume2026(sku),
  // where volume2026 = 2025 volume × (1 + growth.golf/100). The baseline
  // (everyone at 2025 default tokens) gives the volume-scaled cost; matrix
  // changes from default flow as a delta.
  const golfVolMult = 1 + growth.golf / 100
  const matrixTokens2026   = TICKET_SKUS_2025.reduce((sum, s) => sum + (pricing[s.sku]?.tokens ?? s.tokens) * s.sold * golfVolMult, 0)
  const baselineTokens2026 = BASELINE_TOKENS_2025 * golfVolMult
  const arcadeAttachAdjust = (matrixTokens2026 - baselineTokens2026) * IP_LICENSING_TOKEN_VALUE
  const arcadesLine        = Math.round(17152 * mult + arcadeAttachAdjust)

  // ─── Net VAT (computed, replaces the historical 78851*mult line) ───────
  // Output VAT  = revenue × 1/6  (revenue is gross of 20% VAT)
  // Input VAT   = VAT-able costs × 1/6
  // VAT-able    = fixed + drinks + cleaning + cardCharges
  // Zero-rated  = wages, arcades, food (per business owner)
  // Sense check: 2025 actuals → ~£77.8k, vs P&L £78.85k (1.3% diff) ✓
  const VAT_FRACTION   = 1 / 6
  const vatableCosts   = fixedLine + drinksGas2026 + cleaningLine + cardChargesLine
  const outputVat      = totalIncome * VAT_FRACTION
  const inputVat       = vatableCosts * VAT_FRACTION
  const netVat         = Math.round(outputVat - inputVat)
  const vatComputedNote = t('performance2026.costNotes.vatComputed')

  // Office costs (Apps + AI + Accounting + Director). Driven by the
  // OfficeCostsSection editable matrix; flows here as a single line.
  const officeCostsTotal = sumOfficeCosts(officeCosts)

  const costsRaw = [
    { labelKey: 'wages',       value: wageBill2026,    note: t('performance2026.costNotes.wagesDriven') },
    { labelKey: 'fixed',       value: fixedLine,        note: t('performance2026.costNotes.fixedDriven') },
    { labelKey: 'office',      value: officeCostsTotal, note: t('performance2026.costNotes.office'), customLabel: t('costCategories.office') },
    { labelKey: 'drinks',      value: drinksGas2026,    note: t('performance2026.costNotes.drinks') },
    { labelKey: 'vat',         value: netVat,            note: vatComputedNote },
    { labelKey: 'cleaning',    value: cleaningLine,     note: scalesNote },
    { labelKey: 'arcades',     value: arcadesLine,      note: t('performance2026.costNotes.arcades') },
    { labelKey: 'food',        value: foodLine,         note: scalesNote },
    { labelKey: 'cardCharges', value: cardChargesLine,  note: scalesNote },
  ]
  const totalCosts = costsRaw.reduce((s, c) => s + c.value, 0)
  const costs2026 = costsRaw.map((c, idx) => ({
    ...c,
    label: c.customLabel || t(`costCategories.${c.labelKey}`),
    pct: +(c.value / totalCosts * 100).toFixed(1),
    color: COSTS_2026_COLORS[idx] || COSTS_2026_COLORS[COSTS_2026_COLORS.length - 1],
  }))

  // ─── KPI metrics ─────────────────────────────────────────────────────
  // Adjusted EBITDA = Revenue − OPERATING costs (excludes VAT) — proper
  // accounting EBITDA (VAT is a tax pass-through, not an operating cost).
  // Profit After VAT = Revenue − Total Costs (= EBITDA − Net VAT) — bottom line.
  const operatingCosts = totalCosts - netVat
  const ebitda = totalIncome - operatingCosts
  const margin = totalIncome > 0 ? ebitda / totalIncome : 0
  const profitAfterVat = totalIncome - totalCosts
  const profitAfterVatMargin = totalIncome > 0 ? profitAfterVat / totalIncome : 0

  const monthlyIncome2026 = MONTHLY_INCOME.map(m => ({
    m: m.m,
    bar:    Math.round(m.bar    * (1 + growth.bar    / 100)),
    golf:   Math.round(m.golf   * (1 + growth.golf   / 100)),
    events: Math.round(m.events * (1 + growth.events / 100)),
    hire:   Math.round(m.hire   * (1 + growth.hires  / 100)),
    pool:   Math.round(m.pool   * (1 + growth.pool   / 100)),
    sc:     Math.round(m.sc     * mult),
  }))
  const officeCostsMonthly = Math.round(officeCostsTotal / 12)
  const monthlyCosts2026 = MONTHLY_COSTS.map(m => {
    const mi = MONTHLY_INCOME.find(x => x.m === m.m)
    const mthBar2026 = mi ? Math.round(mi.bar * (1 + growth.bar / 100)) : 0
    return {
      m: m.m,
      wages:  Math.round(m.wages * 1.10),
      fixed:  Math.round(m.fixed * 1.10),
      office: officeCostsMonthly,                        // even spread; the line is fixed-per-year
      drinks: Math.round(mthBar2026 * 0.30),
      vat:    Math.round(m.vat * mult),
      other:  Math.round((m.other || m.vat2 || 0) * mult),
    }
  })

  const sliderValue = Math.round(aggGrowth)

  const perfMarkers = [
    { labelKey: 'bear',  value: -10, color: '#EF4444' },
    { labelKey: 'y2025', value:   0, color: '#9CA3AF' },
    { labelKey: 'base',  value:  15, color: '#C9A84C' },
    { labelKey: 'bull',  value:  25, color: '#22D3EE' },
  ]

  // ─── Lock / snapshot ─────────────────────────────────────────────────
  // When user clicks Lock, capture the live forecast totals. Deck slides
  // read this snapshot to populate the Custom scenario card.
  const { isLocked, lock, unlock } = useLockedForecast()
  const handleLockToggle = () => {
    if (isLocked) {
      unlock()
    } else {
      lock({
        revenue:        totalIncome,
        totalCosts,
        ebitda,
        profitAfterVat,
        netVat,
        opProfit:       profitAfterVat,                  // alias for waterfall slide
        margin,
        profitAfterVatMargin,
        // Echo the levers so any slide that wants the underlying scenario can read them.
        growthLevers:   { ...growth },
      })
    }
  }

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
            <ResetBtn onClick={()=>{ if (!isLocked) growth.setAll(15) }} title={t('performance2026.resetLevers')} />
            <button
              onClick={handleLockToggle}
              title={t(isLocked ? 'performance2026.unlockTitle' : 'performance2026.lockTitle')}
              style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'6px 12px', borderRadius:6, fontSize:11, fontWeight:700,
                letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
                background: isLocked ? 'rgba(45,212,191,0.15)' : 'rgba(201,168,76,0.10)',
                border: `1px solid ${isLocked ? 'rgba(45,212,191,0.45)' : 'rgba(201,168,76,0.35)'}`,
                color: isLocked ? '#2DD4BF' : 'var(--gold)',
                transition:'all 0.15s',
              }}
            >
              <span>{isLocked ? '🔒' : '🔓'}</span>
              <span>{t(isLocked ? 'performance2026.locked' : 'performance2026.lock')}</span>
            </button>
          </div>
        </div>
        {isLocked && (
          <div style={{ marginTop:8, padding:'8px 12px', background:'rgba(45,212,191,0.06)', border:'1px solid rgba(45,212,191,0.2)', borderRadius:6, fontSize:11, color:'#9CA3AF', lineHeight:1.5 }}>
            {t('performance2026.lockedNote')}
          </div>
        )}
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
            <button key={mk.labelKey} onClick={()=>{ if (!isLocked) growth.setAll(mk.value) }} disabled={isLocked} style={{
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
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:20 }}>
          <KpiCard2026 label={t('performance2026.adjustedRevenue')} value={fmtK(totalIncome)} color="#22D3EE" />
          <KpiCard2026 label={t('performance2026.adjustedEbitda')} value={fmtK(ebitda)} sub={`${(margin*100).toFixed(1)}% ${t('performance2026.margin')}`} color={ebitda > 0 ? '#A78BFA' : '#EF4444'} />
          <KpiCard2026 label={t('performance2025.totalCosts')} value={fmtK(totalCosts)} color="#8B5CF6" />
          <KpiCard2026 label={t('performance2026.profitAfterVat')} value={fmtK(profitAfterVat)} sub={`${(profitAfterVatMargin*100).toFixed(1)}% ${t('performance2026.margin')} · ${t('performance2026.netVatLabel')} ${fmtK(netVat)}`} color={profitAfterVat > 0 ? '#2DD4BF' : '#EF4444'} />
        </div>
      </div>

      {/* ─── SCENARIO PRESETS ─── 4 summary cards, snap-jumps via growth.setAll */}
      <ScenarioPresetsCard growth={growth} officeCostsTotal={officeCostsTotal} />

      {/* ─── INDEX + CONTENT ─── left-side nav, right-side active section */}
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:16, alignItems:'flex-start' }}>
        {/* Sticky sidebar TOC */}
        <div style={{ position:'sticky', top:16, background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:8 }}>
          <div style={{ fontSize:10, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.1em', padding:'6px 8px 10px' }}>{t('sections.indexLabel')}</div>
          {PERF_SECTIONS.map(s => {
            const isActive = activeSection === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  width:'100%', padding:'10px 12px', marginBottom:4,
                  background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(201,168,76,0.35)' : '1px solid transparent',
                  borderRadius:6,
                  color: isActive ? 'var(--gold)' : 'var(--cream)',
                  fontSize:12, fontWeight: isActive ? 700 : 500,
                  cursor:'pointer', textAlign:'left',
                  letterSpacing:'0.04em', transition:'all 0.15s',
                }}
              >
                <span style={{ fontSize:14, opacity:0.8 }}>{s.icon}</span>
                <span style={{ flex:1 }}>{t(`sections.${s.id}`)}</span>
                {isActive && <span style={{ color:'var(--gold)', fontSize:10 }}>●</span>}
              </button>
            )
          })}
        </div>

        {/* Active section content */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* TICKETS */}
          {activeSection === 'tickets' && (
            <TicketPriceMaker growth={growth} pricing={pricing} setPricing={setPricing} />
          )}

          {/* INCOME — growth levers + income donut + monthly */}
          {activeSection === 'income' && (
            <>
              <ScenarioLeversCard growth={growth} />
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
            </>
          )}

          {/* OPERATING COSTS — full cost donut + monthly */}
          {activeSection === 'opcosts' && (
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
          )}

          {/* FIXED COSTS */}
          {activeSection === 'fixed' && (
            <FixedCostsSection fixedCosts={fixedCosts} setFixedCosts={setFixedCosts} />
          )}

          {/* WAGES */}
          {activeSection === 'wages' && (
            <WageCalculatorCard wages={wages} totalIncome={totalIncome} />
          )}

          {/* OFFICE COSTS */}
          {activeSection === 'office' && (
            <OfficeCostsSection officeCosts={officeCosts} setOfficeCosts={setOfficeCosts} />
          )}
        </div>
      </div>

    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
// Build Custom Scenario card — 5 growth levers driving the 2026 forecast.
// State is lifted in BusinessExplorer parent so the levers, the read-only
// slider above, and the income/cost donuts all stay in sync.
// ───────────────────────────────────────────────────────────────────────
function ScenarioLeversCard({ growth }) {
  const { t } = useTranslation('explorer')
  const { fmt, fmtK } = useFmt()
  const { isLocked } = useLockedForecast()

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

  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, fontSize:13 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('scenarios.buildCustom')}</div>
        <div style={{ fontSize:11, color:'#9CA3AF' }}>{t('scenarios.leverNote')}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {sliders.map(s => (
          <div key={s.key}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
              <span style={{ color:'var(--cream)' }}>{t(`scenarios.levers.${s.labelKey}`)} <span style={{ color:'#6B7280', marginLeft:4 }}>(2025: {fmtK(s.base)})</span></span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                <span style={{ color:s.color, fontWeight:600 }}>{s.value>0?'+':''}{s.value}%</span>
                <ResetBtn onClick={()=>{ if (!isLocked) s.set(15) }} title={t('scenarios.resetTo15')} />
              </span>
            </div>
            <input type="range" disabled={isLocked} min={-20} max={50} value={s.value} onChange={e=>{ if (!isLocked) s.set(Number(e.target.value)) }} style={{ width:'100%', accentColor:s.color, opacity: isLocked ? 0.6 : 1 }} />
            <div style={{ fontSize:10, color:'#6B7280', marginTop:3 }}>{t('scenarios.newLabel')} {fmtK(s.base * (1 + s.value / 100))}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
// Scenario presets card — 4 summary cards (Conservative/Base/Optimistic/Custom).
// Each preset button snaps all 5 levers to the same value via growth.setAll;
// Custom card mirrors live lever positions. Stand-alone so it can render in
// either spot of the 2026 Performance tab (currently directly under the slider).
// ───────────────────────────────────────────────────────────────────────
function ScenarioPresetsCard({ growth, officeCostsTotal }) {
  const { t } = useTranslation('explorer')
  const { t: tc } = useTranslation('common')
  const { fmt, fmtK } = useFmt()
  const { isLocked } = useLockedForecast()

  const custom = computeScenario({ barG: growth.bar, golfG: growth.golf, eventsG: growth.events, hiresG: growth.hires, poolG: growth.pool, officeCostsTotal })
  const buildPreset = pct => computeScenario({ barG: pct, golfG: pct, eventsG: pct, hiresG: pct, poolG: pct, officeCostsTotal })
  const presets = [
    { labelKey:'conservative', pct:-10, ...buildPreset(-10) },
    { labelKey:'base',         pct: 15, ...buildPreset(15)  },
    { labelKey:'optimistic',   pct: 25, ...buildPreset(25)  },
  ]

  const revenueLabel = tc('labels.revenue')
  const opProfit    = t('scenarios.opProfit')
  const investorRet = t('scenarios.investorReturn')
  const cocLabel    = tc('labels.cashOnCash')

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, fontSize:13 }}>
      {presets.map(p => (
        <button key={p.labelKey} disabled={isLocked} onClick={()=>{ if (!isLocked) growth.setAll(p.pct) }} title={`Apply ${p.pct>0?'+':''}${p.pct}%`} style={{
          background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:16, cursor: isLocked ? 'not-allowed' : 'pointer', textAlign:'left', transition:'all 0.15s', opacity: isLocked ? 0.6 : 1,
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
        <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10, fontWeight:600 }}>{t('scenarios.cards.custom')}</div>
        {[[revenueLabel,fmtK(custom.revenue)],[opProfit,fmtK(custom.profit)],[investorRet,fmt(Math.round(custom.investorReturn))],[cocLabel,custom.coc.toFixed(1)+'%']].map(([l,v],j) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:12 }}>
            <span style={{ color:'#9CA3AF' }}>{l}</span>
            <span style={{ color:j===3?'#2DD4BF':'var(--cream)', fontWeight:j===3?700:400 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
// Ticket Price Maker — editable per-SKU pricing matrix.
//
// Each row is an online ticket SKU (combined online + till volume).
// Editable per row: tokens included, ticket price (2026).
// Computed per row: 2026 volume (= 2025 vol × golf-lever growth),
//   revenue, fixed-cost allocation (16% of price), output VAT (1/6),
//   token cost (tokens × £0.325), margin per ticket, total margin.
//
// Loop-back: the matrix's total token count (sum of tokens × volume2026
// across all SKUs) drives the Arcades cost line in TabPerformance.
// Reducing tokens on any SKU saves operator cost → flows to EBITDA.
// Income lines are NOT yet driven by the matrix — they still use the
// growth levers. Future scope: aggregate matrix revenue → income lines.
// ───────────────────────────────────────────────────────────────────────
function TicketPriceMaker({ growth, pricing, setPricing }) {
  const { t } = useTranslation('explorer')
  const { fmt, fmtNum } = useFmt()
  const { isLocked } = useLockedForecast()

  const golfVolMult = 1 + growth.golf / 100

  // Per-row economics
  const rows = TICKET_SKUS_2025.map(s => {
    const cur          = pricing[s.sku] ?? { tokens: s.tokens, price: s.price }
    const tokens       = cur.tokens
    const price        = cur.price
    const price2025    = s.price                       // historical reference
    const tokens2025   = s.tokens
    const vol2025      = s.sold
    const vol2026      = Math.round(vol2025 * golfVolMult)
    const tokenCost    = tokens * IP_LICENSING_TOKEN_VALUE
    const fixedCost    = price * TICKET_FIXED_COST_PCT
    const vatPerTicket = price * TICKET_VAT_FRACTION
    const marginPerTkt = price - tokenCost - fixedCost - vatPerTicket
    const marginPct    = price > 0 ? (marginPerTkt / price) * 100 : 0
    const rev2025      = vol2025 * price2025
    const rev2026      = vol2026 * price
    const totalMargin  = vol2026 * marginPerTkt
    return { sku: s.sku, rounds: s.rounds, tokens, tokens2025, price, price2025, vol2025, vol2026, tokenCost, fixedCost, vatPerTicket, marginPerTkt, marginPct, rev2025, rev2026, totalMargin }
  })

  // Aggregates
  const totalRev2025    = rows.reduce((sum, r) => sum + r.rev2025, 0)
  const totalRev2026    = rows.reduce((sum, r) => sum + r.rev2026, 0)
  const totalMargin2026 = rows.reduce((sum, r) => sum + r.totalMargin, 0)
  const totalVol2025    = rows.reduce((sum, r) => sum + r.vol2025, 0)
  const totalVol2026    = rows.reduce((sum, r) => sum + r.vol2026, 0)
  const totalTokenCost  = rows.reduce((sum, r) => sum + r.tokenCost * r.vol2026, 0)
  const aggregateMarginPct = totalRev2026 > 0 ? (totalMargin2026 / totalRev2026) * 100 : 0

  const updateSku = (skuKey, field, value) => {
    setPricing(prev => ({ ...prev, [skuKey]: { ...prev[skuKey], [field]: value } }))
  }
  const resetAll = () => setPricing(TICKET_PRICING_DEFAULTS)

  // Cell style helpers
  const cellTd = { padding:'8px 6px', fontSize:11.5, borderBottom:'1px solid rgba(255,255,255,0.05)' }
  const headTh = { padding:'10px 6px', fontSize:9.5, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, textAlign:'right', borderBottom:'1px solid rgba(255,255,255,0.1)' }

  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, fontSize:13 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('priceMaker.header')}</div>
        <ResetBtn onClick={resetAll} title={t('priceMaker.resetAll')} />
      </div>
      <div style={{ fontSize:12, color:'#9CA3AF', marginBottom:14 }}>{t('priceMaker.note')}</div>

      {/* Aggregate summary strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:14 }}>
        <SummaryTile label={t('priceMaker.totals.volume')} v2025={fmtNum(totalVol2025)} v2026={fmtNum(totalVol2026)} />
        <SummaryTile label={t('priceMaker.totals.revenue')} v2025={fmt(Math.round(totalRev2025))} v2026={fmt(Math.round(totalRev2026))} highlight />
        <SummaryTile label={t('priceMaker.totals.margin')} v2025="—" v2026={fmt(Math.round(totalMargin2026))} sub={`${aggregateMarginPct.toFixed(1)}%`} highlight />
        <SummaryTile label={t('priceMaker.totals.tokenCost')} v2025="—" v2026={fmt(Math.round(totalTokenCost))} sub={t('priceMaker.totals.tokenCostSub')} />
      </div>

      {/* Editable matrix */}
      <div style={{ overflowX:'auto', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
          <thead>
            <tr>
              <th style={{ ...headTh, textAlign:'left' }}>{t('priceMaker.col.sku')}</th>
              <th style={headTh}>{t('priceMaker.col.price2025')}</th>
              <th style={headTh}>{t('priceMaker.col.rounds')}</th>
              <th style={headTh}>{t('priceMaker.col.tokens')}</th>
              <th style={headTh}>{t('priceMaker.col.price2026')}</th>
              <th style={headTh}>{t('priceMaker.col.vol2025')}</th>
              <th style={headTh}>{t('priceMaker.col.vol2026')}</th>
              <th style={headTh}>{t('priceMaker.col.marginPerTicket')}</th>
              <th style={headTh}>{t('priceMaker.col.totalMargin')}</th>
              <th style={headTh}>{t('priceMaker.col.marginPct')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.sku} style={{ background: r.vol2025 < 10 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                <td style={{ ...cellTd, color:'#D1D5DB', textAlign:'left' }}>{r.sku}</td>
                <td style={{ ...cellTd, color:'#9CA3AF', textAlign:'right' }}>£{r.price2025.toFixed(2)}</td>
                <td style={{ ...cellTd, color:'#9CA3AF', textAlign:'right' }}>{r.rounds}</td>
                <td style={{ ...cellTd, textAlign:'right' }}>
                  <input
                    type="number" min={0} max={20} step={1} disabled={isLocked}
                    value={r.tokens}
                    onChange={e => updateSku(r.sku, 'tokens', Math.max(0, Number(e.target.value) || 0))}
                    style={{ width:48, padding:'3px 6px', textAlign:'right', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:4, color:'var(--gold)', fontWeight:600, fontSize:12, opacity: isLocked ? 0.6 : 1 }}
                  />
                </td>
                <td style={{ ...cellTd, textAlign:'right' }}>
                  <input
                    type="number" min={0} max={500} step={0.50} disabled={isLocked}
                    value={r.price}
                    onChange={e => updateSku(r.sku, 'price', Math.max(0, Number(e.target.value) || 0))}
                    style={{ width:64, padding:'3px 6px', textAlign:'right', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:4, color:'var(--gold)', fontWeight:600, fontSize:12, opacity: isLocked ? 0.6 : 1 }}
                  />
                </td>
                <td style={{ ...cellTd, color:'#9CA3AF', textAlign:'right' }}>{fmtNum(r.vol2025)}</td>
                <td style={{ ...cellTd, color:'#22D3EE', textAlign:'right' }}>{fmtNum(r.vol2026)}</td>
                <td style={{ ...cellTd, color:'#F5F0E8', textAlign:'right' }}>£{r.marginPerTkt.toFixed(2)}</td>
                <td style={{ ...cellTd, color:'#F5F0E8', fontWeight:600, textAlign:'right' }}>{fmt(Math.round(r.totalMargin))}</td>
                <td style={{ ...cellTd, color: r.marginPct >= 50 ? '#2DD4BF' : r.marginPct >= 30 ? '#C9A84C' : '#EF4444', fontWeight:600, textAlign:'right' }}>{r.marginPct.toFixed(1)}%</td>
              </tr>
            ))}
            <tr style={{ background:'rgba(201,168,76,0.05)', borderTop:'2px solid rgba(201,168,76,0.25)' }}>
              <td style={{ ...cellTd, color:'var(--gold)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', fontSize:10.5, textAlign:'left' }}>{t('priceMaker.col.totals')}</td>
              <td style={{ ...cellTd }}></td>
              <td style={{ ...cellTd }}></td>
              <td style={{ ...cellTd }}></td>
              <td style={{ ...cellTd }}></td>
              <td style={{ ...cellTd, color:'#9CA3AF', textAlign:'right' }}>{fmtNum(totalVol2025)}</td>
              <td style={{ ...cellTd, color:'#22D3EE', fontWeight:700, textAlign:'right' }}>{fmtNum(totalVol2026)}</td>
              <td style={{ ...cellTd }}></td>
              <td style={{ ...cellTd, color:'var(--gold)', fontWeight:700, textAlign:'right' }}>{fmt(Math.round(totalMargin2026))}</td>
              <td style={{ ...cellTd, color:'#2DD4BF', fontWeight:700, textAlign:'right' }}>{aggregateMarginPct.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(45,212,191,0.05)', border:'1px solid rgba(45,212,191,0.18)', borderRadius:6, fontSize:11, color:'#9CA3AF', lineHeight:1.5 }}>
        {t('priceMaker.linkNote')}
      </div>
    </div>
  )
}

function SummaryTile({ label, v2025, v2026, sub, highlight }) {
  return (
    <div style={{ background: highlight ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.03)', border:`1px solid ${highlight ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.08)'}`, borderRadius:8, padding:'12px 14px' }}>
      <div style={{ fontSize:9.5, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:8 }}>
        <div>
          <div style={{ fontSize:9, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em' }}>2025</div>
          <div style={{ fontSize:14, color:'#9CA3AF', fontWeight:600 }}>{v2025}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:9, color:'#22D3EE', textTransform:'uppercase', letterSpacing:'0.06em' }}>2026</div>
          <div style={{ fontSize:18, color: highlight ? 'var(--gold)' : '#F5F0E8', fontWeight:800 }}>{v2026}</div>
          {sub && <div style={{ fontSize:10, color:'#6B7280' }}>{sub}</div>}
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
  const { isLocked } = useLockedForecast()

  const roles = [
    { labelKey:'bar',         hours: WAGE_RATES[0].hours, rate: wages.bar, setRate: wages.setBar, plan: WAGE_RATES[0].rate, min:12.21, max:18 },
    { labelKey:'supervisor',  hours: WAGE_RATES[1].hours, rate: wages.sup, setRate: wages.setSup, plan: WAGE_RATES[1].rate, min:13.85, max:20 },
    { labelKey:'asstManager', hours: WAGE_RATES[2].hours, rate: wages.am,  setRate: wages.setAm,  plan: WAGE_RATES[2].rate, min:14.35, max:22 },
    { labelKey:'manager',     hours: WAGE_RATES[3].hours, rate: wages.mgr, setRate: wages.setMgr, plan: WAGE_RATES[3].rate, min:15.38, max:25 },
  ]

  // 2025 actuals (constants from rota source)
  const TOTAL_HOURS_2025 = 10043
  const REVENUE_2025     = 741644

  // 2026 derived from sliders + WAGE_RATES.hours
  const totalHours2026 = roles.reduce((s, r) => s + r.hours, 0)
  const rotaCost2026   = Math.round(roles.reduce((s, r) => s + r.hours * r.rate, 0))
  const plWage2026     = Math.round(rotaCost2026 * WAGE_OVERHEAD_MULT)

  // Comparison metrics (P&L wage basis on both years for apples-to-apples)
  const pct2025 = (PL_WAGE_BASE / REVENUE_2025) * 100
  const pct2026 = totalIncome > 0 ? (plWage2026 / totalIncome) * 100 : 0
  const wageDelta  = plWage2026 - PL_WAGE_BASE
  const hoursDelta = totalHours2026 - TOTAL_HOURS_2025
  const pctDelta   = pct2026 - pct2025

  // Delta sign helpers — for cost/wage %, "lower is better" (teal); for hours, neutral.
  const deltaCash  = (n) => (n > 0 ? '+' : '') + fmt(n)
  const deltaHours = (n) => (n > 0 ? '+' : '') + fmtNum(n) + ' ' + t('wages.hrs')
  const deltaPts   = (n) => (n > 0 ? '+' : '') + n.toFixed(1) + ' pts'
  const goodIfDown = (n) => (n < 0 ? '#2DD4BF' : n > 0 ? '#EF4444' : '#9CA3AF')
  const neutral    = (n) => (n === 0 ? '#9CA3AF' : '#22D3EE')

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      {/* ─── 2025 vs 2026 comparison strip (replaces the old top + bottom stat strips) */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>{t('wages.compareHeader')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          <CompareCard
            label={t('wages.compareBill')}
            v2025={fmt(PL_WAGE_BASE)}
            v2026={fmt(plWage2026)}
            delta={deltaCash(wageDelta)}
            deltaColor={goodIfDown(wageDelta)}
            sub={t('wages.compareBillSub')}
          />
          <CompareCard
            label={t('wages.compareHours')}
            v2025={fmtNum(TOTAL_HOURS_2025) + ' ' + t('wages.hrs')}
            v2026={fmtNum(totalHours2026) + ' ' + t('wages.hrs')}
            delta={deltaHours(hoursDelta)}
            deltaColor={neutral(hoursDelta)}
            sub={t('wages.compareHoursSub')}
          />
          <CompareCard
            label={t('wages.comparePct')}
            v2025={pct2025.toFixed(1) + '%'}
            v2026={pct2026.toFixed(1) + '%'}
            delta={deltaPts(pctDelta)}
            deltaColor={goodIfDown(pctDelta)}
            sub={t('wages.comparePctSub')}
          />
        </div>
      </div>

      {/* ─── Wage rate calculator (sliders only — KPI strip removed, consolidated above) */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('wages.calculatorHeader')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
          {roles.map(r => (
            <div key={r.labelKey} style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontWeight:600, color:'var(--cream)' }}>{t(`wages.roles.${r.labelKey}`)}</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'var(--gold)', fontWeight:700 }}>£{r.rate.toFixed(2)}/hr</span>
                  <ResetBtn onClick={()=>{ if (!isLocked) r.setRate(r.plan) }} title={`Reset £${r.plan.toFixed(2)}/hr`} />
                </span>
              </div>
              <input type="range" disabled={isLocked} min={r.min} max={r.max} step={0.01} value={r.rate} onChange={e=>{ if (!isLocked) r.setRate(Number(e.target.value)) }} style={{ width:'100%', accentColor:'var(--gold)', marginBottom:6, opacity: isLocked ? 0.6 : 1 }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#6B7280' }}>
                <span>{fmtNum(r.hours)} {t('wages.hrs')}</span>
                <span>{t('wages.annual')} {fmt(Math.round(r.hours*r.rate))}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Compact 2025 vs 2026 comparison card. 2025 column is muted (reference);
// 2026 column is gold and prominent (the live forecast). Delta sits under
// the 2026 value, sub-text spans the bottom.
function CompareCard({ label, v2025, v2026, delta, deltaColor, sub }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'16px 14px' }}>
      <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14, textAlign:'center' }}>{label}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1px 1fr', gap:12, alignItems:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:9, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>2025</div>
          <div style={{ fontSize:18, color:'#9CA3AF', fontWeight:700 }}>{v2025}</div>
        </div>
        <div style={{ width:1, alignSelf:'stretch', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:9, color:'#22D3EE', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>2026</div>
          <div style={{ fontSize:22, color:'var(--gold)', fontWeight:800 }}>{v2026}</div>
          {delta && <div style={{ fontSize:11, color:deltaColor, fontWeight:600, marginTop:3 }}>{delta}</div>}
        </div>
      </div>
      {sub && <div style={{ fontSize:10, color:'#6B7280', textAlign:'center', marginTop:12 }}>{sub}</div>}
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
// ───────────────────────────────────────────────────────────────────────
// Fixed Costs section — rent, rates, utilities, insurance, etc.
// 12 line items sourced from rows 21–32 of the 2025 weekly P&L workbook.
// Each row gets a slider for monthly £; total × 12 drives the Fixed Costs
// line in the cost donut. Defaults match the 2025 reference × 1.10
// inflation (= £182,232/yr, ~£20 off the previous £182,212 due to
// per-row rounding — within tolerance).
// ───────────────────────────────────────────────────────────────────────
function FixedCostsSection({ fixedCosts, setFixedCosts }) {
  const { t } = useTranslation('explorer')
  const { fmt } = useFmt()
  const { isLocked } = useLockedForecast()

  const ref2025Total = FIXED_COST_ITEMS.reduce((sum, i) => sum + i.ref2025Annual, 0)
  const totalAnnual  = sumFixedCostsAnnual(fixedCosts)
  const totalMonthly = Math.round(totalAnnual / 12)
  const delta        = totalAnnual - ref2025Total

  const update = (id, value) => setFixedCosts(prev => ({ ...prev, [id]: Math.max(0, Number(value) || 0) }))
  const resetAll = () => setFixedCosts(FIXED_COSTS_2026_DEFAULTS)

  const deltaColor = delta > 0 ? '#EF4444' : delta < 0 ? '#2DD4BF' : '#9CA3AF'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      {/* Header + total tile */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('fixedCosts.header')}</div>
          <ResetBtn onClick={resetAll} title={t('fixedCosts.resetAll')} />
        </div>
        <div style={{ fontSize:12, color:'#9CA3AF', marginBottom:14 }}>{t('fixedCosts.note')}</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>2025 Actual</div>
            <div style={{ fontSize:20, fontWeight:700, color:'#9CA3AF' }}>{fmt(ref2025Total)}</div>
          </div>
          <div style={{ background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.18)', borderRadius:8, padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'#22D3EE', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>2026 Forecast</div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--gold)' }}>{fmt(totalAnnual)}</div>
            <div style={{ fontSize:11, color:'#6B7280', marginTop:3 }}>{fmt(totalMonthly)} / month</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${deltaColor}33`, borderRadius:8, padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{t('fixedCosts.deltaLabel')}</div>
            <div style={{ fontSize:22, fontWeight:800, color:deltaColor }}>{delta > 0 ? '+' : ''}{fmt(delta)}</div>
            <div style={{ fontSize:11, color:'#6B7280', marginTop:3 }}>{t('fixedCosts.vsReference')}</div>
          </div>
        </div>
      </div>

      {/* Per-row sliders */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>{t('fixedCosts.sliderHeader')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
          {FIXED_COST_ITEMS.map(item => {
            const monthly2025 = Math.round(item.ref2025Annual / 12)
            const monthly2026 = fixedCosts[item.id] ?? FIXED_COSTS_2026_DEFAULTS[item.id]
            const annual2026  = monthly2026 * 12
            const sliderMax   = Math.max(monthly2025 * 2, monthly2026 + 100)
            const monthDelta  = monthly2026 - monthly2025
            const itemDeltaColor = monthDelta > 0 ? '#EF4444' : monthDelta < 0 ? '#2DD4BF' : '#9CA3AF'
            const step = monthly2025 >= 2000 ? 25 : monthly2025 >= 500 ? 5 : 1
            return (
              <div key={item.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'12px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontWeight:600, color:'var(--cream)' }}>{t(`fixedCosts.items.${item.id}`)}</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                    <span style={{ color:'var(--gold)', fontWeight:700, fontSize:14 }}>£{monthly2026.toLocaleString()}/mo</span>
                    <ResetBtn onClick={() => { if (!isLocked) update(item.id, FIXED_COSTS_2026_DEFAULTS[item.id]) }} title={`Reset £${FIXED_COSTS_2026_DEFAULTS[item.id]}/mo`} />
                  </span>
                </div>
                <input
                  type="range" disabled={isLocked} min={0} max={sliderMax} step={step}
                  value={monthly2026}
                  onChange={e => { if (!isLocked) update(item.id, e.target.value) }}
                  style={{ width:'100%', accentColor:'var(--gold)', opacity: isLocked ? 0.6 : 1 }}
                />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:'#6B7280', marginTop:4 }}>
                  <span>{t('fixedCosts.ref2025', { val: '£' + monthly2025.toLocaleString() })}</span>
                  <span style={{ color: itemDeltaColor, fontWeight:600 }}>{monthDelta !== 0 ? `${monthDelta > 0 ? '+' : ''}£${Math.abs(monthDelta).toLocaleString()}/mo` : '—'}</span>
                  <span style={{ color:'#9CA3AF' }}>{t('fixedCosts.annual', { val: fmt(annual2026) })}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
// Office Costs section — Apps / AI / Accounting / Director.
// Editable per-line annual £. Total flows to the cost donut as the
// new "Office & Admin" line. Recurring SaaS rates sourced from 2025
// weekly P&L where present, otherwise current online pricing.
// ───────────────────────────────────────────────────────────────────────
function OfficeCostsSection({ officeCosts, setOfficeCosts }) {
  const { t } = useTranslation('explorer')
  const { fmt } = useFmt()
  const { isLocked } = useLockedForecast()

  const total = sumOfficeCosts(officeCosts)
  const monthlyAvg = Math.round(total / 12)

  const update = (id, value) => setOfficeCosts(prev => ({ ...prev, [id]: Math.max(0, Number(value) || 0) }))
  const resetAll = () => setOfficeCosts(OFFICE_COSTS_2026_DEFAULTS)

  const cellTd = { padding:'10px 8px', fontSize:12, borderBottom:'1px solid rgba(255,255,255,0.05)' }
  const headTh = { padding:'10px 8px', fontSize:9.5, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, textAlign:'right', borderBottom:'1px solid rgba(255,255,255,0.1)' }

  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, fontSize:13 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('officeCosts.header')}</div>
        <ResetBtn onClick={resetAll} title={t('officeCosts.resetAll')} />
      </div>
      <div style={{ fontSize:12, color:'#9CA3AF', marginBottom:14 }}>{t('officeCosts.note')}</div>

      {/* Total tile */}
      <div style={{ background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.18)', borderRadius:8, padding:'14px 16px', textAlign:'center', marginBottom:14 }}>
        <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>{t('officeCosts.totalLabel')}</div>
        <div style={{ fontSize:24, fontWeight:800, color:'var(--gold)' }}>{fmt(total)}</div>
        <div style={{ fontSize:11, color:'#6B7280', marginTop:4 }}>{t('officeCosts.monthlyAvg', { val: fmt(monthlyAvg) })}</div>
      </div>

      {/* Editable items table */}
      <div style={{ overflowX:'auto', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headTh, textAlign:'left' }}>{t('officeCosts.col.item')}</th>
              <th style={{ ...headTh, textAlign:'left' }}>{t('officeCosts.col.description')}</th>
              <th style={headTh}>{t('officeCosts.col.source')}</th>
              <th style={headTh}>{t('officeCosts.col.monthly')}</th>
              <th style={headTh}>{t('officeCosts.col.annual')}</th>
            </tr>
          </thead>
          <tbody>
            {OFFICE_COST_ITEMS.map(item => {
              const annual = officeCosts[item.id] ?? OFFICE_COSTS_2026_DEFAULTS[item.id]
              const monthly = Math.round(annual / 12)
              return (
                <tr key={item.id}>
                  <td style={{ ...cellTd, color:'var(--cream)', fontWeight:600, textAlign:'left' }}>{t(`officeCosts.items.${item.id}.name`)}</td>
                  <td style={{ ...cellTd, color:'#9CA3AF', textAlign:'left' }}>{t(`officeCosts.items.${item.id}.note`)}</td>
                  <td style={{ ...cellTd, color:'#6B7280', textAlign:'right', fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>{t(`officeCosts.source.${item.source}`)}</td>
                  <td style={{ ...cellTd, color:'#9CA3AF', textAlign:'right' }}>{item.monthlyHint != null ? `£${monthly}` : '—'}</td>
                  <td style={{ ...cellTd, textAlign:'right' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                      <span style={{ color:'#6B7280', fontSize:11 }}>£</span>
                      <input
                        type="number" min={0} step={1} disabled={isLocked}
                        value={annual}
                        onChange={e => update(item.id, e.target.value)}
                        style={{ width:80, padding:'3px 6px', textAlign:'right', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:4, color:'var(--gold)', fontWeight:600, fontSize:12, opacity: isLocked ? 0.6 : 1 }}
                      />
                    </span>
                  </td>
                </tr>
              )
            })}
            <tr style={{ background:'rgba(201,168,76,0.05)', borderTop:'2px solid rgba(201,168,76,0.25)' }}>
              <td style={{ ...cellTd, color:'var(--gold)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', fontSize:10.5, textAlign:'left' }}>{t('officeCosts.col.totals')}</td>
              <td style={cellTd}></td>
              <td style={cellTd}></td>
              <td style={{ ...cellTd, color:'#9CA3AF', textAlign:'right' }}>£{monthlyAvg}</td>
              <td style={{ ...cellTd, color:'var(--gold)', fontWeight:700, textAlign:'right' }}>{fmt(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(45,212,191,0.05)', border:'1px solid rgba(45,212,191,0.18)', borderRadius:6, fontSize:11, color:'#9CA3AF', lineHeight:1.5 }}>
        {t('officeCosts.modelNote')}
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
    : ['#4C1D95','#5B21B6','#6D28D9','#8B5CF6','#A78BFA','#C4B5FD']
  const LABELS = kind === 'income'
    ? [t('incomeSources.bar'), t('incomeSources.onlineGolf'), t('incomeSources.bookings'), t('incomeSources.privateHires'), t('incomeSources.serviceCharge'), t('incomeSources.poolTickets')]
    : [t('costCategories.wages'), t('costCategories.fixed'), t('costCategories.office'), t('costCategories.drinks'), t('costCategories.vat'), t('performance2026.costNotes.other')]
  const getSegs = m => kind === 'income'
    ? [{ v:m.bar, c:palette[0] },{ v:m.golf, c:palette[1] },{ v:m.events, c:palette[2] },{ v:m.hire, c:palette[3] },{ v:m.sc, c:palette[4] },{ v:m.pool, c:palette[5] }]
    : [{ v:m.wages, c:palette[0] },{ v:m.fixed, c:palette[1] },{ v:m.office, c:palette[2] },{ v:m.drinks, c:palette[3] },{ v:m.vat, c:palette[4] },{ v:m.other, c:palette[5] }]
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

function computeScenario({ barG, golfG, eventsG, hiresG, poolG, officeCostsTotal = 0 }) {
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
    242370 * 1.10        // wages
    + 165647 * 1.10      // fixed
    + officeCostsTotal   // office (Apps + AI + Accounting + Director — flows from OfficeCostsSection)
    + bar * 0.30         // drinks (30% of bar)
    + 78851 * mult       // VAT (scaled — proper formula in TabPerformance)
    + 22965 * mult       // cleaning
    + 17152 * mult       // arcades (token-driven detail in TabPerformance)
    + 9101 * mult        // food
    + 5443 * mult        // card charges
    // hosting (Lithos) removed — under new IP & Licensing model SEO/Ads
    // sit with Plonk Golf, not the venue.

  const profit = revenue - costs
  const investorReturn = Math.max(0, profit) * 0.50
  const coc = investorReturn / 79000 * 100
  return { revenue, profit, investorReturn, coc }
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

  // Per-SKU ticket pricing (price + tokens) for the Ticket Price Maker matrix.
  // Defaults seeded from 2025 SKU data; user can edit any SKU in the matrix.
  // Aggregate tokens × volumes drives the Arcades cost line in TabPerformance.
  const [pricing, setPricing] = useState(TICKET_PRICING_DEFAULTS)

  // Office costs (Apps + AI + Accounting + Director) — annual £ per item.
  // Total flows to the cost donut as a new "Office & Admin" line.
  const [officeCosts, setOfficeCosts] = useState(OFFICE_COSTS_2026_DEFAULTS)

  // Fixed costs (rent, rates, utilities, etc.) — monthly £ per item.
  // Total × 12 replaces the static fixedLine in the cost model.
  const [fixedCosts, setFixedCosts] = useState(FIXED_COSTS_2026_DEFAULTS)

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
    performance2026: <TabPerformance growth={growth} wages={wages} pricing={pricing} setPricing={setPricing} officeCosts={officeCosts} setOfficeCosts={setOfficeCosts} fixedCosts={fixedCosts} setFixedCosts={setFixedCosts} />,
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
