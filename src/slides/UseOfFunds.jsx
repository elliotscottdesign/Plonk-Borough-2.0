import React from 'react'

export default function UseOfFunds() {
  const funds = [
    { label:'Hardware from Liquidators', color:'#4FC3F7', pct:16, amount:24000, vat:'+VAT', icon:'🔧', desc:'Physical bar & kitchen equipment — purchased at liquidation pricing. Operational on Day 1.' },
    { label:'Plonk IP & Goodwill', color:'#C9A84C', pct:48, amount:72000, vat:'+VAT', icon:'⭐', desc:'Brand, gaming IP, customer data and trading goodwill — the proven revenue-generating asset.' },
    { label:'Stock & Supplier Restart', color:'#2DD4BF', pct:8, amount:12000, vat:'+VAT', icon:'📦', desc:'Opening stock, supplier agreements and software subscriptions to trade from Day 1.' },
    { label:'Rent Deposit (3 months)', color:'#8B5CF6', pct:18, amount:27078, vat:'inc VAT', icon:'🏠', desc:'Security deposit held by landlord covering May, Jun, Jul 2026.' },
    { label:'Working Capital Buffer', color:'#6B7280', pct:10, amount:14922, vat:null, icon:'💼', desc:'Staged into business per cash flow model. Covers early trading before revenue covers costs.' },
  ]
  const fmt = n => '£' + n.toLocaleString()
  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 4px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:12, color:'#4FC3F7', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>Use of Investment Funds</div>
        <h1 style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', fontWeight:900, color:'var(--cream)', marginBottom:8, textTransform:'uppercase' }}>Where Your £150,000 Goes</h1>
        <p style={{ fontSize:14, color:'#9CA3AF' }}>Every pound deployed on Day 1 of reopening — no funds held in reserve outside the business</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:24 }}>
          <div style={{ fontSize:12, color:'#4FC3F7', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:20 }}>Fund Allocation — Visual Breakdown</div>
          <div style={{ display:'flex', height:32, borderRadius:6, overflow:'hidden', marginBottom:24 }}>
            {funds.map(f => <div key={f.label} style={{ width:f.pct+'%', background:f.color }} />)}
          </div>
          {funds.map(f => (
            <div key={f.label} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ width:12, height:12, borderRadius:2, background:f.color, flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:600, color:'var(--cream)', flex:1 }}>{f.label}</span>
                {f.vat && <span style={{ fontSize:10, color:f.color, border:`1px solid ${f.color}`, borderRadius:3, padding:'1px 6px' }}>{f.vat}</span>}
                <span style={{ fontSize:13, color:f.color, fontWeight:600, minWidth:36, textAlign:'right' }}>{f.pct}%</span>
                <span style={{ fontSize:13, fontWeight:700, color:f.color, minWidth:64, textAlign:'right' }}>{fmt(f.amount)}</span>
              </div>
              <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, marginLeft:20 }}>
                <div style={{ height:'100%', width:f.pct+'%', background:f.color, borderRadius:2 }} />
              </div>
            </div>
          ))}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', marginTop:8, paddingTop:12, display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--cream)', letterSpacing:'0.06em' }}>TOTAL INVESTMENT</span>
            <span style={{ fontSize:16, fontWeight:700, color:'#C9A84C' }}>£150,000</span>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {funds.map(f => (
            <div key={f.label} style={{ background:'#0D1117', border:'1px solid #21262D', borderLeft:`3px solid ${f.color}`, borderRadius:8, padding:'14px 18px', display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ fontSize:22, flexShrink:0 }}>{f.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:'var(--cream)' }}>{f.label}</span>
                  <span style={{ fontSize:12, color:f.color, fontWeight:600, marginLeft:'auto' }}>{f.pct}%</span>
                  <span style={{ fontSize:14, fontWeight:700, color:f.color }}>{fmt(f.amount)}</span>
                </div>
                <div style={{ fontSize:12, color:'#9CA3AF', lineHeight:1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--cream)', letterSpacing:'0.06em' }}>£150,000 TOTAL · 100% DEPLOYED DAY 1</div>
          <div style={{ fontSize:12, color:'#9CA3AF' }}>VAT on startup costs (£18,000) reclaimed in Q1 — credited against first HMRC VAT return (August 2026)</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          <div style={{ background:'rgba(234,88,12,0.1)', border:'1px solid rgba(234,88,12,0.3)', borderRadius:8, padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#EA580C', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>Day 1 Deployed</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#EA580C', marginBottom:4 }}>£135,078</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>Startup costs paid immediately</div>
          </div>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'2px solid rgba(201,168,76,0.4)', borderRadius:8, padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#C9A84C', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>Working Capital</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#C9A84C', marginBottom:4 }}>£14,922</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>Staged per cash flow model</div>
          </div>
          <div style={{ background:'rgba(45,212,191,0.08)', border:'1px solid rgba(45,212,191,0.3)', borderRadius:8, padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#2DD4BF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>VAT Reclaim</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#2DD4BF', marginBottom:4 }}>£18,000</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>Recovered Q1 — August 2026</div>
          </div>
        </div>
      </div>
    </div>
  )
}