import React, { useState, useMemo } from 'react'
import {
  IP_LICENSING_SKUS_ONLINE_2025,
  IP_LICENSING_SKUS_OFFICE_2025,
  IP_LICENSING_MONTHLY_2025,
  IP_LICENSING_GRAND_2025,
  IP_LICENSING_TOKEN_VALUE,
  IP_LICENSING_BOOKING_FEE_PCT,
} from '../data.js'

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
                  <td style={{ ...cell, textAlign: 'right', color: channel === 'online' ? 'var(--gold)' : '#6B7280', fontWeight: 600 }}>{fmt0(r.revenue)}</td>
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
              <td style={{ ...cell, textAlign: 'right', color: channel === 'online' ? 'var(--gold)' : '#6B7280', fontWeight: 700 }}>{fmt0(totals.revenue)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// --- Monthly trend with online/office split ---
function MonthlyTrend() {
  const data = IP_LICENSING_MONTHLY_2025
  const maxQty = Math.max(...data.map(d => d.onlineQty + d.officeQty))
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
      <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
        Monthly Channel Split — Ticket Volume 2025
      </div>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>
        Blue = online portal bookings (revenue-bearing) · Grey = office/external (payment via till, £0 online revenue).
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, marginBottom: 8 }}>
        {data.map(d => {
          const total = d.onlineQty + d.officeQty
          const onH = (d.onlineQty / maxQty) * 140
          const ofH = (d.officeQty / maxQty) * 140
          return (
            <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ fontSize: 9, color: '#9CA3AF' }}>{total.toLocaleString()}</div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 140 }}>
                <div style={{ width: '100%', background: '#6B7280', height: Math.max(2, ofH) + 'px', opacity: 0.7 }} title={`Office: ${d.officeQty} tickets`} />
                <div style={{ width: '100%', background: '#4FC3F7', borderRadius: '3px 3px 0 0', height: Math.max(2, onH) + 'px' }} title={`Online: ${d.onlineQty} tickets`} />
              </div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>{d.month}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 6 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span><span style={{ display:'inline-block', width:10, height:10, background:'#4FC3F7', borderRadius:2, marginRight:6 }} />Online {IP_LICENSING_GRAND_2025.onlineQty.toLocaleString()}</span>
          <span><span style={{ display:'inline-block', width:10, height:10, background:'#6B7280', borderRadius:2, marginRight:6 }} />Office {IP_LICENSING_GRAND_2025.officeQty.toLocaleString()}</span>
        </div>
        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Online rev: {fmt0(IP_LICENSING_GRAND_2025.onlineRev)}</span>
      </div>
    </div>
  )
}

// --- Holding Co × Venue model ---
function CommissionModel() {
  const [commissionPct, setCommissionPct] = useState(10)
  const [volumeUplift, setVolumeUplift] = useState(0)
  const [webCost, setWebCost] = useState(6000)
  const [seoCost, setSeoCost] = useState(6000)
  const [botCost, setBotCost] = useState(1200)
  const maintenanceCost = 12 * 250

  const m = useMemo(() => {
    const gross = IP_LICENSING_GRAND_2025.onlineRev * (1 + volumeUplift / 100)
    const bookingFees = gross * IP_LICENSING_BOOKING_FEE_PCT
    const commissionFromVenue = gross * (commissionPct / 100)
    const holdingCoRevenue = bookingFees + commissionFromVenue
    const holdingCoCosts = maintenanceCost + webCost + seoCost + botCost
    const holdingCoNet = holdingCoRevenue - holdingCoCosts
    const totalTokenCost = IP_LICENSING_SKUS_ONLINE_2025.reduce((a, s) => a + s.sold * (1 + volumeUplift / 100) * s.tokens * IP_LICENSING_TOKEN_VALUE, 0)
    const venueNet = gross - commissionFromVenue - totalTokenCost
    return { gross, bookingFees, commissionFromVenue, holdingCoRevenue, holdingCoCosts, holdingCoNet, totalTokenCost, venueNet }
  }, [commissionPct, volumeUplift, webCost, seoCost, botCost])

  const sliders = [
    { label: 'Commission % (from venue)', value: commissionPct, set: setCommissionPct, min: 0, max: 30, step: 0.5, suffix: '%', color: '#C9A84C' },
    { label: 'Volume uplift (vs 2025 online)', value: volumeUplift, set: setVolumeUplift, min: -20, max: 50, step: 1, suffix: '%', color: '#2DD4BF' },
    { label: 'Website + booking system', value: webCost, set: setWebCost, min: 0, max: 20000, step: 500, prefix: '£', suffix: '/yr', color: '#4FC3F7' },
    { label: 'SEO (non-venue-specific)', value: seoCost, set: setSeoCost, min: 0, max: 20000, step: 500, prefix: '£', suffix: '/yr', color: '#4FC3F7' },
    { label: 'Chatbot / AI booking', value: botCost, set: setBotCost, min: 0, max: 10000, step: 100, prefix: '£', suffix: '/yr', color: '#4FC3F7' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          Holding Co × Venue — Interactive Model (online revenue only)
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>
          Model uses the ONLINE channel only (£{IP_LICENSING_GRAND_2025.onlineRev.toLocaleString('en-GB', {minimumFractionDigits:2})} baseline). Office/till bookings are out of scope — Holding Co takes no commission on those.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {sliders.map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--cream)' }}>{s.label}</span>
                <span style={{ color: s.color, fontWeight: 700 }}>{s.prefix || ''}{Number(s.value).toLocaleString()}{s.suffix || ''}</span>
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
            Holding Co P&amp;L (Borough online only)
          </div>
          <Row label="Gross online sales (venue books)" value={fmt0(m.gross)} muted />
          <Row label="+ Booking fees collected (10%)" value={fmt0(m.bookingFees)} color="#E67E22" />
          <Row label={`+ Commission from venue (${commissionPct}%)`} value={fmt0(m.commissionFromVenue)} color="#C9A84C" />
          <Row label="= Holding Co revenue" value={fmt0(m.holdingCoRevenue)} color="var(--cream)" bold />
          <div style={{ height: 10 }} />
          <Row label="− Maintenance (12 × £250)" value={fmt0(maintenanceCost)} color="#EF4444" />
          <Row label="− Website + booking system" value={fmt0(webCost)} color="#EF4444" />
          <Row label="− SEO" value={fmt0(seoCost)} color="#EF4444" />
          <Row label="− Chatbot / AI booking" value={fmt0(botCost)} color="#EF4444" />
          <Row label="= Total Holding Co costs" value={fmt0(m.holdingCoCosts)} color="#EF4444" bold />
          <div style={{ height: 10, borderTop: '1px solid rgba(201,168,76,0.3)', marginTop: 6 }} />
          <Row label="NET to Holding Co" value={fmt0(m.holdingCoNet)} color={m.holdingCoNet > 0 ? '#2DD4BF' : '#EF4444'} large />
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 10, lineHeight: 1.5 }}>
            Margin on Holding Co rev: <span style={{ color: 'var(--cream)' }}>{m.holdingCoRevenue > 0 ? pct(m.holdingCoNet / m.holdingCoRevenue) : '—'}</span>
          </div>
        </div>

        <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>
            Venue view (Borough DMN — online only)
          </div>
          <Row label="Gross online sales" value={fmt0(m.gross)} color="var(--cream)" />
          <Row label={`− Commission to Holding Co (${commissionPct}%)`} value={fmt0(m.commissionFromVenue)} color="#EF4444" />
          <Row label="− Token cost (4 × £0.325 per tokened ticket)" value={fmt0(m.totalTokenCost)} color="#EF4444" />
          <div style={{ height: 10, borderTop: '1px solid rgba(201,168,76,0.3)', marginTop: 6 }} />
          <Row label="NET to venue (online)" value={fmt0(m.venueNet)} color={m.venueNet > 0 ? '#2DD4BF' : '#EF4444'} large />
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 10, lineHeight: 1.5 }}>
            Booking fee (10%) is paid by customer on top — venue never sees it.<br />
            Office/till bookings ({IP_LICENSING_GRAND_2025.officeQty.toLocaleString()} tickets in 2025) settled directly at venue — no Holding Co involvement.
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13 }}>
      <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '14px 18px' }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
          IP &amp; Licensing — dev sheet (Borough 2025, split by channel)
        </div>
        <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
          Source: <strong style={{ color: 'var(--cream)' }}>ALL DMN 2025 transactions</strong>, filtered to Borough venue only, split by Status column. Under the new Holding-Co × Venue model, ONLY the online portal channel generates Holding Co revenue (booking fees + commission). Office/till bookings settle directly at the venue.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
          <Stat label="Online Tickets" value={g.onlineQty.toLocaleString()} sub={`${(onlinePct * 100).toFixed(1)}% of total`} color="#4FC3F7" />
          <Stat label="Online Revenue" value={fmt0(g.onlineRev)} sub="Status = complete" color="var(--gold)" />
          <Stat label="Office Tickets" value={g.officeQty.toLocaleString()} sub={`${((1-onlinePct) * 100).toFixed(1)}% of total`} color="#9CA3AF" />
          <Stat label="Office Revenue" value={fmt0(g.officeRev)} sub="Status = external (till)" color="#6B7280" />
        </div>
      </div>

      <SKUTable
        title="Section A · Online Portal (Status = complete)"
        subtitle="Customer books + pays through the online system. Booking fee (10%) added on top, retained by Holding Co. Commission charged to venue on the gross revenue."
        rows={IP_LICENSING_SKUS_ONLINE_2025}
        accentColor="#4FC3F7"
        channel="online"
      />

      <SKUTable
        title="Section B · Office / External (Status = external)"
        subtitle="Reservations booked by the office/bookings team. Payment settled at the venue till — no revenue flows through the online system (all £0). Same SKU pricing shown for reference / imputed value if moved online."
        rows={IP_LICENSING_SKUS_OFFICE_2025}
        accentColor="#9CA3AF"
        channel="office"
      />

      <MonthlyTrend />
      <CommissionModel />

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>Assumptions &amp; open questions</div>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li><strong style={{ color: 'var(--cream)' }}>Channel split is the key insight:</strong> ~{(onlinePct * 100).toFixed(0)}% of 2025 tickets came via the online portal (revenue-bearing). The remaining ~{((1-onlinePct) * 100).toFixed(0)}% were office bookings that bypass the portal entirely — venue handles payment. Under the new model this office channel goes away: those customers must self-serve online or contact the venue directly.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Online total (£{g.onlineRev.toLocaleString('en-GB', {minimumFractionDigits:2})}) reconciles</strong> with the existing deck's "Online Golf Tickets £210,485" line — small delta is from SKU categorisation edge cases (pool table reservations etc.).</li>
          <li><strong style={{ color: 'var(--cream)' }}>Booking fee 10%:</strong> customer pays ticket + 10%. Holding Co keeps the 10% (funds online funnel). Not part of venue gross.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Commission %:</strong> separate, taken from venue's gross online sales — Holding Co's per-venue licensing fee.</li>
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
