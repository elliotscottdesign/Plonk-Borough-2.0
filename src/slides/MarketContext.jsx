import React from 'react'

export default function MarketContext() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', color:'var(--cream)', marginBottom:8 }}>
        Market Context
      </h2>
      <p style={{ color:'var(--cream-dim)', marginBottom:36, fontSize:14 }}>
        Why Borough Market · Why experience venues · Why now
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        <Card icon="📍" title="Defensible Location" body="Borough Market SE1 is one of London's highest-footfall destinations — 14+ million visitors annually. The lease cannot be replicated. No competitor can open next door." />
        <Card icon="🎯" title="Experience Economy" body="Post-pandemic consumer spending has shifted permanently toward experiences over goods. London's hospitality sector grew 8.2% in 2024. Experience venues outperform standard F&B 2–3×." />
        <Card icon="🏆" title="Multiple Revenue Streams" body="Bar spend (49%), online golf tickets (28%), bookings & events (14%), private hires (6%), pool and service charge. No single point of failure — six income streams." />
        <Card icon="💼" title="Distressed Entry Pricing" body="Acquisition from liquidation at 1.70× EBITDA — sector comparables trade at 3–5×. Immediate equity uplift on Day 1. This pricing cannot be achieved in a competitive market sale." />
      </div>

      {/* Valuation comparison */}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:20 }}>
          Valuation Comparison — Hospitality Sector
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {[
            { label:'Small Single-Site\n(<£200k EBITDA)', range:'~2–4×', note:'In range', highlight:false },
            { label:'No Dice Borough\nEntry Multiple', range:'1.70×', note:'Our entry — distressed acquisition', highlight:true },
            { label:'Sector Average\n(hospitality)', range:'3.5–5×', note:'Standard market rate', highlight:false },
            { label:'London Leisure\nPremium Sites', range:'5–8×', note:'Prime location premium', highlight:false },
          ].map((v,i) => (
            <div key={i} style={{
              padding:'16px 14px', borderRadius:10, textAlign:'center',
              background: v.highlight ? 'rgba(201,168,76,0.1)' : 'var(--ink-3)',
              border: v.highlight ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize:9, color:'var(--cream-dim)', marginBottom:10, whiteSpace:'pre-line', lineHeight:1.4 }}>{v.label}</div>
              <div className="serif" style={{ fontSize:24, color: v.highlight ? 'var(--gold)' : 'var(--cream)', marginBottom:6 }}>{v.range}</div>
              <div style={{ fontSize:9, color: v.highlight ? 'var(--gold-dim)' : 'var(--cream-dim)', lineHeight:1.3 }}>{v.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Market trends */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
        {[
          { stat:'77,801', label:'Organic search sessions 2025', note:'Primary acquisition channel — zero paid cost' },
          { stat:'£741,644', label:'Verified 2025 revenue', note:'Real trading history from 52 weeks of categorised P&L' },
          { stat:'6', label:'Revenue streams', note:'Bar, golf, pool, bookings, private hire, service charge' },
        ].map((m,i) => (
          <div key={i} className="card" style={{ padding:20, textAlign:'center' }}>
            <div className="serif" style={{ fontSize:30, color:'var(--gold)', marginBottom:6 }}>{m.stat}</div>
            <div style={{ fontSize:11, color:'var(--cream)', marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:10, color:'var(--cream-dim)' }}>{m.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Card({ icon, title, body }) {
  return (
    <div className="card" style={{ padding:22 }}>
      <div style={{ fontSize:22, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:13, color:'var(--cream)', fontWeight:500, marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.6 }}>{body}</div>
    </div>
  )
}
