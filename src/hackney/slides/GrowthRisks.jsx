import React from 'react'

// GrowthRisks — clones Borough's structure: 2-column grid of growth drivers
// (left) and risk register (right) + overall risk profile callout.
// Six drivers + six risks, each with impact/RAG badge + mitigation/detail.
//
// Borough copy adapted for Hackney where the driver/risk maps cleanly. Items
// that are Borough-specific (SEO 32% drop from Plonk→No Dice rebrand at
// Borough; Lithos programme; Borough Market location) are restated for
// Hackney with TBD where the underlying numbers haven't been measured yet.

const IMPACT_COLOR = { high:'#2DD4BF', medium:'#E67E22', low:'#94A3B8', strategic:'#C9A84C' }
const RAG = { low:'#2DD4BF', medium:'#E67E22', high:'#E53935' }

const DRIVERS = [
  {
    key: 'seo', impact: 'high',
    driver: 'SEO Rebuild from Day 1',
    detail: 'Organic traffic baseline TBD — pending GA4 export. Equivalent SEO programme planned for No Dice Hackney to capture local-search demand. 301 redirect preserves any inbound domain authority on relaunch.',
  },
  {
    key: 'organic', impact: 'medium',
    driver: 'Organic & Local Listings',
    detail: 'Time Out, Resident Advisor, Broadway Market and neighbourhood guides. £2k/yr local listings spend — no paid Google Ads dependency.',
  },
  {
    key: 'corporate', impact: 'high',
    driver: 'Corporate Events Pipeline',
    detail: 'Private hire and corporate bookings TBD — split not yet broken out for the bar-only restatement. Bookings manager focusing on team days, exclusive hires and Christmas parties.',
  },
  {
    key: 'dj', impact: 'medium',
    driver: 'DJ & Events Programme',
    detail: 'Friday and Saturday late events — highest-revenue nights. High-margin bar revenue with minimal additional fixed cost. London Fields location draws natural late-night footfall.',
  },
  {
    key: 'repricing', impact: 'low',
    driver: 'Pool & Gaming Repricing',
    detail: 'Modest price increases on pool tables and arcade play affect 10k+ annual plays. Minimal customer resistance. Direct P&L impact with zero cost increase.',
  },
  {
    key: 'development', impact: 'strategic',
    driver: 'Garden & Capacity Uplift',
    detail: '£12k garden refurbishment expands outdoor trading area for summer/event use — material capacity uplift inside the existing footprint. See Venue Info → Development for the full plan.',
  },
]

const RISKS = [
  {
    key: 'timeline', rating: 'low',
    risk: 'Reopening timeline delay',
    mitigation: 'Lease secured, stock purchased from liquidators, staff network retained. Target May 2026.',
  },
  {
    key: 'revenue', rating: 'low',
    risk: 'Revenue below base case forecast',
    mitigation: 'Base case is +15% on verified 2025 bar-only actuals. Pro-rata dividend flexes with whatever operating profit the venue delivers.',
  },
  {
    key: 'wage', rating: 'medium',
    risk: 'Wage inflation',
    mitigation: 'NMW modelled at 2025 actuals (£12.21/hr fully-loaded). No optimistic wage assumption. Wage calculator on Business Explorer models scenarios.',
  },
  {
    key: 'brand', rating: 'medium',
    risk: 'Brand transition',
    mitigation: 'Existing customer database retained, trading goodwill carries across. Location unchanged. Bar-only restatement clarifies the operating model.',
  },
  {
    key: 'marketing', rating: 'low',
    risk: 'Marketing variability',
    mitigation: 'No paid Google Ads dependency — runs on organic, local listings and events. Lower spend, lower risk of underperforming paid channel.',
  },
  {
    key: 'keyPerson', rating: 'medium',
    risk: 'Key person dependency',
    mitigation: 'Bookings manager and experienced bar staff retained. Operating procedures documented.',
  },
]

export default function GrowthRisks() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', color:'var(--cream)', marginBottom:8 }}>
        Growth &amp; Risks
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
            {DRIVERS.map((g) => (
              <div key={g.key} className="card" style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{
                    fontSize:9, padding:'2px 8px', borderRadius:10,
                    background:`${IMPACT_COLOR[g.impact]}22`, color:IMPACT_COLOR[g.impact],
                    letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600,
                  }}>{g.impact === 'strategic' ? 'Strategic' : g.impact[0].toUpperCase() + g.impact.slice(1)}</div>
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
            {RISKS.map((r) => (
              <div key={r.key} className="card" style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{
                    fontSize:9, padding:'2px 8px', borderRadius:10,
                    background:`${RAG[r.rating]}22`, color:RAG[r.rating],
                    letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600,
                    flexShrink:0,
                  }}>{r.rating[0].toUpperCase() + r.rating.slice(1)}</div>
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
              Four low risks, three medium. No high risks identified. Investor return flexes with the business — pro-rata on operating profit means upside and downside sit on the same side of the table as the founder.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
