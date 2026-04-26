import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { LockedForecastProvider } from './components/LockedForecastContext.jsx'
import { WORKBOOK_URL } from './data.js'

const SLIDE_DEFS = [
  { id:'cover',      labelKey:'cover',     Component: Cover },
  { id:'summary',    labelKey:'summary',   Component: InvestmentSummary },
  { id:'funds',      labelKey:'funds',     Component: UseOfFunds },
  { id:'market',     labelKey:'market',    Component: MarketContext },
  { id:'waterfall',  labelKey:'waterfall', Component: WaterfallReturns },
  { id:'growth',     labelKey:'growth',    Component: GrowthRisks },
  { id:'case',       labelKey:'case',      Component: InvestmentCase },
]

// Plonk tab is now visible for all unlocks — was previously gated behind the
// 888999 password. Both TEST1 and 888999 still work; they no longer differ.
const TOP_TAB_KEYS = ['investorDeck', 'venueInfo', 'businessExplorer', 'plonk']

export default function App() {
  const { t, i18n } = useTranslation('common')
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('ndb_unlocked') === '1')
  const [topTab, setTopTab] = useState('investorDeck')
  const [slideIdx, setSlideIdx] = useState(0)
  const { Component } = SLIDE_DEFS[slideIdx]
  const go = (i) => setSlideIdx(Math.max(0, Math.min(SLIDE_DEFS.length - 1, i)))

  if (!unlocked) {
    return <PasswordGate onUnlock={({ lang: chosenLang }) => {
      sessionStorage.setItem('ndb_unlocked', '1')
      sessionStorage.removeItem('ndb_plonk')   // legacy key, no longer used
      const targetLang = chosenLang && chosenLang !== 'en' ? chosenLang : 'en'
      i18n.changeLanguage(targetLang)
      setUnlocked(true)
    }} />
  }

  return (
    <LockedForecastProvider>
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:48, background:'var(--ink-2)', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0 }}>
        <div className="serif" style={{ fontSize:15, color:'var(--gold)' }}>{t('shell.brand')}</div>
        <div style={{ display:'flex', gap:4 }}>
          {TOP_TAB_KEYS.map(k => (
            <button key={k} onClick={() => setTopTab(k)} style={{ padding:'10px 24px', fontSize:13, borderRadius:8, cursor:'pointer', background:topTab===k?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)', border:`2px solid ${topTab===k?'var(--gold)':'rgba(255,255,255,0.1)'}`, color:topTab===k?'var(--gold)':'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em', fontWeight:topTab===k?600:400 }}>{t(`tabs.${k}`)}</button>
          ))}
          <button onClick={() => window.open(WORKBOOK_URL, '_blank', 'noopener,noreferrer')} style={{ padding:'10px 24px', fontSize:13, borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'2px solid rgba(255,255,255,0.1)', color:'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em' }}>{t('tabs.workbook')}</button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:0, border:'1px solid rgba(201,168,76,0.25)', borderRadius:6, overflow:'hidden' }}>
          {[
            { code:'en',    label:'EN' },
            { code:'pt-BR', label:'PT' },
          ].map(({code, label}) => {
            const active = i18n.language === code
            return (
              <button key={code} onClick={() => i18n.changeLanguage(code)} style={{ padding:'4px 12px', fontSize:11, cursor:'pointer', background:active?'var(--gold)':'transparent', color:active?'var(--ink)':'var(--cream-dim)', border:'none', fontWeight:active?700:400, letterSpacing:'0.08em', transition:'all 0.15s' }}>{label}</button>
            )
          })}
        </div>
      </div>
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {topTab === 'investorDeck' && (
          <>
            <div style={{ borderBottom:'1px solid rgba(201,168,76,0.1)', background:'var(--ink-2)', flexShrink:0 }}>
              <div style={{ display:'flex', overflowX:'auto', padding:'0 16px' }}>
                {SLIDE_DEFS.map((s, i) => (
                  <button key={s.id} onClick={() => setSlideIdx(i)} style={{ padding:'8px 16px', fontSize:10, border:'none', borderBottom:`2px solid ${i===slideIdx?'var(--gold)':'transparent'}`, color:i===slideIdx?'var(--gold)':'var(--cream-dim)', background:'transparent', cursor:'pointer', transition:'all 0.15s', letterSpacing:'0.04em', whiteSpace:'nowrap', flexShrink:0 }}>{t(`slideNav.${s.labelKey}`)}</button>
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
              <div style={{ flex:1, overflowY:'auto' }}><Component /></div>
              <div style={{ padding:'5px 20px', borderTop:'1px solid rgba(201,168,76,0.08)', display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--gold-dim)', flexShrink:0 }}>
                <span>{t('shell.footer')}</span>
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
    </LockedForecastProvider>
  )
}
