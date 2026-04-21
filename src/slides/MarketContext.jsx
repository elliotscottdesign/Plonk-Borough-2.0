import React from 'react'

export default function MarketContext() {
  const benchmarks = [
    { multiple: '~5.3×', label: 'UK Mid-Market Average (EBITDA multiple)', tag: 'Above this deal', tagColor: '#6B7280', highlight: false },
    { multiple: '~4.1×', label: 'Hospitality & Leisure Sector Average', tag: 'Broadly in line', tagColor: '#6B7280', highlight: false },
    { multiple: '~2–4×', label: 'Small Single-Site Venues (<£200k EBITDA)', tag: 'In range', tagColor: '#6B7280', highlight: false },
    { multiple: '~2–3×', label: 'Distressed Asset Range (liquidation)', tag: 'Above — priced for risk', tagColor: '#6B7280', highlight: false },
    { multiple: '1.70×', label: 'No Dice Borough — This Deal', tag: '★ Entry point', tagColor: '#2DD4BF', highlight: true },
  ]

  const sectorReality = [
    { issue: 'Employer NICs rose from 13.8% → 15% (April 2025)', response: 'Labour cost increases are built into the forecast model — not hidden' },
    { issue: 'National Minimum Wage up 6.7% to £12.21/hr (April 2025)', response: 'Wage inflation modelled at 2025 actual base — no optimistic assumption' },
    { issue: 'Business rates relief cut from 75% → 40% (2025/26)', response: 'Cost environment is baked in — not a pre-cost-shock baseline' },
    { issue: 'UK hospitality recording ~2 site closures per day (2025)', response: 'Sector pressure creates acquisition opportunity at realistic pricing' },
    { issue: 'Consumer behaviour shifting toward experience-led, low-alcohol spend', response: 'No Dice Borough's experience model directly aligns with this shift' },
    { issue: 'PE firms cautious on single-country consumer exposure', response: 'Smaller investor opportunity — less institutional competition for deal' },
  ]

  const different = [
    { icon: '📈', title: 'Proven Revenue Base', color: '#C9A84C', text: '£741,644 verified 2025 actuals. Not a projection — real trading history.' },
    { icon: '📍', title: 'Prime London Location', color: '#C9A84C', text: 'Borough Market SE1: top footfall destination. 77,801 organic search sessions in 2025. Organic Search is the primary acquisition channel — Borough Market search terms actively maintained.' },
    { icon: '🎱', title: 'Experience-Led Format', color: '#2DD4BF', text: 'Pool, board games, mini golf, DJ nights. Directly aligned with fastest-growing hospitality sub-sector.' },
    { icon: '💰', title: 'Multiple Revenue Streams', color: '#C9A84C', text: 'Bar + activity pricing + events + corporate hire. Less dependent on drink-only margins.' },
    { icon: '™', title: 'Brand IP Acquired', color: '#9CA3AF', text: 'Plonk trading name, customer data and goodwill purchased. Not starting from zero.' },
    { icon: '📣', title: 'Digital Acquisition', color: '#C9A84C', text: 'Organic Search: 77,801 sessions in 2025 — the primary acquisition channel. Google Ads restarted Nov 2025 with proper tracking: 105 conversions, £0.32 CPC, £5.53 per conversion. Highly efficient when measured correctly.' },
  ]

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ marginBottom:8, fontSize:12, color:'#C9A84C', letterSpacing:'0.15em', textTransform:'uppercase' }}>Market Context</div>
      <h1 style={{ fontSize:'clamp(1.8rem,4vw,3rem)', fontWeight:900, color:'#fff', marginBottom:6, textTransform:'uppercase', letterSpacing:'-0.01em' }}>Investment Case & Market Positioning</h1>
      <p style={{ fontSize:14, color:'#9CA3AF', marginBottom:32 }}>Sourced from CLFI, Houlihan Lokey, Moore Kingston Smith, UKHospitality — 2024/25</p>

      {/* Top section: benchmarks + deal summary */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, marginBottom:24 }}>
        {/* Benchmarks */}
        <div style={{ background:'#111', border:'1px solid #2A2A2A', borderRadius:10, padding:24 }}>
          <div style={{ fontSize:12, color:'#C9A84C', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <span>📊</span> Market Benchmarks — EBITDA Multiples
          </div>
          {benchmarks.map(b => (
            <div key={b.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', marginBottom:8, borderRadius:8, background: b.highlight ? 'rgba(45,212,191,0.06)' : 'transparent', border: b.highlight ? '1px solid #2DD4BF' : '1px solid #1A1A1A' }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <span style={{ fontSize:20, fontWeight:700, color: b.highlight ? '#2DD4BF' : '#E05252', minWidth:60 }}>{b.multiple}</span>
                <span style={{ fontSize:14, color: b.highlight ? '#fff' : '#D1D5DB' }}>{b.label}</span>
              </div>
              <span style={{ fontSize:11, color: b.tagColor, background:'rgba(255,255,255,0.05)', border:'1px solid #333', borderRadius:4, padding:'3px 10px', whiteSpace:'nowrap', color: b.highlight ? '#2DD4BF' : '#9CA3AF' }}>{b.tag}</span>
            </div>
          ))}
          <p style={{ fontSize:11, color:'#6B7280', marginTop:12 }}>Sources: CLFI M&A Monitor H1 2025 · Houlihan Lokey Hospitality H1 2025 · Moore Kingston Smith 2025</p>
        </div>

        {/* Deal summary */}
        <div style={{ background:'rgba(201,168,76,0.06)', border:'2px solid #C9A84C', borderRadius:10, padding:24 }}>
          <div style={{ fontSize:12, color:'#C9A84C', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:16 }}>★ The Deal in One Line</div>
          <p style={{ fontSize:15, color:'#E5E7EB', lineHeight:1.7, marginBottom:20 }}>
            A proven Borough Market experience venue, acquired at distressed pricing (<span style={{ color:'#C9A84C', fontWeight:700 }}>1.70× EBITDA</span>), delivering <span style={{ color:'#F97316', fontWeight:700 }}>8% guaranteed preferred return</span> + equity participation, with payback driven by <span style={{ color:'#2DD4BF', fontWeight:700 }}>cash flow — not exit dependency</span>.
          </p>
          {[
            { tick:'✓', title:'Not a multiple expansion bet', sub:'Returns driven by operating cash flow' },
            { tick:'✓', title:'Cash-yielding from Day 1', sub:'Distributions begin at end of Year 1' },
            { tick:'✓', title:'All 3 scenarios positive', sub:'Conservative through Optimistic' },
          ].map(item => (
            <div key={item.title} style={{ background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:8, padding:'12px 16px', marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:4 }}>{item.tick} {item.title}</div>
              <div style={{ fontSize:12, color:'#9CA3AF' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom section: sector reality + why different */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Sector reality */}
        <div style={{ background:'#111', border:'1px solid #2A2A2A', borderRadius:10, padding:24 }}>
          <div style={{ fontSize:12, color:'#F59E0B', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <span>⚠️</span> Sector Reality — Honest Context
          </div>
          {sectorReality.map(item => (
            <div key={item.issue} style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, color:'#D1D5DB', marginBottom:4 }}>▪ {item.issue}</div>
              <div style={{ fontSize:13, color:'#60A5FA', paddingLeft:14 }}>→ {item.response}</div>
            </div>
          ))}
        </div>

        {/* Why different */}
        <div style={{ background:'#111', border:'1px solid #2A2A2A', borderRadius:10, padding:24 }}>
          <div style={{ fontSize:12, color:'#F59E0B', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <span>🏆</span> Why This Business is Different
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {different.map(item => (
              <div key={item.title} style={{ background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:8, padding:16 }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{item.icon}</div>
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