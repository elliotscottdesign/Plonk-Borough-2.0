import React, { useState } from 'react'
import PasswordGate from './PasswordGate.jsx'
import VenueInfo from './tabs/VenueInfo.jsx'
import BusinessExplorer from './tabs/BusinessExplorer.jsx'
import Cover from './slides/Cover.jsx'
import InvestmentSummary from './slides/InvestmentSummary.jsx'
import InvestmentSnapshot from './slides/InvestmentSnapshot.jsx'
import MarketContext from './slides/MarketContext.jsx'
import MarketingEngine from './slides/MarketingEngine.jsx'
import FinancialPerformance from './slides/FinancialPerformance.jsx'
import WaterfallReturns from './slides/WaterfallReturns.jsx'
import GrowthRisks from './slides/GrowthRisks.jsx'
import InvestmentCase from './slides/InvestmentCase.jsx'

const SLIDES = [
  { id:'cover',      label:'01  Cover',                Component: Cover },
  { id:'summary',    label:'02  Investment Summary',   Component: InvestmentSummary },
  { id:'snapshot',   label:'03  Investment Snapshot',  Component: InvestmentSnapshot },
  { id:'market',     label:'04  Market Context',       Component: MarketContext },
  { id:'marketing',  label:'05  Marketing Engine',     Component: MarketingEngine },
  { id:'financials', label:'06  Financial Performance',Component: FinancialPerformance },
  { id:'waterfall',  label:'07  Waterfall Returns',    Component: WaterfallReturns },
  { id:'growth',     label:'08  Growth & Risks',       Component: GrowthRisks },
  { id:'case',       label:'09  Investment Case',      Component: InvestmentCase },
]

const TOP_TABS = ['Investor Deck', 'Venue Info', 'Business Explorer']

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [topTab, setTopTab] = useState('Investor Deck')
  const [slideIdx, setSlideIdx] = useState(0)

  if (!authed) return <PasswordGate onUnlock={() => setAuthed(true)} />

  const { Component } = SLIDES[slideIdx]
  const go = (i) => setSlideIdx(Math.max(0, Math.min(SLIDES.length-1, i)))

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--ink)', color:'var(--cream)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:48, background:'var(--ink-2)', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0 }}>
        <div className="serif" style={{ fontSize:15, color:'var(--gold)' }}>No Dice Borough Ltd</div>
        <div style={{ display:'flex', gap:4 }}>
          {TOP_TABS.map(t => (
            <button key={t} onClick={() => setTopTab(t)} style={{ padding:'5px 14px', fontSize:10, borderRadius:6, cursor:'pointer', background: topTab===t ? 'rgba(201,168,76,0.12)' : 'transparent', border: `1px solid ${topTab===t ? 'rgba(201,168,76,0.35)' : 'transparent'}`, color: topTab===t ? 'var(--gold)' : 'var(--cream-dim)', transition:'all 0.15s' }}>{t}</button>
          ))}
        </div>
        <div style={{ fontSize:9, color:'var(--gold-dim)', letterSpacing:'0.1em' }}>CONFIDENTIAL · BOROUGH MARKET SE1</div>
      </div>
      <div style={{ flex:1, overflow:'hidden', display:'flex' }}>
        {topTab === 'Investor Deck' && (
          <>
            <nav style={{ width:200, flexShrink:0, background:'var(--ink-2)', borderRight:'1px solid rgba(201,168,76,0.1)', display:'flex', flexDirection:'column' }}>
              <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
                {SLIDES.map((s, i) => (
                  <button key={s.id} onClick={() => setSlideIdx(i)} style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 16px', fontSize:10, border:'none', borderLeft:`2px solid ${i===slideIdx?'var(--gold)':'transparent'}`, color: i===slideIdx ? 'var(--gold)' : 'var(--cream-dim)', background: i===slideIdx ? 'rgba(201,168,76,0.07)' : 'transparent', cursor:'pointer', transition:'all 0.15s' }}>{s.label}</button>
                ))}
              </div>
              <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(201,168,76,0.1)' }}>
                <div style={{ fontSize:9, color:'var(--cream-dim)', marginBottom:5 }}>{slideIdx+1} / {SLIDES.length}</div>
                <div style={{ height:2, background:'var(--ink-3)', borderRadius:1 }}>
                  <div style={{ height:'100%', background:'var(--gold)', borderRadius:1, width:`${((slideIdx+1)/SLIDES.length)*100}%`, transition:'width 0.3s' }} />
                </div>
              </div>
            </nav>
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', height:38, borderBottom:'1px solid rgba(201,168,76,0.08)', flexShrink:0 }}>
                <span style={{ fontSize:10, color:'var(--cream-dim)', letterSpacing:'0.08em', textTransform:'uppercase' }}>{SLIDES[slideIdx].label}</span>
                <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                  <button onClick={() => go(slideIdx-1)} disabled={slideIdx===0} style={{ width:24, height:24, borderRadius:4, border:'1px solid rgba(201,168,76,0.25)', background:'transparent', color: slideIdx===0 ? 'var(--ink-3)' : 'var(--gold)', cursor: slideIdx===0 ? 'default' : 'pointer', fontSize:11 }}>←</button>
                  <span style={{ fontSize:9, color:'var(--cream-dim)' }}>{slideIdx+1}/{SLIDES.length}</span>
                  <button onClick={() => go(slideIdx+1)} disabled={slideIdx===SLIDES.length-1} style={{ width:24, height:24, borderRadius:4, border:'1px solid rgba(201,168,76,0.25)', background:'transparent', color: slideIdx===SLIDES.length-1 ? 'var(--ink-3)' : 'var(--gold)', cursor: slideIdx===SLIDES.length-1 ? 'default' : 'pointer', fontSize:11 }}>→</button>
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
      </div>
    </div>
  )
}import React, { useState } from 'react'import PasswordGate from './PasswordGate.jsx'import VenueInfo from './tabs/VenueInfo.jsx'import BusinessExplorer from './tabs/BusinessExplorer.jsx'// Slidesimport Cover from './slides/Cover.jsx'import InvestmentSummary from './slides/InvestmentSummary.jsx'import InvestmentSnapshot from './slides/InvestmentSnapshot.jsx'import MarketContext from './slides/MarketContext.jsx'import MarketingEngine from './slides/MarketingEngine.jsx'import FinancialPerformance from './slides/FinancialPerformance.jsx'import WaterfallReturns from './slides/WaterfallReturns.jsx'import GrowthRisks from './slides/GrowthRisks.jsx'import InvestmentCase from './slides/InvestmentCase.jsx'const SLIDES = [  { id:'cover',      label:'01  Cover',                Component: Cover },  { id:'summary',    label:'02  Investment Summary',   Component: InvestmentSummary },  { id:'snapshot',   label:'03  Investment Snapshot',  Component: InvestmentSnapshot },  { id:'market',     label:'04  Market Context',       Component: MarketContext },  { id:'marketing',  label:'05  Marketing Engine',     Component: MarketingEngine },  { id:'financials', label:'06  Financial Performance',Component: FinancialPerformance },  { id:'waterfall',  label:'07  Waterfall Returns',    Component: WaterfallReturns },  { id:'growth',     label:'08  Growth & Risks',       Component: GrowthRisks },  { id:'case',       label:'09  Investment Case',      Component: InvestmentCase },]const TOP_TABS = ['Investor Deck', 'Venue Info', 'Business Explorer']export default function App() {  const [authed, setAuthed] = useState(false)  const [topTab, setTopTab] = useState('Investor Deck')  const [slideIdx, setSlideIdx] = useState(0)  if (!authed) return <PasswordGate onUnlock={() => setAuthed(true)} />
