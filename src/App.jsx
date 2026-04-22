import React, { useState } from 'react'
import PasswordGate from './PasswordGate.jsx'
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

const SLIDES = [
  { id:'cover',      label:'01  Cover',               Component: Cover },
  { id:'summary',    label:'02  Investment Summary',  Component: InvestmentSummary },
  { id:'funds',      label:'03  Use of Funds',        Component: UseOfFunds },
  { id:'market',     label:'04  Market Context',      Component: MarketContext },
  { id:'waterfall',  label:'05  Waterfall Returns',   Component: WaterfallReturns },
  { id:'growth',     label:'06  Growth & Risks',      Component: GrowthRisks },
  { id:'case',       label:'07  Investment Case',     Component: InvestmentCase },
]

const BASE_TOP_TABS = ['Investor Deck', 'Venue Info', 'Business Explorer']

export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('ndb_unlocked') === '1')
  const [plonkAccess, setPlonkAccess] = useState(() => sessionStorage.getItem('ndb_plonk') === '1')
  const [topTab, setTopTab] = useState('Investor Deck')
  const [slideIdx, setSlideIdx] = useState(0)
  const { Component } = SLIDES[slideIdx]
  const go = (i) => setSlideIdx(Math.max(0, Math.min(SLIDES.length - 1, i)))
  const TOP_TABS = plonkAccess ? [...BASE_TOP_TABS, 'Plonk'] : BASE_TOP_TABS

  if (!unlocked) {
    return <PasswordGate onUnlock={({ plonk }) => {
      sessionStorage.setItem('ndb_unlocked', '1')
      if (plonk) sessionStorage.setItem('ndb_plonk', '1')
      else sessionStorage.removeItem('ndb_plonk')
      setPlonkAccess(!!plonk)
      setUnlocked(true)
    }} />
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:48, background:'var(--ink-2)', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0 }}>
        <div className="serif" style={{ fontSize:15, color:'var(--gold)' }}>No Dice Borough Ltd</div>
        <div style={{ display:'flex', gap:4 }}>
          {TOP_TABS.map(t => (
            <button key={t} onClick={() => setTopTab(t)} style={{ padding:'10px 24px', fontSize:13, borderRadius:8, cursor:'pointer', background:topTab===t?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)', border:`2px solid ${topTab===t?'var(--gold)':'rgba(255,255,255,0.1)'}`, color:topTab===t?'var(--gold)':'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em', fontWeight:topTab===t?600:400 }}>{t}</button>
          ))}
        </div>
        <div style={{ fontSize:9, color:'var(--gold-dim)', letterSpacing:'0.1em' }}>CONFIDENTIAL · BOROUGH MARKET SE1</div>
      </div>
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {topTab === 'Investor Deck' && (
          <>
            <div style={{ borderBottom:'1px solid rgba(201,168,76,0.1)', background:'var(--ink-2)', flexShrink:0 }}>
              <div style={{ display:'flex', overflowX:'auto', padding:'0 16px' }}>
                {SLIDES.map((s, i) => (
                  <button key={s.id} onClick={() => setSlideIdx(i)} style={{ padding:'8px 16px', fontSize:10, border:'none', borderBottom:`2px solid ${i===slideIdx?'var(--gold)':'transparent'}`, color:i===slideIdx?'var(--gold)':'var(--cream-dim)', background:'transparent', cursor:'pointer', transition:'all 0.15s', letterSpacing:'0.04em', whiteSpace:'nowrap', flexShrink:0 }}>{s.label}</button>
                ))}
              </div>
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 20px', height:36, borderBottom:'1px solid rgba(201,168,76,0.08)', flexShrink:0 }}>
                <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                  <button onClick={() => go(slideIdx-1)} disabled={slideIdx===0} style={{ width:24, height:24, borderRadius:4, border:'1px solid rgba(201,168,76,0.25)', background:'transparent', color:slideIdx===0?'var(--ink-3)':'var(--gold)', cursor:slideIdx===0?'default':'pointer', fontSize:11 }}>←</button>
                  <span style={{ fontSize:9, color:'var(--cream-dim)' }}>{slideIdx+1}/{SLIDES.length}</span>
                  <button onClick={() => go(slideIdx+1)} disabled={slideIdx===SLIDES.length-1} style={{ width:24, height:24, borderRadius:4, border:'1px solid rgba(201,168,76,0.25)', background:'transparent', color:slideIdx===SLIDES.length-1?'var(--ink-3)':'var(--gold)', cursor:slideIdx===SLIDES.length-1?'default':'pointer', fontSize:11 }}>→</button>
                </div>
              </div>
              <div style={{ flex:1, overflowY:'auto' }}><Component /></div>
              <div style={{ padding:'5px 20px', borderTop:'1px solid rgba(201,168,76,0.08)', display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--gold-dim)', flexShrink:0 }}>
                <span>Generated April 2026 · Confidential · No Dice Borough Ltd</span>
                <span>{slideIdx+1} / {SLIDES.length}</span>
              </div>
            </div>
          </>
        )}
        {topTab === 'Venue Info' && <div style={{ flex:1, overflowY:'auto' }}><VenueInfo /></div>}
        {topTab === 'Business Explorer' && <div style={{ flex:1, overflowY:'auto' }}><BusinessExplorer /></div>}
        {topTab === 'Plonk' && plonkAccess && <div style={{ flex:1, overflowY:'auto' }}><Plonk /></div>}
      </div>
    </div>
  )
}