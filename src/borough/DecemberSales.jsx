import React from 'react'
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import data from '../data/decemberSales.json'

// ─── Founder-only December sales dashboard ───────────────────────────────
// Reachable at /borough/december-sales (gated to the founder/Plonk tier in
// App.jsx). Reads the pre-computed POS export summary from
// src/data/decemberSales.json — see that file's `source` field for lineage.
//
// Figure conventions (mirrors the POS export semantics):
//   • Headline "Net sales" = every transaction line netted together — SALE
//     lines plus the corrections, voids, refunds and comps that reverse them.
//     This is the true till takings for the month.
//   • Gross item sales = SALE lines only, before any reversal — shown as
//     context, not the headline.
//   • The category / staff / day charts use the same NET basis so they sum
//     back to the headline. The hourly chart uses gross SALE only, because
//     end-of-night correction batches post at 23:00 and would otherwise
//     show a phantom negative hour.

const GOLD = '#C9A84C'
const TEAL = '#4FD1C5'
const CREAM = '#EFE7D2'
const DIM = '#9A8F73'
const PIE_COLORS = [GOLD, TEAL, '#6FA8DC', '#C0845C', '#B07CC6']

const money = (v) =>
  '£' + Math.round(v).toLocaleString('en-GB')
const moneyP = (v) =>
  '£' + v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtK = (v) => (Math.abs(v) >= 1000 ? '£' + (v / 1000).toFixed(0) + 'k' : '£' + v)

const tooltipStyle = {
  contentStyle: { background: 'var(--ink-3)', border: '1px solid var(--gold-dim)', borderRadius: 8, color: 'var(--cream)' },
  labelStyle: { color: 'var(--cream)', fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: 'var(--cream)' },
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABEL = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

// ─── Small building blocks ───────────────────────────────────────────────
function Kpi({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cream-dim)' }}>{label}</div>
      <div className="stat-number serif" style={{ fontSize: 30, color: accent || 'var(--gold)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{sub}</div>}
    </div>
  )
}

function ChartCard({ title, hint, height = 280, children }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="serif" style={{ fontSize: 16, color: 'var(--gold)', marginBottom: hint ? 2 : 10 }}>{title}</div>
      {hint && <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 12 }}>{hint}</div>}
      <div style={{ height }}>{children}</div>
    </div>
  )
}

// ─── Calendar heatmap ────────────────────────────────────────────────────
function Calendar({ daily }) {
  const max = Math.max(...daily.map((d) => d.net), 1)
  const lead = daily.length ? daily[0].dow : 0 // Mon=0 offset for Dec 1
  const cells = [...Array(lead).fill(null), ...daily]
  const shade = (net) => {
    if (net <= 0.5) return 'rgba(255,255,255,0.03)'
    const t = net / max
    // gold ramp, alpha 0.12 → 0.9
    return `rgba(201,168,76,${(0.12 + t * 0.78).toFixed(3)})`
  }
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="serif" style={{ fontSize: 16, color: 'var(--gold)', marginBottom: 2 }}>December at a glance</div>
      <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 14 }}>
        Each tile = one trading day, shaded by net takings. Blank tiles = closed / no sales.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {DOW_LABELS.map((d) => (
          <div key={d} style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--cream-dim)', textAlign: 'center', paddingBottom: 2 }}>{d}</div>
        ))}
        {cells.map((c, i) =>
          c == null ? (
            <div key={'pad' + i} />
          ) : (
            <div
              key={c.date}
              title={`${MONTH_LABEL(c.date)} — ${moneyP(c.net)}`}
              style={{
                aspectRatio: '1 / 1', borderRadius: 8, background: shade(c.net),
                border: '1px solid rgba(201,168,76,0.12)', padding: 6,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: 10, color: c.net / max > 0.55 ? 'var(--ink)' : 'var(--cream-dim)', fontWeight: 600 }}>{c.day}</div>
              <div style={{ fontSize: 10, color: c.net <= 0.5 ? 'var(--ink-3)' : (c.net / max > 0.55 ? 'var(--ink)' : 'var(--cream)'), fontWeight: 600, textAlign: 'right' }}>
                {c.net <= 0.5 ? '—' : (c.net >= 1000 ? '£' + (c.net / 1000).toFixed(1) + 'k' : '£' + Math.round(c.net))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

// ─── Donut ───────────────────────────────────────────────────────────────
function Donut({ rows, total }) {
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%"
          innerRadius="58%" outerRadius="82%" paddingAngle={2} stroke="none">
          {rows.map((r, i) => <Cell key={r.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip {...tooltipStyle}
          formatter={(v, n) => [`${moneyP(v)} · ${Math.round((v / total) * 100)}%`, n]} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'var(--cream-dim)' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default function DecemberSales() {
  const h = data.headline
  const groupTotal = data.group.reduce((s, r) => s + r.value, 0)
  const profileTotal = data.profile.reduce((s, r) => s + r.value, 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 6 }}>
              {data.venue} · Founder report
            </div>
            <h1 className="serif" style={{ fontSize: 40, margin: 0, color: 'var(--cream)' }}>
              {data.period} sales summary
            </h1>
          </div>
          <a href="/borough" style={{ fontSize: 11, color: 'var(--cream-dim)', letterSpacing: '0.14em', textDecoration: 'none', whiteSpace: 'nowrap', marginTop: 8 }}>
            ← back to deck
          </a>
        </div>
        <div className="gold-rule" style={{ margin: '14px 0 8px' }} />
        <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 24 }}>{data.source}</div>

        {/* Headline KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
          <Kpi label="Net sales (incl VAT)" value={money(h.netInclVat)} sub={`${moneyP(h.netInclVat)} total till takings`} />
          <Kpi label="Net of VAT" value={money(h.netExVat)} sub={`${money(h.vat)} VAT collected`} accent={TEAL} />
          <Kpi label="Transactions" value={h.transactions.toLocaleString('en-GB')} sub="tabs / orders opened" />
          <Kpi label="Avg spend / tab" value={moneyP(h.avgSpend)} sub="net incl VAT" />
          <Kpi label="Items sold" value={h.itemsSold.toLocaleString('en-GB')} sub="line items across the month" />
          <Kpi label="Avg / trading day" value={money(h.avgPerTradingDay)} sub={`over ${h.tradingDays} trading days`} />
        </div>

        {/* Context chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
          {[
            ['Busiest day', `${MONTH_LABEL(h.busiestDay)} · ${money(h.busiestDayNet)}`],
            ['Top seller', `${h.topItem} · ${h.topItemQty} sold`],
            ['Gross item sales', `${money(h.grossSale)} before reversals`],
            ['Comps', money(h.comps)],
            ['Voids', money(h.voids)],
            ['Corrections', money(h.corrections)],
          ].map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 999, padding: '7px 14px', fontSize: 12 }}>
              <span style={{ color: 'var(--cream-dim)' }}>{k}: </span>
              <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div style={{ marginBottom: 16 }}>
          <Calendar daily={data.daily} />
        </div>

        {/* Daily trend */}
        <div style={{ marginBottom: 16 }}>
          <ChartCard title="Daily net takings" hint="Net till takings by trading day across December.">
            <ResponsiveContainer>
              <AreaChart data={data.daily.filter((d) => d.net > 0.5)} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke={DIM} fontSize={11} tickLine={false} />
                <YAxis tickFormatter={fmtK} stroke={DIM} fontSize={11} tickLine={false} />
                <Tooltip {...tooltipStyle}
                  labelFormatter={(d) => `December ${d}`}
                  formatter={(v) => [moneyP(v), 'Net takings']} />
                <Area type="monotone" dataKey="net" stroke={GOLD} strokeWidth={2} fill="url(#dailyFill)" dot={{ r: 2, fill: GOLD }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Donuts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
          <ChartCard title="Sales by category" hint="Net takings split across the till's product groups." height={260}>
            <Donut rows={data.group} total={groupTotal} />
          </ChartCard>
          <ChartCard title="Bar vs table service" hint="Where the money was rung through." height={260}>
            <Donut rows={data.profile} total={profileTotal} />
          </ChartCard>
        </div>

        {/* Top items + staff */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
          <ChartCard title="Top sellers" hint="Highest-grossing items (gross sales)." height={340}>
            <ResponsiveContainer>
              <BarChart data={data.items} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="rgba(201,168,76,0.08)" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtK} stroke={DIM} fontSize={10} tickLine={false} />
                <YAxis type="category" dataKey="name" width={140} stroke={DIM} fontSize={10} tickLine={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(201,168,76,0.06)' }}
                  formatter={(v, n, p) => [`${moneyP(v)} · ${p.payload.qty} sold`, 'Sales']} />
                <Bar dataKey="value" fill={GOLD} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Sales by staff member" hint="Net takings rung through per team member." height={340}>
            <ResponsiveContainer>
              <BarChart data={data.staff} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="rgba(201,168,76,0.08)" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtK} stroke={DIM} fontSize={10} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} stroke={DIM} fontSize={11} tickLine={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(79,209,197,0.06)' }}
                  formatter={(v) => [moneyP(v), 'Net takings']} />
                <Bar dataKey="value" fill={TEAL} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Hour + day-of-week */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <ChartCard title="Trade by hour" hint="Gross sales by hour of day — when the venue earns." height={260}>
            <ResponsiveContainer>
              <BarChart data={data.hours} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
                <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
                <XAxis dataKey="hour" tickFormatter={(hh) => `${hh}:00`} stroke={DIM} fontSize={10} tickLine={false} />
                <YAxis tickFormatter={fmtK} stroke={DIM} fontSize={11} tickLine={false} />
                <Tooltip {...tooltipStyle}
                  labelFormatter={(hh) => `${hh}:00 – ${hh + 1}:00`}
                  formatter={(v) => [moneyP(v), 'Gross sales']} />
                <Bar dataKey="value" fill={GOLD} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Average day-of-week" hint="Average net takings per day, by weekday." height={260}>
            <ResponsiveContainer>
              <BarChart data={data.dow} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
                <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke={DIM} fontSize={11} tickLine={false} />
                <YAxis tickFormatter={fmtK} stroke={DIM} fontSize={11} tickLine={false} />
                <Tooltip {...tooltipStyle}
                  formatter={(v, n, p) => [`${moneyP(v)} avg · ${p.payload.days} days`, p.payload.name]} />
                <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
                  {data.dow.map((d, i) => (
                    <Cell key={d.name} fill={i >= 3 && i <= 5 ? GOLD : 'rgba(201,168,76,0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div style={{ fontSize: 10, color: 'var(--gold-dim)', marginTop: 32, textAlign: 'center', letterSpacing: '0.08em' }}>
          Founder-only · figures derived from the raw POS transaction export · not VAT-filed numbers
        </div>
      </div>
    </div>
  )
}
