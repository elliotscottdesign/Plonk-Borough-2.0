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

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// Section subheading — serif font in cream/white, smaller than the main tab
// heading. Replaces the original tiny gold uppercase label.
function STitle({ children }) {
  return <div className="serif" style={{ fontSize:20, color:'var(--cream)', marginBottom:14, lineHeight:1.25 }}>{children}</div>
}

// ─── Golf Operations — 2025 actuals + go-forward structure ────────────
// Single transparent page for investors covering:
//   1. Context — what the golf was, why it's separating
//   2. 2025 Golf P&L — revenue + costs + net contribution to No Dice
//   3. Old vs New revenue split — line-by-line who keeps what
//   4. Operational handover — what No Dice still does + what changes
// ─── Section components — each block of the old GolfOperations scroll ─
// Split out so the Plonk landing page can render them one-at-a-time
// driven by a left-rail section index. The "New entity structure" card
// that used to live at the bottom of the Operational Handover scroll has
// been removed.

function GolfOverview() {
  const [openCtx, setOpenCtx] = React.useState(false)
  return (
    <div>
      <STitle>Golf Operations · Transparency for Investors</STitle>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14, marginBottom:14 }}>
        <GolfHeroCard
          color="var(--gold)"
          label="Stays 100% with No Dice"
          value="Bar · Food · Parties · Tokens"
          sub="Bar takings, F&B, party hires and ALL token revenue (bundled in online SKUs AND sold at the bar) remain a No Dice line. Operator takes no share."
        />
        <GolfHeroCard
          color="#A78BFA"
          label="Moves to new operator"
          value="Golf-round ticket portion + course costs"
          sub="The golf-round share of ticket sales (online + till) moves to the operator, along with the course cost base — rent, host wages, maintenance, upgrades."
        />
        <GolfHeroCard
          color="#22D3EE"
          label="The new structure"
          value="Independent operator · No Dice still hosts"
          sub="A newly-incorporated operator owns the course P&L. No Dice continues to host and operate on-site — same customer-facing role. Cashflow settled monthly between entities."
        />
      </div>

      <button
        onClick={() => setOpenCtx(o => !o)}
        style={{
          width:'100%', padding:'10px 14px',
          background:'rgba(201,168,76,0.06)',
          border:'1px dashed rgba(201,168,76,0.3)',
          borderRadius:6,
          cursor:'pointer',
          fontSize:11, color:'var(--gold-dim)',
          letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}
      >
        <span style={{ transform:openCtx?'rotate(90deg)':'rotate(0deg)', transition:'transform 0.15s', display:'inline-block' }}>›</span>
        {openCtx ? 'Hide background detail' : 'Show how golf used to work'}
      </button>

      {openCtx && (
        <div className="card" style={{ padding:20, lineHeight:1.7, fontSize:13, color:'var(--cream-dim)', marginTop:10 }}>
          <p style={{ marginBottom:12 }}>
            <strong style={{ color:'var(--cream)' }}>Pre-liquidation:</strong> <strong style={{ color:'var(--cream)' }}>Plonk Golf Ltd</strong> ran a mini-golf course on the adjacent site (next door, on the same road) until its March 2026 liquidation. Customers bought tickets two ways — <strong style={{ color:'var(--cream)' }}>online</strong> via Design My Night (£-priced ticket SKUs, some bundling <strong style={{ color:'var(--gold)' }}>arcade tokens</strong> as an add-on) or <strong style={{ color:'var(--cream)' }}>at the till</strong> on arrival. Players took their golf round, used any bundled tokens in the venue's arcade machines, then spent at the bar.
          </p>
          <p style={{ marginBottom:0 }}>
            <strong style={{ color:'var(--cream)' }}>Going forward (2026+):</strong> No Dice Hackney is the new spin-off launching post-liquidation, acquiring assets back from the liquidator. The golf course is being separated into a newly-incorporated <strong style={{ color:'var(--cream)' }}>independent operator</strong> trading as <strong style={{ color:'var(--cream)' }}>Plonk</strong> — the same name now lives on as the brand of the mini-golf course at No Dice. No Dice continues to <strong style={{ color:'var(--cream)' }}>host and operate the course</strong> — same on-site presence, same customer-facing role. Cashflow between the two entities is settled monthly.
          </p>
        </div>
      )}
    </div>
  )
}

function GolfPnl() {
  const g = HACKNEY_GOLF_2025
  const num = (v) => (typeof v === 'number' ? v : 0)
  const totalRev2025  = Object.values(g.revenue).reduce((s, v) => s + num(v), 0)
  const totalCost2025 = Object.values(g.costs).reduce((s, v) => s + num(v), 0)
  const net2025       = totalRev2025 - totalCost2025
  const tbdLines      = [...Object.values(g.revenue), ...Object.values(g.costs)].filter(v => v === TBD).length
  return (
    <div>
      <STitle>2025 Golf — Revenue, Costs &amp; Net Contribution</STitle>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* Revenue card — Net Contribution lives at the bottom of this card,
            directly under Total Revenue 2025, so the revenue side carries the
            bottom-line takeaway rather than sitting as a separate callout. */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:11, color:'#4FC3F7', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:14 }}>Revenue (gross to No Dice in 2025)</div>
          <PnlRow label="Online ticket sales (DMN — tokens)" value={g.revenue.onlineTickets} colour="#4FC3F7" />
          <PnlRow label="Till ticket sales (at venue)"         value={g.revenue.tillTickets}    colour="#4FC3F7" sourceNote="Weekly Merged 2024-2026 row 3 · 52 weeks of 2025" />
          <PnlTotal label="Total revenue 2025" value={totalRev2025} colour="#4FC3F7" hasTbd={[g.revenue.tillTickets].includes(TBD)} />

          <div style={{
            marginTop: 18, paddingTop: 16, paddingLeft: 14, paddingRight: 14, paddingBottom: 14,
            background: net2025 >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(229,57,53,0.06)',
            border: `1px solid ${net2025 >= 0 ? 'rgba(16,185,129,0.4)' : 'rgba(229,57,53,0.4)'}`,
            borderRadius: 8,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>2025 Net Contribution</div>
                <div style={{ fontSize:10, color:'var(--cream-dim)', lineHeight:1.4 }}>Total revenue − total course costs (TBD lines = £0).</div>
              </div>
              <div className="serif" style={{ fontSize:24, color: net2025 >= 0 ? '#10B981' : '#E53935', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
                {net2025 < 0 ? '−' : ''}{fmt(Math.abs(net2025))}
              </div>
            </div>
            {tbdLines > 0 && (
              <div style={{ marginTop:8, fontSize:10, color:'#EAB308', lineHeight:1.5 }}>
                ⚠ {tbdLines} line{tbdLines === 1 ? '' : 's'} marked TBD — figure firms up once till-sales + Golf-Host wages + maintenance / upgrade approximations land.
              </div>
            )}
          </div>
        </div>
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:11, color:'#F87171', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:14 }}>Costs (attributable to course)</div>
          <PnlRow label="Golf host wages (rota-derived)" value={g.costs.hostWages} colour="#F87171" sourceNote="Live rota · 248.2 hrs × £13.15 × 1.355 (NIC + pension + holiday). Operational estimate — Weekly Merged has no Golf Host line" />
          <PnlRow label="Course rent share"           value={g.costs.rentShare}   colour="#F87171" sourceNote="Separate course-site lease · £24,000 / yr inc VAT (founder)" />
          <PnlRow label="Maintenance"                  value={g.costs.maintenance} colour="#F87171" sourceNote="Founder approximation · 2025" />
          <PnlRow label="Upgrades"                     value={g.costs.upgrade}     colour="#F87171" sourceNote="Founder approximation · new holes + paint job + theming extending from the bar side" />
          <PnlRow label="Utilities / bills"           value={g.costs.utilities}    colour="#9CA3AF" zeroNote="No bills paid for course" />
          <PnlRow label="Business rates"               value={g.costs.businessRates} colour="#9CA3AF" zeroNote="No rates paid on course site" />
          <PnlTotal label="Total cost 2025" value={totalCost2025} colour="#F87171" hasTbd={[g.costs.hostWages, g.costs.rentShare, g.costs.maintenance, g.costs.upgrade].some(v => v === TBD)} />
        </div>
      </div>
    </div>
  )
}

function RevenueSplit() {
  const f = HACKNEY_GOLF_GOING_FORWARD
  return (
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
  )
}

function OperationalHandover() {
  const f = HACKNEY_GOLF_GOING_FORWARD
  return (
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
  )
}

// Small KPI-style hero card with optional rollover tooltip for the
// long-form sub copy. Title + value behave like the BusinessExplorer
// KpiCard2026; sub-line is dimmer and constrained to 2-3 lines.
function GolfHeroCard({ color, label, value, sub }) {
  return (
    <div title={sub} style={{
      background:'var(--ink-2)',
      border:`1px solid ${color}33`,
      borderTop:`3px solid ${color}`,
      borderRadius:10, padding:18,
      display:'flex', flexDirection:'column', gap:8,
    }}>
      <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
        {label}
      </div>
      <div className="serif" style={{ fontSize:18, color, lineHeight:1.2 }}>
        {value}
      </div>
      <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.55 }}>
        {sub}
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
function GolfHosts() {
  const data    = HACKNEY_GOLF_HOST_2025_MONTHLY
  const totals  = HACKNEY_GOLF_HOST_2025_TOTALS
  const peakMo  = data.reduce((acc, m) => m.hours > acc.hours ? m : acc, data[0])
  return (
    <div>
      <STitle>Golf Host Shifts · 2025 Seasonality (Operational)</STitle>
      <p style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:8 }}>
        Source: live rota Google Sheet, filtered to <strong style={{ color:'var(--cream)' }}>Role = Golf host</strong> for 1 Jan – 31 Dec 2025. <strong style={{ color:'var(--cream)' }}>Operational data only</strong> — shifts scheduled, hours rota'd, peak / dark months. No £ figures attributed at the rota level; the financial-truth wage line lives on Weekly Merged 2024-2026, which does not break out a Golf Host line.
      </p>
      <p style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:14, padding:'6px 0' }}>
        Course was always <strong style={{ color:'var(--cream)' }}>OPEN</strong> regardless — bar staff and supervisors covered the host role outside dedicated host shifts. The pattern below shows the seasonal shape of the dedicated-host cover, not when golf was available to play.
      </p>

      <div className="card" style={{ padding:18, marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
          <span style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Host hours per month</span>
          <span style={{ fontSize:11, color:'var(--cream-dim)' }}>Peak: {peakMo.month} · {peakMo.hours} hrs</span>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
              <YAxis stroke="#4FC3F7" fontSize={10} tickFormatter={v => `${v}h`} width={48} />
              <Tooltip
                cursor={{ fill: 'rgba(79,195,247,0.06)' }}
                contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8, color:'var(--cream)' }}
                labelStyle={{ color:'var(--cream)', fontWeight:600, marginBottom:4 }}
                itemStyle={{ color:'var(--cream)' }}
                formatter={(v) => [`${v} hrs`, 'Hours']}
              />
              <Bar  dataKey="hours" name="Hours" fill="#4FC3F7" radius={[3,3,0,0]} maxBarSize={36} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compact host-side totals strip — operational hours only */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
        <SeasonTile label="Total shifts"        value={totals.shifts.toString()}         sub="Dedicated Golf Host shifts" />
        <SeasonTile label="Total hours"         value={totals.hours.toFixed(1) + ' hrs'} sub={`Avg ${(totals.hours / totals.shifts).toFixed(1)} hrs/shift`} />
        <SeasonTile label="Active vs dark"      value={`${totals.activeMonths} / ${totals.darkMonths}`} sub="Months host was rota'd / not" />
      </div>
    </div>
  )
}

function TillRevenue() {
  const tillData  = HACKNEY_GOLF_TILL_2025_MONTHLY
  const tillTotal = tillData.reduce((s, m) => s + m.revenue, 0)
  return (
    <div>
      <STitle>Walk-In (Till) Golf Ticket Revenue · 2025</STitle>
      <p style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:14 }}>
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
                contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8, color:'var(--cream)' }}
                labelStyle={{ color:'var(--cream)', fontWeight:600, marginBottom:4 }}
                itemStyle={{ color:'var(--cream)' }}
                formatter={(v) => [fmt(v), 'Till revenue']}
              />
              <Bar  dataKey="revenue" name="Revenue" fill="#2DD4BF" radius={[3,3,0,0]} maxBarSize={36} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
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

      {/* Monthly split — line chart, online (actual) vs office (imputed) */}
      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid rgba(201,168,76,0.3)', flexWrap:'wrap', gap:12 }}>
          <span style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>
            Monthly split · online (actual) vs office (imputed)
          </span>
          <span style={{ display:'flex', gap:14, fontSize:10.5, color:'var(--cream-dim)' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <span style={{ width:14, height:2, background:'#4FC3F7' }} /> Online £
            </span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <span style={{ width:14, height:2, background:'#A78BFA' }} /> Office £ (imputed)
            </span>
          </span>
        </div>
        <div style={{ height:260, padding:'12px 8px 4px' }}>
          <ResponsiveContainer>
            <ComposedChart data={monthly} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--cream-dim)" fontSize={10} tickFormatter={v => '£' + Math.round(v / 1000) + 'k'} width={56} />
              <Tooltip
                cursor={{ stroke:'rgba(201,168,76,0.2)' }}
                contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8, color:'var(--cream)' }}
                labelStyle={{ color:'var(--cream)', fontWeight:600, marginBottom:4 }}
                itemStyle={{ color:'var(--cream)' }}
                formatter={(v, name) => [fmt(v), name]}
              />
              <Line type="monotone" dataKey="onlineRev" name="Online £"           stroke="#4FC3F7" strokeWidth={2.5} dot={{ fill:'#4FC3F7', r:3 }} />
              <Line type="monotone" dataKey="officeRev" name="Office £ (imputed)" stroke="#A78BFA" strokeWidth={2.5} dot={{ fill:'#A78BFA', r:3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'14px 18px', borderTop:'1px solid rgba(201,168,76,0.15)', flexWrap:'wrap', gap:18, fontVariantNumeric:'tabular-nums' }}>
          <span style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>2025 Total</span>
          <span style={{ display:'flex', gap:24, alignItems:'baseline', fontSize:13 }}>
            <span style={{ color:'var(--cream-dim)' }}>Online qty <strong style={{ color:'var(--cream)' }}>{grand.onlineQty.toLocaleString('en-GB')}</strong></span>
            <span className="serif" style={{ color:'#4FC3F7', fontSize:18 }}>{fmt(grand.onlineRev)}</span>
            <span style={{ color:'var(--cream-dim)' }}>Office qty <strong style={{ color:'var(--cream)' }}>{grand.officeQty.toLocaleString('en-GB')}</strong></span>
            <span className="serif" style={{ color:'#A78BFA', fontSize:18 }}>{fmt(grand.officeRev)}</span>
          </span>
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

// ─── Plonk Commissions — three-slider model ──────────────────────────
// Mirrors Borough's IP & Licensing commission section. Three sliders:
//   1. Commission % on online golf sales (default 10%)
//   2. Commission % on office golf sales (default 10%)
//   3. Booking fee % on ALL online sales (default 10%)
// Golf-only filter: a SKU is commissionable golf if it carries a round
// AND is NOT a Game & Drink bundle. Game & Drink (golf + venue drink)
// stays 100% with No Dice, so it's treated as non-golf for both the
// operator-handover narrative and the commission model. Pool tables,
// pool tournaments, brunches, drink add-ons and seasonal specials are
// venue-managed (no commission).
const isGolfSku = (r) => r.rounds > 0 && !/Game & Drink/i.test(r.sku)
function sumGolfRev(rows)    { return rows.filter(isGolfSku).reduce((s, r) => s + r.revenue, 0) }
function sumNonGolfRev(rows) { return rows.filter(r => !isGolfSku(r)).reduce((s, r) => s + r.revenue, 0) }

function PlonkCommissions() {
  const [commissionOnlinePct, setCommissionOnlinePct] = useState(10)
  const [commissionOfficePct, setCommissionOfficePct] = useState(10)
  const [bookingFeePct, setBookingFeePct]             = useState(10)

  const onlineGolfRev    = sumGolfRev(HACKNEY_DMN_SKUS_ONLINE_2025)
  const onlineNonGolfRev = sumNonGolfRev(HACKNEY_DMN_SKUS_ONLINE_2025)
  const officeGolfRev    = sumGolfRev(HACKNEY_DMN_SKUS_OFFICE_2025)
  const officeNonGolfRev = sumNonGolfRev(HACKNEY_DMN_SKUS_OFFICE_2025)
  const onlineGrossAll   = HACKNEY_DMN_GRAND_2025.onlineRev

  const commissionOnline = onlineGolfRev * (commissionOnlinePct / 100)
  const commissionOffice = officeGolfRev * (commissionOfficePct / 100)
  const bookingFees      = onlineGrossAll * (bookingFeePct / 100)
  const total2026        = commissionOnline + commissionOffice + bookingFees

  const ACCENT = '#22D3EE'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <STitle>Plonk Commissions · 2026 income from venue</STitle>
      <p style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:0 }}>
        Three sliders model what Plonk Golf would earn under the new structure on 2025 base volume — commission % on online golf sales, commission % on office golf sales, and the customer-paid booking fee % applied to ALL online sales at checkout. Booking fee is set to <strong style={{ color:'var(--cream)' }}>10%</strong> by default; the two commission sliders default to <strong style={{ color:'var(--cream)' }}>10%</strong>.
      </p>

      {/* Headline summary card — totals + per-stream split */}
      <div style={{ background:`${ACCENT}10`, border:`1px solid ${ACCENT}40`, borderRadius:10, padding:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:11, color:ACCENT, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>Total Plonk income · 2026</div>
            <div style={{ fontSize:12, color:'var(--cream-dim)', marginTop:4 }}>Commission on golf-rounds (online + office) plus the customer-paid booking fee surcharge.</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Total</div>
            <div className="serif" style={{ fontSize:26, color:ACCENT, fontWeight:800, lineHeight:1.1 }}>{fmt(Math.round(total2026))}</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginTop:6 }}>
          <CommMini label="Online golf commission" value={fmt(Math.round(commissionOnline))} color={ACCENT} />
          <CommMini label="Office golf commission" value={fmt(Math.round(commissionOffice))} color={ACCENT} />
          <CommMini label="Booking fees collected" value={fmt(Math.round(bookingFees))}      color={ACCENT} />
        </div>
      </div>

      <CommissionSlider
        label="Commission % — Online golf sales"
        subtitle="Applied to online GOLF ticket sales only. Pool tables, pool tournaments, brunches, drink add-ons and seasonal specials are venue-managed — no Plonk Golf commission on those."
        value={commissionOnlinePct}
        onChange={setCommissionOnlinePct}
        accent={ACCENT}
        max={30}
        defaultValue={10}
        golfRev={onlineGolfRev}
        nonGolfRev={onlineNonGolfRev}
      />

      <CommissionSlider
        label="Commission % — Office golf sales (if Plonk Golf provides bookings manager)"
        subtitle="Conditional scenario: if Plonk Golf provides a bookings manager for the venue, it earns a commission on office/till-settled golf sales. Set to 0% to model venue-handles-own-bookings."
        value={commissionOfficePct}
        onChange={setCommissionOfficePct}
        accent={ACCENT}
        max={30}
        defaultValue={10}
        golfRev={officeGolfRev}
        nonGolfRev={officeNonGolfRev}
      />

      <BookingFeeSlider
        value={bookingFeePct}
        onChange={setBookingFeePct}
        accent={ACCENT}
        onlineGrossAll={onlineGrossAll}
      />
    </div>
  )
}

function CommissionSlider({ label, subtitle, value, onChange, accent, max, defaultValue, golfRev, nonGolfRev }) {
  const commission = golfRev * (value / 100)
  return (
    <div style={{ background:'var(--ink-2)', border:`1px solid ${accent}60`, borderRadius:10, padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4, gap:12, flexWrap:'wrap' }}>
        <div style={{ fontSize:11, color:accent, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>{label}</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:18, color:accent, fontWeight:700 }}>{value}%</div>
          <button
            onClick={() => onChange(defaultValue)}
            title={`Reset to ${defaultValue}%`}
            style={{ padding:'2px 9px', fontSize:10, borderRadius:4, cursor:'pointer', background:'transparent', border:`1px solid ${accent}55`, color:'var(--cream-dim)', letterSpacing:'0.04em', textTransform:'uppercase' }}
          >Reset</button>
        </div>
      </div>
      <div style={{ fontSize:12, color:'var(--cream-dim)', marginBottom:12, lineHeight:1.5 }}>{subtitle}</div>
      <input type="range" min={0} max={max} step={0.5} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width:'100%', accentColor:accent }} />
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--cream-dim)', marginTop:2, marginBottom:14 }}>
        <span>0%</span><span>{max}%</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
        <CommMini label="Golf revenue (commissionable)" value={fmt(Math.round(golfRev))}    color={accent} />
        <CommMini label="Non-golf (excluded)"           value={fmt(Math.round(nonGolfRev))} color="var(--cream-dim)" />
        <CommMini label={`Commission @ ${value}%`}      value={fmt(Math.round(commission))} color="var(--gold)" emphasised />
      </div>
    </div>
  )
}

function BookingFeeSlider({ value, onChange, accent, onlineGrossAll }) {
  const collected = onlineGrossAll * (value / 100)
  return (
    <div style={{ background:'var(--ink-2)', border:`1px solid ${accent}60`, borderRadius:10, padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4, gap:12, flexWrap:'wrap' }}>
        <div style={{ fontSize:11, color:accent, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>Booking fee % — applied to ALL online sales</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:18, color:accent, fontWeight:700 }}>{value}%</div>
          <button
            onClick={() => onChange(10)}
            title="Reset to 10%"
            style={{ padding:'2px 9px', fontSize:10, borderRadius:4, cursor:'pointer', background:'transparent', border:`1px solid ${accent}55`, color:'var(--cream-dim)', letterSpacing:'0.04em', textTransform:'uppercase' }}
          >Reset</button>
        </div>
      </div>
      <div style={{ fontSize:12, color:'var(--cream-dim)', marginBottom:12, lineHeight:1.5 }}>
        Customer pays ticket + this % on top at checkout. Retained by Plonk Golf as the online-funnel surcharge. Applies to ALL online SKUs (golf, pool, specials) — not till sales.
      </div>
      <input type="range" min={0} max={20} step={0.5} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width:'100%', accentColor:accent }} />
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--cream-dim)', marginTop:2, marginBottom:14 }}>
        <span>0%</span><span>20%</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8 }}>
        <CommMini label="Online gross (all SKUs)" value={fmt(Math.round(onlineGrossAll))} color="var(--cream)" />
        <CommMini label={`Booking fees @ ${value}%`} value={fmt(Math.round(collected))} color={accent} emphasised />
      </div>
    </div>
  )
}

function CommMini({ label, value, color, emphasised }) {
  return (
    <div style={{
      background: emphasised ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${emphasised ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius:8, padding:'8px 12px',
    }}>
      <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:14, color, fontWeight:700 }}>{value}</div>
    </div>
  )
}

// ─── Plonk landing — side-index layout ────────────────────────────────
// Left column = sticky section index. Right column = the active section.
// Default landing view is the Golf Operations · Transparency overview.
// Operations bundles the Revenue Split and Operational Handover blocks
// behind one section button — both speak to the new operating model so
// they read better as one tab than two.
function Operations() {
  return (
    <>
      <RevenueSplit />
      <OperationalHandover />
    </>
  )
}

// ─── Labour Balance — investor-flagged note ─────────────────────────────
// Investor raised the cost-of-labour imbalance for the golf course under
// the new structure: who pays for the ~13 hrs/week of bar-staff time
// spent opening, cleaning, testing, and closing down the course. The
// proposal codified here is a £200/week (inc VAT) settlement from Plonk
// Golf till sales to No Dice — covering 7 × 1-hr daily ops checks plus a
// 6-hr Saturday peak shift. Cross-training the cover staff as bar staff
// makes the hire efficient (one role serves both sides).
function LabourBalance() {
  const WEEKLY_INC_VAT  = 200
  const WEEKS_PER_YEAR  = 52
  const ANNUAL_INC_VAT  = WEEKLY_INC_VAT * WEEKS_PER_YEAR             // £10,400
  const ANNUAL_NET_VAT  = Math.round(ANNUAL_INC_VAT / 1.2)             // £8,667
  const VAT_PORTION     = ANNUAL_INC_VAT - ANNUAL_NET_VAT              // £1,733

  // Implied per-hour rate for the 13 hrs/week
  const HOURS_PER_WEEK  = 13
  const PER_HOUR_INC    = WEEKLY_INC_VAT / HOURS_PER_WEEK              // ≈ £15.38
  return (
    <div>
      <STitle>Labour Balance · Plonk → No Dice settlement</STitle>

      {/* Investor flag banner */}
      <div className="card" style={{ padding:18, background:'rgba(234,179,8,0.06)', border:'1px solid rgba(234,179,8,0.35)', borderLeft:'4px solid #EAB308', marginBottom:16 }}>
        <div style={{ fontSize:11, color:'#EAB308', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>Investor-flagged issue · cost of labour for the course</div>
        <div style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.7 }}>
          Under the new structure the course P&amp;L is a separately-incorporated operator (Plonk), but No Dice still hosts the course on-site. An investor flagged that the daily on-site work — opening, cleaning, testing the games, switching on lights, closing down — is being absorbed by No Dice bar staff at no charge. Without a settlement, No Dice carries the labour cost and Plonk Golf gets the operational benefit for free. The proposal below codifies a weekly transfer that balances this.
        </div>
      </div>

      {/* The proposal — three KPI hero cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14, marginBottom:16 }}>
        <GolfHeroCard
          color="#2DD4BF"
          label="Weekly settlement"
          value="£200 / wk inc VAT"
          sub="Diverted from Plonk Golf till takings to No Dice each week. Covers the on-site labour No Dice provides to keep the course operational."
        />
        <GolfHeroCard
          color="#22D3EE"
          label="Hours covered"
          value="13 hrs / wk"
          sub="1 hour every day (open / clean / test / close — 7 hrs) + a 6-hour peak Saturday shift. Implied rate ≈ £15.38 / hr inc VAT, well covering loaded staff cost."
        />
        <GolfHeroCard
          color="var(--gold)"
          label="Annualised"
          value={fmt(ANNUAL_INC_VAT) + ' / yr inc VAT'}
          sub={`= ${fmt(ANNUAL_NET_VAT)} net + ${fmt(VAT_PORTION)} VAT. Lands in No Dice as a separate revenue line; Plonk Golf books it as an operational service fee.`}
        />
      </div>

      {/* Daily / weekly schedule */}
      <div className="card" style={{ padding:20, marginBottom:16 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:12 }}>What the £200 / week buys</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          <div>
            <div style={{ fontSize:12, color:'var(--cream)', fontWeight:600, marginBottom:8 }}>Daily ops check (×7 days)</div>
            <ul style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.8, paddingLeft:18, marginTop:0 }}>
              <li>Switch on the course lights</li>
              <li>Test each hole / play through to verify holes are working</li>
              <li>Quick clean of the course (litter, balls, surfaces)</li>
              <li>Switch off &amp; close down at end of day</li>
            </ul>
            <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:8 }}>
              ≈ <strong style={{ color:'var(--cream)' }}>1 hour / day</strong> — 7 × 1 = <strong style={{ color:'var(--cream)' }}>7 hrs / week</strong>
            </div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'var(--cream)', fontWeight:600, marginBottom:8 }}>Saturday peak-day shift</div>
            <ul style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.8, paddingLeft:18, marginTop:0 }}>
              <li>Front-of-course host during the busiest day-trade window</li>
              <li>Walk-in ticket sales rung at the till</li>
              <li>Family / event party group handover &amp; turnaround</li>
              <li>Ad-hoc maintenance &amp; ball restocking</li>
            </ul>
            <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:8 }}>
              <strong style={{ color:'var(--cream)' }}>6 hrs</strong> Saturday peak — adds <strong style={{ color:'var(--cream)' }}>6 hrs / week</strong>
            </div>
          </div>
        </div>
        <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(45,212,191,0.06)', border:'1px solid rgba(45,212,191,0.25)', borderRadius:6, fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>
          <strong style={{ color:'#2DD4BF' }}>Total commitment:</strong> <strong style={{ color:'var(--cream)' }}>{HOURS_PER_WEEK} hrs / week</strong> at an implied rate of ≈ <strong style={{ color:'var(--cream)' }}>£{PER_HOUR_INC.toFixed(2)} / hr inc VAT</strong>. Comfortably covers the loaded cost of bar staff time (£13.15 base × 1.355 NIC + pension + holiday ≈ £17.82 / hr loaded) once the cross-training efficiency below is factored in.
        </div>
      </div>

      {/* Cross-training argument */}
      <div className="card" style={{ padding:20, borderLeft:'3px solid #2DD4BF' }}>
        <div style={{ fontSize:11, color:'#2DD4BF', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:12 }}>Why bar staff handle the course (efficient hire)</div>
        <div style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.7 }}>
          The hours covered by this settlement are best done by <strong style={{ color:'var(--cream)' }}>No Dice bar staff</strong>, not a dedicated Golf Host headcount. Bar staff are already on-site for the bar shift; the daily 1-hour ops check and Saturday cover sit cleanly inside their schedule. One person covers <strong style={{ color:'var(--cream)' }}>both sides of the business</strong> — bar service + course host — making the hire materially more efficient than two part-time roles split across a small footprint.
          <br /><br />
          Result: Plonk Golf gets reliable on-site labour at a fixed weekly cost; No Dice converts spare bar-staff capacity into a recurring £10.4k / yr line; the customer experience stays seamless because the same person who pours their drink also opens up their golf round.
        </div>
      </div>
    </div>
  )
}

const PLONK_SECTIONS = [
  { key: 'overview',    label: 'Transparency · Overview', Component: GolfOverview },
  { key: 'pnl',         label: '2025 Golf P&L',           Component: GolfPnl },
  { key: 'hosts',       label: 'Golf Hosts',              Component: GolfHosts },
  { key: 'labour',      label: 'Labour Balance',          Component: LabourBalance },
  { key: 'till',        label: 'Walk-In Till Revenue',    Component: TillRevenue },
  { key: 'dmn',         label: 'Online Ticket Sales',     Component: DmnSkuBreakdown },
  { key: 'commissions', label: 'Plonk Commissions',       Component: PlonkCommissions },
  { key: 'operations',  label: 'Operations',              Component: Operations },
]

export default function Plonk() {
  const [active, setActive] = React.useState('overview')
  const current = PLONK_SECTIONS.find(s => s.key === active) || PLONK_SECTIONS[0]
  const Active = current.Component
  return (
    <div style={{ minHeight:'100%', background:'var(--ink)', color:'var(--cream)' }}>
      <div style={{
        display:'grid', gridTemplateColumns:'220px 1fr',
        gap:28, padding:'24px 32px', fontSize:13,
        alignItems:'start',
      }}>
        {/* Sticky left index */}
        <nav style={{
          position:'sticky', top:16, alignSelf:'start',
          display:'flex', flexDirection:'column', gap:4,
        }}>
          <div style={{
            fontSize:10, color:'var(--gold-dim)', letterSpacing:'0.12em',
            textTransform:'uppercase', fontWeight:600, padding:'6px 12px 10px',
          }}>
            Sections
          </div>
          {PLONK_SECTIONS.map(s => {
            const isActive = s.key === active
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                style={{
                  textAlign:'left',
                  padding:'10px 14px',
                  fontSize:12.5,
                  borderRadius:8,
                  cursor:'pointer',
                  background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                  border:`1px solid ${isActive ? 'rgba(201,168,76,0.4)' : 'transparent'}`,
                  color: isActive ? 'var(--gold)' : 'var(--cream-dim)',
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing:'0.02em',
                  transition:'all 0.15s',
                }}
              >
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* Active section */}
        <div style={{ minWidth:0, display:'flex', flexDirection:'column', gap:28 }}>
          <Active />
        </div>
      </div>
    </div>
  )
}
