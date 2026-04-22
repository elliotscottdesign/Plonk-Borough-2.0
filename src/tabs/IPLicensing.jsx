import React, { useState, useMemo } from 'react'
import {
  IP_LICENSING_SKUS_2025,
  IP_LICENSING_MONTHLY_2025,
  IP_LICENSING_GRAND_2025,
  IP_LICENSING_TOKEN_VALUE,
  IP_LICENSING_BOOKING_FEE_PCT,
} from '../data.js'

const fmt = n => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtK = n => '£' + Math.round(n / 1000).toLocaleString() + 'k'
const fmt0 = n => '£' + Math.round(n).toLocaleString()
const pct = n => (n * 100).toFixed(1) + '%'

// --- Section 1: SKU breakdown table ---
function SKUBreakdown() {
  const grand = IP_LICENSING_GRAND_2025
  const rows = IP_LICENSING_SKUS_2025.map(s => {
    const tokenValue = s.tokens * IP_LICENSING_TOKEN_VALUE
    const bookingFee = s.price * IP_LICENSING_BOOKING_FEE_PCT
    const customerTotal = s.price + bookingFee
    const goldOnlyPrice = s.price - tokenValue // what "online price" looks like after tokens stripped
    const yearTokenCost = s.sold * tokenValue
    const yearBookingFees = s.sold * bookingFee
    return { ...s, tokenValue, bookingFee, customerTotal, goldOnlyPrice, yearTokenCost, yearBookingFees }
  })
  const totals = rows.reduce((a, r) => ({
    sold: a.sold + r.sold,
    revenue: a.revenue + r.revenue,
    yearTokenCost: a.yearTokenCost + r.yearTokenCost,
    yearBookingFees: a.yearBookingFees + r.yearBookingFees,
  }), { sold: 0, revenue: 0, yearTokenCost: 0, yearBookingFees: 0 })

  const cell = { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }
  const head = { ...cell, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600, borderBottom: '1px solid rgba(201,168,76,0.25)' }

  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
      <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
        2025 Online SKU Breakdown
      </div>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>
        Every distinct ticket type sold via the Borough DMN online portal in 2025. Token value @ £0.325 (no VAT) · Booking fee 10% added on top at checkout (retained by Holding Co).
      </div>
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
            {rows.map(r => {
              const dim = r.sold === 0
              return (
                <tr key={r.sku} style={{ opacity: dim ? 0.45 : 1 }}>
                  <td style={{ ...cell, color: 'var(--cream)' }}>{r.sku}</td>
                  <td style={{ ...cell, textAlign: 'right', color: r.tokens ? 'var(--gold)' : '#6B7280' }}>{r.tokens}</td>
                  <td style={{ ...cell, textAlign: 'right', color: 'var(--cream)' }}>{fmt(r.price)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: r.tokens ? '#2DD4BF' : '#6B7280' }}>{fmt(r.tokenValue)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: '#E67E22' }}>{fmt(r.bookingFee)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: '#9CA3AF' }}>{fmt(r.customerTotal)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: 'var(--cream)' }}>{r.sold.toLocaleString()}</td>
                  <td style={{ ...cell, textAlign: 'right', color: 'var(--gold)', fontWeight: 600 }}>{fmt0(r.revenue)}</td>
                </tr>
              )
            })}
            <tr style={{ borderTop: '2px solid rgba(201,168,76,0.4)' }}>
              <td style={{ ...cell, color: 'var(--cream)', fontWeight: 700 }}>TOTAL</td>
              <td style={cell}></td>
              <td style={cell}></td>
              <td style={{ ...cell, textAlign: 'right', color: '#2DD4BF', fontWeight: 700 }}>{fmt0(totals.yearTokenCost)}</td>
              <td style={{ ...cell, textAlign: 'right', color: '#E67E22', fontWeight: 700 }}>{fmt0(totals.yearBookingFees)}</td>
              <td style={cell}></td>
              <td style={{ ...cell, textAlign: 'right', color: 'var(--cream)', fontWeight: 700 }}>{totals.sold.toLocaleString()}</td>
              <td style={{ ...cell, textAlign: 'right', color: 'var(--gold)', fontWeight: 700 }}>{fmt0(totals.revenue)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 12, lineHeight: 1.6 }}>
        Totals for Token Value and Booking Fee columns = annualised (column × units sold). Booking fees are <strong style={{ color: '#E67E22' }}>additional</strong> cash collected from customers on top of the £{totals.revenue.toLocaleString('en-GB', {minimumFractionDigits:2, maximumFractionDigits:2})} gross — retained by Holding Co, not part of the venue's top-line.
      </div>
    </div>
  )
}

// --- Section 2: Monthly trend (2025 actuals) ---
function MonthlyTrend() {
  const data = IP_LICENSING_MONTHLY_2025
  const max = Math.max(...data.map(d => d.revenue))
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
      <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>
        Online Bookings — Monthly 2025
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, marginBottom: 10 }}>
        {data.map(d => (
          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, color: '#9CA3AF' }}>{fmtK(d.revenue)}</div>
            <div style={{ width: '100%', background: '#4FC3F7', borderRadius: '3px 3px 0 0', height: Math.max(4, (d.revenue / max) * 110) + 'px', opacity: 0.85 }} />
            <div style={{ fontSize: 10, color: '#6B7280' }}>{d.month}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
        <span>12 months · {IP_LICENSING_GRAND_2025.sold.toLocaleString()} tickets</span>
        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Total: {fmt0(IP_LICENSING_GRAND_2025.revenue)}</span>
      </div>
    </div>
  )
}

// --- Section 3: Holding Co × Venue model (interactive) ---
function CommissionModel() {
  const [commissionPct, setCommissionPct] = useState(10)    // %
  const [volumeUplift, setVolumeUplift] = useState(0)        // % vs 2025 online volume
  const [webCost, setWebCost] = useState(6000)               // £/yr
  const [seoCost, setSeoCost] = useState(6000)               // £/yr
  const [botCost, setBotCost] = useState(1200)               // £/yr
  const maintenanceCost = 12 * 250 // fixed: 12 visits × £250 = £3,000

  const m = useMemo(() => {
    const gross = IP_LICENSING_GRAND_2025.revenue * (1 + volumeUplift / 100)
    const bookingFees = gross * IP_LICENSING_BOOKING_FEE_PCT // collected on top of gross
    const commissionFromVenue = gross * (commissionPct / 100)
    const holdingCoRevenue = bookingFees + commissionFromVenue
    const holdingCoCosts = maintenanceCost + webCost + seoCost + botCost
    const holdingCoNet = holdingCoRevenue - holdingCoCosts

    // Venue side (golf only — token cost is a COGS to fulfill the bundled tokens)
    const totalTokenCost = IP_LICENSING_SKUS_2025.reduce((a, s) => a + s.sold * (1 + volumeUplift / 100) * s.tokens * IP_LICENSING_TOKEN_VALUE, 0)
    const venueNet = gross - commissionFromVenue - totalTokenCost

    return { gross, bookingFees, commissionFromVenue, holdingCoRevenue, holdingCoCosts, holdingCoNet, totalTokenCost, venueNet }
  }, [commissionPct, volumeUplift, webCost, seoCost, botCost])

  const sliders = [
    { label: 'Commission % (from venue)', value: commissionPct, set: setCommissionPct, min: 0, max: 30, step: 0.5, suffix: '%', color: '#C9A84C' },
    { label: 'Volume uplift (vs 2025)',   value: volumeUplift,  set: setVolumeUplift,  min: -20, max: 50, step: 1,  suffix: '%', color: '#2DD4BF' },
    { label: 'Website + booking system',  value: webCost,        set: setWebCost,       min: 0, max: 20000, step: 500, prefix: '£', suffix: '/yr', color: '#4FC3F7' },
    { label: 'SEO (non-venue-specific)',  value: seoCost,        set: setSeoCost,       min: 0, max: 20000, step: 500, prefix: '£', suffix: '/yr', color: '#4FC3F7' },
    { label: 'Chatbot / AI booking',      value: botCost,        set: setBotCost,       min: 0, max: 10000, step: 100, prefix: '£', suffix: '/yr', color: '#4FC3F7' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sliders */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          Holding Co × Venue — Interactive Model
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>
          Booking fee locked at 10% (customer-facing, funds online funnel). Adjust commission, volume uplift and Holding Co costs to test the model.
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

      {/* Output: Holding Co P&L */}
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
            Venue view (Borough DMN)
          </div>
          <Row label="Gross online sales" value={fmt0(m.gross)} color="var(--cream)" />
          <Row label={`− Commission to Holding Co (${commissionPct}%)`} value={fmt0(m.commissionFromVenue)} color="#EF4444" />
          <Row label="− Token cost (4 × £0.325 per tokened ticket)" value={fmt0(m.totalTokenCost)} color="#EF4444" />
          <div style={{ height: 10, borderTop: '1px solid rgba(201,168,76,0.3)', marginTop: 6 }} />
          <Row label="NET to venue (online)" value={fmt0(m.venueNet)} color={m.venueNet > 0 ? '#2DD4BF' : '#EF4444'} large />
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 10, lineHeight: 1.5 }}>
            Booking fee (10%) is paid by customer on top — venue never sees it.<br />
            VAT on golf portion not modelled here (out of scope for this iteration).
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13 }}>
      <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '14px 18px' }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
          IP &amp; Licensing — dev sheet
        </div>
        <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
          Isolated working sheet — we'll develop this into the full IP &amp; Licensing model. Built from the only clean data source: <strong style={{ color: 'var(--cream)' }}>2025 Borough DMN online bookings portal</strong> (12 monthly sales-report PDFs, {IP_LICENSING_GRAND_2025.sold.toLocaleString()} tickets / {fmt0(IP_LICENSING_GRAND_2025.revenue)}). No other sheets have been changed.
        </div>
      </div>

      <SKUBreakdown />
      <MonthlyTrend />
      <CommissionModel />

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>Assumptions &amp; open questions</div>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li><strong style={{ color: 'var(--cream)' }}>Booking fee model:</strong> customer pays ticket price + 10%. Holding Co keeps the 10%. Not part of venue gross.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Commission model:</strong> Holding Co takes an additional % (slider) from the venue's gross ticket sales — this is the per-venue licensing fee.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Token stripping:</strong> under the new model, arcade tokens move to in-store TILL only. Online SKUs will be re-priced to remove the £0.325 × 4 = £1.30 token component per bundle. Not yet applied — needs a new repriced product list from the venue.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Data gap:</strong> 2025 existing deck shows <code style={{ background:'rgba(255,255,255,0.05)', padding:'1px 4px', borderRadius: 3 }}>Online Golf Tickets £210,485</code>. PDF total here is £417,721 — ~2× difference. Needs reconciliation (VAT/fees? Old figure stale?). Flagged per your "do not change other sheets" instruction.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Not yet modelled:</strong> VAT on golf portion, card/processing fees inside the 10% booking fee, payout timing, refund/chargeback leakage.</li>
        </ul>
      </div>
    </div>
  )
}
