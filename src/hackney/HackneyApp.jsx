import React, { useState } from 'react'
import Cover from './slides/Cover.jsx'
import TheBusiness from './slides/TheBusiness.jsx'
import TheDeal from './slides/TheDeal.jsx'
import TheReturns from './slides/TheReturns.jsx'
import ThePlan from './slides/ThePlan.jsx'
import RiskHonesty from './slides/RiskHonesty.jsx'
import Close from './slides/Close.jsx'

// Hackney deck shell — mirrors the Borough App.jsx pattern (local useState
// slide nav, no router) but lives at /hackney. Borough's i18n is intentionally
// not loaded here: Hackney is English-only per user direction, so plain
// strings inline in each slide keep the code lighter.
const SLIDES = [
  { id: 'cover',    label: 'Cover',          Component: Cover },
  { id: 'business', label: 'The Business',   Component: TheBusiness },
  { id: 'deal',     label: 'The Deal',       Component: TheDeal },
  { id: 'returns',  label: 'The Returns',    Component: TheReturns },
  { id: 'plan',     label: 'The Plan',       Component: ThePlan },
  { id: 'risk',     label: 'Risk & Honesty', Component: RiskHonesty },
  { id: 'close',    label: 'Close',          Component: Close },
]

export default function HackneyApp() {
  const [idx, setIdx] = useState(0)
  const { Component } = SLIDES[idx]
  const go = (i) => setIdx(Math.max(0, Math.min(SLIDES.length - 1, i)))

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:48, background:'var(--ink-2)', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0 }}>
        <div className="serif" style={{ fontSize:15, color:'var(--gold)' }}>No Dice Hackney</div>
        <a href="/" style={{ fontSize:11, color:'var(--cream-dim)', textDecoration:'none', letterSpacing:'0.1em', textTransform:'uppercase' }}>← Borough deck</a>
      </div>

      <div style={{ borderBottom:'1px solid rgba(201,168,76,0.1)', background:'var(--ink-2)', flexShrink:0 }}>
        <div style={{ display:'flex', overflowX:'auto', padding:'0 16px' }}>
          {SLIDES.map((s, i) => (
            <button key={s.id} onClick={() => setIdx(i)} style={{ padding:'8px 16px', fontSize:10, border:'none', borderBottom:`2px solid ${i===idx?'var(--gold)':'transparent'}`, color:i===idx?'var(--gold)':'var(--cream-dim)', background:'transparent', cursor:'pointer', transition:'all 0.15s', letterSpacing:'0.04em', whiteSpace:'nowrap', flexShrink:0, textTransform:'uppercase' }}>{s.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 20px', height:36, borderBottom:'1px solid rgba(201,168,76,0.08)', flexShrink:0 }}>
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            <button onClick={() => go(idx-1)} disabled={idx===0} style={{ width:24, height:24, borderRadius:4, border:'1px solid rgba(201,168,76,0.25)', background:'transparent', color:idx===0?'var(--ink-3)':'var(--gold)', cursor:idx===0?'default':'pointer', fontSize:11 }}>←</button>
            <span style={{ fontSize:9, color:'var(--cream-dim)' }}>{idx+1}/{SLIDES.length}</span>
            <button onClick={() => go(idx+1)} disabled={idx===SLIDES.length-1} style={{ width:24, height:24, borderRadius:4, border:'1px solid rgba(201,168,76,0.25)', background:'transparent', color:idx===SLIDES.length-1?'var(--ink-3)':'var(--gold)', cursor:idx===SLIDES.length-1?'default':'pointer', fontSize:11 }}>→</button>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'40px 32px' }}><Component /></div>
        <div style={{ padding:'5px 20px', borderTop:'1px solid rgba(201,168,76,0.08)', display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--gold-dim)', flexShrink:0 }}>
          <span>No Dice Hackney Ltd · Investor Presentation · Confidential</span>
          <span>{idx+1} / {SLIDES.length}</span>
        </div>
      </div>
    </div>
  )
}
