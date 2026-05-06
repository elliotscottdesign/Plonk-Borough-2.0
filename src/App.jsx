import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PasswordGate from './PasswordGate.jsx'
import VenueInfo from './tabs/VenueInfo.jsx'
import BusinessExplorer from './tabs/BusinessExplorer.jsx'
import Plonk from './tabs/Plonk.jsx'
import NotesTab from './tabs/NotesTab.jsx'
import Cover from './slides/Cover.jsx'
import InvestmentSummary from './slides/InvestmentSummary.jsx'
import UseOfFunds from './slides/UseOfFunds.jsx'
import MarketContext from './slides/MarketContext.jsx'
import WaterfallReturns from './slides/WaterfallReturns.jsx'
import GrowthDrivers from './slides/GrowthDrivers.jsx'
import InvestmentCase from './slides/InvestmentCase.jsx'
import HackneyApp from './hackney/HackneyApp.jsx'
import { LockedDeckProvider } from './components/LockedDeckContext.jsx'
import { NotesProvider, useNotes } from './components/NotesContext.jsx'
import NotesPanel from './components/NotesPanel.jsx'
import { WORKBOOK_URL } from './data.js'

// Path-based deck dispatch. /hackney (and any nested path under it) renders
// the Hackney deck; everything else stays on the Borough shell.
// Combined with public/404.html (SPA fallback) this works on GitHub Pages
// without a router dependency.
const isHackneyPath = () =>
  typeof window !== 'undefined' &&
  /^\/hackney(\/|$)/.test(window.location.pathname)

const SLIDE_DEFS = [
  { id:'cover',      labelKey:'cover',     Component: Cover },
  { id:'summary',    labelKey:'summary',   Component: InvestmentSummary },
  { id:'funds',      labelKey:'funds',     Component: UseOfFunds },
  { id:'drivers',    labelKey:'drivers',   Component: GrowthDrivers },
  { id:'market',     labelKey:'market',    Component: MarketContext },
  { id:'waterfall',  labelKey:'waterfall', Component: WaterfallReturns },
  { id:'case',       labelKey:'case',      Component: InvestmentCase },
]

// Plonk top-tab is PRIVATE — only the founder (888999) and VALEX investor
// codes see it. TEST1 and BRAZIL get the 3-tab investor view.
const TOP_TAB_KEYS_BASE = ['investorDeck', 'venueInfo', 'businessExplorer']
const TOP_TAB_KEYS_PLONK = [...TOP_TAB_KEYS_BASE, 'plonk']

// Build the notes "active page" descriptor from the current top tab and
// (for the deck) the active slide. Page ids are stable strings so server
// rows survive label changes; labels are pulled from i18n at render time.
function deriveActivePage(topTab, slideId, t) {
  if (topTab === 'investorDeck') {
    return { id: `deck:${slideId}`, label: `Deck · ${t(`slideNav.${slideId}`)}` }
  }
  if (topTab === 'venueInfo')         return { id: 'venue',    label: t('tabs.venueInfo') }
  if (topTab === 'businessExplorer')  return { id: 'explorer', label: t('tabs.businessExplorer') }
  if (topTab === 'plonk')             return { id: 'plonk',    label: t('tabs.plonk') }
  if (topTab === 'notes')             return null   // master view — no per-page note
  return null
}

export default function App() {
  const { t, i18n } = useTranslation('common')
  // Treat a session as "unlocked" only when BOTH the unlock flag AND
  // the access code are present. This re-prompts users whose ndb_unlocked
  // was set by the pre-per-tenant PasswordGate (which didn't store
  // ndb_access_code) — without this, their POSTs silently abort because
  // the client doesn't know which tenant slot to write to.
  const [unlocked, setUnlocked]       = useState(() =>
    sessionStorage.getItem('ndb_unlocked') === '1' &&
    !!sessionStorage.getItem('ndb_access_code')
  )
  const [plonkAccess, setPlonkAccess] = useState(() => sessionStorage.getItem('ndb_plonk_access') === '1')
  const [topTab, setTopTab] = useState('investorDeck')
  const [slideIdx, setSlideIdx] = useState(0)
  const go = (i) => setSlideIdx(Math.max(0, Math.min(SLIDE_DEFS.length - 1, i)))

  // Top tabs depend on plonk access. Tabs the user can't see are stripped
  // from the array so the "plonk" key can never become the active tab.
  const topTabKeys = plonkAccess ? TOP_TAB_KEYS_PLONK : TOP_TAB_KEYS_BASE

  if (!unlocked) {
    return <PasswordGate onUnlock={({ plonk, founder, role, lang: chosenLang, accessCode }) => {
      sessionStorage.setItem('ndb_unlocked', '1')
      sessionStorage.removeItem('ndb_plonk')   // legacy key, no longer used
      // Per-tenant access code — every signed-in user gets their own
      // private slot for drags + locks. localStorage keys and the
      // lock-sync server URL are both keyed off this string. Drags
      // and locks under code A never affect code B's view.
      if (accessCode) sessionStorage.setItem('ndb_access_code', accessCode)
      else            sessionStorage.removeItem('ndb_access_code')
      // Edit-access flag — under the per-tenant model EVERY signed-in
      // user can drag + lock within their own scope, so this flag is
      // set on every successful unlock. The original founder/observer
      // boolean (only 888999 + JOHN1 currently) is preserved as
      // ndb_role_founder for any future flow that needs to distinguish
      // the canonical-founder tier.
      sessionStorage.setItem('ndb_founder', '1')
      if (founder) sessionStorage.setItem('ndb_role_founder', '1')
      else         sessionStorage.removeItem('ndb_role_founder')
      // Plonk visibility — 888999 and VALEX get the Plonk top-tab; TEST1
      // and BRAZIL do not. Stripped from the tab array below.
      if (plonk) sessionStorage.setItem('ndb_plonk_access', '1')
      else       sessionStorage.removeItem('ndb_plonk_access')
      // Role tag — components can branch on this for role-specific UI
      // (e.g. BRAZIL sees an explicit "ticket slider locked" badge).
      sessionStorage.setItem('ndb_role', role || 'investor')
      const targetLang = chosenLang && chosenLang !== 'en' ? chosenLang : 'en'
      i18n.changeLanguage(targetLang)
      setPlonkAccess(!!plonk)
      setUnlocked(true)
    }} />
  }

  // After unlock, dispatch by path. All access codes unlock the Hackney deck;
  // only 888999 / VALEX additionally see the Plonk top-tab on Borough.
  if (isHackneyPath()) {
    return <HackneyApp />
  }

  return (
    <LockedDeckProvider>
      <NotesProvider>
        <BoroughShell
          topTab={topTab} setTopTab={setTopTab}
          slideIdx={slideIdx} setSlideIdx={setSlideIdx}
          topTabKeys={topTabKeys} plonkAccess={plonkAccess}
          go={go}
        />
      </NotesProvider>
    </LockedDeckProvider>
  )
}

// ─── Inner shell ──────────────────────────────────────────────────────
// Lives inside both LockedDeckProvider and NotesProvider so it can
// consume the notes hook (toggle button, active-page sync, master tab).
function BoroughShell({ topTab, setTopTab, slideIdx, setSlideIdx, topTabKeys, plonkAccess, go }) {
  const { t, i18n } = useTranslation('common')
  const { Component } = SLIDE_DEFS[slideIdx]
  const notes = useNotes()

  // Keep NotesContext.activePage in lockstep with the current view so
  // the side panel's textarea binds to the right note.
  useEffect(() => {
    const slideId = SLIDE_DEFS[slideIdx]?.id
    notes.setActivePage(deriveActivePage(topTab, slideId, t))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topTab, slideIdx, i18n.language])

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:48, background:'var(--ink-2)', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0 }}>
        <div className="serif" style={{ fontSize:15, color:'var(--gold)' }}>{t('shell.brand')}</div>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          {topTabKeys.map(k => (
            <button key={k} onClick={() => setTopTab(k)} style={{ padding:'10px 24px', fontSize:13, borderRadius:8, cursor:'pointer', background:topTab===k?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)', border:`2px solid ${topTab===k?'var(--gold)':'rgba(255,255,255,0.1)'}`, color:topTab===k?'var(--gold)':'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em', fontWeight:topTab===k?600:400 }}>{t(`tabs.${k}`)}</button>
          ))}
          <button onClick={() => window.open(WORKBOOK_URL, '_blank', 'noopener,noreferrer')} style={{ padding:'10px 24px', fontSize:13, borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'2px solid rgba(255,255,255,0.1)', color:'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em' }}>{t('tabs.workbook')}</button>
          <button
            onClick={() => setTopTab('notes')}
            title="Master notes — every note you've written, in one place"
            style={{ padding:'10px 18px', fontSize:13, borderRadius:8, cursor:'pointer', background:topTab==='notes'?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)', border:`2px solid ${topTab==='notes'?'var(--gold)':'rgba(255,255,255,0.1)'}`, color:topTab==='notes'?'var(--gold)':'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em', fontWeight:topTab==='notes'?600:400 }}
          >{t('tabs.notes')}</button>
          <button
            onClick={notes.toggle}
            title="Open notes panel for the current page"
            style={{ padding:'10px 16px', fontSize:13, borderRadius:8, cursor:'pointer', background:notes.isOpen?'rgba(192,132,252,0.15)':'rgba(255,255,255,0.04)', border:`2px solid ${notes.isOpen?'#C084FC':'rgba(255,255,255,0.1)'}`, color:notes.isOpen?'#C084FC':'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em', marginLeft:4 }}
          >{t('tabs.notesAction')}</button>
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
        {topTab === 'plonk' && plonkAccess && <div style={{ flex:1, overflowY:'auto' }}><Plonk /></div>}
        {topTab === 'notes' && <div style={{ flex:1, overflowY:'auto' }}><NotesTab /></div>}
      </div>
      <NotesPanel />
    </div>
  )
}
