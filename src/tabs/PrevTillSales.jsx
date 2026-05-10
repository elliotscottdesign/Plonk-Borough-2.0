import React, { useMemo, useState } from 'react'
import { PREV_TILL_SALES, GOLF_CATEGORIES, PREV_TILL_YEARS, totalsForYear } from '../data/prevTillSales.js'

// Mirrors the Hackney "Till Sales 2020-2024" view in
// src/hackney/tabs/BusinessExplorer.jsx (TabPrevTillSales) — the same
// trajectory bars + KPI strip + donut/table layout, populated for Borough's
// 2022-2024 till data. Borough 2020/2021 are excluded (opened Oct 2020,
// then lockdowns).

const TILL_CAT_PALETTE = [
  '#C9A84C','#D4B86E','#22D3EE','#0EA5E9','#7DD3FC','#A78BFA','#C4B5FD',
  '#F472B6','#FB7185','#FDA4AF','#FCD34D','#FBBF24','#34D399','#6EE7B7',
  '#A3E635','#FACC15','#FB923C','#F87171','#94A3B8','#CBD5E1',
  '#E2E8F0','#FCA5A5','#67E8F9','#86EFAC','#A5F3FC','#DDD6FE','#F5D0FE','#FEF3C7',
]

const fmtMoney = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// Per-year notes for the trajectory caption. YoY % is computed inline from
// the revenue series, so we only need a short qualitative line here.
const YEAR_NOTES = {
  2022: 'First full trading year',
  2023: 'Full year of 11pm trading',
  2024: 'Most recent full year',
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background:'var(--ink-2)', border:`1px solid ${color}33`, borderTop:`3px solid ${color}`, borderRadius:10, padding:16 }}>
      <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{label}</div>
      <div className="serif" style={{ fontSize:'clamp(1.3rem, 2.4vw, 1.7rem)', color, lineHeight:1, marginBottom:6, fontVariantNumeric:'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.4 }}>{sub}</div>}
    </div>
  )
}

export default function PrevTillSales() {
  const [year, setYear] = useState(2024)
  const [showMinor, setShowMinor] = useState(false)
  const [hoverIdx, setHoverIdx] = useState(null)

  const cats = PREV_TILL_SALES[year] || []
  const totals = useMemo(() => totalsForYear(year), [year])

  // Per-year revenue series (inc-VAT till totals, summed from category totals).
  const trajectory = useMemo(() => PREV_TILL_YEARS.map((y) => {
    const t = totalsForYear(y)
    const revenue = (PREV_TILL_SALES[y] || []).reduce((s, r) => s + r.total, 0)
    return { year: y, revenue, lines: t.totalLines, isSelected: y === year }
  }), [year])
  const maxRev = Math.max(...trajectory.map(t => t.revenue))

  // Selected year revenue (for the KPI strip).
  const yearRevenue = trajectory.find(t => t.year === year)?.revenue || 0
  const avgPerLine = totals.totalLines > 0 ? yearRevenue / totals.totalLines : 0

  // Donut data — top 10 by qty, with the rest folded into one slice.
  const sorted = [...cats].sort((a, b) => b.qty - a.qty)
  const top10 = sorted.slice(0, 10)
  const rest = sorted.slice(10)
  const restQty = rest.reduce((s, r) => s + r.qty, 0)
  const restTotal = rest.reduce((s, r) => s + r.total, 0)

  const donutCats = restQty > 0
    ? [...top10, { name: `Other (${rest.length} smaller cats)`, qty: restQty, total: restTotal }]
    : top10
  const donutTotal = donutCats.reduce((s, c) => s + c.qty, 0)

  const R_OUT = 140, R_IN = 86, CX = 160, CY = 160
  let cumAngle = -Math.PI / 2
  const arcs = donutCats.map((c, i) => {
    const frac = c.qty / Math.max(1, donutTotal)
    const start = cumAngle, end = cumAngle + frac * Math.PI * 2
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
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Slide title */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
        <span style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', background:'rgba(34,211,238,0.12)', border:'1px solid rgba(34,211,238,0.3)', borderRadius:8, fontSize:18 }}>📈</span>
        <div>
          <div className="serif" style={{ fontSize:24, color:'var(--cream)', lineHeight:1.2 }}>Borough 2022–2024 · Till Sales History</div>
          <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>Three-year Goodtill category-level breakdown · click a year below to drill in</div>
        </div>
      </div>

      {/* Till ≠ financial figures reminder */}
      <div style={{ padding:'14px 18px', background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.4)', borderRadius:6, display:'flex', gap:14, alignItems:'flex-start' }}>
        <div style={{ fontSize:18, lineHeight:'18px', color:'#FBBF24' }}>ⓘ</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#FCD34D', marginBottom:4 }}>
            These are till figures, not financial figures
          </div>
          <div style={{ fontSize:13, color:'#FDE68A', lineHeight:1.55 }}>
            Numbers below show what was rung through the till — useful for understanding <strong>what we sold</strong> and <strong>category mix</strong>, not as canonical revenue. Pre-booked packages were paid in advance via the website and run through the till as 100%-discounted £0 lines, so the cash sits in monthly bookings, not in the till total. For audited revenue see the monthly trading P&Ls.
          </div>
        </div>
      </div>

      {/* Year-over-year revenue trajectory — left-hand year index.
          Each row is a clickable button with year, note, YoY badge,
          revenue and a chevron/dot indicator so it's obvious that the
          rows drive the breakdown below. */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:8, padding:'18px 20px' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, marginBottom:4 }}>
          <div className="serif" style={{ fontSize:18, color:'var(--cream)', lineHeight:1.25 }}>
            Three-year revenue trajectory
          </div>
          <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>
            Select a year ↓
          </div>
        </div>
        <div style={{ fontSize:12, color:'#9CA3AF', marginBottom:14 }}>
          Click a year below to drill into its category mix.
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {trajectory.map((t, i) => {
            const isSel = t.isSelected
            const prev = i > 0 ? trajectory[i-1].revenue : null
            const yoy = prev ? ((t.revenue / prev - 1) * 100) : null
            const barFrac = t.revenue / maxRev
            return (
              <button
                key={t.year}
                onClick={() => setYear(t.year)}
                style={{
                  position:'relative',
                  display:'grid',
                  gridTemplateColumns:'72px 1fr auto 110px 18px',
                  alignItems:'center',
                  gap:16,
                  padding:'14px 18px',
                  background: isSel
                    ? 'linear-gradient(90deg, rgba(201,168,76,0.14) 0%, rgba(201,168,76,0.04) 100%)'
                    : 'rgba(255,255,255,0.02)',
                  border: isSel ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.06)',
                  borderLeft: isSel ? '3px solid var(--gold)' : '3px solid rgba(34,211,238,0.25)',
                  borderRadius:6,
                  cursor:'pointer',
                  color:'var(--cream)',
                  textAlign:'left',
                  transition:'all 0.15s',
                  overflow:'hidden',
                }}
                onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              >
                {/* Subtle bar fill behind content to keep a sense of scale */}
                <div style={{
                  position:'absolute', left:0, top:0, bottom:0,
                  width:`${barFrac * 100}%`,
                  background: isSel
                    ? 'linear-gradient(90deg, rgba(201,168,76,0.10) 0%, rgba(201,168,76,0) 100%)'
                    : 'linear-gradient(90deg, rgba(34,211,238,0.07) 0%, rgba(34,211,238,0) 100%)',
                  pointerEvents:'none',
                }} />
                <div className="serif" style={{ position:'relative', fontSize:24, color: isSel ? 'var(--gold)' : 'var(--cream)', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
                  {t.year}
                </div>
                <div style={{ position:'relative', display:'flex', flexDirection:'column', gap:2 }}>
                  <div style={{ fontSize:12, color:'var(--cream)', fontWeight:500 }}>
                    {YEAR_NOTES[t.year] || ''}
                  </div>
                  <div style={{ fontSize:10, color:'#6B7280', fontVariantNumeric:'tabular-nums', letterSpacing:'0.04em' }}>
                    {t.lines.toLocaleString('en-GB')} till lines
                  </div>
                </div>
                {yoy !== null ? (
                  <div style={{
                    position:'relative',
                    fontSize:11, fontWeight:700,
                    padding:'4px 10px', borderRadius:999,
                    background: yoy >= 0 ? 'rgba(16,185,129,0.14)' : 'rgba(248,113,113,0.14)',
                    color: yoy >= 0 ? '#10B981' : '#F87171',
                    border: yoy >= 0 ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(248,113,113,0.3)',
                    fontVariantNumeric:'tabular-nums',
                    whiteSpace:'nowrap',
                  }}>
                    {yoy >= 0 ? '+' : ''}{yoy.toFixed(0)}% YoY
                  </div>
                ) : (
                  <div style={{ position:'relative', fontSize:10, color:'#6B7280', fontStyle:'italic', whiteSpace:'nowrap' }}>
                    baseline
                  </div>
                )}
                <div className="serif" style={{ position:'relative', fontSize:20, color: isSel ? 'var(--gold)' : 'var(--cream)', fontVariantNumeric:'tabular-nums', textAlign:'right', lineHeight:1 }}>
                  £{Math.round(t.revenue/1000)}k
                </div>
                <div style={{ position:'relative', fontSize:16, color: isSel ? 'var(--gold)' : '#6B7280', textAlign:'center', lineHeight:1 }}>
                  {isSel ? '●' : '›'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* KPI strip for the selected year */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        <KpiCard label={`${year} · Revenue`}     value={fmtMoney(yearRevenue)}                  sub="inc-VAT · till total"                                                              color="var(--gold)" />
        <KpiCard label={`${year} · Till lines`}  value={totals.totalLines.toLocaleString('en-GB')} sub={`${avgPerLine.toFixed(2)} avg per line`}                                          color="#22D3EE" />
        <KpiCard label={`${year} · Units sold`}  value={totals.totalQty.toLocaleString('en-GB')}   sub={`${cats.length} categories`}                                                      color="#A78BFA" />
        <KpiCard label={`${year} · Zero-priced`} value={`${totals.pctZero.toFixed(1)}%`}           sub={`${totals.totalZeroLines.toLocaleString('en-GB')} of ${totals.totalLines.toLocaleString('en-GB')} lines`} color="#F87171" />
      </div>

      {/* Donut hero + category table.
          Grid cells stretch to equal heights so the donut card matches the
          table; the SVG is capped at 260px and centred vertically so it
          doesn't balloon when the table is tall. Slices have a hover
          tooltip showing units, total inc-VAT, and % share. */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, alignItems:'stretch' }}>
        <div style={{
          background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:8,
          padding:'18px 20px',
          display:'flex', flexDirection:'column',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ fontSize:13, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', textAlign:'center', fontWeight:600 }}>
            {year} · Top categories by units
          </div>
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', minHeight:0 }}>
            <svg
              viewBox="0 0 320 320"
              style={{ width:'100%', maxWidth:260, height:'auto', display:'block' }}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {arcs.map((a, i) => {
                const isHover = hoverIdx === i
                return (
                  <path
                    key={i}
                    d={a.d}
                    fill={a.color}
                    stroke="var(--ink-2)"
                    strokeWidth="1.5"
                    onMouseEnter={() => setHoverIdx(i)}
                    style={{
                      cursor:'pointer',
                      opacity: hoverIdx === null || isHover ? 1 : 0.45,
                      transform: isHover ? 'scale(1.025)' : 'scale(1)',
                      transformOrigin:'160px 160px',
                      transition:'opacity 0.15s, transform 0.15s',
                    }}
                  >
                    <title>{`${a.cat.name} · ${a.cat.qty.toLocaleString('en-GB')} units · £${Math.round(a.cat.total).toLocaleString('en-GB')}`}</title>
                  </path>
                )
              })}
              <text x="160" y="150" textAnchor="middle" fontSize="12" fill="#9CA3AF" letterSpacing="0.12em">UNITS SOLD</text>
              <text x="160" y="190" textAnchor="middle" fontSize="36" fill="var(--cream)" fontWeight="700" fontFamily="DM Serif Display, serif">{totals.totalQty.toLocaleString('en-GB')}</text>
            </svg>
            {/* Hover tooltip — pinned bottom-centre over the donut card so it
                doesn't get clipped by the SVG viewBox or shift on resize. */}
            {hoverIdx !== null && arcs[hoverIdx] && (() => {
              const c = arcs[hoverIdx].cat
              const color = arcs[hoverIdx].color
              const pctUnits = (c.qty / Math.max(1, donutTotal)) * 100
              return (
                <div style={{
                  position:'absolute', left:12, right:12, bottom:8,
                  background:'rgba(13,17,23,0.96)',
                  border:`1px solid ${color}`,
                  borderRadius:6, padding:'10px 12px',
                  boxShadow:'0 6px 16px rgba(0,0,0,0.45)',
                  pointerEvents:'none',
                  display:'flex', flexDirection:'column', gap:4,
                  fontVariantNumeric:'tabular-nums',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, background:color, borderRadius:2, flexShrink:0 }} />
                    <div style={{ fontSize:12, color:'var(--cream)', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {c.name}
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'2px 12px', fontSize:11, color:'#9CA3AF' }}>
                    <div>Units</div>
                    <div style={{ textAlign:'right', color:'var(--cream)', fontWeight:600 }}>{c.qty.toLocaleString('en-GB')} <span style={{ color:'#6B7280', fontWeight:400 }}>· {pctUnits.toFixed(1)}%</span></div>
                    <div>Total inc-VAT</div>
                    <div style={{ textAlign:'right', color:'var(--cream)', fontWeight:600 }}>£{Math.round(c.total).toLocaleString('en-GB')}</div>
                  </div>
                </div>
              )
            })()}
          </div>
          <div style={{ textAlign:'center', marginTop:8, fontSize:12, color:'#9CA3AF' }}>
            {year} · Goodtill category mix · <span style={{ color:'var(--gold-dim)' }}>hover slices for detail</span>
          </div>
        </div>

        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:6, padding:'14px 18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{year} · By category · descending</div>
            <div style={{ fontSize:10, color:'#6B7280' }}>{cats.length} categories</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 70px 80px 60px', gap:10, fontSize:10, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6, paddingBottom:4, borderBottom:'1px solid rgba(201,168,76,0.1)' }}>
            <div>Category</div>
            <div style={{ textAlign:'right' }}>Units</div>
            <div style={{ textAlign:'right' }}>Total inc-VAT</div>
            <div style={{ textAlign:'right' }}>% Zero</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {(showMinor ? sorted : top10).map((c, i) => {
              const isGolf = GOLF_CATEGORIES.includes(c.name)
              const isMinor = i >= top10.length
              const color = isMinor ? '#475569' : TILL_CAT_PALETTE[i % TILL_CAT_PALETTE.length]
              return (
                <div key={c.name} style={{ display:'grid', gridTemplateColumns:'1fr 70px 80px 60px', gap:10, alignItems:'center', fontSize:11, padding:'3px 0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                    <div style={{ width:8, height:8, background:color, borderRadius:2, flexShrink:0 }} />
                    <div style={{ color: isGolf ? '#FCD34D' : 'var(--cream)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight: isGolf ? 600 : 400 }}>
                      {isGolf ? '⛳ ' : ''}{c.name}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', color:'var(--cream)', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{c.qty.toLocaleString('en-GB')}</div>
                  <div style={{ textAlign:'right', color:'var(--cream)', fontVariantNumeric:'tabular-nums' }}>£{Math.round(c.total).toLocaleString('en-GB')}</div>
                  <div style={{ textAlign:'right', color: c.pctZero >= 25 ? '#F87171' : c.pctZero >= 10 ? '#FBBF24' : '#9CA3AF', fontVariantNumeric:'tabular-nums' }}>
                    {c.pctZero.toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </div>

          {rest.length > 0 && (
            <button
              onClick={() => setShowMinor(s => !s)}
              style={{
                width:'100%', marginTop:10, padding:'8px 10px',
                background:'rgba(201,168,76,0.06)',
                border:'1px dashed rgba(201,168,76,0.35)',
                borderRadius:4,
                cursor:'pointer',
                fontSize:10, color:'var(--gold-dim)',
                letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}
            >
              <span style={{ transform:showMinor?'rotate(90deg)':'rotate(0deg)', transition:'transform 0.15s', display:'inline-block' }}>›</span>
              {showMinor
                ? `Hide ${rest.length} smaller categories`
                : `Show ${rest.length} smaller categories (${restQty.toLocaleString('en-GB')} units combined)`}
            </button>
          )}

          <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid rgba(201,168,76,0.12)', display:'grid', gridTemplateColumns:'1fr 70px 80px 60px', gap:10, fontSize:11, fontWeight:700 }}>
            <div style={{ color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total</div>
            <div style={{ textAlign:'right', color:'var(--cream)', fontVariantNumeric:'tabular-nums' }}>{totals.totalQty.toLocaleString('en-GB')}</div>
            <div style={{ textAlign:'right', color:'var(--cream)', fontVariantNumeric:'tabular-nums' }}>{fmtMoney(yearRevenue)}</div>
            <div style={{ textAlign:'right', color:'#9CA3AF' }}>{totals.pctZero.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Source footnote */}
      <div style={{ fontSize:10, color:'#6B7280', lineHeight:1.6 }}>
        Source · 3 yearly Goodtill workbooks (2022-2024) merged into the project workbook,
        then aggregated into the Category Aggregates tab. 2020 / 2021 excluded — Borough opened Oct 2020,
        followed by COVID-era trading restrictions. ⛳ rows are golf ticket categories — the volume
        baseline for any ticket-price-up scenario.
      </div>
    </div>
  )
}
