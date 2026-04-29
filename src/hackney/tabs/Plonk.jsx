import React, { useState } from 'react'
import {
  HACKNEY_GOLF_2025, HACKNEY_GOLF_GOING_FORWARD, TBD,
  HACKNEY_GOLF_HOST_2025_MONTHLY, HACKNEY_GOLF_HOST_2025_TOTALS,
  HACKNEY_GOLF_TILL_2025_MONTHLY,
  HACKNEY_DMN_SKUS_ONLINE_2025, HACKNEY_DMN_SKUS_OFFICE_2025,
  HACKNEY_DMN_MONTHLY_2025, HACKNEY_DMN_GRAND_2025,
} from '../../data/hackney.js'
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'

// Plonk — Hackney's Plonk tab. The pre-liquidation golf course operated
// next door to the bar; going forward it becomes a separately-incorporated
// company while No Dice continues to host + operate the course on site.
// This tab gives investors a transparent view of what the golf side looked
// like in 2025 and what changes for No Dice under the new structure.

const TABS = ['Golf Operations', 'IP & Licensing', 'Digital Marketing', 'SEO Marketing']

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

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

// ─── Golf Operations — 2025 actuals + go-forward structure ────────────
// Single transparent page for investors covering:
//   1. Context — what the golf was, why it's separating
//   2. 2025 Golf P&L — revenue + costs + net contribution to No Dice
//   3. Old vs New revenue split — line-by-line who keeps what
//   4. Operational handover — what No Dice still does + what changes
function GolfOperations() {
  const g = HACKNEY_GOLF_2025
  const f = HACKNEY_GOLF_GOING_FORWARD
  // Revenue + cost totals for the 2025 P&L card. Treats TBD as 0 for
  // total math while flagging the unknowns inline.
  const num = (v) => (typeof v === 'number' ? v : 0)
  const totalRev2025  = Object.values(g.revenue).reduce((s, v) => s + num(v), 0)
  const totalCost2025 = Object.values(g.costs).reduce((s, v) => s + num(v), 0)
  const net2025       = totalRev2025 - totalCost2025
  const tbdLines      = [...Object.values(g.revenue), ...Object.values(g.costs)].filter(v => v === TBD).length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>

      {/* Context */}
      <div>
        <STitle>Golf Operations · Transparency for Investors</STitle>
        <div className="card" style={{ padding:20, lineHeight:1.7, fontSize:13, color:'var(--cream-dim)' }}>
          <p style={{ marginBottom:12 }}>
            <strong style={{ color:'var(--cream)' }}>Pre-liquidation:</strong> No Dice ran a mini-golf course on the adjacent site (next door, on the same road). Customers bought tickets two ways — <strong style={{ color:'var(--cream)' }}>online</strong> via Design My Night (£-priced ticket SKUs, some bundling <strong style={{ color:'var(--gold)' }}>arcade tokens</strong> as an add-on) or <strong style={{ color:'var(--cream)' }}>at the till</strong> on arrival. Players took their golf round, used any bundled tokens in the venue's arcade machines, then spent at the bar.
          </p>
          <p style={{ marginBottom:12, padding:'8px 12px', background:'rgba(234,179,8,0.06)', borderLeft:'3px solid #EAB308', borderRadius:4 }}>
            <strong style={{ color:'#EAB308' }}>Token mechanic — clarification.</strong> Tickets are <em>not</em> redeemed for tokens at the bar. Some online SKUs (e.g. <em>"Adult — Golf + 4 Tokens"</em>) <strong style={{ color:'var(--cream)' }}>bundle</strong> tokens into the ticket price; the customer uses those tokens in the arcade machines. Tokens are an arcade add-on inside the SKU, not a £-redemption mechanic at the bar.
          </p>
          <p style={{ marginBottom:12 }}>
            <strong style={{ color:'var(--cream)' }}>Going forward (2026+):</strong> the golf course is being separated into a newly-incorporated <strong style={{ color:'var(--cream)' }}>independent operator</strong>. No Dice continues to <strong style={{ color:'var(--cream)' }}>host and operate the course</strong> — same on-site presence, same customer-facing role. Cashflow between the two entities is settled monthly.
          </p>
          <p>
            What this means in plain terms: <strong style={{ color:'var(--gold)' }}>bar / food / party revenue stays 100% with No Dice</strong> (unchanged). <strong style={{ color:'var(--gold)' }}>Token revenue stays 100% with No Dice</strong> — both bundled inside online tickets AND sold at the bar. The operator takes <strong style={{ color:'var(--cream)' }}>no share of token value</strong>; tokens are entirely a No Dice line. <strong style={{ color:'var(--gold)' }}>The golf-round portion of ticket sales</strong> (online and till) <strong style={{ color:'var(--gold)' }}>moves to the operator</strong>, along with the course's cost base — rent, host wages, maintenance, upgrades.
          </p>
        </div>
      </div>

      {/* 2025 Golf P&L */}
      <div>
        <STitle>2025 Golf — Revenue, Costs &amp; Net Contribution</STitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* Revenue card */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:11, color:'#4FC3F7', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:14 }}>Revenue (gross to No Dice in 2025)</div>
            <PnlRow label="Online ticket sales (DMN — tokens)" value={g.revenue.onlineTickets} colour="#4FC3F7" />
            <PnlRow label="Till ticket sales (at venue)"         value={g.revenue.tillTickets}    colour="#4FC3F7" sourceNote="Weekly Merged 2024-2026 row 3 · 52 weeks of 2025" />
            <PnlRow label="Tournament entry fees"                value={g.revenue.tournamentEntry} colour="#4FC3F7" />
            <PnlTotal label="Total revenue 2025" value={totalRev2025} colour="#4FC3F7" hasTbd={[g.revenue.tillTickets].includes(TBD)} />
          </div>
          {/* Costs card */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:11, color:'#F87171', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:14 }}>Costs (attributable to course)</div>
            <PnlRow label="Golf host wages (financial)" value={g.costs.hostWages}    colour="#F87171" sourceNote="Weekly Merged 2024-2026 — no Golf Host line in financials; founder estimate or payroll re-cut needed" />
            <PnlRow label="Course rent share"          value={g.costs.rentShare}    colour="#F87171" sourceNote="Lease apportioned to course site" />
            <PnlRow label="Maintenance"                 value={g.costs.maintenance}  colour="#F87171" sourceNote="Founder approximation" />
            <PnlRow label="Upgrades"                    value={g.costs.upgrade}      colour="#F87171" sourceNote="Founder approximation" />
            <PnlRow label="Utilities / bills"           value={g.costs.utilities}    colour="#9CA3AF" zeroNote="No bills paid for course" />
            <PnlRow label="Business rates"               value={g.costs.businessRates} colour="#9CA3AF" zeroNote="No rates paid on course site" />
            <PnlTotal label="Total cost 2025" value={totalCost2025} colour="#F87171" hasTbd={[g.costs.hostWages, g.costs.rentShare, g.costs.maintenance, g.costs.upgrade].some(v => v === TBD)} />
          </div>
        </div>
        {/* Net contribution + TBD warning */}
        <div className="card" style={{ padding:18, marginTop:14, background: net2025 >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(229,57,53,0.06)', border:`1px solid ${net2025 >= 0 ? 'rgba(16,185,129,0.4)' : 'rgba(229,57,53,0.4)'}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>2025 Net Contribution to No Dice</div>
              <div style={{ fontSize:11, color:'var(--cream-dim)' }}>Total revenue minus total course costs (TBD lines treated as £0 for now).</div>
            </div>
            <div className="serif" style={{ fontSize:32, color: net2025 >= 0 ? '#10B981' : '#E53935', fontVariantNumeric:'tabular-nums' }}>
              {net2025 < 0 ? '−' : ''}{fmt(Math.abs(net2025))}
            </div>
          </div>
          {tbdLines > 0 && (
            <div style={{ marginTop:10, fontSize:11, color:'#EAB308', lineHeight:1.6 }}>
              ⚠ {tbdLines} line{tbdLines === 1 ? '' : 's'} marked TBD — net contribution will firm up once the founder pulls the till-sales figure (Weekly Merged tab) and Golf-Host wage figure (rota), and approximates maintenance + upgrade.
            </div>
          )}
        </div>
      </div>

      {/* Golf Host Seasonality — line + bar chart from 2025 rota */}
      <GolfHostSeasonality />

      {/* DMN ticket breakdown — per-SKU + per-month + token economics */}
      <DmnSkuBreakdown />

      {/* Old vs New structure — revenue split */}
      <div>
        <STitle>Revenue Split — Old Structure vs Going Forward</STitle>
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 2fr', padding:'12px 16px', borderBottom:'1px solid rgba(201,168,76,0.3)', fontSize:10, color:'var(--gold-dim)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
            <span>Revenue line</span>
            <span style={{ textAlign:'center' }}>2025 (old)</span>
            <span style={{ textAlign:'center' }}>2026+ (new)</span>
            <span>What changed</span>
          </div>
          {f.noDiceRetains.map(row => {
            const oldShare = 1.00
            const newShare = typeof row.pct === 'number' ? row.pct : null
            const delta = newShare !== null ? newShare - oldShare : null
            return (
              <div key={row.line} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 2fr', padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13, alignItems:'baseline' }}>
                <span style={{ color:'var(--cream)' }}>{row.line}</span>
                <span style={{ textAlign:'center', color:'var(--gold-dim)', fontVariantNumeric:'tabular-nums' }}>100%</span>
                <span style={{ textAlign:'center', fontVariantNumeric:'tabular-nums', color: newShare === null ? 'var(--cream-dim)' : (delta < 0 ? '#F87171' : (delta === 0 ? 'var(--cream)' : '#10B981')) }}>
                  {newShare === null ? '—' : `${(newShare * 100).toFixed(0)}%`}
                </span>
                <span style={{ fontSize:12, color:'var(--cream-dim)' }}>{row.note}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Operational handover */}
      <div>
        <STitle>Operational Handover</STitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div className="card" style={{ padding:20, borderLeft:'3px solid #2DD4BF' }}>
            <div style={{ fontSize:11, color:'#2DD4BF', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:12 }}>What No Dice keeps doing</div>
            {f.noDiceTakesOver.map(item => (
              <div key={item} style={{ display:'flex', gap:10, fontSize:13, color:'var(--cream-dim)', marginBottom:10, lineHeight:1.6 }}>
                <span style={{ color:'#2DD4BF', flexShrink:0 }}>✓</span><span>{item}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:20, borderLeft:'3px solid #F87171' }}>
            <div style={{ fontSize:11, color:'#F87171', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:12 }}>What moves to the golf company</div>
            {f.golfCompanyTakesOver.map(item => (
              <div key={item} style={{ display:'flex', gap:10, fontSize:13, color:'var(--cream-dim)', marginBottom:10, lineHeight:1.6 }}>
                <span style={{ color:'#F87171', flexShrink:0 }}>→</span><span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Structure summary */}
      <div className="card" style={{ padding:18, background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ fontSize:11, color:'#A78BFA', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:10 }}>New entity structure</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, fontSize:12 }}>
          <div>
            <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Operator</div>
            <div style={{ color:'var(--cream)', lineHeight:1.5 }}>{f.structure.operator}</div>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Course host</div>
            <div style={{ color:'var(--cream)', lineHeight:1.5 }}>{f.structure.host}</div>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Cashflow timing</div>
            <div style={{ color:'var(--cream)', lineHeight:1.5 }}>{f.structure.cashflow}</div>
          </div>
        </div>
      </div>

    </div>
  )
}

// ─── Golf Host seasonality — 2025 rota + till sales overlay ───────────
// Two charts on this section:
//   1. Host hours + gross wage cost — pulled from the live rota
//      (Role = "Golf host"). Shows when staff was actually rota'd.
//   2. Till ticket revenue — pulled from Weekly Merged 2024-2026 row 3.
//      Runs every month of 2025, including months when the host role
//      was dark — meaning bar staff / supervisors were ringing up
//      walk-in tickets at the till.
function GolfHostSeasonality() {
  const data    = HACKNEY_GOLF_HOST_2025_MONTHLY
  const totals  = HACKNEY_GOLF_HOST_2025_TOTALS
  const tillData = HACKNEY_GOLF_TILL_2025_MONTHLY
  const tillTotal = tillData.reduce((s, m) => s + m.revenue, 0)
  const peakMo  = data.reduce((acc, m) => m.hours > acc.hours ? m : acc, data[0])
  const activeMonthLabels = data.filter(m => m.shifts > 0).map(m => m.month).join(', ')
  const darkMonthLabels   = data.filter(m => m.shifts === 0).map(m => m.month).join(', ')
  // Months where till sold tickets but host role was dark — the disconnect.
  const tillByMonth = Object.fromEntries(tillData.map(m => [m.month, m.revenue]))
  const ghostMonths = data.filter(m => m.shifts === 0 && (tillByMonth[m.month] || 0) > 0).map(m => m.month)
  const ghostTotal  = ghostMonths.reduce((s, mo) => s + (tillByMonth[mo] || 0), 0)

  return (
    <div>
      <STitle>Golf Host Shifts · 2025 Seasonality (Operational)</STitle>
      <p style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:8 }}>
        Source: live rota Google Sheet, filtered to <strong style={{ color:'var(--cream)' }}>Role = Golf host</strong> for 1 Jan – 31 Dec 2025. <strong style={{ color:'var(--cream)' }}>Operational data only</strong> — when a dedicated host was scheduled, hours rota'd, peak / dark months. The £ figures shown are the rota's own Cost column (rate × hours) for sanity context only; <strong style={{ color:'var(--cream)' }}>Weekly Merged 2024-2026 is the financial source of truth</strong> for all wage figures and does not break out a Golf Host line. Any role-level £ attribution is therefore an estimate.
      </p>
      <p style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:14, padding:'6px 0' }}>
        Course was always <strong style={{ color:'var(--cream)' }}>OPEN</strong> regardless — bar staff and supervisors covered the host role outside dedicated host shifts. The pattern below shows the seasonal shape of the dedicated-host cover, not when golf was available to play.
      </p>

      <div className="card" style={{ padding:18, marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
          <span style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Host hours + rota Cost column (£)</span>
          <span style={{ fontSize:11, color:'var(--cream-dim)' }}>Peak: {peakMo.month} · {peakMo.hours} hrs · {fmt(peakMo.costGross)}</span>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
              <YAxis yAxisId="hours" stroke="#4FC3F7" fontSize={10} tickFormatter={v => `${v}h`} width={48} />
              <YAxis yAxisId="cost"  orientation="right" stroke="#C9A84C" fontSize={10} tickFormatter={v => '£' + v} width={56} />
              <Tooltip
                cursor={{ fill: 'rgba(201,168,76,0.06)' }}
                contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
                formatter={(v, n) => n === 'Hours' ? [`${v} hrs`, n] : [fmt(v), n]}
              />
              <Bar  yAxisId="hours" dataKey="hours" name="Hours" fill="#4FC3F7" radius={[3,3,0,0]} maxBarSize={36} />
              <Line yAxisId="cost"  dataKey="costGross" name="Gross cost" stroke="#C9A84C" strokeWidth={2.5} dot={{ fill:'#C9A84C', r:4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(229,57,53,0.04)', borderLeft:'3px solid #F87171', borderRadius:4, fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>
          <strong style={{ color:'#F87171' }}>Seasonal pattern:</strong> active in <strong style={{ color:'var(--cream)' }}>{activeMonthLabels}</strong> (6 months), dark in <strong style={{ color:'var(--cream)' }}>{darkMonthLabels}</strong> (6 months). The course shut over the summer-tail and didn't reopen for autumn / winter — half the calendar year ran zero golf hours while the bar continued to trade.
        </div>
      </div>

      {/* Compact host-side totals strip — operational only, no financial truth */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:14 }}>
        <SeasonTile label="Total shifts"        value={totals.shifts.toString()}         sub="Dedicated Golf Host shifts" />
        <SeasonTile label="Total hours"         value={totals.hours.toFixed(1) + ' hrs'} sub={`Avg ${(totals.hours / totals.shifts).toFixed(1)} hrs/shift`} />
        <SeasonTile label="Rota Cost column"    value={fmt(totals.costGross)}            sub="@ £13.15/hr · operational ref only" />
        <SeasonTile label="Active vs dark"      value={`${totals.activeMonths} / ${totals.darkMonths}`} sub="Months host was rota'd / not" />
      </div>

      {/* Walk-in (till) golf ticket revenue — separate chart */}
      <p style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:14, marginTop:24 }}>
        Source: Weekly Merged 2024-2026 sheet, row 3 (<strong style={{ color:'var(--cream)' }}>Total Walk In Golf Tickets</strong>), 52 weeks of 2025 aggregated. Total <strong style={{ color:'var(--gold)' }}>{fmt(tillTotal)}</strong>. Note: till sales ran every month — even when the rota had zero Golf Host shifts. Walk-in tickets were being rung up by bar staff / supervisors at the bar till regardless of whether a dedicated host was scheduled.
      </p>

      <div className="card" style={{ padding:18, marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
          <span style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Walk-in (till) golf ticket revenue</span>
          <span style={{ fontSize:11, color:'var(--cream-dim)' }}>52 weeks of 2025 · {tillData.length} months</span>
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer>
            <ComposedChart data={tillData} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
              <YAxis stroke="#2DD4BF" fontSize={10} tickFormatter={v => '£' + v} width={56} />
              <Tooltip
                cursor={{ fill: 'rgba(45,212,191,0.06)' }}
                contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
                formatter={(v) => [fmt(v), 'Till revenue']}
              />
              <Bar  dataKey="revenue" name="Revenue" fill="#2DD4BF" radius={[3,3,0,0]} maxBarSize={36} />
              <Line dataKey="revenue" stroke="#2DD4BF" strokeWidth={2} dot={{ fill:'#2DD4BF', r:3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {ghostMonths.length > 0 && (
          <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(234,179,8,0.04)', borderLeft:'3px solid #EAB308', borderRadius:4, fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>
            <strong style={{ color:'#EAB308' }}>Bar-staff cover:</strong> till sold <strong style={{ color:'var(--cream)' }}>{fmt(ghostTotal)}</strong> of golf tickets across <strong style={{ color:'var(--cream)' }}>{ghostMonths.join(', ')}</strong> — months where no dedicated Golf Host was rota'd. The course stayed open; bar staff and supervisors absorbed the host role on top of their bar duties. Under the new structure the operator picks this up, freeing No Dice's bar team to focus on bar trade.
          </div>
        )}
      </div>

      {/* Till-side totals strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
        <SeasonTile label="Total walk-in revenue 2025" value={fmt(tillTotal)}                                                            sub="52 weeks · all months active" colour="#2DD4BF" />
        <SeasonTile label="Avg per month"               value={fmt(tillTotal / 12)}                                                       sub="Across 12 months" />
        <SeasonTile label="Peak month"                  value={(() => { const p = tillData.reduce((a, m) => m.revenue > a.revenue ? m : a, tillData[0]); return `${p.month} · ${fmt(p.revenue)}` })()} sub="Highest till take" />
        <SeasonTile label="Quiet month"                 value={(() => { const p = tillData.reduce((a, m) => m.revenue < a.revenue ? m : a, tillData[0]); return `${p.month} · ${fmt(p.revenue)}` })()} sub="Lowest till take" />
      </div>
    </div>
  )
}

// ─── DMN SKU breakdown — Hackney 2025 online ticket economics ─────────
// Mirrors the Borough IP & Licensing tab structure. Three sections:
//   1. Online SKUs (status=complete) — sold + revenue per archetype
//   2. Office / external SKUs (status=external, revenue imputed at
//      avg online unit price) — same shape
//   3. Per-month online vs office split + headline totals + a token
//      callout reinforcing 100% No Dice retention (no operator share)
function DmnSkuBreakdown() {
  const online  = HACKNEY_DMN_SKUS_ONLINE_2025
  const office  = HACKNEY_DMN_SKUS_OFFICE_2025
  const grand   = HACKNEY_DMN_GRAND_2025
  const monthly = HACKNEY_DMN_MONTHLY_2025
  // Token economics: 100% of token revenue stays with No Dice — both
  // bundled-into-SKU tokens AND tokens bought at the bar till.
  // The operator takes NO share of token value. The deck surfaces
  // the bundled-token count for context but does not deduct any
  // operator settlement.

  return (
    <div>
      <STitle>Online Ticket Sales · DMN 2025 Breakdown</STitle>
      <p style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:14 }}>
        Source: Design My Night sales export (Hackney venue, calendar 2025). <strong style={{ color:'var(--cream)' }}>Online</strong> = status <code style={{ background:'rgba(255,255,255,0.06)', padding:'1px 6px', borderRadius:3 }}>complete</code> (paid via DMN portal, £ recorded). <strong style={{ color:'var(--cream)' }}>Office</strong> = status <code style={{ background:'rgba(255,255,255,0.06)', padding:'1px 6px', borderRadius:3 }}>external</code> (booked via DMN, paid at the venue till — DMN records £0; revenue imputed at average online unit price per SKU, same method as Borough).
      </p>

      {/* Headline numbers strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:14 }}>
        <SeasonTile label="Online tickets · 2025"    value={fmt(grand.onlineRev)}   sub={`${grand.onlineQty.toLocaleString('en-GB')} sold (status=complete)`} colour="#4FC3F7" />
        <SeasonTile label="Office tickets · 2025"    value={fmt(grand.officeRev)}   sub={`${grand.officeQty.toLocaleString('en-GB')} sold · imputed @ avg online price`} colour="#A78BFA" />
        <SeasonTile label="Combined DMN volume"      value={fmt(grand.totalRev)}    sub={`${grand.totalQty.toLocaleString('en-GB')} tickets across both channels`} colour="#10B981" />
        <SeasonTile label="Tokens bundled"           value={grand.tokensTotal.toLocaleString('en-GB')} sub="100% to No Dice · no operator share" colour="#EAB308" />
      </div>

      {/* Online SKUs table */}
      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:14 }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(201,168,76,0.3)', fontSize:11, color:'#4FC3F7', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>
          Online SKUs · status = complete · {online.length} archetypes
        </div>
        <SkuTable rows={online} />
      </div>

      {/* Office SKUs table */}
      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:14 }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(167,139,250,0.3)', fontSize:11, color:'#A78BFA', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>
          Office / External SKUs · status = external · revenue imputed
        </div>
        <SkuTable rows={office} />
      </div>

      {/* Monthly split */}
      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:14 }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(201,168,76,0.3)', fontSize:11, color:'var(--gold)', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>
          Monthly split · online (actual) vs office (imputed)
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'0.7fr 1fr 1.2fr 1fr 1.2fr', padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:10, color:'var(--gold-dim)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
          <span>Month</span>
          <span style={{ textAlign:'right' }}>Online qty</span>
          <span style={{ textAlign:'right' }}>Online £</span>
          <span style={{ textAlign:'right' }}>Office qty</span>
          <span style={{ textAlign:'right' }}>Office £ (imputed)</span>
        </div>
        {monthly.map(m => (
          <div key={m.month} style={{ display:'grid', gridTemplateColumns:'0.7fr 1fr 1.2fr 1fr 1.2fr', padding:'8px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12, fontVariantNumeric:'tabular-nums' }}>
            <span style={{ color:'var(--cream)' }}>{m.month}</span>
            <span style={{ textAlign:'right', color:'var(--cream-dim)' }}>{m.onlineQty.toLocaleString('en-GB')}</span>
            <span style={{ textAlign:'right', color:'#4FC3F7' }}>{fmt(m.onlineRev)}</span>
            <span style={{ textAlign:'right', color:'var(--cream-dim)' }}>{m.officeQty.toLocaleString('en-GB')}</span>
            <span style={{ textAlign:'right', color:'#A78BFA' }}>{fmt(m.officeRev)}</span>
          </div>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:'0.7fr 1fr 1.2fr 1fr 1.2fr', padding:'10px 16px', fontSize:13, fontVariantNumeric:'tabular-nums', fontWeight:600 }}>
          <span style={{ color:'var(--cream)' }}>2025</span>
          <span style={{ textAlign:'right', color:'var(--cream)' }}>{grand.onlineQty.toLocaleString('en-GB')}</span>
          <span className="serif" style={{ textAlign:'right', color:'#4FC3F7', fontSize:15 }}>{fmt(grand.onlineRev)}</span>
          <span style={{ textAlign:'right', color:'var(--cream)' }}>{grand.officeQty.toLocaleString('en-GB')}</span>
          <span className="serif" style={{ textAlign:'right', color:'#A78BFA', fontSize:15 }}>{fmt(grand.officeRev)}</span>
        </div>
      </div>

      {/* Token economics callout — 100% No Dice retention */}
      <div className="card" style={{ padding:18, background:'rgba(45,212,191,0.06)', border:'1px solid rgba(45,212,191,0.3)', borderLeft:'4px solid #2DD4BF' }}>
        <div style={{ fontSize:11, color:'#2DD4BF', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:12 }}>Token Economics · 100% No Dice</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Tokens bundled in 2025</div>
            <div className="serif" style={{ fontSize:22, color:'var(--gold)' }}>{grand.tokensTotal.toLocaleString('en-GB')}</div>
            <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:4 }}>{grand.tokensOnline.toLocaleString('en-GB')} online + {grand.tokensOffice.toLocaleString('en-GB')} office</div>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>No Dice retention</div>
            <div className="serif" style={{ fontSize:22, color:'#10B981' }}>100%</div>
            <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:4 }}>Of all token revenue — bundled and bar till</div>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Operator share</div>
            <div className="serif" style={{ fontSize:22, color:'#F87171' }}>£0</div>
            <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:4 }}>No share of token value goes to the operator</div>
          </div>
        </div>
        <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6, paddingTop:12, borderTop:'1px solid rgba(45,212,191,0.2)' }}>
          <strong style={{ color:'var(--cream)' }}>The mechanic:</strong> token revenue is entirely a No Dice line. Customers pay for tokens (either bundled inside an online ticket SKU or directly at the bar till) and use them in the venue's arcade machines. The new golf operator runs the course but takes no share of any token value — token income flows wholly to No Dice.
        </div>
        <div style={{ marginTop:10, fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>
          <strong style={{ color:'var(--cream)' }}>Cost side already accounted for:</strong> the £ actually paid out to the arcade-machine operators (Pinball Geoff, LTF/JP) for tokens used is already booked under the bar P&amp;L's <strong style={{ color:'var(--cream)' }}>Arcades</strong> cost category — ~£{grand.arcadesPaidWeeklyMerged2025.toLocaleString('en-GB', { maximumFractionDigits:0 })} across 52 weeks of 2025 per Weekly Merged 2024-2026 (matches the £8,202 figure on the 2025 Performance tab). No separate token-settlement line is added here to avoid double-counting.
        </div>
      </div>
    </div>
  )
}

function SkuTable({ rows }) {
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'2.6fr 0.7fr 0.7fr 0.7fr 0.7fr 1fr', padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:10, color:'var(--gold-dim)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
        <span>SKU</span>
        <span style={{ textAlign:'right' }}>Rounds</span>
        <span style={{ textAlign:'right' }}>Tokens</span>
        <span style={{ textAlign:'right' }}>Avg £</span>
        <span style={{ textAlign:'right' }}>Sold</span>
        <span style={{ textAlign:'right' }}>Revenue</span>
      </div>
      {rows.map(r => (
        <div key={r.sku} style={{ display:'grid', gridTemplateColumns:'2.6fr 0.7fr 0.7fr 0.7fr 0.7fr 1fr', padding:'8px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12, fontVariantNumeric:'tabular-nums', alignItems:'baseline' }}>
          <span style={{ color:'var(--cream)' }}>{r.sku}</span>
          <span style={{ textAlign:'right', color:'var(--cream-dim)' }}>{r.rounds || '—'}</span>
          <span style={{ textAlign:'right', color: r.tokens > 0 ? '#EAB308' : 'var(--cream-dim)' }}>{r.tokens || '—'}</span>
          <span style={{ textAlign:'right', color:'var(--cream-dim)' }}>£{r.price.toFixed(2)}</span>
          <span style={{ textAlign:'right', color:'var(--cream)' }}>{r.sold.toLocaleString('en-GB')}</span>
          <span style={{ textAlign:'right', color:'var(--gold)', fontWeight:500 }}>{fmt(r.revenue)}</span>
        </div>
      ))}
      <div style={{ display:'grid', gridTemplateColumns:'2.6fr 0.7fr 0.7fr 0.7fr 0.7fr 1fr', padding:'10px 16px', fontSize:13, fontVariantNumeric:'tabular-nums', fontWeight:600 }}>
        <span style={{ color:'var(--cream)' }}>Total</span>
        <span></span><span></span><span></span>
        <span style={{ textAlign:'right', color:'var(--cream)' }}>{rows.reduce((s, r) => s + r.sold, 0).toLocaleString('en-GB')}</span>
        <span className="serif" style={{ textAlign:'right', color:'var(--gold)', fontSize:15 }}>{fmt(rows.reduce((s, r) => s + r.revenue, 0))}</span>
      </div>
    </>
  )
}

function SeasonTile({ label, value, sub, colour }) {
  return (
    <div className="card" style={{ padding:14 }}>
      <div style={{ fontSize:9, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{label}</div>
      <div className="serif" style={{ fontSize:'clamp(1.1rem, 1.8vw, 1.4rem)', color: colour || 'var(--gold)', lineHeight:1, marginBottom:6 }}>{value}</div>
      <div style={{ fontSize:10, color:'var(--cream-dim)', lineHeight:1.4 }}>{sub}</div>
    </div>
  )
}

// ─── Helpers used by the Golf Operations P&L cards ────────────────────
function PnlRow({ label, value, colour, sourceNote, zeroNote }) {
  const isTbd = value === TBD
  const display = isTbd ? 'TBD' : (value === 0 ? '£0' : fmt(value))
  // Footnote: zero → zeroNote; TBD → "Source: <where to find it>";
  // numeric → "Source: <provenance>" so investors see where it came from.
  let footnote = ''
  if (value === 0) footnote = zeroNote || ''
  else if (isTbd) footnote = sourceNote ? `Source: ${sourceNote}` : ''
  else if (sourceNote) footnote = `Source: ${sourceNote}`
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', gap:12 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, color:'var(--cream)' }}>{label}</div>
        {footnote && (
          <div style={{ fontSize:10, color:'var(--cream-dim)', marginTop:2 }}>{footnote}</div>
        )}
      </div>
      <div style={{ fontSize:14, color: isTbd ? '#EAB308' : (value === 0 ? 'var(--cream-dim)' : colour), fontVariantNumeric:'tabular-nums', fontWeight: isTbd ? 600 : 400, letterSpacing: isTbd ? '0.06em' : '0', textTransform: isTbd ? 'uppercase' : 'none' }}>
        {display}
      </div>
    </div>
  )
}

function PnlTotal({ label, value, colour, hasTbd }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', paddingTop:12, marginTop:6, borderTop:`2px solid ${colour}30` }}>
      <div>
        <div style={{ fontSize:12, color:'var(--cream)', fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase' }}>{label}</div>
        {hasTbd && <div style={{ fontSize:10, color:'#EAB308', marginTop:2 }}>(excludes TBD lines)</div>}
      </div>
      <div className="serif" style={{ fontSize:20, color: colour, fontVariantNumeric:'tabular-nums' }}>{fmt(value)}</div>
    </div>
  )
}

function IPLicensing() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>IP & Licensing</STitle>
      <Tbd>Hackney 2025 SKU + monthly DMN data now lives on the <strong>Golf Operations</strong> tab (Online + Office breakdown plus a token-economics callout: 100% of token revenue stays with No Dice; the operator takes no share of token value). This sub-tab is reserved for the formal IP &amp; Licensing arrangement with the new golf operator entity — commission rate, booking-fee handling, online-portal license terms — TBD pending operator incorporation.</Tbd>
    </div>
  )
}

function DigitalMarketing() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Digital Marketing</STitle>
      <Tbd>Borough's Digital Marketing tab models Google Ads, SEO and ticket-uplift forecasts. Hackney runs zero paid Google Ads — populate with Hackney's organic / local listings / events split or remove if not used.</Tbd>
    </div>
  )
}

function SeoMarketing() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>SEO Marketing</STitle>
      <Tbd>Borough's SEO tab covers organic search recovery (the 32% drop from the Plonk→No Dice rebrand). Hackney equivalent: GA4 baseline + local-search ranking plan + 301 redirect strategy. TBD.</Tbd>
    </div>
  )
}

export default function Plonk() {
  const [tab, setTab] = useState('Golf Operations')
  const tabComponents = {
    'Golf Operations':    <GolfOperations />,
    'IP & Licensing':     <IPLicensing />,
    'Digital Marketing':  <DigitalMarketing />,
    'SEO Marketing':      <SeoMarketing />,
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
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>Plonk Golf</div>
        <div style={{ fontSize:14, color:'var(--cream-dim)' }}>IP &amp; Licensing · Digital Marketing · dev section</div>
      </div>
    </div>
  )
}
