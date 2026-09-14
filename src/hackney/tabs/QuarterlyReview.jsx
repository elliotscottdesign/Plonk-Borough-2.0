import React from 'react'
import {
  TRADING_START, SNAPSHOT_END, TRADING_DAYS,
  XERO_SNAPSHOT, FORECAST_PRORATED, RESERVE_FLOOR, UNDRAWN_RAISE,
} from '../data/quarterlyReview.js'

// QuarterlyReview — the investor-portal quarterly review tab.
//
// Visible to founder (888999) + confirmed investors (LEONIE / MIKE /
// LEE01). Filtered out of every other role's top-tab list via the
// roleAny gate added to HackneyApp.jsx TOP_TABS.
//
// Data:
//   • Live-refreshable Xero snapshot from src/hackney/data/quarterlyReview.js
//   • Prorated Y1 forecast baseline from same file
//   • Reserve floor gate from Investors' Agreement clause 4
//
// V1 scope (this file): read-only rendering + PDF-ready print styles.
// V2 (planned): founder-editable paste fields (private events list, staff
// override, opening context, founder's note) synced cross-device via the
// existing SIGNATURES_SYNC_URL Apps Script. See the notes at the top of
// data/quarterlyReview.js for how to refresh the Xero side.
//
// Refresh cadence: ask Claude to "refresh the investor review" — I re-run
// the four Xero MCP endpoints and commit an updated data file. The page
// prominently shows the snapshot date so nobody mistakes it for real-time.

const GOLD    = 'var(--gold)'
const CREAM   = 'var(--cream)'
const CREAM_D = 'var(--cream-dim)'
const TEAL    = 'var(--teal)'
const INK_BG  = 'var(--ink-2)'
const RED     = '#F87171'
const AMBER   = '#FCD34D'
const GREEN   = '#34D399'
const BORDER  = '1px solid rgba(201,168,76,0.18)'

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const fmtP = (v) => (v > 0 ? '+' : '') + v.toFixed(1) + '%'
const pct = (num, denom) => denom === 0 ? 0 : ((num - denom) / denom) * 100

// Traffic-light colour for a delta% — positive is good for revenue &
// profit lines, negative is good for cost lines. Each row picks its own
// polarity via `costLine: true`.
function toneFor(deltaPct, costLine) {
  const beat = costLine ? deltaPct < 0 : deltaPct > 0
  const near = Math.abs(deltaPct) <= 5
  if (near) return AMBER
  return beat ? GREEN : RED
}

export default function QuarterlyReview() {
  return (
    <div data-review-body style={{ padding:'32px 48px', maxWidth:1200, margin:'0 auto', color:CREAM, lineHeight:1.6 }}>

      <Hero />
      <OpeningContextBanner />

      <SectionRule />
      <HeadlineCard />

      <SectionRule />
      <CashAndReserveCard />

      <SectionRule />
      <RevenueAndCostCard />

      <SectionRule />
      <WhatWeDidntSpendCard />

      <SectionRule />
      <PayablesCard />

      <SectionRule />
      <FounderNoteCard />

      <SectionRule />
      <FooterMeta />
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontSize:11, color:GOLD, letterSpacing:'0.18em', textTransform:'uppercase', fontWeight:700, marginBottom:8 }}>
        Q1 Trading Review · {prettyDate(TRADING_START)} → {prettyDate(SNAPSHOT_END)} · Confidential
      </div>
      <h1 className="serif" style={{ fontSize:'clamp(2.4rem, 4.8vw, 3.2rem)', color:CREAM, lineHeight:1.15, margin:0 }}>
        First {TRADING_DAYS} days of trading
      </h1>
      <p style={{ fontSize:15, color:CREAM_D, marginTop:10, maxWidth:820 }}>
        No Dice Hackney Ltd · Round 1 shareholders' quarterly review. Numbers are pulled live from the company's Xero books ({XERO_SNAPSHOT.organisation}, snapshot cut <strong style={{ color:CREAM }}>{prettyDate(XERO_SNAPSHOT.snapshotDate)}</strong>). Forecast baseline is the Y1 model in the deck, pro-rated by calendar days to the same {TRADING_DAYS}-day window.
      </p>
    </div>
  )
}

// ─── Opening context ─────────────────────────────────────────────────
function OpeningContextBanner() {
  return (
    <div style={{
      marginTop:20,
      padding:'22px 26px',
      background:'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(201,168,76,0.05))',
      border:'1px solid rgba(52,211,153,0.28)',
      borderLeft:`4px solid ${GREEN}`,
      borderRadius:12,
    }}>
      <div style={{ fontSize:11, color:GREEN, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>
        Context · Opened without the raise
      </div>
      <div style={{ fontSize:15, color:CREAM, lineHeight:1.6 }}>
        We opened the doors on <strong>19 June 2026</strong> without drawing down the £49,000 Round&nbsp;1 raise, without the £25,000 capex programme, without a launch marketing campaign, and without press. The figures below are pure operating cash — trading on the goodwill of the brand, the fit-out we already had, and organic word-of-mouth. Read them with that in mind.
      </div>
    </div>
  )
}

// ─── Headline actuals-vs-forecast ─────────────────────────────────────
function HeadlineCard() {
  const revActual   = XERO_SNAPSHOT.pnl.totalIncome
  const cogsActual  = XERO_SNAPSHOT.pnl.costOfSalesAccounts.find(a => a.name === 'Cost of Goods Sold').amount
  const wagesActual = XERO_SNAPSHOT.pnl.costOfSalesAccounts
    .filter(a => a.name === 'Direct Wages' || a.name === 'Freelance & Contract Staff')
    .reduce((s, a) => s + a.amount, 0)
  const rentActual  = XERO_SNAPSHOT.pnl.expenseAccounts.find(a => a.name === 'Rent')?.amount ?? 0
  const opActual    = XERO_SNAPSHOT.pnl.netProfit
  const gpActual    = XERO_SNAPSHOT.pnl.grossProfit
  const gpMargin    = (gpActual / revActual) * 100

  const rows = [
    { label:'Revenue',           actual: revActual,   forecast: FORECAST_PRORATED.revenue,         costLine:false },
    { label:'Gross profit',      actual: gpActual,    forecast: FORECAST_PRORATED.revenue - FORECAST_PRORATED.variableCosts, costLine:false, note: gpMargin.toFixed(1) + '% GM' },
    { label:'Direct staff cost', actual: wagesActual, forecast: FORECAST_PRORATED.wagesAll,        costLine:true  },
    { label:'Rent',              actual: rentActual,  forecast: FORECAST_PRORATED.rent,            costLine:true, note:'rent-free period tail' },
    { label:'Marketing spend',   actual: 0,           forecast: FORECAST_PRORATED.marketing,       costLine:true, note:'zero — no launch campaign run' },
    { label:'Operating profit',  actual: opActual,    forecast: FORECAST_PRORATED.operatingProfit, costLine:false, emphasis:true },
  ]

  return (
    <Section eyebrow="Headlines · Actual vs Forecast (pro-rated Y1)" title="How we're tracking against the plan">
      <div style={{ background:INK_BG, border:BORDER, borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
          <thead>
            <tr>
              <Th align="left">Line</Th>
              <Th align="right">Forecast ({TRADING_DAYS}d)</Th>
              <Th align="right">Actual ({TRADING_DAYS}d)</Th>
              <Th align="right">Δ</Th>
              <Th align="left">Notes</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const delta = pct(r.actual, r.forecast)
              const tone  = toneFor(delta, r.costLine)
              return (
                <tr key={i} style={{
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  background: r.emphasis ? 'rgba(252,211,77,0.06)' : 'transparent',
                }}>
                  <Td emphasis={r.emphasis}>{r.label}</Td>
                  <Td align="right">{fmt(r.forecast)}</Td>
                  <Td align="right" emphasis={r.emphasis}>{fmt(r.actual)}</Td>
                  <Td align="right" style={{ color: tone, fontWeight: 700 }}>{fmtP(delta)}</Td>
                  <Td>{r.note ? <span style={{ color:CREAM_D, fontSize:12 }}>{r.note}</span> : ''}</Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:18, padding:'16px 20px', background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.28)', borderRadius:10 }}>
        <div style={{ fontSize:12, color:GREEN, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>
          The line that matters
        </div>
        <div style={{ fontSize:15, color:CREAM, lineHeight:1.55 }}>
          <strong>Operating profit is {fmtP(pct(opActual, FORECAST_PRORATED.operatingProfit))} against the pro-rated Y1 forecast</strong> — earned without any of the £49,000 raise, £0 marketing spend, £0 capex. Every pound of that profit is bar cash-flow.
        </div>
      </div>
    </Section>
  )
}

// ─── Cash & reserve floor ────────────────────────────────────────────
function CashAndReserveCard() {
  const bal = XERO_SNAPSHOT.cash.balance
  const gap = RESERVE_FLOOR - bal
  const pctToFloor = Math.min(100, (bal / RESERVE_FLOOR) * 100)
  const belowFloor = bal < RESERVE_FLOOR

  return (
    <Section eyebrow="Cash on hand · Reserve status" title="Building the working-capital reserve">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:14, marginBottom:20 }}>
        <StatTile label="Cash balance"     value={fmt(bal)}                                   tone="teal" />
        <StatTile label="Owed to us"       value={fmt(XERO_SNAPSHOT.cash.receivables)}       sub="No open customer invoices" />
        <StatTile label="We owe suppliers" value={fmt(XERO_SNAPSHOT.cash.payables)}          sub={`${XERO_SNAPSHOT.payables.billCount} bills · ${XERO_SNAPSHOT.payables.supplierCount} suppliers`} />
        <StatTile label="Reserve floor"    value={fmt(RESERVE_FLOOR)}                        sub="Investors' Agreement clause 4" />
      </div>

      <div style={{ padding:'18px 22px', background:INK_BG, border:BORDER, borderRadius:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, color:CREAM_D, marginBottom:10 }}>
          <span>Progress to £30k reserve floor</span>
          <span style={{ color: belowFloor ? AMBER : GREEN, fontWeight:700 }}>{pctToFloor.toFixed(0)}%</span>
        </div>
        <div style={{ width:'100%', height:14, background:'rgba(255,255,255,0.06)', borderRadius:7, overflow:'hidden' }}>
          <div style={{
            width: `${pctToFloor}%`,
            height: '100%',
            background: belowFloor ? `linear-gradient(90deg, ${AMBER}, ${GOLD})` : `linear-gradient(90deg, ${GREEN}, ${TEAL})`,
          }} />
        </div>
        <div style={{ marginTop:12, fontSize:13, color:CREAM_D, lineHeight:1.6 }}>
          {belowFloor
            ? <>Reserve is <strong style={{ color:AMBER }}>{fmt(gap)} below the £30,000 floor</strong>. Per the agreement, no dividend may be declared until reserves are at or above the floor at a review date. The £{Math.round(XERO_SNAPSHOT.pnl.netProfit / 1000)}k earned this quarter is being reinvested into the reserve rather than distributed — this is the correct outcome for Y1 and by design.</>
            : <>Reserve is <strong style={{ color:GREEN }}>at or above floor</strong>. Directors may consider a per-share dividend declaration at the next review window.</>}
        </div>
      </div>
    </Section>
  )
}

// ─── Revenue + cost accounts breakdown ───────────────────────────────
function RevenueAndCostCard() {
  const cos = XERO_SNAPSHOT.pnl.costOfSalesAccounts
  const exp = XERO_SNAPSHOT.pnl.expenseAccounts

  return (
    <Section eyebrow="Where money went" title="Cost breakdown from Xero">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <SubTable
          title="Cost of sales"
          rows={cos.map(a => ({ label: a.name, value: fmt(a.amount) }))}
          total={{ label:'Total cost of sales', value: fmt(XERO_SNAPSHOT.pnl.totalCostOfSales) }}
        />
        <SubTable
          title="Operating expenses"
          rows={exp.map(a => ({ label: a.name, value: fmt(a.amount) }))}
          total={{ label:'Total operating expenses', value: fmt(XERO_SNAPSHOT.pnl.totalExpenses) }}
        />
      </div>
      <div style={{ marginTop:16, fontSize:12, color:CREAM_D, lineHeight:1.6 }}>
        Direct staff cost (£{Math.round((cos.find(a=>a.name==='Direct Wages').amount + cos.find(a=>a.name==='Freelance & Contract Staff').amount)/1000).toLocaleString()}k) sits under cost of sales; contractor DJs and event freelancers are the freelance line. Rent is still cushioned by the three-month rent-free period at the start of the lease — full £65k + VAT rent runs from month 4 onwards.
      </div>
    </Section>
  )
}

// ─── What we didn't spend ────────────────────────────────────────────
function WhatWeDidntSpendCard() {
  const items = XERO_SNAPSHOT.pnl.zeroLines
  const undrawnTotal =
    UNDRAWN_RAISE.founderASubscriptionCommitted +
    UNDRAWN_RAISE.externalRemaining +
    (UNDRAWN_RAISE.capexPlanned - UNDRAWN_RAISE.capexActual) +
    (UNDRAWN_RAISE.marketingPlanned - UNDRAWN_RAISE.marketingActual)

  return (
    <Section eyebrow="Upside · What we haven't spent" title="Round 1 firepower still in the tank">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14, marginBottom:18 }}>
        <StatTile label="Undrawn founder A" value={fmt(UNDRAWN_RAISE.founderASubscriptionCommitted)} sub="25 A shares committed, not yet drawn" />
        <StatTile label="External pool open" value={fmt(UNDRAWN_RAISE.externalRemaining)} sub="17 B shares — pre-emption to existing holders" />
        <StatTile label="Capex not spent"    value={fmt(UNDRAWN_RAISE.capexPlanned - UNDRAWN_RAISE.capexActual)} sub="fit-out + garden + interior" />
        <StatTile label="Marketing not run"  value={fmt(UNDRAWN_RAISE.marketingPlanned - UNDRAWN_RAISE.marketingActual)} sub="launch campaign — deferred" />
      </div>

      <div style={{ padding:'16px 20px', background:INK_BG, border:BORDER, borderRadius:10 }}>
        <div style={{ fontSize:11, color:GOLD, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, marginBottom:10 }}>
          Forecast lines at £0 in Xero
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:8, fontSize:13 }}>
          {items.map((it, i) => (
            <div key={i} style={{ padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:6 }}>
              <div style={{ color:CREAM, fontWeight:600 }}>{it.name}</div>
              <div style={{ color:CREAM_D, fontSize:11 }}>Forecast Y1 <span style={{ color:AMBER }}>{fmt(it.forecast)}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop:14, fontSize:13, color:CREAM_D, lineHeight:1.6 }}>
        Combined, <strong style={{ color:GOLD }}>{fmt(undrawnTotal)}</strong> of committed and available Round 1 capital + capex + marketing budget has NOT been deployed. Available to accelerate Round 2 or as-and-when operating cash permits.
      </div>
    </Section>
  )
}

// ─── Aged payables ─────────────────────────────────────────────────────
function PayablesCard() {
  const p = XERO_SNAPSHOT.payables
  return (
    <Section eyebrow="Cash discipline · Aged payables" title="What we owe suppliers today">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <div style={{ padding:'18px 22px', background:INK_BG, border:BORDER, borderRadius:12 }}>
          <div style={{ fontSize:11, color:GOLD, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, marginBottom:12 }}>Ageing buckets</div>
          <BucketBar label="Current" value={p.ageBuckets.current} total={p.total} tone={GREEN} />
          <BucketBar label="< 1 month" value={p.ageBuckets.lessThanOneMonth} total={p.total} tone={AMBER} />
          <BucketBar label="1 month" value={p.ageBuckets.oneMonth} total={p.total} tone={AMBER} />
          <BucketBar label="2+ months" value={p.ageBuckets.twoMonths + p.ageBuckets.threeMonths + p.ageBuckets.olderThanThreeMonths} total={p.total} tone={RED} />
          <div style={{ marginTop:14, fontSize:12, color:CREAM_D }}>
            Total <strong style={{ color:CREAM }}>{fmt(p.total)}</strong> across {p.billCount} bills. {fmt(p.overdue)} ({p.overduePercentage.toFixed(0)}%) is 1 month overdue — actionable this week.
          </div>
        </div>
        <div style={{ padding:'18px 22px', background:INK_BG, border:BORDER, borderRadius:12 }}>
          <div style={{ fontSize:11, color:GOLD, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, marginBottom:12 }}>Top creditors</div>
          {p.topCreditors.map((c, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'8px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize:13, color:CREAM }}>{c.name}</span>
              <span style={{ fontSize:13, color:CREAM_D }}>{fmt(c.owed)} <span style={{ opacity:0.6 }}>· {c.share.toFixed(0)}%</span></span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

// ─── Founder's note ──────────────────────────────────────────────────
function FounderNoteCard() {
  return (
    <Section eyebrow="Founder's Note" title="Where we go from here">
      <div style={{ padding:'22px 26px', background:INK_BG, border:BORDER, borderLeft:`4px solid ${GOLD}`, borderRadius:12, fontSize:15, color:CREAM_D, lineHeight:1.7 }}>
        <p style={{ margin:'0 0 12px 0' }}>
          Three months in. We haven't touched the raise, we haven't run a single paid ad, and we haven't spent a pound on the capex programme. The £30k of operating profit is the venue paying for itself while we work out how to deploy the round properly.
        </p>
        <p style={{ margin:'0 0 12px 0' }}>
          Round 1 firepower stays untouched and grows in value as the business proves it out. When we do draw it — for the garden refurb, for the launch push, for the interior polish — we're spending it on a business that already trades, not one that needs the money to prove the model works.
        </p>
        <p style={{ margin:0, color:CREAM }}>
          Thank you for backing the doors that opened without them.
        </p>
      </div>
    </Section>
  )
}

// ─── Footer meta ─────────────────────────────────────────────────────
function FooterMeta() {
  return (
    <div style={{ marginTop:24, padding:'16px 20px', background:'rgba(0,0,0,0.2)', border:BORDER, borderRadius:10, fontSize:11, color:CREAM_D, textAlign:'center', lineHeight:1.6 }}>
      Xero snapshot cut <strong style={{ color:CREAM }}>{prettyDate(XERO_SNAPSHOT.snapshotDate)}</strong> · organisation <strong style={{ color:CREAM }}>{XERO_SNAPSHOT.organisation}</strong> · Financial year {prettyDate(XERO_SNAPSHOT.financialYear.start)} → {prettyDate(XERO_SNAPSHOT.financialYear.end)} · Forecast baseline pro-rated linearly by calendar days ({TRADING_DAYS} / {365} = {(FORECAST_PRORATED.proration * 100).toFixed(1)}%). Confidential to No Dice Hackney Ltd Round 1 shareholders.
    </div>
  )
}

// ─── Presentational primitives ───────────────────────────────────────
function Section({ eyebrow, title, children }) {
  return (
    <div style={{ marginBottom:34 }}>
      <div style={{ fontSize:11, color:GOLD, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>{eyebrow}</div>
      <h2 className="serif" style={{ fontSize:26, color:CREAM, margin:'0 0 16px 0', lineHeight:1.2 }}>{title}</h2>
      {children}
    </div>
  )
}

function SectionRule() {
  return <div className="gold-rule" style={{ width:160, marginTop:30, marginBottom:28, opacity:0.5 }} />
}

function StatTile({ label, value, sub, tone }) {
  return (
    <div style={{
      padding:'16px 20px',
      background:INK_BG,
      border: tone === 'teal' ? `1px solid rgba(45,212,191,0.35)` : BORDER,
      borderRadius:12,
    }}>
      <div style={{ fontSize:10, color:CREAM_D, letterSpacing:'0.16em', textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>{label}</div>
      <div className="serif" style={{ fontSize:26, color: tone === 'teal' ? TEAL : CREAM, lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:CREAM_D, marginTop:6, lineHeight:1.4 }}>{sub}</div>}
    </div>
  )
}

function SubTable({ title, rows, total }) {
  return (
    <div style={{ background:INK_BG, border:BORDER, borderRadius:10, padding:'4px 8px', overflow:'hidden' }}>
      <div style={{ padding:'10px 12px', fontSize:11, color:GOLD, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>{title}</div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
              <Td>{r.label}</Td>
              <Td align="right">{r.value}</Td>
            </tr>
          ))}
          <tr style={{ borderTop:'2px solid rgba(201,168,76,0.35)' }}>
            <Td bold>{total.label}</Td>
            <Td align="right" bold>{total.value}</Td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function BucketBar({ label, value, total, tone }) {
  const pctOf = total > 0 ? (value / total) * 100 : 0
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:CREAM_D, marginBottom:4 }}>
        <span>{label}</span>
        <span>{fmt(value)} · {pctOf.toFixed(0)}%</span>
      </div>
      <div style={{ width:'100%', height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${pctOf}%`, height:'100%', background:tone }} />
      </div>
    </div>
  )
}

function Th({ children, align='left' }) {
  return (
    <th style={{
      textAlign:align, padding:'10px 12px', fontSize:10, color:CREAM_D,
      letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:600,
      borderBottom:'1px solid rgba(255,255,255,0.08)',
    }}>{children}</th>
  )
}

function Td({ children, align='left', bold=false, emphasis=false, style={} }) {
  return (
    <td style={{
      padding:'10px 12px', textAlign:align, color:CREAM, fontSize:13,
      fontWeight: (bold || emphasis) ? 700 : 400,
      ...style,
    }}>{children}</td>
  )
}

function prettyDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d} ${months[m-1]} ${y}`
}
