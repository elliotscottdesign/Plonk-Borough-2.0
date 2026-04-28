import React, { useState } from 'react'
import {
  IP_LICENSING_SKUS_ONLINE_2025,
  IP_LICENSING_SKUS_OFFICE_2025,
} from '../data.js'
import ResetBtn from './ResetBtn.jsx'

// ───────────────────────────────────────────────────────────────────────
// Marketing-Driven Ticket Uplift card — shared between two views:
//
//   1. Plonk → IP & Licensing  (operator-side, near commission sliders)
//   2. Plonk → Digital Marketing  (alongside the GA4 forecast calculator)
//
// Each instance has its own local state, so the two views can show
// different scenarios side-by-side. Default uplift is 8,000 tickets/yr;
// default capacity assumptions are 60 players/hr × 12 hrs/day × 360 days
// × 40% realistic utilisation.
// ───────────────────────────────────────────────────────────────────────

const fmt  = n => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt0 = n => '£' + Math.round(n).toLocaleString()

export default function MarketingUpliftCard() {
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
  // ─── Venue capacity assumptions (editable) ───────────────────────────
  // Defaults: 60 players/hr peak ceiling. Open hours and utilisation
  // factor are blended estimates — realistic utilisation accounts for
  // weekday daytime sitting well below peak.
  const [maxPerHour,      setMaxPerHour]     = useState(60)
  const [openHoursPerDay, setOpenHoursPerDay] = useState(12)
  const [daysPerYear,     setDaysPerYear]    = useState(360)
  const [utilisationPct,  setUtilisationPct] = useState(40)

  const theoreticalMax = maxPerHour * openHoursPerDay * daysPerYear
  const realisticMax   = Math.round(theoreticalMax * (utilisationPct / 100))
  const forecast2026   = total2025 + extraTickets
  const util2025       = realisticMax > 0 ? (total2025 / realisticMax) * 100 : 0
  const util2026       = realisticMax > 0 ? (forecast2026 / realisticMax) * 100 : 0
  const headroom       = realisticMax - forecast2026

  const utilColor = util2026 < 70 ? '#2DD4BF' : util2026 < 90 ? '#E67E22' : '#EF4444'
  const statusMessage =
    util2026 >= 100 ? `⚠ Exceeds realistic capacity by ${(forecast2026 - realisticMax).toLocaleString()} tickets — uplift not achievable at current open hours / utilisation.` :
    util2026 >= 90  ? `⚠ Approaching realistic capacity (${util2026.toFixed(0)}%) — peak slots likely fully booked. Off-peak still has room.` :
    util2026 >= 70  ? `Comfortable: ${util2026.toFixed(0)}% of realistic capacity. Healthy headroom on weekday + Sunday slots.` :
                      `✓ Well within realistic capacity (${util2026.toFixed(0)}%). ${headroom.toLocaleString()} tickets headroom for further growth.`

  const rows = combined.map(r => {
    const share        = total2025 > 0 ? r.sold2025 / total2025 : 0
    const extraForSku  = Math.round(extraTickets * share)
    const extraRevenue = extraForSku * r.price
    const newTotal     = r.sold2025 + extraForSku
    return { ...r, share, extraForSku, extraRevenue, newTotal }
  })
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
        2025 sales mix. The capacity check below validates that the projected volume actually fits
        inside venue capacity at realistic utilisation.
      </div>

      {/* ─── Venue capacity context ──────────────────────────────── */}
      <div style={{ background: 'rgba(0,0,0,0.20)', border: `1px solid ${utilColor}33`, borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Venue Capacity Reality Check</span>
          <span style={{ fontSize: 11, color: '#6B7280' }}>theoretical max {theoreticalMax.toLocaleString()} · realistic {realisticMax.toLocaleString()}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
          <CapacityInput label="Max players / hr"   value={maxPerHour}      setValue={setMaxPerHour}      step={5}  />
          <CapacityInput label="Open hrs / day"     value={openHoursPerDay} setValue={setOpenHoursPerDay} step={1}  />
          <CapacityInput label="Days open / yr"     value={daysPerYear}     setValue={setDaysPerYear}     step={5}  />
          <CapacityInput label="Realistic util %"   value={utilisationPct}  setValue={setUtilisationPct}  step={5} suffix="%" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <UtilBar label="2025 actual"    value={total2025}    pct={util2025} color="#9CA3AF" />
          <UtilBar label="2026 forecast"  value={forecast2026} pct={util2026} color={utilColor} highlight />
        </div>

        <div style={{ marginTop: 12, padding: '8px 12px', background: `${utilColor}10`, border: `1px solid ${utilColor}30`, borderRadius: 6, fontSize: 11.5, color: '#D1D5DB', lineHeight: 1.5 }}>
          {statusMessage}
        </div>
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
        <UpliftStat label="Additional Tickets" value={extraTickets.toLocaleString()} sub="across all SKUs"               color="#4FC3F7" />
        <UpliftStat label="Blended Ticket £"   value={fmt(blendedTicketPrice)}        sub="weighted avg price"           color="#9CA3AF" />
        <UpliftStat label="Revenue Uplift"     value={fmt0(totalRevenueUplift)}       sub="annual"                       color="var(--gold)" />
        <UpliftStat label="2026 Forecast Vol"  value={(total2025 + extraTickets).toLocaleString()} sub={`vs 2025 ${total2025.toLocaleString()}`} color="#2DD4BF" />
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
        calculator output (Google Ads conversions/yr + SEO conversions/yr). Capacity check above
        flags whether the projected volume fits inside the venue's realistic operating window
        (max-players / open hours / utilisation).
      </div>
    </div>
  )
}

// ─── Local helpers ────────────────────────────────────────────────────

function UpliftStat({ label, value, sub, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function CapacityInput({ label, value, setValue, step = 1, suffix }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 9.5, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <input
          type="number" min={0} step={step}
          value={value}
          onChange={e => setValue(Math.max(0, Number(e.target.value) || 0))}
          style={{
            width: '100%', padding: '4px 6px', textAlign: 'right',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(79,195,247,0.3)',
            borderRadius: 4, color: '#4FC3F7', fontWeight: 600, fontSize: 12,
          }}
        />
        {suffix && <span style={{ fontSize: 11, color: '#6B7280' }}>{suffix}</span>}
      </span>
    </label>
  )
}

function UtilBar({ label, value, pct, color, highlight }) {
  const cappedPct = Math.min(100, pct)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
        <span style={{ color: highlight ? 'var(--cream)' : '#9CA3AF', fontWeight: highlight ? 600 : 400 }}>{label}</span>
        <span style={{ color: '#9CA3AF' }}>
          <span style={{ color: highlight ? 'var(--cream)' : '#9CA3AF', fontWeight: 600 }}>{value.toLocaleString()}</span>
          <span style={{ color: '#6B7280' }}> tickets / </span>
          <span style={{ color }}>{pct.toFixed(0)}%</span>
          <span style={{ color: '#6B7280' }}> of realistic</span>
        </span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', width: `${cappedPct}%`, background: color, transition: 'width 0.2s, background 0.2s' }} />
        {pct > 100 && (
          <div style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: '#FFF', fontWeight: 700 }}>OVER</div>
        )}
      </div>
    </div>
  )
}
