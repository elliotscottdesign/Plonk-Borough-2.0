import React, { useState, useMemo } from 'react'
import {
  IP_LICENSING_SKUS_ONLINE_2025,
  IP_LICENSING_SKUS_OFFICE_2025,
  IP_LICENSING_MONTHLY_2025,
  IP_LICENSING_GRAND_2025,
  IP_LICENSING_COMMISSION_2025,
  IP_LICENSING_TOKEN_VALUE,
  IP_LICENSING_BOOKING_FEE_PCT,
  IP_LICENSING_PAYMENT_FEE_PCT,
} from '../data.js'
import ResetBtn from '../components/ResetBtn.jsx'
import { useChartTooltip } from '../components/ChartTooltip.jsx'

const fmt = n => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtK = n => '£' + Math.round(n / 1000).toLocaleString() + 'k'
const fmt0 = n => '£' + Math.round(n).toLocaleString()
const pct = n => (n * 100).toFixed(1) + '%'

// --- Shared SKU table (used for both Online and Office sections) ---
function SKUTable({ title, subtitle, rows, accentColor, channel }) {
  const enriched = rows.map(s => {
    const tokenValue = s.tokens * IP_LICENSING_TOKEN_VALUE
    const bookingFee = s.price * IP_LICENSING_BOOKING_FEE_PCT
    const customerTotal = s.price + bookingFee
    const yearTokenCost = s.sold * tokenValue
    // Booking fee only applies to online-portal bookings (till sales don't carry a booking fee)
    const yearBookingFees = channel === 'online' ? s.revenue * IP_LICENSING_BOOKING_FEE_PCT : 0
    return { ...s, tokenValue, bookingFee, customerTotal, yearTokenCost, yearBookingFees }
  })
  const totals = enriched.reduce((a, r) => ({
    sold: a.sold + r.sold,
    revenue: a.revenue + r.revenue,
    yearTokenCost: a.yearTokenCost + r.yearTokenCost,
    yearBookingFees: a.yearBookingFees + r.yearBookingFees,
  }), { sold: 0, revenue: 0, yearTokenCost: 0, yearBookingFees: 0 })

  const cell = { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }
  const head = { ...cell, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600, borderBottom: `1px solid ${accentColor}40` }

  return (
    <div style={{ background: 'var(--ink-2)', border: `1px solid ${accentColor}60`, borderRadius: 10, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: accentColor, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{totals.sold.toLocaleString()} tickets · {fmt0(totals.revenue)}</div>
      </div>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>{subtitle}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={{ ...head, textAlign: 'left' }}>SKU</th>
              <th style={{ ...head, textAlign: 'right' }}>Tokens</th>
              <th style={{ ...head, textAlign: 'right' }}>Gross Price</th>
              <th style={{ ...head, textAlign: 'right' }}>Token Value (no VAT)</th>
              <th style={{ ...head, textAlign: 'right' }}>Booking Fee (10%)</th>
              <th style={{ ...head, textAlign: 'right' }}>Customer Pays</th>
              <th style={{ ...head, textAlign: 'right' }}>Units 2025</th>
              <th style={{ ...head, textAlign: 'right' }}>Revenue 2025</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map(r => {
              const dim = r.sold === 0
              return (
                <tr key={r.sku} style={{ opacity: dim ? 0.35 : 1 }}>
                  <td style={{ ...cell, color: 'var(--cream)' }}>{r.sku}</td>
                  <td style={{ ...cell, textAlign: 'right', color: r.tokens ? 'var(--gold)' : '#6B7280' }}>{r.tokens}</td>
                  <td style={{ ...cell, textAlign: 'right', color: 'var(--cream)' }}>{fmt(r.price)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: r.tokens ? '#2DD4BF' : '#6B7280' }}>{fmt(r.tokenValue)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: channel === 'online' ? '#E67E22' : '#6B7280' }}>{fmt(r.bookingFee)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: '#9CA3AF' }}>{fmt(r.customerTotal)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: 'var(--cream)' }}>{r.sold.toLocaleString()}</td>
                  <td style={{ ...cell, textAlign: 'right', color: 'var(--gold)', fontWeight: 600 }}>{fmt0(r.revenue)}</td>
                </tr>
              )
            })}
            <tr style={{ borderTop: `2px solid ${accentColor}` }}>
              <td style={{ ...cell, color: 'var(--cream)', fontWeight: 700 }}>TOTAL</td>
              <td style={cell}></td>
              <td style={cell}></td>
              <td style={{ ...cell, textAlign: 'right', color: '#2DD4BF', fontWeight: 700 }}>{fmt0(totals.yearTokenCost)}</td>
              <td style={{ ...cell, textAlign: 'right', color: channel === 'online' ? '#E67E22' : '#6B7280', fontWeight: 700 }}>{fmt0(totals.yearBookingFees)}</td>
              <td style={cell}></td>
              <td style={{ ...cell, textAlign: 'right', color: 'var(--cream)', fontWeight: 700 }}>{totals.sold.toLocaleString()}</td>
              <td style={{ ...cell, textAlign: 'right', color: 'var(--gold)', fontWeight: 700 }}>{fmt0(totals.revenue)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// --- Monthly trend with online/office split (revenue) ---
function MonthlyTrend() {
  const { containerProps, segmentProps, overlay } = useChartTooltip()
  const data = IP_LICENSING_MONTHLY_2025
  const maxRev = Math.max(...data.map(d => d.onlineRev + d.officeRev))
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
      <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
        Monthly Channel Split — Revenue 2025
      </div>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>
        Blue = online portal revenue (actual) · Grey = office revenue (imputed at SKU list price, till-settled).
      </div>
      <div {...containerProps} style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180, marginBottom: 8, position: 'relative' }}>
        {data.map(d => {
          const onH = (d.onlineRev / maxRev) * 150
          const ofH = (d.officeRev / maxRev) * 150
          const total = d.onlineRev + d.officeRev
          return (
            <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ fontSize: 9, color: '#9CA3AF' }}>{fmtK(total)}</div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 150 }}>
                <div style={{ width: '100%', background: '#6B7280', height: Math.max(2, ofH) + 'px', opacity: 0.7, cursor: 'default' }} {...segmentProps(`${d.month} · Office (imputed)\n${fmt0(d.officeRev)}`)} />
                <div style={{ width: '100%', background: '#4FC3F7', borderRadius: '3px 3px 0 0', height: Math.max(2, onH) + 'px', cursor: 'default' }} {...segmentProps(`${d.month} · Online\n${fmt0(d.onlineRev)}`)} />
              </div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>{d.month}</div>
            </div>
          )
        })}
        {overlay}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 6 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span><span style={{ display:'inline-block', width:10, height:10, background:'#4FC3F7', borderRadius:2, marginRight:6 }} />Online {fmt0(IP_LICENSING_GRAND_2025.onlineRev)}</span>
          <span><span style={{ display:'inline-block', width:10, height:10, background:'#6B7280', borderRadius:2, marginRight:6 }} />Office {fmt0(IP_LICENSING_GRAND_2025.officeRev)} <span style={{ color:'#6B7280', fontStyle:'italic' }}>(imputed)</span></span>
        </div>
        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Total: {fmt0(IP_LICENSING_GRAND_2025.totalRev)}</span>
      </div>
    </div>
  )
}

// --- Golf-only filter: Plonk Golf only takes commission on GOLF tickets.
//     Pool/tournament/add-ons/specials are venue-managed (+ group bookings 12+ handled directly by venue).
const NON_GOLF_SKUS = new Set([
  'Pool Table Reservation — 30 Mins',
  'Doubles Pool Tournament',
  'Extra Arcade Tokens (add-on)',
  "Valentine's Day Deal",
])
const isGolfSku = sku => !NON_GOLF_SKUS.has(sku)

function sumRev(rows, predicate = () => true) {
  return rows.filter(r => predicate(r.sku)).reduce((a, r) => a + r.revenue, 0)
}

// --- Commission slider card (reused for Section A and B) ---
function CommissionSliderCard({ label, subtitle, value, onChange, accent, totalChannelRev, golfRev, nonGolfRev, max = 30, helperText, defaultValue = 10 }) {
  const commission = golfRev * (value / 100)
  return (
    <div style={{ background: 'var(--ink-2)', border: `1px solid ${accent}60`, borderRadius: 10, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 18, color: accent, fontWeight: 700 }}>{value}%</div>
          <ResetBtn onClick={() => onChange(defaultValue)} title={`Reset to ${defaultValue}%`} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12, lineHeight: 1.5 }}>{subtitle}</div>
      <input type="range" min={0} max={max} step={0.5} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: accent }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B7280', marginTop: 2, marginBottom: 14 }}>
        <span>0%</span><span>{max}%</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <MiniStat label="Golf revenue (commissionable)" value={fmt0(golfRev)} color={accent} />
        <MiniStat label="Non-golf (excluded)" value={fmt0(nonGolfRev)} color="#6B7280" />
        <MiniStat label={`Commission @ ${value}%`} value={fmt0(commission)} color="var(--gold)" emphasised />
      </div>
      {helperText && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 10, lineHeight: 1.5 }}>{helperText}</div>}
    </div>
  )
}

function MiniStat({ label, value, color, emphasised }) {
  return (
    <div style={{ background: emphasised ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${emphasised ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

// --- Plonk Golf × Venue model (reads commission values from parent state) ---
function CommissionModel({ commissionOnlinePct, commissionOfficePct }) {
  const [volumeUplift, setVolumeUplift] = useState(0)
  const [webCost, setWebCost] = useState(6000)
  const [seoCost, setSeoCost] = useState(6000)
  const [botCost, setBotCost] = useState(1200)
  const [accountancyCost, setAccountancyCost] = useState(3000)
  const maintenanceCost = 12 * 250

  const m = useMemo(() => {
    const upliftFactor = 1 + volumeUplift / 100
    // Online: full (all SKUs) and golf-only
    const onlineGrossAll = IP_LICENSING_GRAND_2025.onlineRev * upliftFactor
    const onlineGolfRev = sumRev(IP_LICENSING_SKUS_ONLINE_2025, isGolfSku) * upliftFactor
    // Booking fee applies to ALL online sales (customer pays 10% on top at checkout, regardless of SKU)
    const bookingFees = onlineGrossAll * IP_LICENSING_BOOKING_FEE_PCT
    // Commission (online) only on golf
    const commissionOnline = onlineGolfRev * (commissionOnlinePct / 100)
    // Office: golf only (office is a scenario — commission conditional on PlonkGolf providing bookings manager)
    const officeGolfRev = sumRev(IP_LICENSING_SKUS_OFFICE_2025, isGolfSku) * upliftFactor
    const officeGrossAll = sumRev(IP_LICENSING_SKUS_OFFICE_2025) * upliftFactor
    const commissionOffice = officeGolfRev * (commissionOfficePct / 100)
    // Payment processing (1.5%) applies to any revenue that flows through the online payment provider
    // — all online sales (SKU-agnostic) + office if PlonkGolf processes them digitally via the bookings manager.
    const paymentFees = (onlineGrossAll + officeGrossAll) * IP_LICENSING_PAYMENT_FEE_PCT

    const plonkGolfRevenue = bookingFees + commissionOnline + commissionOffice
    const plonkGolfCosts = maintenanceCost + webCost + seoCost + botCost + accountancyCost + paymentFees
    const plonkGolfNet = plonkGolfRevenue - plonkGolfCosts
    const totalTokenCost = IP_LICENSING_SKUS_ONLINE_2025.reduce((a, s) => a + s.sold * upliftFactor * s.tokens * IP_LICENSING_TOKEN_VALUE, 0)
    const venueNet = onlineGrossAll - commissionOnline - totalTokenCost
    return { onlineGrossAll, onlineGolfRev, officeGrossAll, officeGolfRev, bookingFees, commissionOnline, commissionOffice, paymentFees, plonkGolfRevenue, plonkGolfCosts, plonkGolfNet, totalTokenCost, venueNet }
  }, [commissionOnlinePct, commissionOfficePct, volumeUplift, webCost, seoCost, botCost, accountancyCost])

  const sliders = [
    { label: 'Volume uplift (vs 2025 online)', value: volumeUplift, set: setVolumeUplift, min: -20, max: 50, step: 1, suffix: '%', color: '#2DD4BF', default: 0 },
    { label: 'Website + booking system', value: webCost, set: setWebCost, min: 0, max: 20000, step: 500, prefix: '£', suffix: '/yr', color: '#4FC3F7', default: 6000 },
    { label: 'SEO (non-venue-specific)', value: seoCost, set: setSeoCost, min: 0, max: 20000, step: 500, prefix: '£', suffix: '/yr', color: '#4FC3F7', default: 6000 },
    { label: 'Chatbot / AI booking', value: botCost, set: setBotCost, min: 0, max: 10000, step: 100, prefix: '£', suffix: '/yr', color: '#4FC3F7', default: 1200 },
    { label: 'Accountancy fees', value: accountancyCost, set: setAccountancyCost, min: 0, max: 15000, step: 250, prefix: '£', suffix: '/yr', color: '#4FC3F7', default: 3000 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          Plonk Golf × Venue — Interactive Model
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>
          Commission rates come from the golf-only sliders under Sections A &amp; B. Booking fee (10%) is locked — applied to ALL online sales at checkout. Uplift and cost sliders below are scenario inputs.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {sliders.map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--cream)' }}>{s.label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: s.color, fontWeight: 700 }}>{s.prefix || ''}{Number(s.value).toLocaleString()}{s.suffix || ''}</span>
                  <ResetBtn onClick={() => s.set(s.default)} title={`Reset to ${s.prefix || ''}${s.default.toLocaleString()}${s.suffix || ''}`} />
                </span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.value} onChange={e => s.set(Number(e.target.value))} style={{ width: '100%', accentColor: s.color }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B7280', marginTop: 2 }}>
                <span>{s.prefix || ''}{s.min.toLocaleString()}{s.suffix || ''}</span>
                <span>{s.prefix || ''}{s.max.toLocaleString()}{s.suffix || ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--ink-2)', border: '2px solid rgba(201,168,76,0.35)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>
            Plonk Golf P&amp;L (Borough)
          </div>
          <Row label="Gross online sales (all SKUs)" value={fmt0(m.onlineGrossAll)} muted />
          <Row label="↳ of which online golf (commissionable)" value={fmt0(m.onlineGolfRev)} muted />
          <Row label="↳ of which office golf — imputed (commissionable)" value={fmt0(m.officeGolfRev)} muted />
          <div style={{ height: 10 }} />
          <Row label="+ Booking fees collected (10% on all online)" value={fmt0(m.bookingFees)} color="#E67E22" />
          <Row label={`+ Commission from Venue — Online sales (${commissionOnlinePct}% × golf)`} value={fmt0(m.commissionOnline)} color="#C9A84C" />
          <Row label={`+ Commission from Venue — Office sales (${commissionOfficePct}% × golf)`} value={fmt0(m.commissionOffice)} color="#C9A84C" />
          <Row label="= Plonk Golf revenue" value={fmt0(m.plonkGolfRevenue)} color="var(--cream)" bold />
          <div style={{ height: 10 }} />
          <Row label="− Maintenance (12 × £250)" value={fmt0(maintenanceCost)} color="#EF4444" />
          <Row label="− Website + booking system" value={fmt0(webCost)} color="#EF4444" />
          <Row label="− SEO" value={fmt0(seoCost)} color="#EF4444" />
          <Row label="− Chatbot / AI booking" value={fmt0(botCost)} color="#EF4444" />
          <Row label="− Accountancy fees" value={fmt0(accountancyCost)} color="#EF4444" />
          <Row label={`− Payment processing (${(IP_LICENSING_PAYMENT_FEE_PCT * 100).toFixed(1)}% × online + office gross)`} value={fmt0(m.paymentFees)} color="#EF4444" />
          <Row label="= Total Plonk Golf costs" value={fmt0(m.plonkGolfCosts)} color="#EF4444" bold />
          <div style={{ height: 10, borderTop: '1px solid rgba(201,168,76,0.3)', marginTop: 6 }} />
          <Row label="NET to Plonk Golf" value={fmt0(m.plonkGolfNet)} color={m.plonkGolfNet > 0 ? '#2DD4BF' : '#EF4444'} large />
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 10, lineHeight: 1.5 }}>
            Margin on Plonk Golf rev: <span style={{ color: 'var(--cream)' }}>{m.plonkGolfRevenue > 0 ? pct(m.plonkGolfNet / m.plonkGolfRevenue) : '—'}</span><br />
            Office commission assumes Plonk Golf provides the bookings manager. Set slider B to 0% to model the "venue self-serves office bookings" scenario.
          </div>
        </div>

        <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>
            Venue view (Borough DMN — online only)
          </div>
          <Row label="Gross online sales" value={fmt0(m.onlineGrossAll)} color="var(--cream)" />
          <Row label={`− Commission to Plonk Golf (${commissionOnlinePct}% × golf)`} value={fmt0(m.commissionOnline)} color="#EF4444" />
          <Row label="− Token cost (4 × £0.325 per tokened ticket)" value={fmt0(m.totalTokenCost)} color="#EF4444" />
          <div style={{ height: 10, borderTop: '1px solid rgba(201,168,76,0.3)', marginTop: 6 }} />
          <Row label="NET to venue (online)" value={fmt0(m.venueNet)} color={m.venueNet > 0 ? '#2DD4BF' : '#EF4444'} large />
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 10, lineHeight: 1.5 }}>
            Booking fee (10%) is paid by customer on top — venue never sees it.<br />
            Pool tables, private events and group bookings 12+ are venue-managed — Plonk Golf takes no commission on those.<br />
            Office/till-settled revenue ({IP_LICENSING_GRAND_2025.officeQty.toLocaleString()} tickets · imputed {fmt0(IP_LICENSING_GRAND_2025.officeRev)} in 2025) sits with the venue directly; Plonk Golf only earns on it if it provides a bookings manager (slider B).
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, color, muted, bold, large }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 12, color: muted ? '#6B7280' : '#9CA3AF' }}>{label}</span>
      <span style={{ fontSize: large ? 18 : 13, fontWeight: bold || large ? 700 : 500, color: color || 'var(--cream)' }}>{value}</span>
    </div>
  )
}

// --- Main export ---
export default function IPLicensing() {
  const g = IP_LICENSING_GRAND_2025
  const onlinePct = g.totalQty ? g.onlineQty / g.totalQty : 0

  // Commission state — sliders live under sections A & B, values feed the Plonk Golf P&L
  const [commissionOnlinePct, setCommissionOnlinePct] = useState(10)
  const [commissionOfficePct, setCommissionOfficePct] = useState(10)

  const onlineGolfRev = sumRev(IP_LICENSING_SKUS_ONLINE_2025, isGolfSku)
  const onlineNonGolfRev = sumRev(IP_LICENSING_SKUS_ONLINE_2025, s => !isGolfSku(s))
  const officeGolfRev = sumRev(IP_LICENSING_SKUS_OFFICE_2025, isGolfSku)
  const officeNonGolfRev = sumRev(IP_LICENSING_SKUS_OFFICE_2025, s => !isGolfSku(s))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13 }}>
      <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '14px 18px' }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
          IP &amp; Licensing — dev sheet (Borough 2025, split by channel)
        </div>
        <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
          Source: <strong style={{ color: 'var(--cream)' }}>ALL DMN 2025 transactions</strong>, filtered to Borough venue only, split by Status column. Online revenue is actual portal revenue; office revenue is imputed at SKU list price (qty × price) because till payments don't appear in the online system. Under the Plonk Golf × Venue model, only the online channel generates Plonk Golf revenue.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
          <Stat label="Online Tickets" value={g.onlineQty.toLocaleString()} sub={`${(onlinePct * 100).toFixed(1)}% of volume`} color="#4FC3F7" />
          <Stat label="Online Revenue" value={fmt0(g.onlineRev)} sub={`${(g.onlineRev / g.totalRev * 100).toFixed(1)}% of total £ · actual`} color="var(--gold)" />
          <Stat label="Office Tickets" value={g.officeQty.toLocaleString()} sub={`${((1-onlinePct) * 100).toFixed(1)}% of volume`} color="#9CA3AF" />
          <Stat label="Office Revenue" value={fmt0(g.officeRev)} sub={`${(g.officeRev / g.totalRev * 100).toFixed(1)}% of total £ · imputed`} color="#9CA3AF" />
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10, display:'flex', justifyContent:'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
          <span>Combined Borough 2025 revenue</span>
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{fmt0(g.totalRev)}</span>
        </div>
      </div>

      {/* Verified 2025 commission income to Plonk Golf — drawn from source weekly P&L */}
      <div style={{ background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 10, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: '#2DD4BF', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
            Plonk Golf — Verified 2025 Commission Income
          </div>
          <div className="serif" style={{ fontSize: 22, color: '#2DD4BF', fontWeight: 700 }}>
            {fmt0(IP_LICENSING_COMMISSION_2025.onlineTicketCommission)}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
          Online ticket commission already booked under the existing Design My Night arrangement during 2025 — verified from the Borough weekly P&L (source: <em>Borough Weekly Totals CATEGORISED PAST 14 MONTHS V2.xlsx</em>, row 67, sum of cols 12-63). This is Plonk Golf P&L income, NOT venue revenue. Going forward the same commercial relationship moves from Design My Night to No Dice Bars LTD with the same effective rate; the sliders below model 2026+ scenarios.
        </div>
      </div>

      <SKUTable
        title="Section A · Online Portal (Status = complete)"
        subtitle="Customer books + pays through the online system. Booking fee (10%) added on top, retained by Plonk Golf. Commission charged to venue on online golf sales only (see slider below)."
        rows={IP_LICENSING_SKUS_ONLINE_2025}
        accentColor="#4FC3F7"
        channel="online"
      />

      <CommissionSliderCard
        label="Commission % — Online golf sales"
        subtitle="Applied to online GOLF ticket sales only. Pool tables, events, group bookings 12+ and specials are venue-managed — no Plonk Golf commission on those."
        value={commissionOnlinePct}
        onChange={setCommissionOnlinePct}
        accent="#4FC3F7"
        totalChannelRev={g.onlineRev}
        golfRev={onlineGolfRev}
        nonGolfRev={onlineNonGolfRev}
        helperText="Excluded from commission: Pool Table Reservation, Doubles Pool Tournament, Extra Arcade Tokens, Valentine's Day Deal."
      />

      <SKUTable
        title="Section B · Office / External (Status = external)"
        subtitle="Bookings taken by the office/bookings team. Payment is settled at the venue till. Revenue column is IMPUTED at SKU list price (qty × price). Booking fee column is £0 because till sales don't carry the online booking fee."
        rows={IP_LICENSING_SKUS_OFFICE_2025}
        accentColor="#9CA3AF"
        channel="office"
      />

      <CommissionSliderCard
        label="Commission % — Office golf sales (if Plonk Golf provides bookings manager)"
        subtitle="Conditional scenario: if Plonk Golf provides a bookings manager for the venue, it earns a commission on office/till-settled golf sales. Set to 0% to model venue-handles-own-bookings."
        value={commissionOfficePct}
        onChange={setCommissionOfficePct}
        accent="#9CA3AF"
        totalChannelRev={g.officeRev}
        golfRev={officeGolfRev}
        nonGolfRev={officeNonGolfRev}
        helperText="Same golf-only scope as online. Office-channel revenue is imputed at SKU list price — Plonk Golf commission on it is a modelled scenario, not a current revenue stream."
      />

      <MarketingUpliftCard />

      <MonthlyTrend />
      <CommissionModel commissionOnlinePct={commissionOnlinePct} commissionOfficePct={commissionOfficePct} />

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>Assumptions &amp; open questions</div>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li><strong style={{ color: 'var(--cream)' }}>Channel split:</strong> ~{(onlinePct * 100).toFixed(0)}% of 2025 tickets (and ~{(g.onlineRev / g.totalRev * 100).toFixed(0)}% of revenue) came via the online portal. The remaining ~{((1-onlinePct) * 100).toFixed(0)}% were office/till bookings. Under the new model this office channel goes away: those customers must self-serve online or contact the venue directly.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Office revenue is imputed</strong> at each SKU's list price (qty × price = £{g.officeRev.toLocaleString('en-GB', {minimumFractionDigits:2})}). Actual till revenue may differ if the office team discounts/comps. Swap in real till takings when available.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Online total (£{g.onlineRev.toLocaleString('en-GB', {minimumFractionDigits:2})}) reconciles</strong> with the existing deck's "Online Golf Tickets £210,485" line — small delta is from SKU categorisation edge cases (pool table reservations etc.).</li>
          <li><strong style={{ color: 'var(--cream)' }}>Booking fee 10%:</strong> customer pays ticket + 10%. Plonk Golf keeps the 10% (funds online funnel). Not part of venue gross.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Commission %:</strong> separate, taken from venue's gross online sales — Plonk Golf's per-venue licensing fee.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Payment processing 1.5%:</strong> Stripe-style fee applied to all revenue that flows through the online payment provider — online portal sales always, office bookings only when Plonk Golf's bookings manager processes them digitally. Sits as a cost on the Plonk Golf P&amp;L.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Token stripping:</strong> under new model, arcade tokens move to in-store TILL only. Online SKUs will be re-priced to remove the £0.325 × 4 = £1.30 token component per bundle. Not yet applied — needs a new repriced product list from the venue.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Not yet modelled:</strong> VAT on golf portion, card/processing fees inside the 10% booking fee, refund/chargeback leakage (£135 fully-refunded in 2025 — immaterial), the ~9.8k unexplained tickets in the earlier PDF-summary extract (that data path superseded).</li>
        </ul>
      </div>
    </div>
  )
}

function Stat({ label, value, sub, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{sub}</div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
// Marketing-Driven Ticket Uplift slider — distributes additional 2026
// tickets across the existing SKU mix in proportion to 2025 sales.
//
// Connects to the Digital Marketing slide's forecast calculator (Plonk →
// Digital Marketing tab): Google Ads + SEO investment generate incremental
// ticket sales; this card shows where those sales land by SKU and what
// they're worth.
//
// Default value 8,000 incremental tickets/yr — sits between conservative
// and full marketing-engine upside. User drags the slider to model their
// own assumption.
// ───────────────────────────────────────────────────────────────────────
function MarketingUpliftCard() {
  // Combined 2025 ticket volumes (online + till) per SKU — these define
  // the distribution proportions.
  const combined = IP_LICENSING_SKUS_ONLINE_2025.map(online => {
    const office = IP_LICENSING_SKUS_OFFICE_2025.find(o => o.sku === online.sku)
    return {
      sku: online.sku,
      price: online.price,
      sold2025: online.sold + (office?.sold || 0),
    }
  })
  const total2025 = combined.reduce((s, r) => s + r.sold2025, 0)

  const [extraTickets, setExtraTickets] = useState(8000)

  // Distribute proportionally
  const rows = combined.map(r => {
    const share        = total2025 > 0 ? r.sold2025 / total2025 : 0
    const extraForSku  = Math.round(extraTickets * share)
    const extraRevenue = extraForSku * r.price
    const newTotal     = r.sold2025 + extraForSku
    return { ...r, share, extraForSku, extraRevenue, newTotal }
  })
  // Sort by 2025 volume (biggest sellers first) for at-a-glance scanning
  rows.sort((a, b) => b.sold2025 - a.sold2025)
  const totalRevenueUplift = rows.reduce((s, r) => s + r.extraRevenue, 0)
  const blendedTicketPrice = extraTickets > 0 ? totalRevenueUplift / extraTickets : 0

  const cell = { padding: '8px 10px', fontSize: 11.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }
  const head = { ...cell, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600, borderBottom: '1px solid rgba(78,195,247,0.25)' }

  return (
    <div style={{ background: 'rgba(79,195,247,0.05)', border: '1px solid rgba(79,195,247,0.3)', borderRadius: 10, padding: '18px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: '#4FC3F7', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
          Marketing-Driven Ticket Uplift · 2026 Plan
        </div>
        <ResetBtn onClick={() => setExtraTickets(8000)} title="Reset to 8,000" />
      </div>
      <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 14 }}>
        Set the projected number of <strong style={{ color: 'var(--cream)' }}>additional ticket sales</strong> for 2026 from
        the marketing engine (Google Ads + SEO). Tickets are distributed across SKUs in proportion to
        2025 sales mix. Drives the same 2026 ticket volume the Digital Marketing forecast calculator
        ends up at — the two views are complementary.
      </div>

      {/* Master slider */}
      <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--cream-dim)' }}>Additional 2026 tickets from marketing</span>
          <span className="serif" style={{ fontSize: 26, color: '#4FC3F7', fontWeight: 700 }}>
            {extraTickets.toLocaleString()}
          </span>
        </div>
        <input
          type="range" min={0} max={30000} step={250}
          value={extraTickets}
          onChange={e => setExtraTickets(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#4FC3F7' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B7280', marginTop: 4 }}>
          <span>0</span>
          <span>15,000</span>
          <span>30,000</span>
        </div>
      </div>

      {/* Headline numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <Stat label="Additional Tickets" value={extraTickets.toLocaleString()} sub="across all SKUs"               color="#4FC3F7" />
        <Stat label="Blended Ticket £"   value={fmt(blendedTicketPrice)}        sub="weighted avg price"           color="#9CA3AF" />
        <Stat label="Revenue Uplift"     value={fmt0(totalRevenueUplift)}       sub="annual"                       color="var(--gold)" />
        <Stat label="2026 Forecast Vol"  value={(total2025 + extraTickets).toLocaleString()} sub={`vs 2025 ${total2025.toLocaleString()}`} color="#2DD4BF" />
      </div>

      {/* Per-SKU distribution table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ ...head, textAlign: 'left' }}>SKU</th>
              <th style={{ ...head, textAlign: 'right' }}>2025 sold</th>
              <th style={{ ...head, textAlign: 'right' }}>2025 mix</th>
              <th style={{ ...head, textAlign: 'right' }}>Price</th>
              <th style={{ ...head, textAlign: 'right' }}>+ Tickets</th>
              <th style={{ ...head, textAlign: 'right' }}>+ Revenue</th>
              <th style={{ ...head, textAlign: 'right' }}>2026 total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.sku}>
                <td style={{ ...cell, color: 'var(--cream)' }}>{r.sku}</td>
                <td style={{ ...cell, color: '#9CA3AF', textAlign: 'right' }}>{r.sold2025.toLocaleString()}</td>
                <td style={{ ...cell, color: '#6B7280', textAlign: 'right' }}>{(r.share * 100).toFixed(1)}%</td>
                <td style={{ ...cell, color: '#9CA3AF', textAlign: 'right' }}>{fmt(r.price)}</td>
                <td style={{ ...cell, color: '#4FC3F7', fontWeight: 600, textAlign: 'right' }}>+{r.extraForSku.toLocaleString()}</td>
                <td style={{ ...cell, color: 'var(--gold)', fontWeight: 600, textAlign: 'right' }}>{fmt0(r.extraRevenue)}</td>
                <td style={{ ...cell, color: '#2DD4BF', fontWeight: 600, textAlign: 'right' }}>{r.newTotal.toLocaleString()}</td>
              </tr>
            ))}
            <tr style={{ background: 'rgba(79,195,247,0.06)' }}>
              <td style={{ ...cell, color: '#4FC3F7', fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em' }}>Total</td>
              <td style={{ ...cell, color: '#9CA3AF', textAlign: 'right' }}>{total2025.toLocaleString()}</td>
              <td style={{ ...cell, color: '#6B7280', textAlign: 'right' }}>100%</td>
              <td style={cell}></td>
              <td style={{ ...cell, color: '#4FC3F7', fontWeight: 700, textAlign: 'right' }}>+{extraTickets.toLocaleString()}</td>
              <td style={{ ...cell, color: 'var(--gold)', fontWeight: 700, textAlign: 'right' }}>{fmt0(totalRevenueUplift)}</td>
              <td style={{ ...cell, color: '#2DD4BF', fontWeight: 700, textAlign: 'right' }}>{(total2025 + extraTickets).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
        Distribution assumes the 2025 SKU mix holds — bigger sellers (Adult Peak Golf) absorb the
        biggest share of new traffic. Adjust the slider above to match the Digital Marketing
        calculator output (Google Ads conversions/yr + SEO conversions/yr).
      </div>
    </div>
  )
}
