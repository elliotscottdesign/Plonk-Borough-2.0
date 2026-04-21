import React from 'react'

export default function MarketContext() {
  const benchmarks = [
    { multiple: '~5.3Ã', label: 'UK Mid-Market Average (EBITDA multiple)', tag: 'Above this deal', tagColor: '#6B7280', highlight: false },
    { multiple: '~4.1Ã', label: 'Hospitality & Leisure Sector Average', tag: 'Broadly in line', tagColor: '#6B7280', highlight: false },
    { multiple: '~2â4Ã', label: 'Small Single-Site Venues (<Â£200k EBITDA)', tag: 'In range', tagColor: '#6B7280', highlight: false },
    { multiple: '~2â3Ã', label: 'Distressed Asset Range (liquidation)', tag: 'Above â priced for risk', tagColor: '#6B7280', highlight: false },
    { multiple: '1.70Ã', label: 'No Dice Borough â This Deal', tag: 'â Entry point', tagColor: '#2DD4BF', highlight: true },
  ]

  const sectorReality = [
    { issue: 'Employer NICs rose from 13.8% â 15% (April 2025)', response: 'Labour cost increases are built into the forecast model â not hidden' },
    { issue: 'National Minimum Wage up 6.7% to Â£12.21/hr (April 2025)', response: 'Wage inflation modelled at 2025 actual base â no optimistic assumption' },
    { issue: 'Business rates relief cut from 75% â 40% (2025/26)', response: 'Cost environment is baked in â not a pre-cost-shock baseline' },
    { issue: 'UK hospitality recording ~2 site closures per day (2025)', response: 'Sector pressure creates acquisition opportunity at realistic pricing' },
    { issue: 'Consumer behaviour shifting toward experience-led, low-alcohol spend', response: "No Dice Borough's experience model directly aligns with this shift" },
    { issue: 'PE firms cautious on single-country consumer exposure', response: 'Smaller investor opportunity â less institutional competition for deal' },
  ]

  const differentiators = [
    { icon: 'ð', title: 'Proven Revenue Base', color: '#C9A84C', text: 'Â£741,644 verified 2025 actuals. Not a projection â real trading history.' },
    { icon: 'ð', title: 'Prime London Location', color: '#C9A84C', text: 'Borough Market SE1: top footfall destination. 77,801 organic search sessions in 2025. Organic Search is the primary acquisition channel â Borough Market search terms actively maintained.' },
    { icon: 'ð±', title: 'Experience-Led Format', color: '#2DD4BF', text: 'Pool, board games, mini golf, DJ nights. Directly aligned with fastest-growing hospitality sub-sector.' },
    { icon: 'ð°', title: 'Multiple Revenue Streams', color: '#C9A84C', text: 'Bar + activity pricing + events + corporate hire. Less dependent on drink-only margins.' },
    { icon: 'â¢', title: 'Brand IP Acquired', color: '#9CA3AF', text: 'Plonk trading name, customer data and goodwill purchased. Not starting from zero.' },
    { icon: 'ð£', title: 'Digital Acquisition', color: '#2DD4BF', text: 'Organic Search: 77,801 sessions in 2025 â the primary acquisition channel. Google Ads restarted Nov 2025 with proper tracking: 105 conversions, Â£0.32 CPC, Â£5.53 per conversion. Highly efficient when measured correctly.' },
  ]

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 4px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:12, color:'#C9A84C', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>Market Context</div>
        <h2 className="serif" style={{ fontSize:'clamp(2rem, 4vw, 3rem)', color:'var(--cream)', marginBottom:8 }}>Investment Case &amp; Market Positioning</h2>
        <p style={{ fontSize:14, color:'#9CA3AF' }}>Sourced from CLFI, Houlihan Lokey, Moore Kingston Smith, UKHospitality â 2024/25</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, marginBottom:20 }}>
        {/* Left: Market Benchmarks */}
        <div style={{ background:'#13131A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <span style={{ fontSize:16 }}>ð</span>
            <span style={{ fontSize:12, color:'#C9A84C', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>Market Benchmarks â EBITDA Multiples</span>
          </div>
          {benchmarks.map((b, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', marginBottom:8, borderRadius:8, background: b.highlight ? 'rgba(45,212,191,0.05)' : 'rgba(255,255,255,0.02)', border: b.highlight ? '1px solid #2DD4BF' : '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize:18, fontWeight:800, color: b.highlight ? '#2DD4BF' : '#E53935', minWidth:60 }}>{b.multiple}</div>
              <div style={{ flex:1, fontSize:14, color:'#F5F0E8' }}>{b.label}</div>
              <div style={{ fontSize:11, color: b.highlight ? '#2DD4BF' : '#6B7280', border: `1px solid ${b.highlight ? '#2DD4BF' : '#374151'}`, borderRadius:4, padding:'3px 10px', whiteSpace:'nowrap' }}>{b.tag}</div>
            </div>
          ))}
          <div style={{ marginTop:16, fontSize:11, color:'#6B7280' }}>Sources: CLFI M&A Monitor H1 2025 Â· Houlihan Lokey Hospitality H1 2025 Â· Moore Kingston Smith 2025</div>
        </div>

        {/* Right: The Deal in One Line */}
        <div style={{ background:'#13131A', border:'2px solid #C9A84C', borderRadius:10, padding:24 }}>
          <div style={{ fontSize:11, color:'#C9A84C', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:16 }}>â The Deal in One Line</div>
          <p style={{ fontSize:14, color:'#F5F0E8', lineHeight:1.7, marginBottom:20 }}>
            A proven Borough Market experience venue, acquired at distressed pricing (<span style={{ color:'#C9A84C', fontWeight:700 }}>1.70Ã EBITDA</span>), delivering <span style={{ color:'#E67E22', fontWeight:700 }}>8% guaranteed preferred return</span> + equity participation, with payback driven by <span style={{ color:'#2DD4BF', fontWeight:700 }}>cash flow â not exit dependency</span>.
          </p>
          {[
            { check:'â Not a multiple expansion bet', sub:'Returns driven by operating cash flow' },
            { check:'â Cash-yielding from Day 1', sub:'Distributions begin at end of Year 1' },
            { check:'â All 3 scenarios positive', sub:'Conservative through Optimistic' },
          ].map((item, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'10px 14px', marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#F5F0E8', marginBottom:2 }}>{item.check}</div>
              <div style={{ fontSize:12, color:'#9CA3AF' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Sector Reality */}
        <div style={{ background:'#13131A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <span style={{ fontSize:16 }}>â ï¸</span>
            <span style={{ fontSize:12, color:'#EAB308', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>Sector Reality â Honest Context</span>
          </div>
          {sectorReality.map((item, i) => (
            <div key={i} style={{ marginBottom:14 }}>
              <div style={{ fontSize:13, color:'#D1D5DB' }}>âª {item.issue}</div>
              <div style={{ fontSize:13, color:'#2DD4BF', paddingLeft:16, marginTop:4 }}>â {item.response}</div>
            </div>
          ))}
        </div>

        {/* Why This Business is Different */}
        <div style={{ background:'#13131A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <span style={{ fontSize:16 }}>ð</span>
            <span style={{ fontSize:12, color:'#E67E22', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>Why This Business is Different</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {differentiators.map((item, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:14 }}>
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