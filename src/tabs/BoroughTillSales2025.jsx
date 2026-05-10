import React, { useState } from 'react'
import { BOROUGH_2025_TILL_SALES, BOROUGH_2025_DISCOUNTS, BOROUGH_2025_DISCOUNT_CODES } from '../data/borough2025TillSales.js'

// Palette mirrors the Hackney 2025 Till Sales tab so the visual language is
// identical across the two decks. Borough has 21 categories, Hackney 28 —
// the palette wraps via modulo, so the cycle repeats for the long tail.
const TILL_CAT_PALETTE = [
  '#FBBF24', '#22D3EE', '#A78BFA', '#34D399', '#FB7185',
  '#60A5FA', '#F472B6', '#A3E635', '#FCD34D', '#F97316',
  '#67E8F9', '#C4B5FD', '#6EE7B7', '#FDA4AF', '#93C5FD',
  '#94A3B8',
]

const fmtMoney = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const fmtN = (n) => n.toLocaleString('en-GB')

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}40`, borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// `section` lets the 2025 Performance index split this component into
// the Till Sales-only view and the Discounts-only view. Default 'all'
// preserves the previous single-page layout for any caller that just
// renders <BoroughTillSales2025 />.
export default function BoroughTillSales2025({ section = 'all' }) {
  const [discOpen, setDiscOpen] = useState(false)
  const [showMinor, setShowMinor] = useState(false)
  const showTill      = section === 'all' || section === 'till'
  const showDiscounts = section === 'all' || section === 'discounts'
  const forceDiscOpen = section === 'discounts'   // expand by default in dedicated view
  const discIsOpen    = forceDiscOpen || discOpen
  const data = BOROUGH_2025_TILL_SALES
  const disc = BOROUGH_2025_DISCOUNTS
  const codes = BOROUGH_2025_DISCOUNT_CODES
  const { categories, months, monthlyTotals, totalRevenue, totalTxns, lastDate } = data
  const avgSpend = totalRevenue / Math.max(1, totalTxns)
  const peakIdx = monthlyTotals.reduce((bi, v, i, arr) => v > arr[bi] ? i : bi, 0)
  const peakMonth = months[peakIdx]
  const peakValue = monthlyTotals[peakIdx]

  // Donut: small categories (<1%) folded into "Other"
  const threshold = totalRevenue * 0.01
  const major = categories.filter(c => c.total >= threshold)
  const minor = categories.filter(c => c.total < threshold)
  const minorTotal = minor.reduce((s, c) => s + c.total, 0)
  const donutCats = minorTotal > 0
    ? [...major, { name: 'Other (<1% combined)', total: minorTotal, qty: minor.reduce((s, c) => s + c.qty, 0) }]
    : major
  const donutTotal = donutCats.reduce((s, c) => s + c.total, 0)
  const R_OUT = 140, R_IN = 86, CX = 160, CY = 160
  let cumAngle = -Math.PI / 2
  const arcs = donutCats.map((c, i) => {
    const frac = c.total / donutTotal
    const start = cumAngle
    const end = cumAngle + frac * Math.PI * 2
    cumAngle = end
    const large = end - start > Math.PI ? 1 : 0
    const sx = CX + R_OUT * Math.cos(start), sy = CY + R_OUT * Math.sin(start)
    const ex = CX + R_OUT * Math.cos(end),   ey = CY + R_OUT * Math.sin(end)
    const sxi = CX + R_IN * Math.cos(end),   syi = CY + R_IN * Math.sin(end)
    const exi = CX + R_IN * Math.cos(start), eyi = CY + R_IN * Math.sin(start)
    return {
      d: `M ${sx} ${sy} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${ex} ${ey} L ${sxi} ${syi} A ${R_IN} ${R_IN} 0 ${large} 0 ${exi} ${eyi} Z`,
      color: TILL_CAT_PALETTE[i % TILL_CAT_PALETTE.length],
      cat: c,
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Slide title — shown in both views so the user knows which
          dataset they're looking at. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <span style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, fontSize: 18 }}>🧾</span>
        <div>
          <div className="serif" style={{ fontSize: 24, color: 'var(--cream)', lineHeight: 1.2 }}>
            Borough 2025 · {section === 'discounts' ? 'Discount analytics' : 'Till Sales by Category'}
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>No Dice Borough · Borough Market SE1 · Goodtill till data, COMPLETED orders only, 3 Jan → 14 Sep 2025</div>
        </div>
      </div>

      {/* Till ≠ Financials warning — only in Till Sales view */}
      {showTill && (<>
        {/* (warning + till body wrapped in fragment so we toggle them as one) */}
      <div style={{ padding: '14px 18px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 18, lineHeight: '18px', color: '#FBBF24' }}>ⓘ</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FCD34D', marginBottom: 4 }}>
            These are till figures, not financial figures
          </div>
          <div style={{ fontSize: 13, color: '#FDE68A', lineHeight: 1.55 }}>
            Numbers below are gross customer payments through the till (inclusive of VAT, after
            discounts at the till, before any subsequent refund / comp / accounting restatement).
            They are useful for understanding <strong>what we sold</strong> and <strong>category mix</strong> —
            they are <strong>not</strong> the canonical revenue figure. For audited / P&amp;L revenue
            see the <strong>2025 Performance</strong> tab, which is sourced from the Weekly Merge
            2024–2026 sheet. Expect the till total here to read higher than the Weekly Merge figure
            (VAT layer, restatements, refunds, golf-line split — see the Discounts section below
            for the full reconciliation).
          </div>
        </div>
      </div>

      {/* Data gap callout */}
      <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 6, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 18, lineHeight: '18px', color: '#F87171' }}>⚠</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FCA5A5', marginBottom: 4 }}>
            Data gap · Till migration to Lightspeed shortly after 14 Sep 2025
          </div>
          <div style={{ fontSize: 13, color: '#FECACA', lineHeight: 1.55 }}>
            No till data is available from 15 Sep 2025 onwards. Borough migrated off Goodtill to
            Lightspeed shortly after this date — Q4 2025 figures live in Lightspeed reports, not
            in this dataset. The September bar below is partial (1–14 Sep only).
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <KpiCard label="Gross till sales" value={fmtMoney(totalRevenue)} sub="Jan → 14 Sep 2025 · inc-VAT" color="var(--gold)" />
        <KpiCard label="Transactions"     value={fmtN(totalTxns)}        sub={`${fmtMoney(Math.round(avgSpend))} avg spend`} color="#22D3EE" />
        <KpiCard label="Peak month"       value={peakMonth}              sub={fmtMoney(peakValue)} color="#A78BFA" />
        <KpiCard label="Coverage"         value="Goodtill only"          sub={`ends ${lastDate}`} color="#F87171" />
      </div>

      {/* Donut hero + category table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 480px) 1fr', gap: 32, alignItems: 'flex-start' }}>
        <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 8, padding: '24px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14, textAlign: 'center', fontWeight: 600 }}>Category mix</div>
          <svg viewBox="0 0 320 320" style={{ width: '100%', height: 'auto' }}>
            {arcs.map((a, i) => (
              <path key={i} d={a.d} fill={a.color} stroke="var(--ink-2)" strokeWidth="1.5">
                <title>{`${a.cat.name} · ${fmtMoney(a.cat.total)} (${((a.cat.total / totalRevenue) * 100).toFixed(1)}%)`}</title>
              </path>
            ))}
            <text x="160" y="155" textAnchor="middle" fontSize="11" fill="#9CA3AF" letterSpacing="0.12em">TOTAL TILL SALES</text>
            <text x="160" y="185" textAnchor="middle" fontSize="26" fill="var(--cream)" fontWeight="700" fontFamily="DM Serif Display, serif">{fmtMoney(totalRevenue)}</text>
          </svg>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#9CA3AF', letterSpacing: '0.04em' }}>
            Jan → 14 Sep 2025 · inc-VAT
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
            {donutCats.slice(0, 3).map((c, i) => (
              <div key={c.name} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${TILL_CAT_PALETTE[i]}`, borderRadius: '3px 6px 6px 3px' }}>
                <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{fmtMoney(c.total)}</div>
                <div style={{ fontSize: 10, color: TILL_CAT_PALETTE[i], fontVariantNumeric: 'tabular-nums' }}>{((c.total / totalRevenue) * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category table */}
        <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 6, padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>By category · descending</div>
            <div style={{ fontSize: 10, color: '#6B7280' }}>
              {showMinor ? `${categories.length} categories` : `${major.length} of ${categories.length} · over 1% only`}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(showMinor ? categories : major).map((c) => {
              const pct = (c.total / totalRevenue) * 100
              const barW = (c.total / categories[0].total) * 100
              const isMinor = c.total < threshold
              const color = isMinor ? '#475569' : TILL_CAT_PALETTE[major.indexOf(c) % TILL_CAT_PALETTE.length]
              return (
                <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 60px', gap: 10, alignItems: 'center', fontSize: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, background: color, borderRadius: 2, flexShrink: 0 }} />
                    <div style={{ color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${barW}%`, height: '100%', background: color }} />
                  </div>
                  <div style={{ textAlign: 'right', color: 'var(--cream)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(c.total)}</div>
                  <div style={{ textAlign: 'right', color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(1)}%</div>
                </div>
              )
            })}
          </div>
          {minor.length > 0 && (
            <button onClick={() => setShowMinor(s => !s)} style={{ width: '100%', marginTop: 10, padding: '8px 10px', background: 'rgba(201,168,76,0.06)', border: '1px dashed rgba(201,168,76,0.35)', borderRadius: 4, cursor: 'pointer', fontSize: 10, color: 'var(--gold-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ transform: showMinor ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', display: 'inline-block' }}>›</span>
              {showMinor ? `Hide ${minor.length} smaller categories` : `Show ${minor.length} smaller categories (under 1% — ${fmtMoney(minorTotal)} combined)`}
            </button>
          )}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(201,168,76,0.12)', display: 'grid', gridTemplateColumns: '1fr 90px 60px 60px', gap: 10, fontSize: 11, fontWeight: 700 }}>
            <div style={{ color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
            <div />
            <div style={{ textAlign: 'right', color: 'var(--cream)', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(totalRevenue)}</div>
            <div style={{ textAlign: 'right', color: '#9CA3AF' }}>100%</div>
          </div>
        </div>
      </div>
      </>)}

      {/* Discounts section. Collapsible in the combined view, always
          expanded in the dedicated Discounts view. */}
      {showDiscounts && (
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 6, overflow: 'hidden' }}>
        {!forceDiscOpen && (
          <button onClick={() => setDiscOpen(o => !o)} style={{ width: '100%', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--cream)', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{ fontSize: 22, color: 'var(--gold)', transform: discOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', display: 'inline-block' }}>›</span>
              <div>
                <div className="serif" style={{ fontSize: 22, color: 'var(--cream)', lineHeight: 1.2 }}>Discounts</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                  Cost against drink sales · {fmtMoney(Math.round(disc.totalDiscount))} discounted · {disc.discountRate.toFixed(2)}% of gross · {fmtN(disc.discountedOrders)} discounted orders of {fmtN(disc.totalOrders)}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{discOpen ? 'Hide' : 'Show'}</span>
          </button>
        )}

        {discIsOpen && (
          <div style={{ padding: '4px 18px 20px', borderTop: '1px solid rgba(201,168,76,0.12)' }}>
            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 14, marginBottom: 18 }}>
              <KpiCard label="Total discounted"    value={fmtMoney(Math.round(disc.totalDiscount))} sub={`${disc.discountRate.toFixed(2)}% of gross`} color="#F87171" />
              <KpiCard label="Discounted orders"   value={fmtN(disc.discountedOrders)}              sub={`${disc.discountedOrderPct}% of orders`} color="#FB923C" />
              <KpiCard label="Avg per disc. order" value={fmtMoney(Math.round(disc.avgDiscountPerDiscountedOrder))} sub="across discounted orders" color="#FBBF24" />
              <KpiCard label="Peak month"          value="May" sub="3.0% rate · ~3× baseline" color="#A78BFA" />
            </div>

            {/* Monthly discount-rate strip */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Discount rate by month (% of gross)</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                {disc.monthly.map((m) => {
                  const maxRate = Math.max(...disc.monthly.map(x => x.rate))
                  const h = Math.round((m.rate / maxRate) * 70)
                  const hot = m.rate >= 2
                  return (
                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ fontSize: 9, color: hot ? '#FCA5A5' : '#9CA3AF', fontWeight: hot ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{m.rate.toFixed(1)}%</div>
                      <div style={{ width: '80%', height: h, background: hot ? '#F87171' : 'rgba(248,113,113,0.35)', borderRadius: '2px 2px 0 0' }} />
                      <div style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>{m.month}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 8, fontStyle: 'italic' }}>
                Borough's baseline is well under 1% — most months sit at 0.3–0.9% discount-of-gross.
                May spikes to 3.0% (a single named comp / event ring inflated the month).
                For comparison, Hackney averaged 6.2% — Borough does not run BOGOF / happy-hour
                programmes the way Hackney does.
              </div>
            </div>

            {/* Category table */}
            <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Discount by category · sorted by £</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px', gap: 10, fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
              <div>Category</div>
              <div style={{ textAlign: 'right' }}>Gross</div>
              <div style={{ textAlign: 'right' }}>Discount £</div>
              <div style={{ textAlign: 'right' }}>Rate</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {disc.categories.map((c) => {
                const heat = c.rate >= 2 ? '#F87171' : c.rate >= 1 ? '#FB923C' : c.rate >= 0.5 ? '#FBBF24' : '#9CA3AF'
                const flag = c.rate >= 2 ? '🚨' : c.rate >= 1 ? '⚠' : ''
                return (
                  <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px', gap: 10, alignItems: 'center', fontSize: 11, padding: '4px 0' }}>
                    <div style={{ color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {flag && <span style={{ marginRight: 6 }}>{flag}</span>}
                      {c.name}
                    </div>
                    <div style={{ textAlign: 'right', color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(c.gross)}</div>
                    <div style={{ textAlign: 'right', color: 'var(--cream)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(Math.round(c.discount))}</div>
                    <div style={{ textAlign: 'right', color: heat, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{c.rate.toFixed(2)}%</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 4, fontSize: 11, color: '#A5F3FC', lineHeight: 1.55 }}>
              <strong style={{ color: '#22D3EE' }}>Read across to Hackney: </strong>
              Hackney shows category discount rates of 17–26% on outlier SKUs (BOGOF promo SKUs).
              Borough's highest category rate is well under 1%. The dominant Borough discount
              pattern is named comp/event rings (see below) — not promotional BOGOFs.
            </div>

            {/* What discount codes were used */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(201,168,76,0.12)' }}>
              <div className="serif" style={{ fontSize: 18, color: 'var(--cream)', marginBottom: 8, lineHeight: 1.25 }}>
                What discount codes were used?
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.55, marginBottom: 14 }}>{codes.note}</div>

              {/* Findings note */}
              <div style={{ padding: '12px 14px', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 6, fontSize: 12, color: '#A5F3FC', lineHeight: 1.65, marginBottom: 18 }}>
                <div style={{ fontSize: 10, color: '#22D3EE', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Findings</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li style={{ marginBottom: 4 }}>
                    <strong style={{ color: 'var(--cream)' }}>Discounting is rare</strong> —
                    just 425 of {fmtN(disc.totalOrders)} orders ({disc.discountedOrderPct}%)
                    touched any discount, and the total £ value is only {fmtMoney(Math.round(disc.totalDiscount))}.
                  </li>
                  <li style={{ marginBottom: 4 }}>
                    <strong style={{ color: 'var(--cream)' }}>Borough does not run formal happy-hour / 2-for-1</strong> —
                    only 3 line-discount rings landed in the 50–100% bracket (£46.89 total).
                    Pre-booked packages paid in advance via the website don't show as till discounts
                    because the cash was collected up-front, off-till.
                  </li>
                  <li style={{ marginBottom: 4 }}>
                    <strong style={{ color: 'var(--cream)' }}>Named comp / event rings are the dominant pattern</strong> —
                    staff used named tags (Tuesday-night events, named-staff comps) instead of
                    promo codes. See the panel below.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--cream)' }}>Free pours are mostly bottled beer</strong> —
                    Corona Extra rung at £0 156× (226 units), Camden Hells 106×, Lucky Buddha 87×.
                    Looks like ad-hoc comp / staff drinks rather than a deal.
                  </li>
                </ul>
              </div>

              {/* Magnitude buckets */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
                {codes.magnitudeBuckets.map(b => {
                  const pctOfTotal = (b.value / disc.totalDiscount) * 100
                  const isHero = b.bucket.includes('BOGOF')
                  return (
                    <div key={b.bucket} style={{ padding: '10px 12px', background: isHero ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isHero ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: isHero ? '#FCA5A5' : '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{b.bucket}</div>
                      <div className="serif" style={{ fontSize: 18, color: 'var(--cream)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(b.value)}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                        {b.rows.toLocaleString('en-GB')} rows · {pctOfTotal.toFixed(1)}% of line-disc £
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: 10, color: '#6B7280', marginTop: -8, marginBottom: 18, fontStyle: 'italic' }}>
                Note: line-discount magnitude only — sale-level discounts (the bulk of Borough's £3,018) aren't bucketable this way.
              </div>

              {/* Named comp / event entries — Borough-specific */}
              <div className="serif" style={{ fontSize: 14, color: 'var(--cream)', marginTop: 18, marginBottom: 8 }}>
                Named comp / event entries · Borough's actual discount pattern
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>
                Till lines where staff rang in a name (event night, person) instead of a real
                product. These are how Borough's comp / event behaviour shows up at the till —
                not promo codes per se, but the dominant discount-shaped pattern at this venue.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {codes.namedEvents.map((n) => (
                  <div key={n.name} style={{ padding: '10px 12px', background: 'rgba(168,139,250,0.06)', border: '1px solid rgba(168,139,250,0.3)', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: '#C4B5FD', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{n.name}</div>
                    <div className="serif" style={{ fontSize: 18, color: 'var(--cream)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(n.total)}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{n.rows} rings · {n.units} units</div>
                  </div>
                ))}
              </div>

              {/* Promotion column */}
              <div className="serif" style={{ fontSize: 14, color: 'var(--cream)', marginTop: 22, marginBottom: 8 }}>
                Promotion column · barely used at Borough
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>
                The Goodtill <code style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 3, color: '#A5F3FC' }}>Promotion</code> column
                captures a £ tag, not a campaign name. Borough used it on <strong>0 rows</strong> across the whole 2025 till history (Hackney used it on 87 of 89,521 — also rare there).
              </div>

              {/* Free / £1 mixers */}
              <div className="serif" style={{ fontSize: 14, color: 'var(--cream)', marginTop: 20, marginBottom: 8 }}>
                Free items · staff rang at £0
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>
                Top items rung at £0 (excluding Eat-In / Takeaway service-mode tags). These are not
                give-aways — they sit inside packages and private hires that the office team
                already collected payment for, so they're rung through at £0 at the bar to
                avoid double-charging the customer. The £ has already landed via the office.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {codes.freeMixers.map((x) => (
                  <div key={x.name} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px', gap: 8, padding: '4px 8px', background: 'rgba(248,113,113,0.04)', borderLeft: '2px solid rgba(248,113,113,0.4)', borderRadius: '2px 4px 4px 2px', fontSize: 11 }}>
                    <div style={{ color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.name}</div>
                    <div style={{ textAlign: 'right', color: '#FCA5A5', fontVariantNumeric: 'tabular-nums' }}>{x.rows}×</div>
                    <div style={{ textAlign: 'right', color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>{x.units} units</div>
                  </div>
                ))}
              </div>

              <div className="serif" style={{ fontSize: 14, color: 'var(--cream)', marginTop: 20, marginBottom: 8 }}>
                £1 mixer pattern · weak / no signal
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>
                Mixers rung at £1 (Hackney's classic G&amp;T-deal pattern). Borough doesn't show
                a meaningful £1-mixer line — only Soda &amp; Lime appears with any regularity (67×),
                which is the bar's standard "soda + lime" garnish, not a promo.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {codes.onePoundMixers.map((x) => (
                  <div key={x.name} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px', gap: 8, padding: '4px 8px', background: 'rgba(251,191,36,0.04)', borderLeft: '2px solid rgba(251,191,36,0.4)', borderRadius: '2px 4px 4px 2px', fontSize: 11 }}>
                    <div style={{ color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.name}</div>
                    <div style={{ textAlign: 'right', color: '#FCD34D', fontVariantNumeric: 'tabular-nums' }}>{x.rows}×</div>
                    <div style={{ textAlign: 'right', color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>{x.units} units</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reconciliation */}
            <div style={{ marginTop: 18, padding: '12px 14px', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 4, fontSize: 11, color: '#A5F3FC', lineHeight: 1.6 }}>
              <div style={{ fontSize: 10, color: '#22D3EE', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
                Why doesn't this match the P&amp;L revenue figure?
              </div>
              <div style={{ color: '#CBD5E1' }}>
                Goodtill till total <strong>£{fmtN(totalRevenue)} inc-VAT</strong> for Jan → 14 Sep
                2025. The Borough P&amp;L (Weekly Merge 2024–2026) will show a <strong>lower</strong>
                figure for the same window because <strong>(1)</strong> the till total is gross of
                VAT (≈£44k of the gap is the 20% layer); <strong>(2)</strong> Monthly Summary is
                post-restatement / re-categorisation; <strong>(3)</strong> till captures only what
                was rung at the venue — <strong>pre-booked golf packages paid online never hit the
                till</strong>, so a major chunk of Borough's actual revenue lives in the website
                bookings ledger, not here. <strong>This till data is for product-mix and
                discount analytics — not for the P&amp;L.</strong> Weekly Merge stays the canonical
                revenue figure.
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Source footnote — only when rendering the combined view, the
          split views surface it on their own indexed sections instead. */}
      {section === 'all' && (
        <div style={{ fontSize: 10, color: '#6B7280', lineHeight: 1.6 }}>
          Source · data/borough_2025_till_sales.csv (cleaned Goodtill export, 32,156 rows ·
          141 previously-blank categories filled by the recategorisation playbook).
          Single-venue till instance — Borough Market SE1 only. No Hackney or other venue data is mixed in.
        </div>
      )}
    </div>
  )
}
