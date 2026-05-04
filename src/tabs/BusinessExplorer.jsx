import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import FinancialPerformance, { INCOME, COSTS, MONTHLY_INCOME, MONTHLY_COSTS, DonutChart } from '../slides/FinancialPerformance.jsx'
import PrevTillSales from './PrevTillSales.jsx'
import BoroughTillSales2025 from './BoroughTillSales2025.jsx'
import ResetBtn from '../components/ResetBtn.jsx'
import { useChartTooltip } from '../components/ChartTooltip.jsx'
import { formatCurrency, formatNumber } from '../i18n/format.js'
import { DEAL, ACTUALS_2025, FORECAST, WAGE_RATES, WAGE_OVERHEAD_MULT, PL_WAGE_BASE, IP_LICENSING_TOKEN_VALUE, IP_LICENSING_SKUS_ONLINE_2025, IP_LICENSING_SKUS_OFFICE_2025, WORKBOOK_URL } from '../data.js'
import { useLockedForecast } from '../components/LockedForecastContext.jsx'
import { useBarPriceUplift } from '../slides/GrowthDrivers.jsx'
import { useLockedFunding } from '../components/LockedFundingContext.jsx'
import { useLockedTicketVolume, useLockedFixedCosts } from '../components/LockedDeckContext.jsx'

const TAB_KEYS = ['performance2025','tillsales2025','performance2026','cashflow','prevTillSales']

function useFmt() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const fmt = (n) => formatCurrency(n, lang)
  const fmtK = (n) => '£' + Math.round(n/1000) + 'k'
  const fmtNum = (n) => formatNumber(n, lang)
  return { fmt, fmtK, fmtNum, lang }
}

// 2026 Performance — scenario-adjusted forecast built from the 2025 figures on the
// Financial Performance sheet. Slider (with Bear/Base/Bull markers) drives income and
// costs: wages +10%, non-rent fixed +10%, drinks = 30% of bar revenue, rent = 15%
// of turnover (contractual, NO inflation), office driven by the OfficeCostsSection,
// everything else scales with revenue. Palette shifted to teals (income) and purples
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
  { id: 'amazonPrime', monthlyHint: 9,   source: 'pricing'    },
  { id: 'accounting', monthlyHint: null, source: 'specified'  },
  { id: 'director',   monthlyHint: null, source: 'estimated'  },
]

const OFFICE_COSTS_2026_DEFAULTS = {
  xero:         300,   // £25/mo × 12
  rotacloud:    480,   // ~£40/mo for 10 users × 12
  claude:       240,   // Claude Pro £20/mo × 12
  google:       300,   // £25/mo × 12
  webhosting:   500,   // basic shared hosting · annual prepay (~£42/mo equivalent)
  amazonPrime:  108,   // £8.99/mo × 12 ≈ £108 — venue stock + supplies delivery
  accounting:  3000,   // annual fees (user-specified)
  director:   30000,   // total directors' compensation budget — can be split
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
// Rent is contractually 15% of quarterly turnover — NOT editable.
// Auto-computed = revenue × RENT_PCT_OF_TURNOVER. Replaces the old
// "165647 × 1.10" fixed-cost shorthand which baked in a flat 10%
// inflation on rent — rent now scales with turnover, not inflation.
const RENT_PCT_OF_TURNOVER = 0.15

// Historical 2025 fixed-cost split — used by deck slides and the
// computeScenario helper so they can apply the new "rent = 15% of
// revenue" rule consistently with the 2026 Performance tab.
//   HISTORICAL_RENT_2025 = 15% × £741,644 ≈ £111,247
//   HISTORICAL_NON_RENT_FIXED_2025 = £165,647 (P&L total) − rent ≈ £54,400
const HISTORICAL_RENT_2025          = 111247
const HISTORICAL_NON_RENT_FIXED_2025 = 54400

const FIXED_COST_ITEMS = [
  { id: 'rates',       ref2025Annual:  18000 },
  { id: 'electricity', ref2025Annual:  18000 },
  { id: 'water',       ref2025Annual:   4000 },
  { id: 'insurance',   ref2025Annual:  10000 },
  { id: 'internet',    ref2025Annual:   4000 },
  { id: 'prs',         ref2025Annual:   2500 },
  { id: 'maintenance', ref2025Annual:  14000 },
  { id: 'misc',        ref2025Annual:   4147 },
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
  // Fixed Costs = editable sliders (rates, utilities, etc.) + auto rent
  // (15% of turnover, contractual, NOT editable).
  const rent2026        = Math.round(totalIncome * RENT_PCT_OF_TURNOVER)
  const fixedLine       = sumFixedCostsAnnual(fixedCosts) + rent2026
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
  // Even-spread the slider-driven Fixed Costs total across 12 months —
  // sliders are annual-monthly figures and rent (15% of turnover) doesn't
  // have month-on-month seasonality in the model.
  const fixedCostsMonthly = Math.round(fixedLine / 12)
  const monthlyCosts2026 = MONTHLY_COSTS.map(m => {
    const mi = MONTHLY_INCOME.find(x => x.m === m.m)
    const mthBar2026 = mi ? Math.round(mi.bar * (1 + growth.bar / 100)) : 0
    return {
      m: m.m,
      wages:  Math.round(m.wages * 1.10),
      fixed:  fixedCostsMonthly,                         // even spread of slider total + auto rent
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
  // When founder clicks Lock, capture the live forecast totals AND
  // persist to localStorage so the lock survives reloads / new sessions.
  // Deck slides read this snapshot to populate the Custom scenario card.
  // Non-founders see the page in read-only mode regardless of lock state.
  const { isLocked, isFounder, canEdit, lock, unlock } = useLockedForecast()
  const handleLockToggle = () => {
    if (!isFounder) return                              // founder-only action
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

  // INCOME · 2026 FORECAST — donut + breakdown + monthly stacked bars.
  // Defined as a const so the Income sub-section can render it above the
  // Build Custom Scenario levers without duplicating the JSX.
  const incomeForecastCard = (
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
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      {/* ─── FORECAST CALCULATOR ─── 3 KPI tiles + preset chip strip + Reset/Lock.
          Replaces the old read-only slider card and the four scenario preset
          summary cards. Visual style mirrors Hackney's ForecastLockBar /
          KpiCard2026 pattern (colored top border + serif value). */}
      <div style={{ background:'var(--ink-2)', border:`1px solid ${isLocked ? 'rgba(45,212,191,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:20 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:18 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:22 }}>📊</span>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, color:'#22D3EE', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>Forecast Calculator</div>
            <div style={{ fontSize:13, color:'#9CA3AF', lineHeight:1.5, marginTop:4 }}>
              Drag the levers (or pick a preset) — every figure across the deck cascades live until the founder locks the snapshot.
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:14 }}>
          <KpiCard2026
            label={t('performance2026.adjustedRevenue')}
            value={fmt(totalIncome)}
            sub={`Aggregate growth ${sliderValue >= 0 ? '+' : ''}${sliderValue.toFixed(1)}%`}
            color="#22D3EE"
          />
          <KpiCard2026
            label={t('performance2026.adjustedEbitda')}
            value={fmt(ebitda)}
            sub={`${(margin*100).toFixed(1)}% ${t('performance2026.margin')}`}
            color={ebitda > 0 ? '#A78BFA' : '#EF4444'}
          />
          <KpiCard2026
            label={t('performance2026.profitAfterVat')}
            value={fmt(profitAfterVat)}
            sub={`${(profitAfterVatMargin*100).toFixed(1)}% ${t('performance2026.margin')} · ${t('performance2026.netVatLabel')} ${fmt(netVat)}`}
            color={profitAfterVat > 0 ? '#2DD4BF' : '#EF4444'}
          />
        </div>

        {(isLocked || !isFounder) && (
          <div style={{ marginBottom:12, padding:'8px 12px', background:'rgba(45,212,191,0.06)', border:'1px solid rgba(45,212,191,0.2)', borderRadius:6, fontSize:11, color:'#9CA3AF', lineHeight:1.5 }}>
            {t(isFounder ? 'performance2026.lockedNote' : 'performance2026.viewOnlyNote')}
          </div>
        )}

        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:12, background: isLocked ? 'rgba(45,212,191,0.12)' : 'rgba(201,168,76,0.08)', border:`1px solid ${isLocked ? 'rgba(45,212,191,0.4)' : 'rgba(201,168,76,0.2)'}`, fontSize:10, color: isLocked ? '#2DD4BF' : 'var(--gold)', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>
            <span style={{ fontSize:9 }}>{isLocked ? '🔒' : '○'}</span>
            {isLocked ? t('performance2026.locked') : 'Live preview'}
          </span>

          {perfMarkers.filter(mk => mk.labelKey !== 'y2025').map(mk => {
            const active = sliderValue === mk.value
            return (
              <button
                key={mk.labelKey}
                onClick={() => { if (canEdit) growth.setAll(mk.value) }}
                disabled={!canEdit}
                style={{
                  display:'inline-flex', flexDirection:'column', alignItems:'center', gap:1,
                  padding:'6px 14px', borderRadius:6,
                  background: active ? `${mk.color}1F` : 'transparent',
                  border: `1px solid ${active ? mk.color : 'rgba(201,168,76,0.25)'}`,
                  color: active ? mk.color : 'var(--cream-dim)',
                  cursor: canEdit ? 'pointer' : 'not-allowed',
                  opacity: canEdit ? 1 : 0.6,
                  fontWeight: active ? 600 : 500, transition:'all 0.15s',
                }}
              >
                <span style={{ fontSize:11 }}>{t(`performance2026.labels.${mk.labelKey}`)}</span>
                <span style={{ fontSize:10, opacity:0.85 }}>{mk.value > 0 ? '+' : ''}{mk.value}% on 2025</span>
              </button>
            )
          })}
          {(() => {
            const isCustom = !perfMarkers.some(m => m.value === sliderValue && m.labelKey !== 'y2025')
            return (
              <span
                style={{
                  display:'inline-flex', flexDirection:'column', alignItems:'center', gap:1,
                  padding:'6px 14px', borderRadius:6,
                  background: isCustom ? 'rgba(201,168,76,0.12)' : 'transparent',
                  border: `1px solid ${isCustom ? 'var(--gold)' : 'rgba(201,168,76,0.25)'}`,
                  color: isCustom ? 'var(--gold)' : 'var(--cream-dim)',
                  fontWeight: isCustom ? 600 : 500,
                }}
              >
                <span style={{ fontSize:11 }}>Custom</span>
                <span style={{ fontSize:10, opacity:0.85 }}>Drag levers</span>
              </span>
            )
          })()}

          <div style={{ flex:1 }} />

          {isFounder && (
            <button
              onClick={() => { if (canEdit) growth.setAll(15) }}
              disabled={!canEdit}
              title={t('performance2026.resetLevers')}
              style={{ padding:'6px 14px', borderRadius:6, fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor: canEdit ? 'pointer' : 'not-allowed', opacity: canEdit ? 1 : 0.5, background:'transparent', border:'1px solid rgba(201,168,76,0.35)', color:'var(--cream-dim)' }}
            >Reset</button>
          )}
          {isFounder ? (
            <button
              onClick={handleLockToggle}
              title={t(isLocked ? 'performance2026.unlockTitle' : 'performance2026.lockTitle')}
              style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'6px 14px', borderRadius:6, fontSize:11, fontWeight:700,
                letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
                background: isLocked ? 'rgba(45,212,191,0.15)' : 'var(--gold)',
                border: `1px solid ${isLocked ? 'rgba(45,212,191,0.45)' : 'var(--gold)'}`,
                color: isLocked ? '#2DD4BF' : 'var(--ink)',
                transition:'all 0.15s',
              }}
            >
              <span>{isLocked ? '🔒' : '🔓'}</span>
              <span>{t(isLocked ? 'performance2026.locked' : 'performance2026.lock')}</span>
            </button>
          ) : (
            <span style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'6px 14px', borderRadius:6, fontSize:11, fontWeight:700,
              letterSpacing:'0.06em', textTransform:'uppercase',
              background:'rgba(45,212,191,0.10)',
              border:'1px solid rgba(45,212,191,0.25)',
              color:'#2DD4BF',
            }}>
              <span>👁</span>
              <span>{t('performance2026.viewOnly')}</span>
            </span>
          )}
        </div>
      </div>

      {/* ─── SECTION DIVIDER ─── separates the headline summary from the per-section drill-downs */}
      <div style={{ marginTop: 12, paddingBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.25)' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>
          Detail Sections
        </div>
      </div>

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

          {/* INCOME — donut + breakdown first, then Build Custom Scenario
              levers, then the Bar Price Uplift Calculator. The headline KPI
              tiles / Forecast Calculator sits above this index content. */}
          {activeSection === 'income' && (
            <>
              {incomeForecastCard}
              <ScenarioLeversCard growth={growth} />
              <BoroughBarPriceUpliftCalculator />
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
            <FixedCostsSection fixedCosts={fixedCosts} setFixedCosts={setFixedCosts} totalIncome={totalIncome} />
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
// ─── BoroughBarPriceUpliftCalculator ─────────────────────────────────
// Borough's price-side growth lever. Sized against the verified 2025
// "Spend at Bar" income line (£362,836). The resulting % uplift is
// surfaced read-only on the Growth Drivers slide and contributes to
// the Custom scenario when the founder locks it.
function BoroughBarPriceUpliftCalculator() {
  const { fmt } = useFmt()
  const bp = useBarPriceUplift()
  const annualUplift = bp.baseline * (bp.value / 100)

  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
        <span style={{ fontSize:11, color:'#FBBF24', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>
          Bar Price Uplift Calculator
        </span>
        <span style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.06em' }}>
          Feeds the Growth Drivers slide
          {bp.isLocked ? ' · 🔒 Locked' : ''}
        </span>
      </div>
      <div style={{ fontSize:12, color:'#9CA3AF', lineHeight:1.6, marginBottom:14 }}>
        How much would a price uplift on bar SKUs lift annual revenue, applied to the 2025 bar baseline of <strong style={{ color:'#F5F0E8' }}>{fmt(bp.baseline)}</strong>? This is the only price-side lever in the growth model — every other driver lifts volume.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:18 }}>
        <BarPriceKpi label="Price Uplift"          value={`+${bp.value.toFixed(1)}%`}       sub={bp.canEdit ? 'Drag the slider below' : (bp.isLocked ? 'Founder-locked' : 'Founder edit only')} color="#FBBF24" />
        <BarPriceKpi label="2025 Bar Baseline"     value={fmt(bp.baseline)}                  sub="Verified — Income Sources"  color="#9CA3AF" />
        <BarPriceKpi label="Annual £ Uplift (Y1)"  value={fmt(Math.round(annualUplift))}     sub="At unchanged volume"        color="#10B981" />
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <span style={{ fontSize:10, color:'#9CA3AF' }}>0%</span>
        <input
          type="range" min={0} max={15} step={0.5}
          value={bp.value} disabled={!bp.canEdit}
          onChange={(e) => bp.setValue(+e.target.value)}
          style={{
            flex:1, accentColor:'#FBBF24',
            cursor: bp.canEdit ? 'pointer' : 'not-allowed',
            opacity: bp.canEdit ? 1 : 0.5,
          }}
        />
        <span style={{ fontSize:10, color:'#9CA3AF' }}>+15%</span>
      </div>

      {bp.isFounder && (
        <div style={{ marginTop:14, display:'flex', gap:10 }}>
          <button onClick={() => (bp.isLocked ? bp.unlock() : bp.lock())} style={{
            padding:'8px 16px', borderRadius:6, fontSize:11, fontWeight:600,
            letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
            background: bp.isLocked ? 'transparent' : '#FBBF24',
            color: bp.isLocked ? '#FBBF24' : 'var(--ink)',
            border: `1px solid ${bp.isLocked ? 'rgba(251,191,36,0.5)' : '#FBBF24'}`,
          }}>
            {bp.isLocked ? '🔓 Unlock Bar Price Uplift' : '🔒 Lock Bar Price Uplift'}
          </button>
        </div>
      )}

      <div style={{ marginTop:10, fontSize:11, color:'#9CA3AF', lineHeight:1.55 }}>
        Typical hospitality price reviews land 3–6% per cycle without measurable elasticity impact. Above 8% starts to test customer tolerance — model it but stress-test against repeat-rate metrics.
      </div>
    </div>
  )
}

function BarPriceKpi({ label, value, sub, color }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${color}33`, borderTop:`3px solid ${color}`, borderRadius:8, padding:14 }}>
      <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{label}</div>
      <div className="serif" style={{ fontSize:24, color, lineHeight:1, marginBottom:4, fontVariantNumeric:'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:'#9CA3AF', lineHeight:1.4 }}>{sub}</div>}
    </div>
  )
}

// Build Custom Scenario card — 5 growth levers driving the 2026 forecast.
// State is lifted in BusinessExplorer parent so the levers, the read-only
// slider above, and the income/cost donuts all stay in sync.
// ───────────────────────────────────────────────────────────────────────
function ScenarioLeversCard({ growth }) {
  const { t } = useTranslation('explorer')
  const { fmt, fmtK } = useFmt()
  const { isLocked, canEdit } = useLockedForecast()

  // Sliders mirror the 2026 income breakdown lines (excluding Service Charge,
  // which is a derived passive scaler, AND Online Golf Tickets, which has been
  // promoted to a master slider on the Ticket Price Maker — see the Tickets
  // section). Bases pulled from INCOME (= 2025 actuals).
  const sliders = SCENARIO_LEVERS
    .filter(l => l.key !== 'golf')
    .map(l => ({
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
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
        {sliders.map(s => (
          <div key={s.key}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
              <span style={{ color:'var(--cream)' }}>{t(`scenarios.levers.${s.labelKey}`)} <span style={{ color:'#6B7280', marginLeft:4 }}>(2025: {fmtK(s.base)})</span></span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                <span style={{ color:s.color, fontWeight:600 }}>{s.value>0?'+':''}{s.value}%</span>
                <ResetBtn onClick={()=>{ if (canEdit) s.set(15) }} title={t('scenarios.resetTo15')} />
              </span>
            </div>
            <input type="range" disabled={!canEdit} min={-20} max={50} value={s.value} onChange={e=>{ if (canEdit) s.set(Number(e.target.value)) }} style={{ width:'100%', accentColor:s.color, opacity: canEdit ? 1 : 0.6 }} />
            <div style={{ fontSize:10, color:'#6B7280', marginTop:3 }}>{t('scenarios.newLabel')} {fmtK(s.base * (1 + s.value / 100))}</div>
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

// Master ticket volume slider — the (former) Online Golf Tickets income
// lever, relocated here. Drives growth.golf which scales all SKU 2026
// volumes proportionally based on 2025 sales mix. Also still drives the
// Online Golf Tickets income line in the broader cost model.
function MasterTicketVolumeSlider({ growth }) {
  const { t } = useTranslation('explorer')
  const { fmtK } = useFmt()
  const { canEdit: forecastCanEdit } = useLockedForecast()
  const role = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ndb_role')) || ''
  const isBrazil = role === 'brazil'
  const golfBase = SCENARIO_LEVERS.find(l => l.key === 'golf')?.base ?? 210485
  const golfColor = SCENARIO_LEVERS.find(l => l.key === 'golf')?.color ?? '#0891B2'
  const value = growth.golf
  const newRevenue = golfBase * (1 + value / 100)

  // Master-volume lock — independent of the broader forecast lock so the
  // founder can pin just this slider while the rest of the 2026 levers
  // stay editable.
  const tv = growth.ticketVolumeLock || {}
  const tvIsLocked = !!tv.isLocked
  const tvIsFounder = !!tv.isFounder
  const lockedAtLabel = tv.locked?.lockedAt
    ? new Date(tv.locked.lockedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : null

  // Slider is editable when (a) the forecast lock allows it AND (b) the
  // ticket-volume lock isn't pinned. Brazil role is always read-only on
  // this slider regardless.
  const canDrag = forecastCanEdit && !tvIsLocked && !isBrazil

  return (
    <div style={{
      background:'rgba(8,145,178,0.06)',
      border:`1px solid ${tvIsLocked ? 'rgba(16,185,129,0.5)' : `${golfColor}55`}`,
      borderRadius:10, padding:'14px 18px', marginBottom:14,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8, gap:12, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:9.5, color:golfColor, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:2 }}>{t('priceMaker.masterHeader')}</div>
          <div style={{ fontSize:12, color:'var(--cream)' }}>
            {t('priceMaker.masterLabel')}
            <span style={{ color:'#6B7280', marginLeft:6 }}>(2025: {fmtK(golfBase)})</span>
          </div>
        </div>
        <span style={{ display:'inline-flex', alignItems:'center', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {/* Founder-set lock pill — visible to everyone when active. */}
          {tvIsLocked && (
            <span style={{
              fontSize:9, padding:'2px 8px', borderRadius:10, fontWeight:700,
              letterSpacing:'0.08em', textTransform:'uppercase',
              background:'rgba(16,185,129,0.12)', color:'#10B981',
              border:'1px solid rgba(16,185,129,0.4)',
            }}>🔒 Locked{lockedAtLabel ? ` · ${lockedAtLabel}` : ''}</span>
          )}
          {isBrazil && !tvIsLocked && (
            <span style={{
              fontSize:9, padding:'2px 8px', borderRadius:10, fontWeight:700,
              letterSpacing:'0.08em', textTransform:'uppercase',
              background:'rgba(229,57,53,0.12)', color:'#EF4444',
              border:'1px solid rgba(229,57,53,0.35)',
            }}>🔒 Locked</span>
          )}
          <span style={{ color:golfColor, fontWeight:700, fontSize:16 }}>{value > 0 ? '+' : ''}{value}%</span>
          {/* Founder-only Lock / Unlock toggle */}
          {tvIsFounder && (
            <button
              onClick={() => tvIsLocked ? tv.unlock() : tv.lock(value)}
              style={{
                padding:'4px 10px', fontSize:10, fontWeight:700,
                letterSpacing:'0.08em', textTransform:'uppercase',
                borderRadius:6, cursor:'pointer',
                background: tvIsLocked ? 'transparent' : `${golfColor}22`,
                color: tvIsLocked ? '#10B981' : golfColor,
                border: `1px solid ${tvIsLocked ? 'rgba(16,185,129,0.5)' : `${golfColor}66`}`,
                whiteSpace:'nowrap', transition:'all 0.15s',
              }}
              title={tvIsLocked ? 'Unlock the Master Ticket Volume' : 'Lock this value so every visitor sees it'}
            >
              {tvIsLocked ? '🔓 Unlock' : '🔒 Lock'}
            </button>
          )}
          <ResetBtn onClick={() => { if (canDrag) growth.setGolf(15) }} title={t('priceMaker.masterReset')} />
        </span>
      </div>
      <input
        type="range" disabled={!canDrag} min={-20} max={50} value={value}
        onChange={e => { if (canDrag) growth.setGolf(Number(e.target.value)) }}
        style={{ width:'100%', accentColor:golfColor, opacity: canDrag ? 1 : 0.6, cursor: canDrag ? 'pointer' : 'not-allowed' }}
      />
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:'#6B7280', marginTop:4 }}>
        <span>−20%</span>
        <span style={{ color:'#9CA3AF' }}>{t('priceMaker.masterSub')}</span>
        <span>+50%</span>
      </div>
      <div style={{ marginTop:8, fontSize:11, color:'#9CA3AF' }}>
        <span>{t('priceMaker.masterNew', { val: fmtK(newRevenue) })}</span>
      </div>
    </div>
  )
}

function TicketPriceMaker({ growth, pricing, setPricing }) {
  const { t } = useTranslation('explorer')
  const { fmt, fmtNum } = useFmt()
  const { isLocked, canEdit } = useLockedForecast()

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

      {/* Master ticket volume slider — drives all SKU 2026 volumes via growth.golf.
          Same state as the income lever (now hidden from ScenarioLeversCard since
          ticket volumes are the live editable here). */}
      <MasterTicketVolumeSlider growth={growth} />

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
                    type="number" min={0} max={20} step={1} disabled={!canEdit}
                    value={r.tokens}
                    onChange={e => updateSku(r.sku, 'tokens', Math.max(0, Number(e.target.value) || 0))}
                    style={{ width:48, padding:'3px 6px', textAlign:'right', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:4, color:'var(--gold)', fontWeight:600, fontSize:12, opacity: canEdit ? 1 : 0.6 }}
                  />
                </td>
                <td style={{ ...cellTd, textAlign:'right' }}>
                  <input
                    type="number" min={0} max={500} step={0.50} disabled={!canEdit}
                    value={r.price}
                    onChange={e => updateSku(r.sku, 'price', Math.max(0, Number(e.target.value) || 0))}
                    style={{ width:64, padding:'3px 6px', textAlign:'right', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:4, color:'var(--gold)', fontWeight:600, fontSize:12, opacity: canEdit ? 1 : 0.6 }}
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
  const { isLocked, canEdit } = useLockedForecast()

  const roles = [
    // min = 2026 NMW for the role · max set wide so the annual-salary input
    // can accommodate London market-rate management salaries (e.g. Manager
    // at GBP 60-80k/yr = GBP 30-40/hr at 2,000 hrs).
    { labelKey:'bar',         hours: WAGE_RATES[0].hours, rate: wages.bar, setRate: wages.setBar, plan: WAGE_RATES[0].rate, min:12.21, max:25 },
    { labelKey:'supervisor',  hours: WAGE_RATES[1].hours, rate: wages.sup, setRate: wages.setSup, plan: WAGE_RATES[1].rate, min:13.85, max:30 },
    { labelKey:'asstManager', hours: WAGE_RATES[2].hours, rate: wages.am,  setRate: wages.setAm,  plan: WAGE_RATES[2].rate, min:14.35, max:35 },
    { labelKey:'manager',     hours: WAGE_RATES[3].hours, rate: wages.mgr, setRate: wages.setMgr, plan: WAGE_RATES[3].rate, min:15.38, max:45 },
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

      {/* ─── Wage rate calculator — hourly slider + editable hourly + annual inputs ─── */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('wages.calculatorHeader')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
          {roles.map(r => (
            <WageRoleRow key={r.labelKey} role={r} canEdit={canEdit} t={t} fmt={fmt} fmtNum={fmtNum} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
// Wage role row — slider + editable £/hr input + editable annual £ input.
// All three views are locked to a single underlying state (rate). Edit
// any one and the other two recompute (annual = hours × rate).
// ───────────────────────────────────────────────────────────────────────
function WageRoleRow({ role: r, canEdit, t, fmt, fmtNum }) {
  const annual = Math.round(r.hours * r.rate)
  const onAnnualChange = (e) => {
    if (!canEdit) return
    const newAnnual = Math.max(0, Number(e.target.value) || 0)
    const newRate = r.hours > 0 ? newAnnual / r.hours : 0
    // Clamp to slider min/max so the slider thumb stays valid
    const clamped = Math.max(r.min, Math.min(r.max, newRate))
    r.setRate(Number(clamped.toFixed(2)))
  }
  const onHourlyChange = (e) => {
    if (!canEdit) return
    const v = Math.max(0, Number(e.target.value) || 0)
    const clamped = Math.max(r.min, Math.min(r.max, v))
    r.setRate(Number(clamped.toFixed(2)))
  }
  const inputBase = {
    padding:'4px 8px', textAlign:'right', background:'rgba(0,0,0,0.3)',
    border:'1px solid rgba(201,168,76,0.3)', borderRadius:4,
    color:'var(--gold)', fontWeight:600, fontSize:12,
    opacity: canEdit ? 1 : 0.6,
  }
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontWeight:600, color:'var(--cream)' }}>{t(`wages.roles.${r.labelKey}`)}</span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10, color:'#6B7280' }}>{fmtNum(r.hours)} {t('wages.hrs')}</span>
          <ResetBtn onClick={()=>{ if (canEdit) r.setRate(r.plan) }} title={`Reset £${r.plan.toFixed(2)}/hr`} />
        </span>
      </div>
      <input
        type="range" disabled={!canEdit}
        min={r.min} max={r.max} step={0.01}
        value={r.rate}
        onChange={e=>{ if (canEdit) r.setRate(Number(e.target.value)) }}
        style={{ width:'100%', accentColor:'var(--gold)', marginBottom:10, opacity: canEdit ? 1 : 0.6 }}
      />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <label style={{ display:'flex', flexDirection:'column', gap:3 }}>
          <span style={{ fontSize:9, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em' }}>{t('wages.hourly')}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:'#6B7280' }}>£</span>
            <input
              type="number" disabled={!canEdit}
              min={r.min} max={r.max} step={0.01}
              value={r.rate.toFixed(2)}
              onChange={onHourlyChange}
              style={{ ...inputBase, width:'100%' }}
            />
            <span style={{ fontSize:10, color:'#6B7280' }}>/hr</span>
          </span>
        </label>
        <label style={{ display:'flex', flexDirection:'column', gap:3 }}>
          <span style={{ fontSize:9, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em' }}>{t('wages.annualLabel')}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:'#6B7280' }}>£</span>
            <input
              type="number" disabled={!canEdit}
              min={0} step={100}
              value={annual}
              onChange={onAnnualChange}
              style={{ ...inputBase, width:'100%' }}
            />
            <span style={{ fontSize:10, color:'#6B7280' }}>/yr</span>
          </span>
        </label>
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
function FixedCostsSection({ fixedCosts, setFixedCosts, totalIncome }) {
  const { t } = useTranslation('explorer')
  const { fmt } = useFmt()
  // Two locks gate edits here: the broader 2026 forecast lock AND the
  // section-specific fixed-costs lock. Either one being engaged disables
  // the sliders. The Lock/Unlock button on this card controls only the
  // fixed-costs lock — when engaged the values are pinned for every
  // viewer and feed straight into the 2026 forecast totals.
  const forecast = useLockedForecast()
  const fcLock = useLockedFixedCosts()
  const isLocked = fcLock.isLocked
  const canEdit = forecast.canEdit && fcLock.canEdit
  const handleLockToggle = () => {
    if (!fcLock.isFounder) return
    if (fcLock.isLocked) fcLock.unlock()
    else fcLock.lock(fixedCosts)
  }

  // Auto rent — contractually 15% of turnover. Not editable.
  const rent2025 = Math.round(ACTUALS_2025.revenue * RENT_PCT_OF_TURNOVER)
  const rent2026 = Math.round(totalIncome * RENT_PCT_OF_TURNOVER)

  // Editable rows totals + auto rent
  const editableRef2025  = FIXED_COST_ITEMS.reduce((sum, i) => sum + i.ref2025Annual, 0)
  const editable2026     = sumFixedCostsAnnual(fixedCosts)
  const ref2025Total     = editableRef2025 + rent2025
  const totalAnnual      = editable2026 + rent2026
  const totalMonthly     = Math.round(totalAnnual / 12)
  const delta            = totalAnnual - ref2025Total

  const update = (id, value) => { if (canEdit) setFixedCosts(prev => ({ ...prev, [id]: Math.max(0, Number(value) || 0) })) }
  const resetAll = () => { if (canEdit) setFixedCosts(FIXED_COSTS_2026_DEFAULTS) }

  const deltaColor = delta > 0 ? '#EF4444' : delta < 0 ? '#2DD4BF' : '#9CA3AF'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      {/* Header + total tile */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('fixedCosts.header')}</div>
            <span style={{
              fontSize:9.5, padding:'3px 9px', borderRadius:10, fontWeight:700,
              background:'rgba(45,212,191,0.15)', color:'#2DD4BF',
              border:'1px solid rgba(45,212,191,0.35)',
              letterSpacing:'0.1em', textTransform:'uppercase',
            }}>{t('fixedCosts.vatPill')}</span>
          </div>
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
      <div style={{ background:'var(--ink-2)', border:`1px solid ${isLocked ? 'rgba(45,212,191,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('fixedCosts.sliderHeader')}</span>
          {fcLock.isFounder ? (
            <button
              onClick={handleLockToggle}
              title={isLocked ? 'Unlock — resume editing the per-line fixed costs' : 'Lock these values so every visitor sees them and they feed the 2026 forecast totals'}
              style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'5px 11px', borderRadius:6, fontSize:10.5, fontWeight:700,
                letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
                background: isLocked ? 'rgba(45,212,191,0.15)' : 'rgba(201,168,76,0.10)',
                border: `1px solid ${isLocked ? 'rgba(45,212,191,0.45)' : 'rgba(201,168,76,0.35)'}`,
                color: isLocked ? '#2DD4BF' : 'var(--gold)',
                transition:'all 0.15s',
              }}
            >
              <span>{isLocked ? '🔒' : '🔓'}</span>
              <span>{isLocked ? 'Locked' : 'Lock'}</span>
            </button>
          ) : isLocked ? (
            <span style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'5px 11px', borderRadius:6, fontSize:10.5, fontWeight:700,
              letterSpacing:'0.06em', textTransform:'uppercase',
              background:'rgba(45,212,191,0.10)',
              border:'1px solid rgba(45,212,191,0.25)',
              color:'#2DD4BF',
            }}>
              <span>🔒</span><span>Locked snapshot</span>
            </span>
          ) : null}
        </div>
        {isLocked && (
          <div style={{ marginBottom:14, padding:'8px 12px', background:'rgba(45,212,191,0.06)', border:'1px solid rgba(45,212,191,0.2)', borderRadius:6, fontSize:11, color:'#9CA3AF', lineHeight:1.5 }}>
            These values are locked and feeding the 2026 forecast totals. {fcLock.isFounder ? 'Unlock to edit.' : 'Founder-controlled — read-only for visitors.'}
          </div>
        )}

        {/* Auto rent — non-editable, scales with revenue at 15% (contractual) */}
        <div style={{ background:'rgba(45,212,191,0.05)', border:'1px solid rgba(45,212,191,0.25)', borderRadius:8, padding:'14px 16px', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
              <span style={{ fontWeight:600, color:'var(--cream)' }}>{t('fixedCosts.items.rent')}</span>
              <span style={{
                fontSize:9, padding:'2px 7px', borderRadius:8, fontWeight:700,
                background:'rgba(45,212,191,0.18)', color:'#2DD4BF',
                letterSpacing:'0.08em', textTransform:'uppercase',
              }}>{t('fixedCosts.autoPill')}</span>
            </span>
            <span style={{ color:'#2DD4BF', fontWeight:700, fontSize:14 }}>£{Math.round(rent2026 / 12).toLocaleString()}/mo · {fmt(rent2026)}/yr</span>
          </div>
          <div style={{ fontSize:11, color:'#9CA3AF', lineHeight:1.5 }}>
            {t('fixedCosts.rentFormula', { pct: '15%', revenue: fmt(Math.round(totalIncome)) })}
          </div>
          <div style={{ fontSize:10, color:'#6B7280', marginTop:3 }}>
            {t('fixedCosts.rentRef2025', { val: fmt(rent2025) })}
          </div>
        </div>

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
                    <ResetBtn onClick={() => { if (canEdit) update(item.id, FIXED_COSTS_2026_DEFAULTS[item.id]) }} title={`Reset £${FIXED_COSTS_2026_DEFAULTS[item.id]}/mo`} />
                  </span>
                </div>
                <input
                  type="range" disabled={!canEdit} min={0} max={sliderMax} step={step}
                  value={monthly2026}
                  onChange={e => { if (canEdit) update(item.id, e.target.value) }}
                  style={{ width:'100%', accentColor:'var(--gold)', opacity: canEdit ? 1 : 0.6 }}
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
  const { isLocked, canEdit } = useLockedForecast()

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
                        type="number" min={0} step={1} disabled={!canEdit}
                        value={annual}
                        onChange={e => update(item.id, e.target.value)}
                        style={{ width:80, padding:'3px 6px', textAlign:'right', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:4, color:'var(--gold)', fontWeight:600, fontSize:12, opacity: canEdit ? 1 : 0.6 }}
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
    <div style={{ background:'var(--ink-2)', border:`1px solid ${color}33`, borderTop:`3px solid ${color}`, borderRadius:10, padding:'16px 18px' }}>
      <div style={{ fontSize:10, color:'var(--cream-dim)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
      <div className="serif" style={{ fontSize:'clamp(1.4rem, 2.6vw, 1.9rem)', color, lineHeight:1, marginBottom:6, fontVariantNumeric:'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.4 }}>{sub}</div>}
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
// Cashflow Forecast — 12 months from May 2026 → Apr 2027
//
// Mirrors the structure of the workbook's "Cash Flow Forecast" sheet but
// kept simple here for at-a-glance investor view. Workbook button links
// out for the full detailed breakdown.
//
// Cashflow logic per month:
//   - Inflow:    revenue × seasonal weight / 12
//   - Outflow:   non-rent operating costs × seasonal weight / 12
//                + quarterly rent payment (Aug, Nov, Feb only)
//                  = 15% × revenue × sum of next-3-month seasonal weights / 12
//   - First-3-month rent already prepaid (£27,078 deposit, NOT shown here as
//     an outflow — assumed funded from initial investment)
//   - Net:       inflow − outflow
//   - Cumulative: running sum of nets, starting from £0
//
// Threshold lines on chart:
//   - 3-month rent reserve (£27,078 — when cumulative cash covers a
//     fresh quarter of rent prepay equivalent)
//   - Investor capital (£79,000 — when cumulative covers the original
//     investment)
//
// Scenario selector: Conservative -10%, Base +15%, Optimistic +25%, Custom
// (live from locked snapshot if present, disabled otherwise).
// ───────────────────────────────────────────────────────────────────────

const CASHFLOW_MONTHS = ['May 2026','Jun 2026','Jul 2026','Aug 2026','Sep 2026','Oct 2026','Nov 2026','Dec 2026','Jan 2027','Feb 2027','Mar 2027','Apr 2027']
// Seasonal weights — pulled from the 2025 monthly trading pattern, shifted to
// align with May start. Sums to 12.0 so total ÷ 12 = annual.
// Indexes: 0=May, 1=Jun, 2=Jul, 3=Aug, 4=Sep, 5=Oct, 6=Nov, 7=Dec, 8=Jan, 9=Feb, 10=Mar, 11=Apr
const CASHFLOW_SEASONAL = [0.90, 0.85, 1.00, 1.05, 1.05, 1.10, 1.20, 1.40, 0.85, 0.95, 1.00, 0.95]
// Rent prepay months 0,1,2 are prepaid (£27,078). Quarterly rent due at
// months 3 (Aug, covers Aug-Oct), 6 (Nov, covers Nov-Jan), 9 (Feb, covers Feb-Apr).
const RENT_QUARTER_MAP = { 3: [3,4,5], 6: [6,7,8], 9: [9,10,11] }

// RENT_3MO_RESERVE and INVESTOR_CAPITAL are now per-render: pulled from
// the LockedFundingContext inside TabCashflow.
//   reserveTarget    = funding.rent          (the rent prepay the founder
//                                             chose on Use of Funds — 1, 2,
//                                             or 3 months of contractual
//                                             rent, £9k / £18k / £27k)
//   investorCapital  = funding.investment    (locked total raise)
// Both follow the Cover slider + Use of Funds rent snap live.

function buildCashflow({ revenue, totalCosts }) {
  const annualRent     = revenue * 0.15
  const nonRentCosts   = Math.max(0, totalCosts - annualRent)
  const out = []
  let cumulative = 0
  for (let i = 0; i < 12; i++) {
    const w           = CASHFLOW_SEASONAL[i]
    const inflow      = Math.round(revenue * w / 12)
    const opex        = Math.round(nonRentCosts * w / 12)
    let rent          = 0
    if (RENT_QUARTER_MAP[i]) {
      const wsum = RENT_QUARTER_MAP[i].reduce((s, m) => s + CASHFLOW_SEASONAL[m], 0)
      rent = Math.round(annualRent * wsum / 12)
    }
    const outflow = opex + rent
    const net     = inflow - outflow
    cumulative   += net
    out.push({ month: CASHFLOW_MONTHS[i], inflow, opex, rent, outflow, net, cumulative })
  }
  return out
}

function TabCashflow({ growth }) {
  const { t } = useTranslation('explorer')
  const { fmt, fmtK } = useFmt()
  const { snapshot, isLocked } = useLockedForecast()
  const { effective: funding } = useLockedFunding()
  const INVESTOR_CAPITAL  = funding.investment    // tracks the locked Cover slider
  const RENT_3MO_RESERVE  = funding.rent          // tracks the Use of Funds rent snap

  // Scenario set — uses the same mult logic as InvestmentSummary.calcReturns
  // for Conservative/Base/Optimistic; Custom reads the locked snapshot.
  const SCENARIOS = {
    conservative: { labelKey: 'conservative', mult: 1.10, color: '#94A3B8' },
    base:         { labelKey: 'base',         mult: 1.15, color: '#C9A84C' },
    optimistic:   { labelKey: 'optimistic',   mult: 1.25, color: '#2DD4BF' },
    custom:       { labelKey: 'custom',       mult: snapshot ? snapshot.revenue / ACTUALS_2025.revenue : 1.15, color: 'var(--gold)', disabled: !isLocked },
  }
  const [active, setActive] = useState('base')
  const sc = SCENARIOS[active]?.disabled ? SCENARIOS.base : SCENARIOS[active]
  const activeKey = SCENARIOS[active]?.disabled ? 'base' : active

  // Compute revenue + costs for the selected scenario
  const cf = (() => {
    if (activeKey === 'custom' && snapshot) {
      return buildCashflow({ revenue: snapshot.revenue, totalCosts: snapshot.totalCosts })
    }
    // Otherwise approximate from sc.mult: revenue scales linearly,
    // costs partial — use the InvestmentSummary calcReturns-style estimate.
    const rev = ACTUALS_2025.revenue * sc.mult
    const bar = 362836 * sc.mult
    const totalCosts =
        242370 * 1.10                          // wages
      + 54400 * 1.10                           // non-rent fixed
      + rev * 0.15                              // rent (15% of revenue)
      + bar * 0.30                              // drinks
      + 78851 * sc.mult                         // VAT
      + 22965 * sc.mult                         // cleaning
      + 17152 * sc.mult                         // arcades
      + 9101 * sc.mult                          // food
      + 5443 * sc.mult                          // card charges
    return buildCashflow({ revenue: rev, totalCosts })
  })()

  const closingCash    = cf[cf.length - 1].cumulative
  const minCash        = Math.min(0, ...cf.map(m => m.cumulative))
  const maxCash        = Math.max(closingCash, RENT_3MO_RESERVE, INVESTOR_CAPITAL)
  const peakMonth      = cf.reduce((best, m) => m.cumulative > best.cumulative ? m : best, cf[0])
  const reserveCrossed = cf.find(m => m.cumulative >= RENT_3MO_RESERVE)
  const capitalCrossed = cf.find(m => m.cumulative >= INVESTOR_CAPITAL)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      {/* Header — scenario picker + workbook link */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:18 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>{t('cashflow.header')}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{t('cashflow.note')}</div>
          </div>
          <a href={WORKBOOK_URL} target="_blank" rel="noopener noreferrer" style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:6, fontSize:11, fontWeight:700,
            letterSpacing:'0.06em', textTransform:'uppercase', textDecoration:'none', whiteSpace:'nowrap',
            background:'rgba(201,168,76,0.10)', border:'1px solid rgba(201,168,76,0.35)', color:'var(--gold)',
          }}>
            <span>↗</span><span>{t('cashflow.workbookLink')}</span>
          </a>
        </div>

        {/* Scenario tabs */}
        <div style={{ display:'flex', gap:6 }}>
          {Object.entries(SCENARIOS).map(([key, s]) => (
            <button
              key={key}
              onClick={() => { if (!s.disabled) setActive(key) }}
              disabled={s.disabled}
              title={s.disabled ? t('cashflow.customDisabledHint') : undefined}
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
              {t(`cashflow.scenarios.${s.labelKey}`)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        <KpiCard2026 label={t('cashflow.kpi.closing')} value={fmt(Math.round(closingCash))} sub={t('cashflow.kpi.closingSub')} color={closingCash > 0 ? '#2DD4BF' : '#EF4444'} />
        <KpiCard2026 label={t('cashflow.kpi.peak')} value={fmt(Math.round(peakMonth.cumulative))} sub={peakMonth.month} color="#22D3EE" />
        <KpiCard2026 label={t('cashflow.kpi.reserveHit')} value={reserveCrossed ? reserveCrossed.month : t('cashflow.kpi.notHit')} sub={`${t('cashflow.kpi.reserveSub')} ${fmt(RENT_3MO_RESERVE)}`} color={reserveCrossed ? '#2DD4BF' : '#EF4444'} />
        <KpiCard2026 label={t('cashflow.kpi.capitalHit')} value={capitalCrossed ? capitalCrossed.month : t('cashflow.kpi.notHit')} sub={`${t('cashflow.kpi.capitalSub')} ${fmt(INVESTOR_CAPITAL)}`} color={capitalCrossed ? 'var(--gold)' : '#9CA3AF'} />
      </div>

      {/* Line chart with threshold markers */}
      <CashflowLineChart cf={cf} sc={sc} minCash={minCash} maxCash={maxCash} fmt={fmt} fmtK={fmtK} t={t} reserveTarget={RENT_3MO_RESERVE} investorCapital={INVESTOR_CAPITAL} />

      {/* Monthly breakdown table */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase' }}>{t('cashflow.tableHeader')}</div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'rgba(255,255,255,0.02)' }}>
              <th style={cfTh('left')}>{t('cashflow.col.month')}</th>
              <th style={cfTh('right')}>{t('cashflow.col.inflow')}</th>
              <th style={cfTh('right')}>{t('cashflow.col.opex')}</th>
              <th style={cfTh('right')}>{t('cashflow.col.rent')}</th>
              <th style={cfTh('right')}>{t('cashflow.col.net')}</th>
              <th style={cfTh('right')}>{t('cashflow.col.cumulative')}</th>
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

const cfTh = (align) => ({ padding:'10px 14px', fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, textAlign:align, whiteSpace:'nowrap' })
const cfTd = (align, color, weight=400) => ({ padding:'10px 14px', fontSize:12.5, color, fontWeight:weight, textAlign:align, whiteSpace:'nowrap' })

function CashflowLineChart({ cf, sc, minCash, maxCash, fmt, fmtK, t, reserveTarget, investorCapital }) {
  // SVG line chart — 12 months × cumulative cash position
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

  // Threshold horizontal line points — reserveTarget/investorCapital come
  // from useLockedFunding() inside TabCashflow (per-render) and are passed
  // in as props.
  const yReserve = y(reserveTarget)
  const yCapital = y(investorCapital)
  const yZero    = y(0)

  // Cumulative line as polyline
  const points = cf.map((m, i) => `${x(i)},${y(m.cumulative)}`).join(' ')

  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:18 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase' }}>{t('cashflow.chartHeader')}</div>
        <div style={{ display:'flex', gap:14, fontSize:10.5, color:'#9CA3AF' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:14, height:2, background:sc.color }} />
            {t('cashflow.legend.cumulative')}
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:14, height:1, background:'#A78BFA', borderTop:'1px dashed #A78BFA', borderColor:'#A78BFA' }} />
            {t('cashflow.legend.reserve')} ({fmtK(reserveTarget)})
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:14, height:1, borderTop:'1px dashed var(--gold)' }} />
            {t('cashflow.legend.capital')} ({fmtK(investorCapital)})
          </span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
        {/* Grid + zero baseline */}
        <line x1={padL} x2={W-padR} y1={yZero} y2={yZero} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
        {/* Threshold lines */}
        <line x1={padL} x2={W-padR} y1={yReserve} y2={yReserve} stroke="#A78BFA" strokeWidth={1} strokeDasharray="6 4" opacity={0.7} />
        <line x1={padL} x2={W-padR} y1={yCapital} y2={yCapital} stroke="#C9A84C" strokeWidth={1} strokeDasharray="6 4" opacity={0.7} />
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
        <text x={padL - 8} y={yZero + 4}     fontSize="9.5" fill="#6B7280" textAnchor="end">£0</text>
        <text x={padL - 8} y={yReserve + 4}  fontSize="9.5" fill="#A78BFA" textAnchor="end">{fmtK(reserveTarget)}</text>
        <text x={padL - 8} y={yCapital + 4}  fontSize="9.5" fill="#C9A84C" textAnchor="end">{fmtK(investorCapital)}</text>
      </svg>
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


export default function BusinessExplorer() {
  const { t } = useTranslation('explorer')
  const { t: tc } = useTranslation('common')
  const [tab, setTab] = useState('performance2026')

  // Master ticket-volume lock — when set, pins the golf growth lever for
  // every visitor (founder-only lock, persists in localStorage). Wins
  // over local state for the effective `growth.golf` value.
  const ticketVolume = useLockedTicketVolume()
  const tvIsLocked   = ticketVolume.isLocked
  const tvLockedVal  = ticketVolume.locked?.value

  // Initialise golf state from the lock if one exists at first paint, so
  // a visitor lands directly on the locked value without a flicker.
  const [barGrowth, setBarGrowth]       = useState(15)
  const [golfGrowth, setGolfGrowthState] = useState(() => tvIsLocked ? tvLockedVal : 15)
  const [hiresGrowth, setHiresGrowth]   = useState(15)
  const [eventsGrowth, setEventsGrowth] = useState(15)
  const [poolGrowth, setPoolGrowth]     = useState(15)

  // setGolf respects the lock — no-op when locked, regardless of caller.
  const setGolfGrowth = (v) => { if (!tvIsLocked) setGolfGrowthState(v) }

  // setAll respects the lock for golf only — other levers still snap.
  const setAllGrowth = v => {
    setBarGrowth(v)
    if (!tvIsLocked) setGolfGrowthState(v)
    setHiresGrowth(v); setEventsGrowth(v); setPoolGrowth(v)
  }

  // Effective golf value — locked snapshot wins if present.
  const effectiveGolf = tvIsLocked ? tvLockedVal : golfGrowth

  const growth = {
    bar: barGrowth, setBar: setBarGrowth,
    golf: effectiveGolf, setGolf: setGolfGrowth,
    hires: hiresGrowth, setHires: setHiresGrowth,
    events: eventsGrowth, setEvents: setEventsGrowth,
    pool: poolGrowth, setPool: setPoolGrowth,
    setAll: setAllGrowth,
    // Lock surface for the Master Ticket Volume slider. The slider
    // component reads these; rest of the deck is unaffected.
    ticketVolumeLock: ticketVolume,
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
  // When the founder locks this section, the locked.values pin the
  // sliders for everyone and feed the 2026 forecast totals via the
  // effectiveFixedCosts passed down to TabPerformance.
  const fixedCostsLock = useLockedFixedCosts()
  const [fixedCosts, setFixedCosts] = useState(
    () => fixedCostsLock.locked?.values
      ? { ...FIXED_COSTS_2026_DEFAULTS, ...fixedCostsLock.locked.values }
      : FIXED_COSTS_2026_DEFAULTS
  )
  // Keep the live editing state in sync whenever a lock arrives
  // (cross-device hydrate, founder lock action) so unlocking resumes
  // editing from the last locked snapshot rather than defaults.
  useEffect(() => {
    if (fixedCostsLock.locked?.values) {
      setFixedCosts(prev => ({ ...prev, ...fixedCostsLock.locked.values }))
    }
  }, [fixedCostsLock.locked])
  const effectiveFixedCosts = fixedCostsLock.locked?.values
    ? { ...FIXED_COSTS_2026_DEFAULTS, ...fixedCostsLock.locked.values }
    : fixedCosts

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
    performance2025: <FinancialPerformance />,
    tillsales2025:   <BoroughTillSales2025 />,
    performance2026: <TabPerformance growth={growth} wages={wages} pricing={pricing} setPricing={setPricing} officeCosts={officeCosts} setOfficeCosts={setOfficeCosts} fixedCosts={effectiveFixedCosts} setFixedCosts={setFixedCosts} />,
    cashflow:        <TabCashflow growth={growth} />,
    prevTillSales:   <PrevTillSales />,
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
