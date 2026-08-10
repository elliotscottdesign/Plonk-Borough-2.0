import React, { useEffect, useMemo, useState } from 'react'
import { rotaLoad } from '../../rota/api.js'
import { workedMins, hoursLabel } from '../../rota/shifts.js'
import { ASOF, PNL, INCOME_CHANNELS, SPEND_CATEGORIES, TILL, VAT } from '../../finance/overviewData.js'

// ─── Finances (FOUNDER ONLY — registered founderOnly:true in OpsApp) ─────────
// Senior-management money view, hidden from team-tier (NDTEAM) logins.
// Laid out like the Hackney investor deck's Performance tab: a left-hand
// section index + one section at a time on the right. Sections:
//   overview — top-line cards from the reconciled Xero books
//   income   — where the money came in (channels donut + till months)
//   spends   — segregated spend by category (donut + list)
//   till     — what actually sells (categories, weekdays, top products)
//   vat      — the £90k registration tracker
//   wages    — LIVE wage bill from clock-ins × rates (was slice 1)
// All money numbers except Wages come from the snapshot in
// src/finance/overviewData.js — ask Claude (finance lane) to refresh it.

const GOLD = 'var(--gold)', CREAM = 'var(--cream)', DIM = 'var(--cream-dim)'
const CARD = { background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '16px 18px' }

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (ds, n) => { const d = new Date(ds + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const mondayOf = (ds) => addDays(ds, -((new Date(ds + 'T00:00:00Z').getUTCDay() + 6) % 7))
const monthStart = (ds) => ds.slice(0, 8) + '01'
const gbp = (n) => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const gbp0 = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// ─── Section index (mirrors the deck's Sidebar TOC) ──────────────────────────
const SECTIONS = [
  { id: 'overview', label: 'Top-Line Actuals', icon: '📊' },
  { id: 'income',   label: 'Money In',         icon: '💰' },
  { id: 'spends',   label: 'Spend by Category', icon: '💸' },
  { id: 'till',     label: 'Till Sales',       icon: '🍺' },
  { id: 'vat',      label: 'VAT Tracker',      icon: '🧾' },
  { id: 'wages',    label: 'Wage Bill (live)', icon: '👥' },
]

function SidebarTOC({ active, onChange }) {
  return (
    <div style={{ position: 'sticky', top: 16, background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 8 }}>
      <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 8px 10px' }}>Finances · Index</div>
      {SECTIONS.map(s => {
        const isActive = active === s.id
        return (
          <button key={s.id} onClick={() => onChange(s.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', marginBottom: 4,
            background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
            border: isActive ? '1px solid rgba(201,168,76,0.35)' : '1px solid transparent',
            borderRadius: 6, color: isActive ? GOLD : CREAM, fontSize: 12, fontWeight: isActive ? 700 : 500,
            cursor: 'pointer', textAlign: 'left', letterSpacing: '0.04em', transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 14, opacity: 0.85 }}>{s.icon}</span>
            <span style={{ flex: 1 }}>{s.label}</span>
            {isActive && <span style={{ color: GOLD, fontSize: 10 }}>●</span>}
          </button>
        )
      })}
    </div>
  )
}

function STitle({ children }) {
  return <div className="serif" style={{ fontSize: 20, color: CREAM, marginBottom: 14, lineHeight: 1.25 }}>{children}</div>
}

// ─── DonutWithLegend — same geometry as the deck's version ──────────────────
function DonutWithLegend({ rows, total, eyebrow, centreLabel = 'Total' }) {
  const data = rows.map(r => ({ ...r, share: total ? (Math.abs(r.amount) / Math.abs(total)) * 100 : 0 }))
  const absTotal = rows.reduce((s, r) => s + Math.max(0, r.amount), 0)
  const R_OUT = 90, R_IN = 56, CX = 110, CY = 110
  let cumAngle = -Math.PI / 2
  const arcs = data.filter(d => d.amount > 0).map((d) => {
    const frac = absTotal > 0 ? d.amount / absTotal : 0
    const start = cumAngle, end = cumAngle + frac * Math.PI * 2
    cumAngle = end
    const large = end - start > Math.PI ? 1 : 0
    const sx = CX + R_OUT * Math.cos(start), sy = CY + R_OUT * Math.sin(start)
    const ex = CX + R_OUT * Math.cos(end), ey = CY + R_OUT * Math.sin(end)
    const sxi = CX + R_IN * Math.cos(end), syi = CY + R_IN * Math.sin(end)
    const exi = CX + R_IN * Math.cos(start), eyi = CY + R_IN * Math.sin(start)
    return { d: `M ${sx} ${sy} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${ex} ${ey} L ${sxi} ${syi} A ${R_IN} ${R_IN} 0 ${large} 0 ${exi} ${eyi} Z`, color: d.color, row: d }
  })
  return (
    <div style={{ ...CARD }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: DIM }}>{eyebrow}</span>
        <span style={{ fontSize: 13, color: GOLD, fontVariantNumeric: 'tabular-nums' }}>{gbp0(total)} total</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 200px) 1fr', gap: 24, alignItems: 'center' }}>
        <svg viewBox="0 0 220 220" style={{ width: '100%', height: 'auto' }}>
          {arcs.map((a, i) => (
            <path key={i} d={a.d} fill={a.color} stroke="var(--ink-2)" strokeWidth="1.5">
              <title>{`${a.row.name} · ${gbp0(a.row.amount)} (${a.row.share.toFixed(1)}%)`}</title>
            </path>
          ))}
          <text x="110" y="103" textAnchor="middle" fontSize="10" fill="var(--cream-dim)" letterSpacing="0.1em">{centreLabel.toUpperCase()}</text>
          <text x="110" y="124" textAnchor="middle" fontSize="17" fill="var(--cream)" fontWeight="700" fontFamily="DM Serif Display, serif">{gbp0(total)}</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {data.map(r => (
            <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '1fr 84px 46px', gap: 10, alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
              <span style={{ color: CREAM, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
              </span>
              <span style={{ color: CREAM, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{gbp0(r.amount)}</span>
              <span style={{ color: GOLD, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.share.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Simple vertical bar chart (monthly till / weekday split) ───────────────
function Bars({ rows, eyebrow, barColor = '#4FC3F7' }) {
  const max = Math.max(...rows.map(r => r.value), 1)
  return (
    <div style={{ ...CARD }}>
      {eyebrow && <div style={{ fontSize: 11, color: DIM, marginBottom: 14 }}>{eyebrow}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150 }}>
        {rows.map(r => (
          <div key={r.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: CREAM, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{gbp0(r.value)}</div>
            <div style={{ width: '100%', maxWidth: 54, height: Math.max(4, (r.value / max) * 110), background: barColor, borderRadius: '3px 3px 0 0', opacity: 0.9 }} title={`${r.label} · ${gbp0(r.value)}`} />
            <div style={{ fontSize: 10, color: DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{r.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Top-line cards (deck style) ────────────────────────────────────────────
function TopLineCards() {
  const cards = [
    { label: 'Income (banked)', value: PNL.income, colour: '#4FC3F7' },
    { label: 'Stock & staff (CoS)', value: PNL.costOfSales, colour: '#E67E22' },
    { label: 'Overheads', value: PNL.overheads, colour: '#F87171' },
    { label: 'Net position', value: PNL.netPosition, colour: '#10B981', sub: 'before PAYE, pensions & director pay' },
    { label: 'Till gross (to 6 Aug)', value: TILL.total, colour: '#A78BFA', sub: `${TILL.tradingDays} trading days` },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
      {cards.map(c => (
        <div key={c.label} style={{ ...CARD, padding: 14 }}>
          <div style={{ fontSize: 10, color: DIM, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{c.label}</div>
          <div className="serif" style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)', color: c.colour, lineHeight: 1 }}>{gbp0(c.value)}</div>
          {c.sub && <div style={{ fontSize: 10, color: DIM, marginTop: 6 }}>{c.sub}</div>}
        </div>
      ))}
    </div>
  )
}

// ─── VAT tracker ────────────────────────────────────────────────────────────
function VatTracker() {
  const pct = Math.min(100, (VAT.turnoverAtTillDate / VAT.threshold) * 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...CARD }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: CREAM }}>Progress to the £90,000 registration threshold</div>
          <div style={{ fontSize: 12, color: DIM }}>gross taxable turnover since opening · at {ASOF.till}</div>
        </div>
        <div style={{ margin: '14px 0 6px', background: 'rgba(255,255,255,0.07)', borderRadius: 999, height: 18, overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct > 95 ? '#F87171' : GOLD, borderRadius: 999, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: DIM }}>
          <span><strong style={{ color: pct > 95 ? '#F87171' : GOLD }}>{gbp0(VAT.turnoverAtTillDate)}</strong> ({pct.toFixed(0)}%)</span>
          <span>{gbp0(VAT.threshold)}</span>
        </div>
        <div style={{ fontSize: 12.5, color: CREAM, marginTop: 12, lineHeight: 1.6 }}>
          On current pace the line was crossed in the <strong>{VAT.crossedEstimate}</strong>. Crossing in August means:
          tell HMRC by <strong style={{ color: GOLD }}>{VAT.notifyBy}</strong>, charge VAT from <strong style={{ color: GOLD }}>{VAT.effectiveFrom}</strong>.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {[
          ['📞 Accountant call', 'Registration timing, the fit-out VAT reclaim (money back), and menu pricing from 1 October.'],
          ['🧾 Receipts check', 'Till receipts must not display VAT until registration is live — check a printed receipt.'],
          ['📊 Gross vs banked', 'The threshold counts gross takings before card fees — this tracker uses grossed-up processor figures, not the bank.'],
        ].map(([t, b]) => (
          <div key={t} style={{ ...CARD }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: CREAM }}>{t}</div>
            <div style={{ fontSize: 12, color: DIM, marginTop: 5, lineHeight: 1.5 }}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Till section ───────────────────────────────────────────────────────────
function TillSection() {
  const catTotal = TILL.categories.reduce((s, c) => s + c.amount, 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <DonutWithLegend
        rows={TILL.categories}
        total={catTotal}
        eyebrow={`What sells · Lightspeed line transactions · ${ASOF.opened} – ${ASOF.till}`}
        centreLabel="Till sales"
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <Bars eyebrow="Till gross by month" rows={TILL.monthly.map(m => ({ label: m.label, value: m.gross }))} />
        <Bars eyebrow="Till gross by weekday — Sat is 40% of the week" rows={TILL.weekday.map(w => ({ label: w.day, value: w.gross }))} barColor="#C084FC" />
      </div>
      <div style={{ ...CARD, overflowX: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: CREAM, marginBottom: 10 }}>Top products</div>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12.5, minWidth: 420 }}>
          <thead>
            <tr>{['#', 'Product', 'Sold', 'Gross', 'Share'].map(h => (
              <th key={h} style={{ textAlign: h === 'Product' ? 'left' : 'right', padding: '6px 8px', color: DIM, fontWeight: 600, borderBottom: '1px solid rgba(201,168,76,0.25)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {TILL.topItems.map((r, i) => (
              <tr key={r.name}>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: DIM }}>{i + 1}</td>
                <td style={{ padding: '7px 8px', color: CREAM, fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: CREAM }}>{r.qty.toLocaleString('en-GB')}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: GOLD, fontWeight: 700 }}>{gbp0(r.value)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: DIM }}>{((r.value / TILL.total) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 11.5, color: DIM, marginTop: 10, lineHeight: 1.5 }}>
          Camden Hells alone is ~31% of everything sold. {TILL.keyedSalesNote && <>Note: sales keyed straight into the card machine never reach the till data — ring everything through the POS (add a “Misc sale” button) to keep this section honest.</>}
        </div>
      </div>
    </div>
  )
}

// ─── Live wage bill (original slice 1, unchanged logic) ─────────────────────
function periods(todayStr) {
  const wk = mondayOf(todayStr)
  const mo = monthStart(todayStr)
  const lastMoEnd = addDays(mo, -1)
  return [
    { key: 'thisweek', label: 'This week', from: wk, to: todayStr },
    { key: 'lastweek', label: 'Last week', from: addDays(wk, -7), to: addDays(wk, -1) },
    { key: 'thismonth', label: 'This month', from: mo, to: todayStr },
    { key: 'lastmonth', label: 'Last month', from: monthStart(lastMoEnd), to: lastMoEnd },
  ]
}

function WagesLive() {
  const [staff, setStaff] = useState([])
  const [clocks, setClocks] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [periodKey, setPeriodKey] = useState('thisweek')

  useEffect(() => {
    rotaLoad()
      .then(r => { setStaff(r.staff || []); setClocks(r.clocks || []) })
      .catch(e => setErr(e.message || 'Could not load'))
      .finally(() => setLoading(false))
  }, [])

  const todayStr = iso(new Date())
  const PERIODS = useMemo(() => periods(todayStr), [todayStr])
  const period = PERIODS.find(p => p.key === periodKey) || PERIODS[0]

  const tally = useMemo(() => {
    const byStaff = {}
    for (const s of staff) byStaff[s.id] = { staff: s, mins: 0, cost: 0, shifts: 0, autoOut: 0 }
    const windows = {}
    for (const p of PERIODS) windows[p.key] = { mins: 0, cost: 0, unrated: 0 }
    for (const c of clocks) {
      if (!c.clock_in || !c.clock_out || !c.date) continue
      const mins = workedMins(c.clock_in, c.clock_out)
      if (!mins) continue
      const s = byStaff[c.staff_id]
      const rate = s ? Number(s.staff.hourly_rate) : NaN
      const rated = Number.isFinite(rate) && rate > 0
      for (const p of PERIODS) {
        if (c.date < p.from || c.date > p.to) continue
        windows[p.key].mins += mins
        if (rated) windows[p.key].cost += (mins / 60) * rate
        else windows[p.key].unrated += mins
        if (p.key === periodKey && s) {
          s.mins += mins; s.shifts += 1
          if (rated) s.cost += (mins / 60) * rate
          if (c.auto_out) s.autoOut += 1
        }
      }
    }
    const rows = Object.values(byStaff).filter(r => r.mins > 0).sort((a, b) => b.cost - a.cost || b.mins - a.mins)
    return { windows, rows }
  }, [staff, clocks, PERIODS, periodKey])

  if (loading) return <div style={{ padding: 24, color: DIM, fontSize: 13 }}>Loading the wage picture…</div>
  if (err) return <div style={{ padding: 24, color: '#F87171', fontSize: 13 }}>{err}</div>

  const totalRow = tally.rows.reduce((a, r) => ({ mins: a.mins + r.mins, cost: a.cost + r.cost }), { mins: 0, cost: 0 })
  const anyUnrated = tally.rows.some(r => !(Number(r.staff.hourly_rate) > 0))
  const anyAuto = tally.rows.some(r => r.autoOut > 0)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 18 }}>
        {PERIODS.map(p => {
          const w = tally.windows[p.key]
          const active = p.key === periodKey
          return (
            <button key={p.key} onClick={() => setPeriodKey(p.key)} style={{ ...CARD, textAlign: 'left', cursor: 'pointer', borderColor: active ? GOLD : 'rgba(201,168,76,0.2)', background: active ? 'rgba(201,168,76,0.08)' : 'var(--ink-2)' }}>
              <div style={{ fontSize: 11, color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{p.label}</div>
              <div className="serif" style={{ fontSize: 24, color: active ? GOLD : CREAM, margin: '4px 0 2px' }}>{gbp(w.cost)}</div>
              <div style={{ fontSize: 11.5, color: DIM }}>{hoursLabel(w.mins)} clocked{w.unrated ? ` · ${hoursLabel(w.unrated)} salaried` : ''}</div>
            </button>
          )
        })}
      </div>
      <div style={{ ...CARD, overflowX: 'auto' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: CREAM, marginBottom: 10 }}>Who earned what — {period.label.toLowerCase()} <span style={{ color: DIM, fontWeight: 400, fontSize: 12 }}>({period.from} → {period.to})</span></div>
        {tally.rows.length === 0 ? (
          <div style={{ fontSize: 12.5, color: DIM }}>No completed clock records in this window yet.</div>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12.5, minWidth: 480 }}>
            <thead>
              <tr>{['Name', 'Role', 'Shifts', 'Hours', 'Rate', 'Cost'].map(h => <th key={h} style={{ textAlign: h === 'Name' || h === 'Role' ? 'left' : 'right', padding: '6px 8px', color: DIM, fontWeight: 600, borderBottom: '1px solid rgba(201,168,76,0.25)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {tally.rows.map(r => {
                const rate = Number(r.staff.hourly_rate)
                const rated = Number.isFinite(rate) && rate > 0
                return (
                  <tr key={r.staff.id}>
                    <td style={{ padding: '7px 8px', color: CREAM, fontWeight: 600, whiteSpace: 'nowrap' }}>{(r.staff.name || 'Unnamed')}{r.autoOut > 0 && <span title={`${r.autoOut} shift(s) auto-signed-out — adjust in Staff Rota`} style={{ marginLeft: 6, fontSize: 11 }}>⏰</span>}</td>
                    <td style={{ padding: '7px 8px', color: DIM, whiteSpace: 'nowrap' }}>{r.staff.role || '—'}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: CREAM }}>{r.shifts}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: CREAM, whiteSpace: 'nowrap' }}>{hoursLabel(r.mins)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: rated ? CREAM : DIM, whiteSpace: 'nowrap' }}>{rated ? gbp(rate) + '/h' : 'salaried'}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: rated ? GOLD : DIM, fontWeight: 700, whiteSpace: 'nowrap' }}>{rated ? gbp(r.cost) : '—'}</td>
                  </tr>
                )
              })}
              <tr>
                <td colSpan={3} style={{ padding: '9px 8px', color: DIM, borderTop: '1px solid rgba(201,168,76,0.25)' }}>Total (hourly staff)</td>
                <td style={{ padding: '9px 8px', textAlign: 'right', color: CREAM, fontWeight: 700, borderTop: '1px solid rgba(201,168,76,0.25)', whiteSpace: 'nowrap' }}>{hoursLabel(totalRow.mins)}</td>
                <td style={{ borderTop: '1px solid rgba(201,168,76,0.25)' }} />
                <td style={{ padding: '9px 8px', textAlign: 'right', color: GOLD, fontWeight: 800, borderTop: '1px solid rgba(201,168,76,0.25)', whiteSpace: 'nowrap' }}>{gbp(totalRow.cost)}</td>
              </tr>
            </tbody>
          </table>
        )}
        {(anyUnrated || anyAuto) && (
          <div style={{ fontSize: 11.5, color: DIM, marginTop: 10, lineHeight: 1.5 }}>
            {anyUnrated && <>“Salaried” = no hourly rate set on their profile (set one in Staff Rota → Team → Edit → Pay &amp; hours to include them here). </>}
            {anyAuto && <>⏰ = includes an auto-signed-out shift (forgot to clock out) — the hours are an estimate until you adjust them in Staff Rota.</>}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function Finances() {
  const [section, setSection] = useState('overview')
  const incomeTotal = INCOME_CHANNELS.reduce((s, r) => s + r.amount, 0)
  const spendTotal = SPEND_CATEGORIES.reduce((s, r) => s + r.amount, 0)

  return (
    <div style={{ padding: '20px max(16px, env(safe-area-inset-right)) 40px max(16px, env(safe-area-inset-left))', maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div className="serif" style={{ fontSize: 24, color: GOLD }}>💷 Finances</div>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', background: GOLD, borderRadius: 999, padding: '3px 10px' }}>Founder only</div>
      </div>
      <div style={{ fontSize: 12.5, color: DIM, margin: '6px 0 18px', lineHeight: 1.5 }}>
        The money picture since opening ({ASOF.opened}). Books reconciled to <strong style={{ color: CREAM }}>{ASOF.books}</strong>; till data to <strong style={{ color: CREAM }}>{ASOF.till}</strong>. Wage Bill is live; everything else refreshes when Claude updates the snapshot — automatic once the till→Xero sync (Omniboost) is on.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 200px) 1fr', gap: 16, alignItems: 'flex-start' }}>
        <SidebarTOC active={section} onChange={setSection} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {section === 'overview' && (
            <>
              <STitle>Top-Line Actuals — since opening</STitle>
              <TopLineCards />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                <Bars eyebrow="Till gross by month" rows={TILL.monthly.map(m => ({ label: m.label, value: m.gross }))} />
                <div style={{ ...CARD }}>
                  <div style={{ fontSize: 11, color: DIM, marginBottom: 10 }}>Reading the numbers</div>
                  <div style={{ fontSize: 12.5, color: CREAM, lineHeight: 1.7 }}>
                    Income is what has actually <strong>banked</strong>. Net position is before PAYE, pensions and director pay, so treat it as a healthy engine — not spendable profit. The VAT tracker says registration is due: see the <strong style={{ color: GOLD }}>VAT Tracker</strong> section.
                  </div>
                </div>
              </div>
            </>
          )}
          {section === 'income' && (
            <>
              <STitle>Money In — by channel</STitle>
              <DonutWithLegend rows={INCOME_CHANNELS} total={incomeTotal} eyebrow={`Banked income · Xero, reconciled to ${ASOF.books}`} centreLabel="Income" />
              <Bars eyebrow="Till gross by month (Lightspeed)" rows={TILL.monthly.map(m => ({ label: m.label, value: m.gross }))} />
            </>
          )}
          {section === 'spends' && (
            <>
              <STitle>Spend by Category — segregated</STitle>
              <DonutWithLegend rows={SPEND_CATEGORIES} total={spendTotal} eyebrow={`Every £ out by category · Xero books to ${ASOF.books} · excludes lease deposits & investor movements`} centreLabel="Spend" />
              <div style={{ ...CARD }}>
                <div style={{ fontSize: 12.5, color: DIM, lineHeight: 1.6 }}>
                  “General expenses” is the accountant-review bucket (storage, till tests, staff food, one-offs) — it shrinks as categories get their own homes. Fit-out spend under Repairs may be moved to the balance sheet by the accountant. Wages here = hourly staff only.
                </div>
              </div>
            </>
          )}
          {section === 'till' && (
            <>
              <STitle>Till Sales — what actually sells</STitle>
              <TillSection />
            </>
          )}
          {section === 'vat' && (
            <>
              <STitle>VAT — the £90k line</STitle>
              <VatTracker />
            </>
          )}
          {section === 'wages' && (
            <>
              <STitle>Wage Bill — live from clock-ins</STitle>
              <WagesLive />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
