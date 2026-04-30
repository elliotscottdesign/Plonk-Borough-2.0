import React, { useMemo, useState } from 'react'
import { PREV_TILL_SALES, GOLF_CATEGORIES, PREV_TILL_YEARS, totalsForYear } from '../data/prevTillSales.js'

// 10 distinct colours for the top-10 slices + a muted grey for the
// "all other categories" bucket at the end.
const SLICE_COLORS = [
  '#22D3EE', '#A78BFA', '#FBBF24', '#FB7185', '#34D399',
  '#F472B6', '#60A5FA', '#FCD34D', '#A3E635', '#F97316',
]
const REST_COLOR = '#475569'

const fmtNum = (n) => Math.round(n).toLocaleString()
const fmtGBP = (n) => '£' + Math.round(n).toLocaleString()

// ─────────────────────────────────────────────────────────────────────
// Standalone donut. Lightweight SVG, takes data shaped as
//   [{ label, value, color, pct }]
// where value is a unit count (not £) — this distinguishes it from the
// shared £-labelled DonutChart used elsewhere.
// ─────────────────────────────────────────────────────────────────────
function UnitsDonut({ data, total, size = 220 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.42, inner = size * 0.26
  let angle = -Math.PI / 2
  const slices = data.map((d, i) => {
    const slice = (d.value / total) * Math.PI * 2
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle)
    angle += slice
    const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle)
    const large = slice > Math.PI ? 1 : 0
    const pct = d.pct != null ? d.pct : ((d.value / total) * 100).toFixed(1)
    const tip = `${d.label}\n${fmtNum(d.value)} units · ${pct}%`
    return (
      <path
        key={i}
        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
        fill={d.color}
        stroke="#0A0A0F"
        strokeWidth={1}
        style={{ cursor: 'default' }}
      >
        <title>{tip}</title>
      </path>
    )
  })
  return (
    <div style={{ display: 'inline-block', position: 'relative', lineHeight: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices}
        <circle cx={cx} cy={cy} r={inner} fill="#0A0A0F" />
        <text
          x={cx} y={cy - 4} textAnchor="middle"
          fontFamily="DM Sans" fontSize="11" fill="#9CA3AF"
          style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >Units sold</text>
        <text
          x={cx} y={cy + 14} textAnchor="middle"
          fontFamily="DM Sans" fontSize="18" fontWeight="700" fill="var(--cream)"
        >{fmtNum(total)}</text>
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Year tabs (2022 / 2023 / 2024)
// ─────────────────────────────────────────────────────────────────────
function YearTabs({ year, setYear }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ fontSize: 10, color: '#6B7280', letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 4 }}>Year</div>
      {PREV_TILL_YEARS.map((y) => (
        <button
          key={y}
          onClick={() => setYear(y)}
          style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 600,
            borderRadius: 6, cursor: 'pointer',
            background: y === year ? 'rgba(201,168,76,0.15)' : 'transparent',
            border: `1px solid ${y === year ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.12)'}`,
            color: y === year ? 'var(--gold)' : 'var(--cream-dim)',
            letterSpacing: '0.05em', transition: 'all 0.15s',
          }}
        >
          {y}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Volume-vs-revenue disclaimer banner
// ─────────────────────────────────────────────────────────────────────
function DisclaimerBanner() {
  return (
    <div style={{
      background: 'rgba(229,57,53,0.05)', border: '1px solid rgba(229,57,53,0.25)',
      borderRadius: 8, padding: '10px 14px',
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <div style={{ fontSize: 14, lineHeight: 1, marginTop: 2 }}>⚠️</div>
      <div style={{ fontSize: 11.5, color: 'var(--cream-dim)', lineHeight: 1.55 }}>
        These figures show <strong style={{ color: 'var(--cream)' }}>sales volume</strong>, not financial revenue.
        Pre-booked packages were paid in advance via online checkout — when the till logs them they appear
        as 100%-discounted £0 lines (so the cash sits in monthly bookings, not in the till total).
        For actual cash revenue see the monthly trading P&Ls.
        Use this view to understand <strong style={{ color: 'var(--cream)' }}>what was rung through the till and in what mix</strong> — particularly golf ticket volumes for price-rise modelling.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Top 10 list with colour swatch, units, share %
// ─────────────────────────────────────────────────────────────────────
function CategoryList({ data, totalQty }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {data.map((d, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '14px 1fr 90px 70px 90px',
          gap: 10, alignItems: 'center',
          padding: '7px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          fontSize: 12,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
          <div style={{ color: 'var(--cream)' }}>{d.label}</div>
          <div style={{ color: 'var(--cream-dim)', textAlign: 'right' }}>{fmtNum(d.value)}</div>
          <div style={{ color: '#6B7280', textAlign: 'right' }}>{d.pct}%</div>
          <div style={{ color: '#6B7280', textAlign: 'right', fontSize: 11 }}>
            {d.zeroLines != null ? `${d.zeroLines} pkgs` : ''}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Golf-tickets focus card. Always rendered, even if golf isn't top-10.
// ─────────────────────────────────────────────────────────────────────
function GolfFocusCard({ cats, totalQty, year }) {
  const golfQty = cats.reduce((s, c) => s + c.qty, 0)
  const golfNet = cats.reduce((s, c) => s + c.net, 0)
  const golfShare = totalQty ? (golfQty / totalQty * 100).toFixed(1) : '0.0'
  return (
    <div style={{
      background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.3)',
      borderRadius: 10, padding: '14px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#2DD4BF', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
          ⛳ Golf focus · {year}
        </div>
        <div style={{ fontSize: 11, color: '#6B7280' }}>
          {golfShare}% of all till units this year
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {cats.map((c) => (
          <div key={c.name} style={{
            background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8, padding: '10px 14px',
          }}>
            <div style={{ fontSize: 10, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{c.name}</div>
            <div className="serif" style={{ fontSize: 22, color: 'var(--cream)', lineHeight: 1, marginBottom: 4 }}>{fmtNum(c.qty)}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>tickets · {fmtGBP(c.net)} net</div>
          </div>
        ))}
        <div style={{
          background: 'rgba(45,212,191,0.10)', border: '1px solid rgba(45,212,191,0.45)',
          borderRadius: 8, padding: '10px 14px',
        }}>
          <div style={{ fontSize: 10, color: '#2DD4BF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Total golf-related</div>
          <div className="serif" style={{ fontSize: 22, color: '#2DD4BF', lineHeight: 1, marginBottom: 4 }}>{fmtNum(golfQty)}</div>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>units · {fmtGBP(golfNet)} net</div>
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: '#94A3B8', lineHeight: 1.55 }}>
        These are golf ticket-equivalent units rung through the till. <strong style={{ color: 'var(--cream)' }}>OTHER - GOLF</strong> is the pure round-of-golf line; <strong style={{ color: 'var(--cream)' }}>OTHER - GOLF & GAMES</strong> bundles a round with a drink. Together they're the volume baseline for any ticket-price-up scenario.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Discount/package summary card
// ─────────────────────────────────────────────────────────────────────
function DiscountCard({ totals, year }) {
  const { totalLines, totalZeroLines, pctZero } = totals
  return (
    <div style={{
      background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '14px 18px',
    }}>
      <div style={{ fontSize: 11, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
        Discounts · {year}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 10 }}>
        <Stat label="Total till lines" value={fmtNum(totalLines)} />
        <Stat label="100%-discounted lines" value={fmtNum(totalZeroLines)} sub={`${pctZero.toFixed(1)}% of lines`} />
        <Stat label="Estimated package volume" value={fmtNum(totalZeroLines)} sub="≈ pre-booked package units" highlight />
      </div>
      <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.55 }}>
        Borough's discount mix is dominated by <strong style={{ color: 'var(--cream)' }}>pre-booked packages paid in advance via the website</strong> — those run through the till at £0 (the cash was already collected via online booking). We had very few in-venue 2-for-1 / happy-hour deals, so the bulk of the {pctZero.toFixed(1)}% zero-priced lines you see here are package bookings, not promotional discounts.
      </div>
    </div>
  )
}

function Stat({ label, value, sub, highlight }) {
  return (
    <div style={{
      background: highlight ? 'rgba(201,168,76,0.08)' : 'rgba(0,0,0,0.18)',
      border: `1px solid ${highlight ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 8, padding: '10px 14px',
    }}>
      <div style={{ fontSize: 10, color: highlight ? 'var(--gold)' : '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div className="serif" style={{ fontSize: 22, color: highlight ? 'var(--gold)' : 'var(--cream)', lineHeight: 1, marginBottom: sub ? 4 : 0 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{sub}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Top-level component
// ─────────────────────────────────────────────────────────────────────
export default function PrevTillSales() {
  const [year, setYear] = useState(2024)

  const data = PREV_TILL_SALES[year] || []
  const totals = useMemo(() => totalsForYear(year), [year])

  // Sort by qty desc, take top 10. Group the remainder into one "Others"
  // bucket so the donut still totals to 100% but doesn't get visually noisy.
  const sorted = [...data].sort((a, b) => b.qty - a.qty)
  const top10 = sorted.slice(0, 10)
  const rest = sorted.slice(10)
  const restQty = rest.reduce((s, r) => s + r.qty, 0)
  const restZero = rest.reduce((s, r) => s + r.zeroLines, 0)

  const donutData = top10.map((c, i) => ({
    label: c.name,
    value: c.qty,
    color: SLICE_COLORS[i],
    pct: ((c.qty / totals.totalQty) * 100).toFixed(1),
    zeroLines: c.zeroLines,
  }))
  if (restQty > 0) {
    donutData.push({
      label: `${rest.length} other categories`,
      value: restQty,
      color: REST_COLOR,
      pct: ((restQty / totals.totalQty) * 100).toFixed(1),
      zeroLines: restZero,
    })
  }

  // Golf categories — always surfaced separately even if outside top-10.
  const golfCats = data.filter((c) => GOLF_CATEGORIES.includes(c.name))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13 }}>
      <YearTabs year={year} setYear={setYear} />
      <DisclaimerBanner />

      {/* Donut + list */}
      <div style={{
        background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '16px 18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
            Top 10 categories by units · {year}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>
            {fmtNum(totals.totalQty)} units across {data.length} categories
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 28, alignItems: 'center' }}>
          <UnitsDonut data={donutData} total={totals.totalQty} size={240} />
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '14px 1fr 90px 70px 90px',
              gap: 10, fontSize: 10, color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '0 4px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div></div><div>Category</div>
              <div style={{ textAlign: 'right' }}>Units</div>
              <div style={{ textAlign: 'right' }}>Share</div>
              <div style={{ textAlign: 'right' }}>Packages</div>
            </div>
            <CategoryList data={donutData} totalQty={totals.totalQty} />
          </div>
        </div>
      </div>

      <GolfFocusCard cats={golfCats} totalQty={totals.totalQty} year={year} />
      <DiscountCard totals={totals} year={year} />
    </div>
  )
}
