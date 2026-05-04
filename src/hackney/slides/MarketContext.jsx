import React from 'react'
import { DEAL, computeDealFromInvestment } from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

// MarketContext — clones Borough's structure: market benchmarks list,
// "Deal in One Line" gold card, sector reality items, differentiators grid.
// All sources/copy mirror Borough; numbers swapped for Hackney where they apply.
// The implied EBITDA multiple in the benchmarks table + Deal-in-One-Line
// reads from the locked Use-of-Funds snapshot when locked, so the
// market-positioning narrative stays consistent with the slider.

export default function MarketContext() {
  const { effective } = useLockedUseOfFunds()
  // Live whether locked or not — effective.investment is the slider
  // value during preview, the locked value when locked.
  const deal = { ...DEAL, ...computeDealFromInvestment(effective.investment) }
  const dealMultiple = deal.impliedMult ?? DEAL.multiple

  const benchmarks = [
    { min: 5.3, max: 5.3, multiple: '~5.3×',                          label: 'UK Mid-Market Average (EBITDA multiple)',     tag: 'Above this deal',           highlight: false },
    { min: 4.1, max: 4.1, multiple: '~4.1×',                          label: 'Hospitality & Leisure Sector Average',         tag: 'Above this deal',           highlight: false },
    { min: 2,   max: 4,   multiple: '~2–4×',                          label: 'Small Single-Site Venues (<£200k EBITDA)',     tag: 'In range',                   highlight: false },
    { min: 2,   max: 3,   multiple: '~2–3×',                          label: 'Distressed Asset Range (liquidation)',         tag: 'Below — priced for return', highlight: false },
    { min: dealMultiple, max: dealMultiple, multiple: `${dealMultiple.toFixed(2)}×`, label: 'No Dice Hackney — This Deal',     tag: '→ Entry point',              highlight: true  },
  ]
  const chartMax = 6 // x-axis upper bound for the EBITDA multiple chart (covers UK mid-market avg ~5.3×)

  const sectorReality = [
    { issue: 'Employer NICs rose from 13.8% → 15% (April 2025)',                          response: 'Labour cost increases are built into the forecast model — not hidden' },
    { issue: 'National Minimum Wage up 6.7% to £12.21/hr (April 2025)',                  response: 'Wage inflation modelled at 2025 actual base — no optimistic assumption' },
    { issue: 'Business rates relief cut from 75% → 40% (2025/26)',                       response: 'Cost environment is baked in — not a pre-cost-shock baseline' },
    { issue: 'UK hospitality recording ~2 site closures per day (2025)',                 response: 'Sector pressure creates acquisition opportunity at realistic pricing' },
    { issue: 'Consumer behaviour shifting toward experience-led, low-alcohol spend',     response: 'No Dice Hackney experience-led format directly aligns with this shift' },
    { issue: 'PE firms cautious on single-country consumer exposure',                    response: 'Smaller investor opportunity — less institutional competition for deal' },
  ]

  const differentiators = [
    { icon:'📊', color:'#C9A84C', title: 'Proven Revenue Base',     text: '£538,091 verified 2025 actuals (bar-only restated). Not a projection — real trading history with mini golf operations excluded.' },
    { icon:'📍', color:'#C9A84C', title: 'Established East London', text: 'London Fields location — established late-night destination with built-in footfall. Organic acquisition figures TBD pending GA4 baseline.' },
    { icon:'🎮', color:'#2DD4BF', title: 'Experience-Led Format',   text: 'DJ & events programme, pool tables, arcades, garden, board games. Directly aligned with fastest-growing hospitality sub-sector.' },
    { icon:'⭐', color:'#9CA3AF', title: 'Brand IP Retained',       text: 'Trading name, customer data and goodwill carry across the relaunch. Not starting from zero.' },
  ]

  const checks = [
    { title: '✓ Not a multiple expansion bet', sub: 'Returns driven by operating cash flow' },
    { title: '✓ Cash-yielding from Day 1',      sub: 'Distributions begin at end of Year 1' },
    { title: '✓ All 3 scenarios positive',      sub: 'Conservative through Optimistic' },
  ]

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 4px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:12, color:'#C9A84C', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>Market Context</div>
        <h2 className="serif" style={{ fontSize:'clamp(2rem, 4vw, 3rem)', color:'var(--cream)', marginBottom:8 }}>Investment Case &amp; Market Positioning</h2>
        <p style={{ fontSize:14, color:'#9CA3AF' }}>Sourced from CLFI, Houlihan Lokey, Moore Kingston Smith, UKHospitality — 2024/25</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, marginBottom:20 }}>
        {/* Left: Market Benchmarks */}
        <div style={{ background:'#13131A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <span style={{ fontSize:16 }}>📊</span>
            <span style={{ fontSize:12, color:'#C9A84C', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>Market Benchmarks — EBITDA Multiples</span>
          </div>
          {benchmarks.map((b, i) => {
            const isLast = i === benchmarks.length - 1
            const accent = b.highlight ? '#2DD4BF' : '#E53935'
            const minPct = (b.min / chartMax) * 100
            const maxPct = (b.max / chartMax) * 100
            const isRange = b.max > b.min
            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr 64px 138px',
                alignItems: 'center',
                gap: 12,
                padding: '11px 0',
                borderTop: isLast ? '1px dashed rgba(45,212,191,0.45)' : '1px solid rgba(255,255,255,0.04)',
                marginTop: isLast ? 8 : 0,
              }}>
                <div style={{ fontSize: 13, color: '#F5F0E8', lineHeight: 1.35 }}>{b.label}</div>

                <div style={{ position: 'relative', height: 18 }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }} />
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    width: `${Math.max(0.3, minPct)}%`,
                    top: 4,
                    height: 10,
                    background: accent,
                    borderRadius: 3,
                    boxShadow: b.highlight ? '0 0 0 3px rgba(45,212,191,0.2)' : 'none',
                  }} />
                  {isRange && (
                    <div style={{
                      position: 'absolute',
                      left: `${minPct}%`,
                      width: `${maxPct - minPct}%`,
                      top: 4,
                      height: 10,
                      background: 'rgba(229,57,53,0.18)',
                      border: '1px dashed rgba(229,57,53,0.6)',
                      borderLeft: 'none',
                      borderRadius: '0 3px 3px 0',
                      boxSizing: 'border-box',
                    }} />
                  )}
                </div>

                <div style={{ fontSize: 15, fontWeight: 800, color: accent, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{b.multiple}</div>
                <div style={{ fontSize: 11, color: b.highlight ? '#2DD4BF' : '#9CA3AF', border: `1px solid ${b.highlight ? '#2DD4BF' : '#374151'}`, borderRadius: 4, padding: '3px 8px', whiteSpace: 'nowrap', textAlign: 'center' }}>{b.tag}</div>
              </div>
            )
          })}

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 64px 138px', gap: 12, marginTop: 6 }}>
            <div />
            <div style={{ position: 'relative', height: 16 }}>
              {[0,1,2,3,4,5,6].map(n => (
                <span key={n} style={{
                  position: 'absolute',
                  left: `${(n / chartMax) * 100}%`,
                  transform: 'translateX(-50%)',
                  fontSize: 10,
                  color: '#6B7280',
                  fontVariantNumeric: 'tabular-nums',
                }}>{n}×</span>
              ))}
            </div>
            <div />
            <div />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, fontSize: 10, color: '#9CA3AF', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 16, height: 8, background: '#E53935', borderRadius: 2 }} />
              Comparable point multiple
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 16, height: 8, background: 'rgba(229,57,53,0.18)', border: '1px dashed rgba(229,57,53,0.6)', borderRadius: 2, boxSizing: 'border-box' }} />
              Comparable range
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 16, height: 8, background: '#2DD4BF', borderRadius: 2, boxShadow: '0 0 0 2px rgba(45,212,191,0.2)' }} />
              Entry point (this deal)
            </span>
          </div>

          <div style={{ marginTop: 14, fontSize: 11, color: '#6B7280' }}>Sources: CLFI M&amp;A Monitor H1 2025 · Houlihan Lokey Hospitality H1 2025 · Moore Kingston Smith 2025</div>
        </div>

        {/* Right: The Deal in One Line */}
        <div style={{ background:'#13131A', border:'2px solid #C9A84C', borderRadius:10, padding:24 }}>
          <div style={{ fontSize:11, color:'#C9A84C', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:16 }}>→ The Deal in One Line</div>
          <p style={{ fontSize:14, color:'#F5F0E8', lineHeight:1.7, marginBottom:20 }}>
            A proven London Fields bar, acquired at <span style={{ color:'#C9A84C', fontWeight:700 }}>{dealMultiple.toFixed(2)}× EBITDA</span> (below sector average), distributing via <span style={{ color:'#E67E22', fontWeight:700 }}>pure pro-rata on operating profit</span> (all shareholders paid at the same time by equity %), with payback driven by <span style={{ color:'#2DD4BF', fontWeight:700 }}>cash flow — not exit dependency</span>.
          </p>
          {checks.map((c, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'10px 14px', marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#F5F0E8', marginBottom:2 }}>{c.title}</div>
              <div style={{ fontSize:12, color:'#9CA3AF' }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Sector Reality */}
        <div style={{ background:'#13131A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <span style={{ fontSize:16 }}>⚠️</span>
            <span style={{ fontSize:12, color:'#EAB308', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>Sector Reality — Honest Context</span>
          </div>
          {sectorReality.map((r, i) => (
            <div key={i} style={{ marginBottom:14 }}>
              <div style={{ fontSize:13, color:'#D1D5DB' }}>▪ {r.issue}</div>
              <div style={{ fontSize:13, color:'#2DD4BF', paddingLeft:16, marginTop:4 }}>→ {r.response}</div>
            </div>
          ))}
        </div>

        {/* Why This Business is Different */}
        <div style={{ background:'#13131A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <span style={{ fontSize:16 }}>💎</span>
            <span style={{ fontSize:12, color:'#E67E22', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>Why This Business is Different</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {differentiators.map(item => (
              <div key={item.title} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:14 }}>
                <div style={{ fontSize:22, marginBottom:8 }}>{item.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:item.color, marginBottom:6 }}>{item.title}</div>
                <div style={{ fontSize:12, color:'#9CA3AF', lineHeight:1.5 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
