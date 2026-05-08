import React, { useState } from 'react'

// ─── TokenShare ───────────────────────────────────────────────────────
// Founder-only (888999) sandbox tab. Models a token-revenue rent split
// between the venue operator and the landlord. Drag the monthly token
// revenue slider (£0 → £5,000 net) and see:
//   1. Per-month breakdown of who gets what
//   2. Tier-by-tier share (base + 3 marginal bands)
//   3. Annual extrapolation against UK shopping-centre seasonality
//      (peaks Nov/Dec, troughs Jan/Feb)
//
// Rent rule:
//   • Base ground rent: £250 + VAT (£300 inc VAT) per month — paid to
//     landlord regardless of revenue
//   • Marginal rent share to landlord, layered on top of base:
//        £0   – £1,000 net  →  10% to landlord
//        £1,000 – £2,000     →  25%
//        £2,000+             →  50%
//   • Operator keeps the residual.
//
// UK shopping-centre seasonality — index multipliers normalised so the
// 12 months sum to 12.0 (i.e. average = 1.0). Pattern: Jan/Feb slump,
// Easter pickup, summer ~flat, big Oct → Dec ramp through Black Friday
// and Christmas.

const BASE_RENT_NET   = 250
const VAT_RATE        = 0.20
const BASE_RENT_INC   = BASE_RENT_NET * (1 + VAT_RATE)   // £300
const TIER_1_CAP      = 1000
const TIER_2_CAP      = 2000
const TIER_1_PCT      = 0.10
const TIER_2_PCT      = 0.25
const TIER_3_PCT      = 0.50
const SLIDER_MAX      = 5000

const SEASONAL = [
  { month: 'Jan', mult: 0.70 },
  { month: 'Feb', mult: 0.80 },
  { month: 'Mar', mult: 0.90 },
  { month: 'Apr', mult: 1.00 },
  { month: 'May', mult: 1.00 },
  { month: 'Jun', mult: 1.05 },
  { month: 'Jul', mult: 1.00 },
  { month: 'Aug', mult: 0.95 },
  { month: 'Sep', mult: 0.95 },
  { month: 'Oct', mult: 1.10 },
  { month: 'Nov', mult: 1.25 },
  { month: 'Dec', mult: 1.30 },
]

const fmt  = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const fmt2 = (n) => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Compute the rent split for a single month given a net revenue figure.
// Returns the dollarized landlord total + operator residual + the
// per-tier shares so the breakdown card can render the layers.
function splitForRevenue(rev) {
  const t1Base = Math.min(rev, TIER_1_CAP)
  const t2Base = Math.max(0, Math.min(rev, TIER_2_CAP) - TIER_1_CAP)
  const t3Base = Math.max(0, rev - TIER_2_CAP)
  const t1Rent = t1Base * TIER_1_PCT
  const t2Rent = t2Base * TIER_2_PCT
  const t3Rent = t3Base * TIER_3_PCT
  const tieredRent = t1Rent + t2Rent + t3Rent
  const landlord = BASE_RENT_INC + tieredRent
  const operator = rev - landlord
  return {
    revenue: rev,
    base: BASE_RENT_INC,
    t1Base, t2Base, t3Base,
    t1Rent, t2Rent, t3Rent,
    tieredRent,
    landlord,
    operator,
  }
}

export default function TokenShare() {
  const [monthly, setMonthly] = useState(2000)
  const month = splitForRevenue(monthly)
  // Annual extrapolation — apply the seasonal multiplier to the slider
  // value to produce a per-month synthetic revenue, then split each.
  const annual = SEASONAL.map(s => {
    const rev = monthly * s.mult
    const split = splitForRevenue(rev)
    return { ...s, ...split }
  })
  const yearTotals = annual.reduce((acc, m) => ({
    revenue:    acc.revenue + m.revenue,
    landlord:   acc.landlord + m.landlord,
    operator:   acc.operator + m.operator,
    base:       acc.base + m.base,
    tieredRent: acc.tieredRent + m.tieredRent,
  }), { revenue: 0, landlord: 0, operator: 0, base: 0, tieredRent: 0 })
  const peakMonth  = annual.reduce((a, m) => m.revenue > a.revenue ? m : a, annual[0])
  const troughMonth = annual.reduce((a, m) => m.revenue < a.revenue ? m : a, annual[0])
  const yMaxAnnual = Math.max(...annual.map(m => m.revenue))

  return (
    <div style={{ minHeight:'100%', background:'var(--ink)', color:'var(--cream)', padding:'28px 32px', fontFamily:"'DM Sans',sans-serif", maxWidth:1100, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize:11, color:'#C084FC', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>Founder Sandbox · 888999 only</div>
        <h2 className="serif" style={{ fontSize:28, color:'var(--cream)', margin:0, lineHeight:1.2 }}>Token Share · Operator ↔ Landlord</h2>
        <p style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6, marginTop:10 }}>
          Models a tiered token-revenue rent share for a venue operator with a landlord on a turnover-rent lease. Drag the monthly revenue slider, see the split per tier, then read the annualised picture below using UK shopping-centre seasonality. Base ground rent <strong style={{ color:'var(--cream)' }}>£{BASE_RENT_NET}+VAT</strong> ({fmt(BASE_RENT_INC)} inc VAT) is paid to the landlord regardless of revenue.
        </p>
      </div>

      {/* Slider card */}
      <div className="card" style={{ padding:20, border:'1px solid rgba(192,132,252,0.3)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
          <div style={{ fontSize:11, color:'#C084FC', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Monthly token revenue (net)</div>
          <div className="serif" style={{ fontSize:30, color:'#C084FC' }}>{fmt(monthly)}</div>
        </div>
        <input
          type="range" min={0} max={SLIDER_MAX} step={50}
          value={monthly}
          onChange={e => setMonthly(+e.target.value)}
          style={{ width:'100%', accentColor:'#C084FC' }}
        />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--cream-dim)', marginTop:4 }}>
          <span>£0</span>
          <span>£1,000 (tier 1 cap)</span>
          <span>£2,000 (tier 2 cap)</span>
          <span>£5,000 (max)</span>
        </div>
      </div>

      {/* Per-month split — operator vs landlord */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div className="card" style={{ padding:20, borderLeft:'3px solid #2DD4BF' }}>
          <div style={{ fontSize:11, color:'#2DD4BF', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>Operator · this month</div>
          <div className="serif" style={{ fontSize:32, color: month.operator >= 0 ? '#10B981' : '#F87171', marginBottom:6 }}>
            {month.operator >= 0 ? '' : '−'}{fmt(Math.abs(month.operator))}
          </div>
          <div style={{ fontSize:12, color:'var(--cream-dim)' }}>
            Net residual after rent. {monthly > 0 ? `${((month.operator / monthly) * 100).toFixed(1)}% of revenue retained.` : 'Pays £300 base when revenue is zero.'}
          </div>
        </div>
        <div className="card" style={{ padding:20, borderLeft:'3px solid #C084FC' }}>
          <div style={{ fontSize:11, color:'#C084FC', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>Landlord · this month</div>
          <div className="serif" style={{ fontSize:32, color:'#C084FC', marginBottom:6 }}>
            {fmt(month.landlord)}
          </div>
          <div style={{ fontSize:12, color:'var(--cream-dim)' }}>
            {fmt(month.base)} base + {fmt(month.tieredRent)} tiered rent share. {monthly > 0 ? `${((month.landlord / monthly) * 100).toFixed(1)}% of revenue.` : 'Base only when revenue is zero.'}
          </div>
        </div>
      </div>

      {/* Tier breakdown */}
      <div className="card" style={{ padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:14 }}>Tier breakdown · how the rent is layered</div>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1.4fr 1fr 1fr 1fr', gap:'10px 16px', alignItems:'center', fontSize:13, fontVariantNumeric:'tabular-nums' }}>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Layer</div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Range</div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'right' }}>Revenue in band</div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'right' }}>% to landlord</div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'right' }}>Rent £</div>

          <div style={{ color:'var(--cream)', fontWeight:600 }}>Base</div>
          <div style={{ color:'var(--cream-dim)' }}>Fixed monthly · £250 + VAT</div>
          <div style={{ textAlign:'right', color:'var(--cream-dim)' }}>—</div>
          <div style={{ textAlign:'right', color:'var(--cream-dim)' }}>—</div>
          <div style={{ textAlign:'right', color:'#C084FC', fontWeight:600 }}>{fmt(month.base)}</div>

          <div style={{ color:'var(--cream)', fontWeight:600 }}>Tier 1</div>
          <div style={{ color:'var(--cream-dim)' }}>£0 → £1,000 net</div>
          <div style={{ textAlign:'right', color:'var(--cream)' }}>{fmt(month.t1Base)}</div>
          <div style={{ textAlign:'right', color:'var(--cream-dim)' }}>10%</div>
          <div style={{ textAlign:'right', color:'#C084FC', fontWeight:600 }}>{fmt(month.t1Rent)}</div>

          <div style={{ color:'var(--cream)', fontWeight:600 }}>Tier 2</div>
          <div style={{ color:'var(--cream-dim)' }}>£1,000 → £2,000 net</div>
          <div style={{ textAlign:'right', color:'var(--cream)' }}>{fmt(month.t2Base)}</div>
          <div style={{ textAlign:'right', color:'var(--cream-dim)' }}>25%</div>
          <div style={{ textAlign:'right', color:'#C084FC', fontWeight:600 }}>{fmt(month.t2Rent)}</div>

          <div style={{ color:'var(--cream)', fontWeight:600 }}>Tier 3</div>
          <div style={{ color:'var(--cream-dim)' }}>£2,000+ net</div>
          <div style={{ textAlign:'right', color:'var(--cream)' }}>{fmt(month.t3Base)}</div>
          <div style={{ textAlign:'right', color:'var(--cream-dim)' }}>50%</div>
          <div style={{ textAlign:'right', color:'#C084FC', fontWeight:600 }}>{fmt(month.t3Rent)}</div>

          <div style={{ gridColumn:'1 / -1', borderTop:'1px solid rgba(201,168,76,0.2)', marginTop:4 }} />

          <div style={{ color:'var(--cream)', fontWeight:700, textTransform:'uppercase', fontSize:11, letterSpacing:'0.06em' }}>Total</div>
          <div style={{ color:'var(--cream-dim)', fontSize:11 }}>Base + tier 1 + tier 2 + tier 3</div>
          <div style={{ textAlign:'right', color:'var(--cream)' }}>{fmt(month.revenue)}</div>
          <div style={{ textAlign:'right', color:'var(--cream-dim)' }}>—</div>
          <div className="serif" style={{ textAlign:'right', color:'#C084FC', fontSize:18 }}>{fmt(month.landlord)}</div>
        </div>
      </div>

      {/* Annual extrapolation with UK shopping centre seasonality */}
      <div className="card" style={{ padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6, flexWrap:'wrap', gap:10 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Annual extrapolation · UK shopping-centre seasonality</div>
          <div style={{ fontSize:11, color:'var(--cream-dim)' }}>Slider value treated as average month · multipliers sum to 12.0</div>
        </div>
        <p style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6, marginTop:4, marginBottom:14 }}>
          Peak months <strong style={{ color:'var(--cream)' }}>Nov ({SEASONAL[10].mult.toFixed(2)}×) · Dec ({SEASONAL[11].mult.toFixed(2)}×)</strong> drive the year (Black Friday / Christmas / gifting). <strong style={{ color:'var(--cream)' }}>Jan ({SEASONAL[0].mult.toFixed(2)}×) · Feb ({SEASONAL[1].mult.toFixed(2)}×)</strong> are the trough (post-Christmas slump). Using your current slider of <strong style={{ color:'var(--cream)' }}>{fmt(monthly)}/mo</strong> as the baseline, the year prints peak <strong style={{ color:'var(--cream)' }}>{fmt(peakMonth.revenue)}</strong> in {peakMonth.month} and trough <strong style={{ color:'var(--cream)' }}>{fmt(troughMonth.revenue)}</strong> in {troughMonth.month}.
        </p>

        {/* Monthly bar visualisation */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:6, marginBottom:14 }}>
          {annual.map(m => {
            const h = yMaxAnnual > 0 ? (m.revenue / yMaxAnnual) * 100 : 0
            return (
              <div key={m.month} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ height:80, width:'100%', display:'flex', alignItems:'flex-end' }}>
                  <div style={{
                    width:'100%', height:`${h}%`,
                    background: m===peakMonth ? '#10B981' : m===troughMonth ? '#F87171' : '#C084FC',
                    borderRadius:'3px 3px 0 0', opacity:0.85,
                  }} />
                </div>
                <div style={{ fontSize:9, color:'var(--cream-dim)' }}>{m.month}</div>
                <div style={{ fontSize:9, color:'var(--cream)', fontVariantNumeric:'tabular-nums' }}>{fmt(m.revenue)}</div>
              </div>
            )
          })}
        </div>

        {/* Monthly split table */}
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr 1fr 1fr', gap:'8px 14px', fontSize:12, fontVariantNumeric:'tabular-nums', alignItems:'center' }}>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Month</div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'right' }}>Mult</div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'right' }}>Revenue</div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'right' }}>Landlord</div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'right' }}>Operator</div>
          {annual.map(m => (
            <React.Fragment key={m.month}>
              <div style={{ color:'var(--cream)' }}>{m.month}</div>
              <div style={{ textAlign:'right', color:'var(--cream-dim)' }}>{m.mult.toFixed(2)}×</div>
              <div style={{ textAlign:'right', color:'var(--cream)' }}>{fmt(m.revenue)}</div>
              <div style={{ textAlign:'right', color:'#C084FC' }}>{fmt(m.landlord)}</div>
              <div style={{ textAlign:'right', color: m.operator >= 0 ? '#10B981' : '#F87171' }}>{m.operator >= 0 ? '' : '−'}{fmt(Math.abs(m.operator))}</div>
            </React.Fragment>
          ))}
          <div style={{ gridColumn:'1 / -1', borderTop:'2px solid rgba(201,168,76,0.25)', marginTop:4 }} />
          <div style={{ color:'var(--cream)', fontWeight:700, textTransform:'uppercase', fontSize:10, letterSpacing:'0.06em' }}>Year</div>
          <div style={{ textAlign:'right', color:'var(--cream-dim)' }}>12.00×</div>
          <div className="serif" style={{ textAlign:'right', color:'var(--cream)', fontSize:16 }}>{fmt(yearTotals.revenue)}</div>
          <div className="serif" style={{ textAlign:'right', color:'#C084FC', fontSize:16 }}>{fmt(yearTotals.landlord)}</div>
          <div className="serif" style={{ textAlign:'right', color: yearTotals.operator >= 0 ? '#10B981' : '#F87171', fontSize:16 }}>
            {yearTotals.operator >= 0 ? '' : '−'}{fmt(Math.abs(yearTotals.operator))}
          </div>
        </div>

        {/* Annual headline tiles */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginTop:18, paddingTop:14, borderTop:'1px solid rgba(201,168,76,0.15)' }}>
          <SeasonTile label="Year revenue"  value={fmt(yearTotals.revenue)}  sub="Slider × seasonal multipliers" colour="var(--cream)" />
          <SeasonTile label="Landlord take" value={fmt(yearTotals.landlord)} sub={`${(yearTotals.landlord / yearTotals.revenue * 100).toFixed(1)}% of revenue`} colour="#C084FC" />
          <SeasonTile label="Operator take" value={fmt(yearTotals.operator)} sub={`${(yearTotals.operator / yearTotals.revenue * 100).toFixed(1)}% of revenue`} colour={yearTotals.operator >= 0 ? '#10B981' : '#F87171'} />
          <SeasonTile label="Base rent / yr" value={fmt(yearTotals.base)}    sub={`12 × ${fmt(BASE_RENT_INC)} fixed`} colour="var(--cream-dim)" />
        </div>
      </div>
    </div>
  )
}

function SeasonTile({ label, value, sub, colour }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:12 }}>
      <div style={{ fontSize:9, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{label}</div>
      <div className="serif" style={{ fontSize:18, color: colour, lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:'var(--cream-dim)', marginTop:4 }}>{sub}</div>}
    </div>
  )
}
