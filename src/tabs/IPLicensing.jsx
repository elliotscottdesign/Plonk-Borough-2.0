import React, { useState, useMemo, useEffect } from 'react'
import {
  IP_LICENSING_SKUS_ONLINE_2025,
  IP_LICENSING_SKUS_OFFICE_2025,
  IP_LICENSING_GRAND_2025,
  IP_LICENSING_COMMISSION_2025,
  IP_LICENSING_TOKEN_VALUE,
  IP_LICENSING_BOOKING_FEE_PCT,
  IP_LICENSING_PAYMENT_FEE_PCT,
} from '../data.js'
import ResetBtn from '../components/ResetBtn.jsx'
import MarketingUpliftCard from '../components/MarketingUpliftCard.jsx'
import { useLockedCommissions, useLockedPlonkModel } from '../components/LockedDeckContext.jsx'
import { getAccessCode } from '../lib/access-code.js'

const fmt = n => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

// --- Golf-only filter: Plonk Golf only takes commission on GOLF tickets.
//     Pool/tournament/add-ons are venue-managed (+ group bookings 12+ handled directly by venue).
const NON_GOLF_SKUS = new Set([
  'Pool Table Reservation — 30 Mins',
  'Doubles Pool Tournament',
  'Extra Arcade Tokens (add-on)',
])
const isGolfSku = sku => !NON_GOLF_SKUS.has(sku)

function sumRev(rows, predicate = () => true) {
  return rows.filter(r => predicate(r.sku)).reduce((a, r) => a + r.revenue, 0)
}

// --- Commission slider card (reused for Section A and B) ---
function CommissionSliderCard({ label, subtitle, value, onChange, accent, totalChannelRev, golfRev, nonGolfRev, max = 30, helperText, defaultValue = 10, canEdit = true }) {
  const commission = golfRev * (value / 100)
  return (
    <div style={{ background: 'var(--ink-2)', border: `1px solid ${accent}60`, borderRadius: 10, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 18, color: accent, fontWeight: 700 }}>{value}%</div>
          <ResetBtn onClick={() => { if (canEdit) onChange(defaultValue) }} title={`Reset to ${defaultValue}%`} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12, lineHeight: 1.5 }}>{subtitle}</div>
      <input type="range" min={0} max={max} step={0.5} value={value} disabled={!canEdit} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: accent, cursor: canEdit ? 'pointer' : 'not-allowed', opacity: canEdit ? 1 : 0.55 }} />
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

// --- Plonk Golf × Venue model (reads commission + booking fee from parent state) ---
// Defaults for the scenario inputs. Maintenance default = £3,000/yr
// (12 × £250) — historically the on-site upkeep allocated to Plonk
// Golf's side. Now slider-driven (user can model £0 → £15k/yr).
const PLONK_MODEL_DEFAULTS = {
  volumeUplift:    0,
  webCost:         6000,
  seoCost:         6000,
  botCost:         1200,
  accountancyCost: 3000,
  maintenanceCost: 3000,
}

function CommissionModel({ commissionOnlinePct, commissionOfficePct, bookingFeePct }) {
  // Locked snapshot of the scenario (founder-pinned, cross-device).
  // When locked, the inputs come from the snapshot — sliders disabled.
  // When unlocked, inputs are local working state seeded from the last
  // locked snapshot (or defaults).
  const modelLock = useLockedPlonkModel()
  const lockedValues = modelLock.locked?.values
  const seedValues = lockedValues || PLONK_MODEL_DEFAULTS

  const [volumeUplift, setVolumeUplift]       = useState(seedValues.volumeUplift)
  const [webCost, setWebCost]                 = useState(seedValues.webCost)
  const [seoCost, setSeoCost]                 = useState(seedValues.seoCost)
  const [botCost, setBotCost]                 = useState(seedValues.botCost)
  const [accountancyCost, setAccountancyCost] = useState(seedValues.accountancyCost)
  const [maintenanceCost, setMaintenanceCost] = useState(seedValues.maintenanceCost)

  // Re-seed local state when a lock arrives (cross-device hydrate or
  // founder lock action) so unlocking resumes editing from the latest
  // locked snapshot rather than stale defaults.
  useEffect(() => {
    if (lockedValues) {
      if (Number.isFinite(lockedValues.volumeUplift))    setVolumeUplift(lockedValues.volumeUplift)
      if (Number.isFinite(lockedValues.webCost))         setWebCost(lockedValues.webCost)
      if (Number.isFinite(lockedValues.seoCost))         setSeoCost(lockedValues.seoCost)
      if (Number.isFinite(lockedValues.botCost))         setBotCost(lockedValues.botCost)
      if (Number.isFinite(lockedValues.accountancyCost)) setAccountancyCost(lockedValues.accountancyCost)
      if (Number.isFinite(lockedValues.maintenanceCost)) setMaintenanceCost(lockedValues.maintenanceCost)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelLock.locked])

  // Effective values that drive the P&L — locked snapshot if locked,
  // else live editing state.
  const eff = lockedValues
    ? {
        volumeUplift:    lockedValues.volumeUplift    ?? volumeUplift,
        webCost:         lockedValues.webCost         ?? webCost,
        seoCost:         lockedValues.seoCost         ?? seoCost,
        botCost:         lockedValues.botCost         ?? botCost,
        accountancyCost: lockedValues.accountancyCost ?? accountancyCost,
        maintenanceCost: lockedValues.maintenanceCost ?? maintenanceCost,
      }
    : { volumeUplift, webCost, seoCost, botCost, accountancyCost, maintenanceCost }

  const isLocked = modelLock.isLocked
  const canEdit  = !isLocked && modelLock.isFounder
  const lockedAtLabel = modelLock.locked?.lockedAt
    ? new Date(modelLock.locked.lockedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : null

  const m = useMemo(() => {
    const upliftFactor = 1 + eff.volumeUplift / 100
    // Online: full (all SKUs) and golf-only
    const onlineGrossAll = IP_LICENSING_GRAND_2025.onlineRev * upliftFactor
    const onlineGolfRev = sumRev(IP_LICENSING_SKUS_ONLINE_2025, isGolfSku) * upliftFactor
    // Booking fee applies to ALL online sales (customer pays X% on top at checkout, regardless of SKU)
    const bookingFees = onlineGrossAll * (bookingFeePct / 100)
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
    const plonkGolfCosts = eff.maintenanceCost + eff.webCost + eff.seoCost + eff.botCost + eff.accountancyCost + paymentFees
    const plonkGolfNet = plonkGolfRevenue - plonkGolfCosts
    const totalTokenCost = IP_LICENSING_SKUS_ONLINE_2025.reduce((a, s) => a + s.sold * upliftFactor * s.tokens * IP_LICENSING_TOKEN_VALUE, 0)
    const venueNet = onlineGrossAll - commissionOnline - totalTokenCost
    return { onlineGrossAll, onlineGolfRev, officeGrossAll, officeGolfRev, bookingFees, commissionOnline, commissionOffice, paymentFees, plonkGolfRevenue, plonkGolfCosts, plonkGolfNet, totalTokenCost, venueNet }
  }, [commissionOnlinePct, commissionOfficePct, bookingFeePct, eff.volumeUplift, eff.webCost, eff.seoCost, eff.botCost, eff.accountancyCost, eff.maintenanceCost])

  const sliders = [
    { label: 'Volume uplift (vs 2025 online)', value: eff.volumeUplift, set: setVolumeUplift, min: -20, max: 50, step: 1, suffix: '%', color: '#2DD4BF', default: PLONK_MODEL_DEFAULTS.volumeUplift },
    { label: 'Website + booking system', value: eff.webCost, set: setWebCost, min: 0, max: 20000, step: 500, prefix: '£', suffix: '/yr', color: '#4FC3F7', default: PLONK_MODEL_DEFAULTS.webCost },
    { label: 'SEO (non-venue-specific)', value: eff.seoCost, set: setSeoCost, min: 0, max: 20000, step: 500, prefix: '£', suffix: '/yr', color: '#4FC3F7', default: PLONK_MODEL_DEFAULTS.seoCost },
    { label: 'Chatbot / AI booking', value: eff.botCost, set: setBotCost, min: 0, max: 10000, step: 100, prefix: '£', suffix: '/yr', color: '#4FC3F7', default: PLONK_MODEL_DEFAULTS.botCost },
    { label: 'Accountancy fees', value: eff.accountancyCost, set: setAccountancyCost, min: 0, max: 15000, step: 250, prefix: '£', suffix: '/yr', color: '#4FC3F7', default: PLONK_MODEL_DEFAULTS.accountancyCost },
    { label: 'Maintenance', value: eff.maintenanceCost, set: setMaintenanceCost, min: 0, max: 15000, step: 250, prefix: '£', suffix: '/yr', color: '#4FC3F7', default: PLONK_MODEL_DEFAULTS.maintenanceCost },
  ]

  const handleLock = () => {
    if (!canEdit) return
    modelLock.lock({ volumeUplift, webCost, seoCost, botCost, accountancyCost, maintenanceCost })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--ink-2)', border: isLocked ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:4, flexWrap:'wrap' }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
            Plonk Golf × Venue — Interactive Model
          </div>
          {modelLock.isFounder && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'3px 10px', borderRadius:12,
                background: isLocked ? 'rgba(16,185,129,0.12)' : 'rgba(201,168,76,0.08)',
                border: `1px solid ${isLocked ? 'rgba(16,185,129,0.4)' : 'rgba(201,168,76,0.2)'}`,
                fontSize:10, color: isLocked ? '#10B981' : 'var(--gold-dim)',
                letterSpacing:'0.08em', textTransform:'uppercase',
              }}>
                <span style={{ fontSize:9 }}>{isLocked ? '🔒' : '○'}</span>
                {isLocked
                  ? (lockedAtLabel ? `Locked · ${lockedAtLabel}` : 'Locked scenario')
                  : 'Live preview'}
              </span>
              {isLocked ? (
                <button onClick={modelLock.unlock} style={{ fontSize:11, fontWeight:600, padding:'5px 14px', borderRadius:4, background:'transparent', color:'var(--gold)', border:'1px solid var(--gold)', cursor:'pointer', letterSpacing:'0.06em', textTransform:'uppercase' }}>🔓 Unlock</button>
              ) : (
                <button onClick={handleLock} style={{ fontSize:11, fontWeight:600, padding:'5px 14px', borderRadius:4, background:'var(--gold)', color:'var(--ink)', border:'1px solid var(--gold)', cursor:'pointer', letterSpacing:'0.06em', textTransform:'uppercase' }}>🔒 Lock</button>
              )}
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>
          Commission rates and booking fee come from the Commissions section sliders. Booking fee applies to ALL online sales at checkout. Uplift and cost sliders below are scenario inputs.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {sliders.map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--cream)' }}>{s.label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: s.color, fontWeight: 700 }}>{s.prefix || ''}{Number(s.value).toLocaleString()}{s.suffix || ''}</span>
                  <ResetBtn onClick={() => { if (canEdit) s.set(s.default) }} title={`Reset to ${s.prefix || ''}${s.default.toLocaleString()}${s.suffix || ''}`} />
                </span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.value} disabled={!canEdit} onChange={e => s.set(Number(e.target.value))} style={{ width: '100%', accentColor: s.color, cursor: canEdit ? 'pointer' : 'not-allowed', opacity: canEdit ? 1 : 0.55 }} />
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
          <Row label={`+ Booking fees collected (${bookingFeePct}% on all online)`} value={fmt0(m.bookingFees)} color="#E67E22" />
          <Row label={`+ Commission from Venue — Online sales (${commissionOnlinePct}% × golf)`} value={fmt0(m.commissionOnline)} color="#C9A84C" />
          <Row label={`+ Commission from Venue — Office sales (${commissionOfficePct}% × golf)`} value={fmt0(m.commissionOffice)} color="#C9A84C" />
          <Row label="= Plonk Golf revenue" value={fmt0(m.plonkGolfRevenue)} color="var(--cream)" bold />
          <div style={{ height: 10 }} />
          <Row label="− Maintenance" value={fmt0(eff.maintenanceCost)} color="#EF4444" />
          <Row label="− Website + booking system" value={fmt0(eff.webCost)} color="#EF4444" />
          <Row label="− SEO" value={fmt0(eff.seoCost)} color="#EF4444" />
          <Row label="− Chatbot / AI booking" value={fmt0(eff.botCost)} color="#EF4444" />
          <Row label="− Accountancy fees" value={fmt0(eff.accountancyCost)} color="#EF4444" />
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

  // Commission state — sourced from the LockedDeckContext so the
  // founder's slider positions cascade into the venue P&L (Business
  // Explorer · 2026 Performance) and every scenario calc in the deck.
  // Booking fee stays local — it's not Plonk's revenue under the new
  // model (it's collected at checkout and goes to the bookings system
  // to cover its costs), so it never appears as a venue cost.
  const commissionsLock = useLockedCommissions()
  const commissionOnlinePct = commissionsLock.effective.onlinePct
  const commissionOfficePct = commissionsLock.effective.officePct
  const setCommissionOnlinePct = (v) => commissionsLock.setRate('onlinePct', v)
  const setCommissionOfficePct = (v) => commissionsLock.setRate('officePct', v)
  const [bookingFeePct, setBookingFeePct] = useState(IP_LICENSING_BOOKING_FEE_PCT * 100)

  const onlineGolfRev = sumRev(IP_LICENSING_SKUS_ONLINE_2025, isGolfSku)
  const onlineNonGolfRev = sumRev(IP_LICENSING_SKUS_ONLINE_2025, s => !isGolfSku(s))
  const officeGolfRev = sumRev(IP_LICENSING_SKUS_OFFICE_2025, isGolfSku)
  const officeNonGolfRev = sumRev(IP_LICENSING_SKUS_OFFICE_2025, s => !isGolfSku(s))

  const commission2025 = IP_LICENSING_COMMISSION_2025.onlineTicketCommission
  const commission2026Online = onlineGolfRev * (commissionOnlinePct / 100)
  const commission2026Office = officeGolfRev * (commissionOfficePct / 100)
  const commission2026BookingFees = g.onlineRev * (bookingFeePct / 100)
  const commission2026 = commission2026Online + commission2026Office + commission2026BookingFees

  const ONLINE_GREEN = '#10B981'
  const OFFICE_GOLD = 'var(--gold)'
  const COMMISSION_CYAN = '#2DD4BF'

  // 'Plonk × No Dice' is a Plonk-Golf-side P&L view (company costing for
  // Plonk Golf Ltd, not for the venue). Only the canonical founder code
  // 888999 should see it — JOHN1 gets the Plonk top-tab (observer-founder
  // tier) but is intentionally excluded from this view.
  const isCanonicalFounder = getAccessCode() === '888999'

  const [activeSection, setActiveSection] = useState('commissions')
  const sections = [
    { key: 'commissions',label: 'Commissions',             sub: 'Online · Office · Booking fee',       color: COMMISSION_CYAN },
    { key: 'online',     label: '2025 Online Sales',       sub: 'Section A',                           color: ONLINE_GREEN },
    { key: 'office',     label: '2025 Office Sales',       sub: 'Section B',                           color: OFFICE_GOLD },
    { key: 'marketing',  label: 'Marketing Uplift',        sub: 'Forecast tickets · capacity check',   color: '#E67E22' },
    ...(isCanonicalFounder
      ? [{ key: 'plonk', label: 'Plonk × No Dice',         sub: 'Interactive P&L + venue view',        color: 'var(--gold)' }]
      : []),
    { key: 'notes',      label: 'Assumptions',             sub: 'Open questions · methodology',        color: '#9CA3AF' },
  ]
  // Defensive: if the section the user had selected has been stripped
  // (e.g. they were on 'plonk' and later signed in as a non-888999),
  // bounce them back to Commissions so the right pane never goes blank.
  const safeActiveSection = sections.some(s => s.key === activeSection) ? activeSection : 'commissions'

  const [openBubble, setOpenBubble] = useState(null)
  const bubbles = [
    {
      key: 'online-tickets',
      label: 'Online Tickets',
      value: g.onlineQty.toLocaleString(),
      sub: `${(onlinePct * 100).toFixed(1)}% of volume`,
      color: ONLINE_GREEN,
      detail: <>Tickets booked + paid through the DMN online portal during 2025 (status = <code style={{ background:'rgba(255,255,255,0.06)', padding:'1px 5px', borderRadius:3 }}>complete</code>). The dominant channel — under the Plonk Golf × Venue model this is the only channel that generates licensing commission by default.</>,
    },
    {
      key: 'online-revenue',
      label: 'Online Revenue',
      value: fmt0(g.onlineRev),
      sub: `${(g.onlineRev / g.totalRev * 100).toFixed(1)}% of total £ · actual`,
      color: ONLINE_GREEN,
      detail: <>Actual £ recorded by the DMN portal — not imputed. Reconciles within rounding to the deck's "Online Golf Tickets" headline. This figure is the gross online sale; Plonk Golf's commission is taken from it (golf-only SKUs).</>,
    },
    {
      key: 'office-tickets',
      label: 'Office Tickets',
      value: g.officeQty.toLocaleString(),
      sub: `${((1 - onlinePct) * 100).toFixed(1)}% of volume`,
      color: OFFICE_GOLD,
      detail: <>Bookings taken by the office/bookings team and settled at the venue till (status = <code style={{ background:'rgba(255,255,255,0.06)', padding:'1px 5px', borderRadius:3 }}>external</code>). DMN records the booking but not the payment. Going forward customers either self-serve online or contact the venue directly.</>,
    },
    {
      key: 'office-revenue',
      label: 'Office Revenue',
      value: fmt0(g.officeRev),
      sub: `${(g.officeRev / g.totalRev * 100).toFixed(1)}% of total £ · imputed`,
      color: OFFICE_GOLD,
      detail: <>Imputed at SKU list price (qty × price) because till payments don't flow through the online system. Actual till takings may differ if the office team discounts/comps. Plonk Golf only earns commission on this channel under the conditional bookings-manager scenario (slider B).</>,
    },
    {
      key: 'commission-2025',
      label: '2025 Plonk Commission',
      value: fmt0(commission2025),
      sub: 'verified · DMN arrangement',
      color: COMMISSION_CYAN,
      detail: <>Online ticket commission already booked under the existing Design My Night arrangement during 2025 — verified from the Borough weekly P&L (source: <em>Borough Weekly Totals CATEGORISED PAST 14 MONTHS V2.xlsx</em>, row 67, sum of cols 12-63). This is Plonk Golf P&L income, NOT venue revenue. Going forward the same commercial relationship moves from Design My Night to No Dice Bars LTD with the same effective rate.</>,
    },
    {
      key: 'commission-2026',
      label: '2026 Plonk Commission',
      value: fmt0(commission2026),
      sub: `${commissionOnlinePct}% online · ${commissionOfficePct}% office · ${bookingFeePct}% booking fee`,
      color: COMMISSION_CYAN,
      detail: <>Live projection driven by the three sliders inside the <strong style={{ color: 'var(--cream)' }}>Commissions</strong> section. Online golf: {fmt0(onlineGolfRev)} × {commissionOnlinePct}% = <strong style={{ color: 'var(--cream)' }}>{fmt0(commission2026Online)}</strong>. Office golf: {fmt0(officeGolfRev)} × {commissionOfficePct}% = <strong style={{ color: 'var(--cream)' }}>{fmt0(commission2026Office)}</strong>. Booking fee: {fmt0(g.onlineRev)} × {bookingFeePct}% = <strong style={{ color: 'var(--cream)' }}>{fmt0(commission2026BookingFees)}</strong>. Based on 2025 base volume — uplift scenarios are layered in the Plonk × No Dice section.</>,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13 }}>
      <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '14px 18px' }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
          IP &amp; Licensing — dev sheet (Borough 2025, split by channel)
        </div>
        <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
          Source: <strong style={{ color: 'var(--cream)' }}>ALL DMN 2025 transactions</strong>, filtered to Borough venue only, split by Status column. Online revenue is actual portal revenue; office revenue is imputed at SKU list price (qty × price) because till payments don't appear in the online system. Under the Plonk Golf × Venue model, only the online channel generates Plonk Golf revenue.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginTop: 14 }}>
          {bubbles.map(b => (
            <StatBubble
              key={b.key}
              label={b.label}
              value={b.value}
              sub={b.sub}
              color={b.color}
              expanded={openBubble === b.key}
              onClick={() => setOpenBubble(openBubble === b.key ? null : b.key)}
            />
          ))}
        </div>
        {openBubble && (() => {
          const b = bubbles.find(x => x.key === openBubble)
          if (!b) return null
          return (
            <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${b.color}`, borderRadius: 6, fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
              <div style={{ fontSize: 10, color: b.color, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>{b.label}</div>
              {b.detail}
            </div>
          )
        })()}
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10, display:'flex', justifyContent:'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
          <span>Combined Borough 2025 revenue</span>
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{fmt0(g.totalRev)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 18, alignItems: 'start' }}>
        <SectionIndex sections={sections} active={safeActiveSection} onSelect={setActiveSection} />

        <div>
          {safeActiveSection === 'online' && (
            <SKUTable
              title="Section A · Online Portal (Status = complete)"
              subtitle="Customer books + pays through the online system. Booking fee added on top, retained by Plonk Golf. Commission charged to venue on online golf sales only (see Commissions section)."
              rows={IP_LICENSING_SKUS_ONLINE_2025}
              accentColor={ONLINE_GREEN}
              channel="online"
            />
          )}

          {safeActiveSection === 'office' && (
            <SKUTable
              title="Section B · Office / External (Status = external)"
              subtitle="Bookings taken by the office/bookings team. Payment is settled at the venue till. Revenue column is IMPUTED at SKU list price (qty × price). Booking fee column is £0 because till sales don't carry the online booking fee."
              rows={IP_LICENSING_SKUS_OFFICE_2025}
              accentColor={OFFICE_GOLD}
              channel="office"
            />
          )}

          {safeActiveSection === 'commissions' && (
            <CommissionsSection
              commissionOnlinePct={commissionOnlinePct}
              setCommissionOnlinePct={setCommissionOnlinePct}
              commissionOfficePct={commissionOfficePct}
              setCommissionOfficePct={setCommissionOfficePct}
              bookingFeePct={bookingFeePct}
              setBookingFeePct={setBookingFeePct}
              onlineGolfRev={onlineGolfRev}
              onlineNonGolfRev={onlineNonGolfRev}
              officeGolfRev={officeGolfRev}
              officeNonGolfRev={officeNonGolfRev}
              onlineGrossAll={g.onlineRev}
              commission2026Online={commission2026Online}
              commission2026Office={commission2026Office}
              commission2026BookingFees={commission2026BookingFees}
              commission2026={commission2026}
              accent={COMMISSION_CYAN}
              commissionsLock={commissionsLock}
            />
          )}

          {safeActiveSection === 'marketing' && <MarketingUpliftCard />}

          {safeActiveSection === 'plonk' && (
            <CommissionModel
              commissionOnlinePct={commissionOnlinePct}
              commissionOfficePct={commissionOfficePct}
              bookingFeePct={bookingFeePct}
            />
          )}

          {safeActiveSection === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>
                <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>Assumptions &amp; open questions</div>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  <li><strong style={{ color: 'var(--cream)' }}>Channel split:</strong> ~{(onlinePct * 100).toFixed(0)}% of 2025 tickets (and ~{(g.onlineRev / g.totalRev * 100).toFixed(0)}% of revenue) came via the online portal. The remaining ~{((1-onlinePct) * 100).toFixed(0)}% were office/till bookings. Under the new model this office channel goes away: those customers must self-serve online or contact the venue directly.</li>
                  <li><strong style={{ color: 'var(--cream)' }}>Office revenue is imputed</strong> at each SKU's list price (qty × price = £{g.officeRev.toLocaleString('en-GB', {minimumFractionDigits:2})}). Actual till revenue may differ if the office team discounts/comps. Swap in real till takings when available.</li>
                  <li><strong style={{ color: 'var(--cream)' }}>Package &amp; private-hire mismatch:</strong> some office tickets will have been inputted at full SKU price but the actual £ taken was the package / private-hire rate. The imputed office revenue therefore overstates till takings on those bookings — actual till revenue would be lower than the list-price imputation suggests.</li>
                  <li><strong style={{ color: 'var(--cream)' }}>Online total (£{g.onlineRev.toLocaleString('en-GB', {minimumFractionDigits:2})}) reconciles</strong> with the existing deck's "Online Golf Tickets £210,485" line — small delta is from SKU categorisation edge cases (pool table reservations etc.).</li>
                  <li><strong style={{ color: 'var(--cream)' }}>Booking fee:</strong> customer pays ticket + booking fee on top. Plonk Golf keeps it (funds online funnel). Not part of venue gross.</li>
                  <li><strong style={{ color: 'var(--cream)' }}>Commission %:</strong> separate, taken from venue's gross online sales — Plonk Golf's per-venue licensing fee.</li>
                  <li><strong style={{ color: 'var(--cream)' }}>Payment processing 1.5%:</strong> Stripe-style fee applied to all revenue that flows through the online payment provider — online portal sales always, office bookings only when Plonk Golf's bookings manager processes them digitally. Sits as a cost on the Plonk Golf P&amp;L.</li>
                  <li><strong style={{ color: 'var(--cream)' }}>Token stripping:</strong> under new model, arcade tokens move to in-store TILL only. Online SKUs will be re-priced to remove the £0.325 × 4 = £1.30 token component per bundle. Not yet applied — needs a new repriced product list from the venue.</li>
                  <li><strong style={{ color: 'var(--cream)' }}>Not yet modelled:</strong> VAT on golf portion, card/processing fees inside the booking fee, refund/chargeback leakage (£135 fully-refunded in 2025 — immaterial), the ~9.8k unexplained tickets in the earlier PDF-summary extract (that data path superseded).</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionIndex({ sections, active, onSelect }) {
  return (
    <div style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, padding: '4px 8px', marginBottom: 4 }}>Sections</div>
      {sections.map(s => {
        const isActive = active === s.key
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onSelect(s.key)}
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: '1px solid',
              borderColor: isActive ? s.color : 'rgba(255,255,255,0.06)',
              borderLeft: `3px solid ${isActive ? s.color : 'transparent'}`,
              borderRadius: 6,
              padding: '10px 12px',
              font: 'inherit',
              color: 'inherit',
              transition: 'background 120ms ease, border-color 120ms ease',
            }}
          >
            <div style={{ fontSize: 12, color: isActive ? 'var(--cream)' : 'var(--cream-dim)', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: isActive ? s.color : '#6B7280', marginTop: 2 }}>{s.sub}</div>
          </button>
        )
      })}
    </div>
  )
}

function CommissionsSection({
  commissionOnlinePct, setCommissionOnlinePct,
  commissionOfficePct, setCommissionOfficePct,
  bookingFeePct, setBookingFeePct,
  onlineGolfRev, onlineNonGolfRev,
  officeGolfRev, officeNonGolfRev,
  onlineGrossAll,
  commission2026Online, commission2026Office, commission2026BookingFees, commission2026,
  accent,
  commissionsLock,
}) {
  const { isLocked, isFounder, snapshot, lock, unlock, reset } = commissionsLock || {}
  const lockedAtLabel = snapshot?.lockedAt
    ? new Date(snapshot.lockedAt).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' })
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: `${accent}10`, border: `1px solid ${isLocked ? 'rgba(16,185,129,0.5)' : accent + '40'}`, borderRadius: 10, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap:12, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Commissions · 2026 Plonk income from venue</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
              Two locked sliders cascade into the 2026 Performance cost donut as <strong style={{ color:'var(--cream)' }}>Plonk Commission</strong>. Booking fee is collected at checkout but goes to the bookings system — never to Plonk or the venue.
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total 2026</div>
            <div className="serif" style={{ fontSize: 26, color: accent, fontWeight: 800, lineHeight: 1.1 }}>{fmt0(commission2026)}</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>matches top bubble</div>
          </div>
        </div>

        {/* Lock toolbar — Live preview / Locked pill on the left, Reset / Lock on the right */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginTop:12, flexWrap:'wrap' }}>
          <span style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'3px 10px', borderRadius:12,
            background: isLocked ? 'rgba(16,185,129,0.12)' : 'rgba(201,168,76,0.08)',
            border: `1px solid ${isLocked ? 'rgba(16,185,129,0.4)' : 'rgba(201,168,76,0.2)'}`,
            fontSize:10, color: isLocked ? '#10B981' : 'var(--gold-dim)',
            letterSpacing:'0.08em', textTransform:'uppercase',
          }}>
            <span style={{ fontSize:9 }}>{isLocked ? '🔒' : '○'}</span>
            {isLocked
              ? (lockedAtLabel ? `Locked · ${lockedAtLabel} · cascades to 2026 Performance` : 'Locked · cascades to 2026 Performance')
              : 'Live preview · slide values cascade once locked'}
          </span>
          {isFounder && (
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={reset} style={{ fontSize:11, padding:'5px 12px', borderRadius:4, background:'transparent', color:'var(--cream-dim)', border:'1px solid rgba(201,168,76,0.3)', cursor:'pointer' }}>Reset</button>
              {isLocked ? (
                <button onClick={unlock} style={{ fontSize:11, fontWeight:600, padding:'5px 14px', borderRadius:4, background:'transparent', color:'var(--gold)', border:'1px solid var(--gold)', cursor:'pointer', letterSpacing:'0.06em', textTransform:'uppercase' }}>🔓 Unlock</button>
              ) : (
                <button onClick={lock} style={{ fontSize:11, fontWeight:600, padding:'5px 14px', borderRadius:4, background:'var(--gold)', color:'var(--ink)', border:'1px solid var(--gold)', cursor:'pointer', letterSpacing:'0.06em', textTransform:'uppercase' }}>🔒 Lock</button>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
          <MiniStat label="Online golf commission" value={fmt0(commission2026Online)} color={accent} />
          <MiniStat label="Office golf commission" value={fmt0(commission2026Office)} color={accent} />
          <MiniStat label="Booking fees collected" value={fmt0(commission2026BookingFees)} color={accent} />
        </div>
      </div>

      <CommissionSliderCard
        label="Commission % — Online golf sales"
        subtitle="Applied to online GOLF ticket sales only. Pool tables, events, group bookings 12+ and specials are venue-managed — no Plonk Golf commission on those."
        value={commissionOnlinePct}
        onChange={setCommissionOnlinePct}
        accent={accent}
        totalChannelRev={onlineGrossAll}
        golfRev={onlineGolfRev}
        nonGolfRev={onlineNonGolfRev}
        helperText="Excluded from commission: Pool Table Reservation, Doubles Pool Tournament, Extra Arcade Tokens."
        canEdit={!!commissionsLock?.canEdit}
      />

      <CommissionSliderCard
        label="Commission % — Office golf sales (if Plonk Golf provides bookings manager)"
        subtitle="Conditional scenario: if Plonk Golf provides a bookings manager for the venue, it earns a commission on office/till-settled golf sales. Set to 0% to model venue-handles-own-bookings."
        value={commissionOfficePct}
        onChange={setCommissionOfficePct}
        accent={accent}
        totalChannelRev={officeGolfRev + officeNonGolfRev}
        golfRev={officeGolfRev}
        nonGolfRev={officeNonGolfRev}
        helperText="Same golf-only scope as online. Office-channel revenue is imputed at SKU list price — Plonk Golf commission on it is a modelled scenario, not a current revenue stream."
        canEdit={!!commissionsLock?.canEdit}
      />

      <BookingFeeSliderCard
        value={bookingFeePct}
        onChange={setBookingFeePct}
        onlineGrossAll={onlineGrossAll}
        accent={accent}
      />
    </div>
  )
}

function BookingFeeSliderCard({ value, onChange, onlineGrossAll, accent }) {
  const collected = onlineGrossAll * (value / 100)
  return (
    <div style={{ background: 'var(--ink-2)', border: `1px solid ${accent}60`, borderRadius: 10, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Booking fee % — applied to ALL online sales</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 18, color: accent, fontWeight: 700 }}>{value}%</div>
          <ResetBtn onClick={() => onChange(IP_LICENSING_BOOKING_FEE_PCT * 100)} title={`Reset to ${IP_LICENSING_BOOKING_FEE_PCT * 100}%`} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12, lineHeight: 1.5 }}>
        Customer pays ticket + this % on top at checkout. Retained by Plonk Golf as the online-funnel surcharge. Applies to ALL online SKUs (golf, pool, specials) — not till sales.
      </div>
      <input type="range" min={0} max={20} step={0.5} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: accent }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B7280', marginTop: 2, marginBottom: 14 }}>
        <span>0%</span><span>20%</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <MiniStat label="Online gross (all SKUs)" value={fmt0(onlineGrossAll)} color="var(--cream)" />
        <MiniStat label={`Booking fees @ ${value}%`} value={fmt0(collected)} color={accent} emphasised />
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

function StatBubble({ label, value, sub, color, expanded, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        background: expanded ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${expanded ? color : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 8,
        padding: '10px 12px',
        font: 'inherit',
        color: 'inherit',
        transition: 'background 120ms ease, border-color 120ms ease',
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, paddingRight: 14 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3, lineHeight: 1.3 }}>{sub}</div>
      <span aria-hidden style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, color: expanded ? color : '#6B7280', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 120ms ease' }}>▾</span>
    </button>
  )
}
