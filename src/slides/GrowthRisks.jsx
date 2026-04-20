import React from 'react'

const GROWTH = [
  { driver:'SEO Rebuild from Day 1', detail:'Organic traffic dropped 32% due to brand change (Plonk→No Dice). Lithos SEO programme restores rankings under No Dice Borough — compounding year-on-year. 301 redirect preserves domain authority.', impact:'High' },
  { driver:'Google Ads at Scale', detail:'Proven £0.32 CPC and 5.7% conversion rate from Nov–Dec 2025 campaign. 105 conversions in 37 days at £580 spend. Scale to £600/mth = ~107 conversions/month with verified unit economics.', impact:'Medium' },
  { driver:'Corporate Events Pipeline', detail:'Private hire revenue £44,999 in 2025. Bookings manager focusing on corporate team days, exclusive hires and Christmas parties. High-margin, pre-paid bookings with minimal incremental cost.', impact:'High' },
  { driver:'DJ Nights Programme', detail:'Friday and Saturday late events incremental to walk-in trade. High-margin bar revenue with zero additional fixed cost. Borough Market location draws natural footfall.', impact:'Medium' },
  { driver:'Gaming Repricing', detail:'+£1 across pool and mini golf affects 100k+ annual plays. Minimal customer resistance. Direct P&L impact with zero cost increase.', impact:'Low' },
  { driver:'Second Site Optionality', detail:'Proven operating model, experienced team and Borough Market brand can be replicated. Future fundraise at higher multiple is plausible once Year 1 returns are demonstrated.', impact:'Strategic' },
]

const RISKS = [
  { risk:'Reopening timeline delay', rating:'Low', mitigation:'Lease secured, hardware acquired from liquidation, staff network retained. Target May 2026.' },
  { risk:'Revenue below base case forecast', rating:'Low', mitigation:'Base case is +15% on verified 2025 actuals. Preferred return still paid if revenue is flat.' },
  { risk:'Wage inflation', rating:'Medium', mitigation:'NMW modelled at 2025 actuals. No optimistic wage assumption. Wage calculator models scenarios.' },
  { risk:'Brand transition (Plonk→No Dice)', rating:'Medium', mitigation:'SEO redirect preserves domain authority. Existing customer database retained. Location unchanged.' },
  { risk:'Marketing variability', rating:'Low', mitigation:'Google Ads proven at £0.32 CPC with live conversion tracking. SEO programme starts Day 1.' },
  { risk:'Key person dependency', rating:'Medium', mitigation:'Bookings manager and experienced bar staff retained. Operating procedures documented.' },
]

const IMPACT_COLOR = { High:'#2DD4BF', Medium:'#E67E22', Low:'#94A3B8', Strategic:'#C9A84C' }
const RAG = { Low:'#2DD4BF', Medium:'#E67E22', High:'#E53935' }

export default function GrowthRisks() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', color:'var(--cream)', marginBottom:8 }}>
        Growth & Risks
      </h2>
      <p style={{ color:'var(--cream-dim)', marginBottom:32, fontSize:14 }}>
        Upside drivers not in the base case · Risk register with mitigations
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>

        {/* Growth drivers */}
        <div>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>
            Upside Drivers (not in base case)
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {GROWTH.map((g,i) => (
              <div key={i} className="card" style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{
                    fontSize:9, padding:'2px 8px', borderRadius:10,
                    background:`${IMPACT_COLOR[g.impact]}22`, color:IMPACT_COLOR[g.impact],
                    letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600,
                  }}>{g.impact}</div>
                  <div style={{ fontSize:12, color:'var(--cream)', fontWeight:500 }}>▶ {g.driver}</div>
                </div>
                <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.5 }}>{g.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk register */}
        <div>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>
            Risk Register
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {RISKS.map((r,i) => (
              <div key={i} className="card" style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{
                    fontSize:9, padding:'2px 8px', borderRadius:10,
                    background:`${RAG[r.rating]}22`, color:RAG[r.rating],
                    letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600,
                    flexShrink:0,
                  }}>{r.rating}</div>
                  <div style={{ fontSize:12, color:'var(--cream)' }}>{r.risk}</div>
                </div>
                <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.5 }}>{r.mitigation}</div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="card-highlight" style={{ padding:18, marginTop:12 }}>
            <div style={{ fontSize:11, color:'var(--gold)', marginBottom:8 }}>Overall Risk Profile</div>
            <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.6 }}>
              Four low risks, two medium. No high risks identified. The preferred return structure
              means investors receive £12,000/yr even in a below-forecast year, providing meaningful
              downside protection.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
