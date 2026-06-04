import React, { useState } from 'react'

// Reusable "Till Sales by Category" view — KPI strip + category-mix donut +
// descending category table. Driven entirely by a `data` object of the shape
// exported by data/borough2025TillSales.js / borough2026TillSales.js:
//   { totalRevenue, totalTxns, lastDate, months[], monthlyTotals[], categories:[{name,total,qty,monthly[]}] }
// `meta` supplies the year-specific copy (title, subtitle, coverage chip, and
// the two callout boxes) so 2025 and 2026 render from one component.

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

export default function TillSalesByCategory({ data, meta }) {
  const [showMinor, setShowMinor] = useState(false)
  const { categories, months, monthlyTotals, totalRevenue, totalTxns } = data
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
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <span style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, fontSize: 18 }}>🧾</span>
        <div>
          <div className="serif" style={{ fontSize: 24, color: 'var(--cream)', lineHeight: 1.2 }}>{meta.title}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{meta.subtitle}</div>
        </div>
      </div>

      {/* Till ≠ financials warning */}
      {meta.infoBox}

      {/* Year-specific coverage callout */}
      {meta.calloutBox}

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <KpiCard label="Gross till sales" value={fmtMoney(totalRevenue)} sub={meta.kpiSub} color="var(--gold)" />
        <KpiCard label="Transactions"     value={fmtN(totalTxns)}        sub={`${fmtMoney(Math.round(avgSpend))} avg spend`} color="#22D3EE" />
        <KpiCard label="Peak month"       value={peakMonth}              sub={fmtMoney(peakValue)} color="#A78BFA" />
        <KpiCard label="Coverage"         value={meta.coverageValue}     sub={meta.coverageSub} color={meta.coverageColor || '#F87171'} />
      </div>

      {/* Donut + category table */}
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
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#9CA3AF', letterSpacing: '0.04em' }}>{meta.kpiSub}</div>
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

      {meta.footnote}
    </div>
  )
}
