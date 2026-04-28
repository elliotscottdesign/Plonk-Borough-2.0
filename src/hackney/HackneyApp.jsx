import React, { useState } from 'react'
import VenueInfo from './tabs/VenueInfo.jsx'
import BusinessExplorer from './tabs/BusinessExplorer.jsx'
import Plonk from './tabs/Plonk.jsx'
import Cover from './slides/Cover.jsx'
import InvestmentSummary from './slides/InvestmentSummary.jsx'
import UseOfFunds from './slides/UseOfFunds.jsx'
import MarketContext from './slides/MarketContext.jsx'
import WaterfallReturns from './slides/WaterfallReturns.jsx'
import GrowthRisks from './slides/GrowthRisks.jsx'
import InvestmentCase from './slides/InvestmentCase.jsx'
import { WORKBOOK_URL } from '../data/hackney.js'

// HackneyApp — clones the structure of Borough's App.jsx exactly:
//   • 4 top-level tabs: Investor Deck · Venue Info · Business Explorer · Plonk
//   • Investor Deck shows 7 slides in the same order as Borough
//   • Slide nav: dots row + prev/next + footer counter
//
// Differences vs Borough App.jsx:
//   • No i18n. English-only inline strings.
//   • No LockedForecastProvider — Hackney's Business Explorer doesn't yet
//     have a 2026 Performance lock feature. Stub the calls in slides that
//     would have used it; wire the provider back in when that tab exists.
//   • Workbook button hidden if WORKBOOK_URL is empty (Hackney's URL is TBD).
//   • Brand text: "No Dice Hackney" + "← Borough deck" link in the header.

const SLIDE_DEFS = [
  { id:'cover',      label:'Cover',              Component: Cover },
  { id:'summary',    label:'Investment Summary', Component: InvestmentSummary },
  { id:'funds',      label:'Use of Funds',       Component: UseOfFunds },
  { id:'market',     label:'Market Context',     Component: MarketContext },
  { id:'waterfall',  label:'Investor Returns',   Component: WaterfallReturns },
  { id:'growth',     label:'Growth & Risks',     Component: GrowthRisks },
  { id:'case',       label:'Investment Case',    Component: InvestmentCase },
]

const TOP_TABS = [
  { key:'investorDeck',     label:'Investor Deck' },
  { key:'venueInfo',        label:'Venue Info' },
  { key:'businessExplorer', label:'Business Explorer' },
  { key:'plonk',            label:'Plonk' },
]

export default function HackneyApp() {
  const [topTab, setTopTab] = useState('investorDeck')
  const [slideIdx, setSlideIdx] = useState(0)
  const { Component } = SLIDE_DEFS[slideIdx]
  const go = (i) => setSlideIdx(Math.max(0, Math.min(SLIDE_DEFS.length - 1, i)))

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif" }}>

      {/* Top header — brand + tab buttons + back-to-Borough */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:48, background:'var(--ink-2)', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0 }}>
        <div className="serif" style={{ fontSize:15, color:'var(--gold)' }}>No Dice Hackney</div>
        <div style={{ display:'flex', gap:4 }}>
          {TOP_TABS.map(t => (
            <button key={t.key} onClick={() => setTopTab(t.key)} style={{ padding:'10px 24px', fontSize:13, borderRadius:8, cursor:'pointer', background:topTab===t.key?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)', border:`2px solid ${topTab===t.key?'var(--gold)':'rgba(255,255,255,0.1)'}`, color:topTab===t.key?'var(--gold)':'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em', fontWeight:topTab===t.key?600:400 }}>{t.label}</button>
          ))}
          {WORKBOOK_URL && (
            <button onClick={() => window.open(WORKBOOK_URL, '_blank', 'noopener,noreferrer')} style={{ padding:'10px 24px', fontSize:13, borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'2px solid rgba(255,255,255,0.1)', color:'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em' }}>Workbook</button>
          )}
        </div>
        <a href="/" style={{ fontSize:11, color:'var(--cream-dim)', textDecoration:'none', letterSpacing:'0.1em', textTransform:'uppercase' }}>← Borough deck</a>
      </div>

      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {topTab === 'investorDeck' && (
          <>
            {/* Slide nav row */}
            <div style={{ borderBottom:'1px solid rgba(201,168,76,0.1)', background:'var(--ink-2)', flexShrink:0 }}>
              <div style={{ display:'flex', overflowX:'auto', padding:'0 16px' }}>
                {SLIDE_DEFS.map((s, i) => (
                  <button key={s.id} onClick={() => setSlideIdx(i)} style={{ padding:'8px 16px', fontSize:10, border:'none', borderBottom:`2px solid ${i===slideIdx?'var(--gold)':'transparent'}`, color:i===slideIdx?'var(--gold)':'var(--cream-dim)', background:'transparent', cursor:'pointer', transition:'all 0.15s', letterSpacing:'0.04em', whiteSpace:'nowrap', flexShrink:0, textTransform:'uppercase' }}>{s.label}</button>
                ))}
              </div>
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 20px', height:36, borderBottom:'1px solid rgba(201,168,76,0.08)', flexShrink:0 }}>
                <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                  <button onClick={() => go(slideIdx-1)} disabled={slideIdx===0} style={{ width:24, height:24, borderRadius:4, border:'1px solid rgba(201,168,76,0.25)', background:'transparent', color:slideIdx===0?'var(--ink-3)':'var(--gold)', cursor:slideIdx===0?'default':'pointer', fontSize:11 }}>←</button>
                  <span style={{ fontSize:9, color:'var(--cream-dim)' }}>{slideIdx+1}/{SLIDE_DEFS.length}</span>
                  <button onClick={() => go(slideIdx+1)} disabled={slideIdx===SLIDE_DEFS.length-1} style={{ width:24, height:24, borderRadius:4, border:'1px solid rgba(201,168,76,0.25)', background:'transparent', color:slideIdx===SLIDE_DEFS.length-1?'var(--ink-3)':'var(--gold)', cursor:slideIdx===SLIDE_DEFS.length-1?'default':'pointer', fontSize:11 }}>→</button>
                </div>
              </div>
              <div style={{ flex:1, overflowY:'auto', padding:'40px 32px' }}><Component /></div>
              <div style={{ padding:'5px 20px', borderTop:'1px solid rgba(201,168,76,0.08)', display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--gold-dim)', flexShrink:0 }}>
                <span>No Dice Hackney Ltd · Investor Presentation · Confidential</span>
                <span>{slideIdx+1} / {SLIDE_DEFS.length}</span>
              </div>
            </div>
          </>
        )}
        {topTab === 'venueInfo' && <div style={{ flex:1, overflowY:'auto' }}><VenueInfo /></div>}
        {topTab === 'businessExplorer' && <div style={{ flex:1, overflowY:'auto' }}><BusinessExplorer /></div>}
        {topTab === 'plonk' && <div style={{ flex:1, overflowY:'auto' }}><Plonk /></div>}
      </div>
    </div>
  )
}
