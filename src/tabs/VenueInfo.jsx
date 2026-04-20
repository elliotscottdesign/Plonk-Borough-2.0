import React from 'react'

export default function VenueInfo() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 40px 60px' }}>
      <h2 className="serif" style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', color:'var(--cream)', marginBottom:8 }}>
        Venue Information
      </h2>
      <p style={{ color:'var(--cream-dim)', marginBottom:36, fontSize:14 }}>
        Borough Market SE1 · London Bridge · No Dice Borough Ltd
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <div className="card" style={{ padding:24 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>
            Location & Access
          </div>
          {[
            ['Address', 'Borough Market, SE1, London'],
            ['Nearest Station', 'London Bridge (3 min walk)'],
            ['Area', 'Borough Market — 14M+ annual visitors'],
            ['Footfall', 'High — tourist, office and local mix'],
            ['Lease', 'Secured — deposit paid from investment'],
          ].map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
        </div>

        <div className="card" style={{ padding:24 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>
            Venue Offering
          </div>
          {[
            ['Mini Golf', '9-hole course — Plonk Golf IP acquired'],
            ['Bar', 'Full licensed bar — primary revenue driver'],
            ['Pool Tables', 'Online bookable via Design My Night'],
            ['Arcades', 'Retro arcade machines — included in acquisition'],
            ['Board Games', 'Curated selection — dwell time driver'],
            ['Private Hire', 'Full venue available for exclusive bookings'],
          ].map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
        </div>

        <div className="card" style={{ padding:24 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>
            Trading History
          </div>
          {[
            ['Operating since', '2021 (as Plonk Golf)'],
            ['2025 Revenue', '£741,644 — verified 52-week actuals'],
            ['2025 EBITDA', '£91,950'],
            ['2025 Profit', '£111,177'],
            ['Peak month', 'December — £121,758 revenue'],
            ['Lowest month', 'May — £46,513 revenue'],
          ].map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
        </div>

        <div className="card" style={{ padding:24 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>
            Acquisition Details
          </div>
          {[
            ['Acquired from', 'Plonk Golf Ltd (liquidation)'],
            ['IP acquired', 'Brand, gaming IP, customer database'],
            ['Hardware', 'Bar & kitchen equipment — operational'],
            ['Entry valuation', '1.70× EBITDA (distressed pricing)'],
            ['Sector comparables', '3–5× EBITDA'],
            ['Instant equity uplift', 'Yes — Day 1 arbitrage on entry'],
          ].map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
        </div>
      </div>

      {/* Operating hours and team */}
      <div className="card" style={{ padding:24 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>
          Operations
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
          {[
            { label:'Staff (2025)', value:'23 employees', note:'1,283 shifts · 10,043 hours' },
            { label:'Booking platform', value:'Design My Night', note:'Online ticket sales — DMN checkout verified in GA4' },
            { label:'Bookings manager', value:'Remote', note:'Cost-efficient — handles events & private hires' },
            { label:'Target opening', value:'May 2026', note:'Lease secured · hardware ready' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'var(--cream-dim)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
              <div style={{ fontSize:14, color:'var(--cream)', marginBottom:4, fontFamily:"'DM Serif Display',serif" }}>{s.value}</div>
              <div style={{ fontSize:10, color:'var(--cream-dim)' }}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0',
      borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:11 }}>
      <span style={{ color:'var(--cream-dim)' }}>{label}</span>
      <span style={{ color:'var(--cream)', textAlign:'right', maxWidth:200 }}>{value}</span>
    </div>
  )
}
