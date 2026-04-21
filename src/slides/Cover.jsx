import React from 'react'

export default function Cover() {
  const stats = [
    { label: 'Seeking', value: '£150,000', sub: '49% equity · 51% retained by founder' },
    { label: '2025 Verified Revenue', value: '£741,644', sub: 'Real trading history — not a projection' },
    { label: 'Year 1 Investor Return', value: '£78,123', sub: '52.1% cash-on-cash · payback 1.92 yrs' },
    { label: 'Preferred Return', value: '£12,000/yr', sub: '8% annual · paid first before distributions' },
    { label: 'Forecast Revenue', value: '£852,891', sub: 'Base case +15% · May 2026–Apr 2027' },
    { label: 'Valuation Entry', value: '1.70×', sub: 'EBITDA · distressed acquisition pricing' },
  ]

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:48 }}>
        <div style={{ fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--gold)', marginBottom:16 }}>
          Series A · Seed Investment · April 2026
        </div>
        <h1 className="serif" style={{ fontSize:'clamp(3rem,7vw,5.5rem)', lineHeight:1, color:'var(--cream)', marginBottom:20 }}>
          No Dice<br/>Borough
        </h1>
        <p style={{ fontSize:18, color:'var(--cream-dim)', maxWidth:520, lineHeight:1.6 }}>
          A proven Borough Market experience venue — mini golf, bar, pool, arcades and board games.
          Generating £741,644 verified 2025 revenue, acquired at distressed pricing.
        </p>
      </div>

      <div style={{ height:1, background:'linear-gradient(90deg,transparent,var(--gold),transparent)', marginBottom:40 }} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:12, padding:24 }}>
            <div style={{ fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', marginBottom:10 }}>{s.label}</div>
            <div className="serif" style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)', color:'var(--cream)', marginBottom:8, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:40, padding:'16px 24px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:10 }}>
        <div style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6 }}>
          <strong style={{ color:'var(--gold)' }}>Borough Market SE1</strong> · Arches B C D And E, Montague Close · London Bridge
        </div>
      </div>
    </div>
  )
}