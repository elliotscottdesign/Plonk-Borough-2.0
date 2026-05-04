import React from 'react'
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
function GolfHostSeasonality() {
  const data    = HACKNEY_GOLF_HOST_2025_MONTHLY
  const totals  = HACKNEY_GOLF_HOST_2025_TOTALS
  const tillData = HACKNEY_GOLF_TILL_2025_MONTHLY
  const tillTotal = tillData.reduce((s, m) => s + m.revenue, 0)
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
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:14 }}>
        <SeasonTile label="Total shifts"        value={totals.shifts.toString()}         sub="Dedicated Golf Host shifts" />
        <SeasonTile label="Total hours"         value={totals.hours.toFixed(1) + ' hrs'} sub={`Avg ${(totals.hours / totals.shifts).toFixed(1)} hrs/shift`} />
        <SeasonTile label="Active vs dark"      value={`${totals.activeMonths} / ${totals.darkMonths}`} sub="Months host was rota'd / not" />
      </div>

      {/* Walk-in (till) golf ticket revenue — separate chart with its own section header */}
      <div style={{ marginTop:32, marginBottom:14 }}>
        <STitle>Walk-In (Till) Golf Ticket Revenue · 2025</STitle>
        <p style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6, marginBottom:0 }}>
          Source: Weekly Merged 2024-2026 sheet, row 3 (<strong style={{ color:'var(--cream)' }}>Total Walk In Golf Tickets</strong>), 52 weeks of 2025 aggregated. Total <strong style={{ color:'var(--gold)' }}>{fmt(tillTotal)}</strong>. Note: till sales ran every month — even when the rota had zero Golf Host shifts. Walk-in tickets were being rung up by bar staff / supervisors at the bar till regardless of whether a dedicated host was scheduled.
        </p>
      </div>

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

// ─── Plonk landing — side-index layout ────────────────────────────────
// Left column = sticky section index. Right column = the active section.
// Default landing view is the Golf Operations · Transparency overview.
const PLONK_SECTIONS = [
  { key: 'overview', label: 'Transparency · Overview', Component: GolfOverview },
  { key: 'pnl',      label: '2025 Golf P&L',           Component: GolfPnl },
  { key: 'host',     label: 'Host & Till Activity',    Component: GolfHostSeasonality },
  { key: 'dmn',      label: 'Online Ticket Sales',     Component: DmnSkuBreakdown },
  { key: 'split',    label: 'Revenue Split',           Component: RevenueSplit },
  { key: 'handover', label: 'Operational Handover',    Component: OperationalHandover },
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
