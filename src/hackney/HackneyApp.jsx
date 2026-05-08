import React, { useState, useEffect } from 'react'
import VenueInfo from './tabs/VenueInfo.jsx'
import BusinessExplorer from './tabs/BusinessExplorer.jsx'
import Plonk from './tabs/Plonk.jsx'
import TokenShare from './tabs/TokenShare.jsx'
import NotesTab from './tabs/NotesTab.jsx'
import Cover from './slides/Cover.jsx'
import InvestmentSummary from './slides/InvestmentSummary.jsx'
import UseOfFunds from './slides/UseOfFunds.jsx'
import MarketContext from './slides/MarketContext.jsx'
import WaterfallReturns from './slides/WaterfallReturns.jsx'
import GrowthDrivers from './slides/GrowthDrivers.jsx'
import { LockedUseOfFundsProvider } from './components/LockedUseOfFundsContext.jsx'
import { NotesProvider, useNotes } from './components/NotesContext.jsx'
import NotesPanel from './components/NotesPanel.jsx'
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
  { id:'drivers',    label:'Growth Drivers',     Component: GrowthDrivers },
  { id:'market',     label:'Market Context',     Component: MarketContext },
  { id:'waterfall',  label:'Investor Returns',   Component: WaterfallReturns },
]

// `founderOnly: true` flags a tab as gated to the 888999 access code.
// PasswordGate sets sessionStorage.ndb_founder='1' on that unlock; the
// tab list filters on it before rendering so other access codes never
// see the tab in the header at all.
const TOP_TABS = [
  { key:'investorDeck',     label:'Investor Deck' },
  { key:'businessExplorer', label:'Business Explorer' },
  { key:'venueInfo',        label:'Venue Info' },
  { key:'plonk',            label:'Plonk' },
  { key:'tokenShare',       label:'Token Share', founderOnly: true },
]

// Build the notes "active page" descriptor from the current top tab and
// (for the deck) the active slide. Page ids are stable strings so server
// rows survive label changes; labels come from SLIDE_DEFS / TOP_TABS.
function deriveActivePage(topTab, slideId) {
  if (topTab === 'investorDeck') {
    const def = SLIDE_DEFS.find(s => s.id === slideId)
    return def ? { id: `deck:${def.id}`, label: `Deck · ${def.label}` } : null
  }
  if (topTab === 'venueInfo')         return { id: 'venue',    label: 'Venue Info' }
  if (topTab === 'businessExplorer')  return { id: 'explorer', label: 'Business Explorer' }
  if (topTab === 'plonk')             return { id: 'plonk',    label: 'Plonk' }
  if (topTab === 'tokenShare')        return { id: 'tokenShare', label: 'Token Share' }
  if (topTab === 'notes')             return null   // master view
  return null
}

// Read founder flag set by PasswordGate at 888999. Used to filter
// founder-only tabs out of the header for non-founder access codes.
function readIsFounder() {
  try { return sessionStorage.getItem('ndb_founder') === '1' } catch { return false }
}

export default function HackneyApp() {
  const [topTab, setTopTab] = useState('investorDeck')
  const [slideIdx, setSlideIdx] = useState(0)
  const go = (i) => setSlideIdx(Math.max(0, Math.min(SLIDE_DEFS.length - 1, i)))

  // Override the static <title> from index.html (which says "No Dice
  // Borough — Investor Presentation") so the browser tab reads
  // "No Dice Hackney" while on /hackney. Reverts naturally on full
  // navigation back to the Borough route.
  //
  // Also swap the favicon — Borough uses a 🏙️ cityscape (set in
  // index.html), Hackney uses a 🌴 palm tree to differentiate browser
  // tabs at a glance when both decks are open.
  useEffect(() => {
    const prev = document.title
    document.title = 'No Dice Hackney — Investor Presentation'

    const PALM_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8C%B4%3C/text%3E%3C/svg%3E"
    const link = document.querySelector("link[rel='icon']") || document.createElement('link')
    const prevHref = link.getAttribute('href')
    const prevType = link.getAttribute('type')
    if (!link.parentNode) {
      link.setAttribute('rel', 'icon')
      document.head.appendChild(link)
    }
    link.setAttribute('type', 'image/svg+xml')
    link.setAttribute('href', PALM_FAVICON)

    return () => {
      document.title = prev
      if (prevHref) link.setAttribute('href', prevHref)
      if (prevType) link.setAttribute('type', prevType)
    }
  }, [])

  return (
    <LockedUseOfFundsProvider>
      <NotesProvider>
        <HackneyShell
          topTab={topTab} setTopTab={setTopTab}
          slideIdx={slideIdx} setSlideIdx={setSlideIdx}
          go={go}
        />
      </NotesProvider>
    </LockedUseOfFundsProvider>
  )
}

// ─── Inner shell ──────────────────────────────────────────────────────
// Lives inside both LockedUseOfFundsProvider and NotesProvider so it can
// consume the notes hook (toggle button, active-page sync, master tab).
function HackneyShell({ topTab, setTopTab, slideIdx, setSlideIdx, go }) {
  const { Component } = SLIDE_DEFS[slideIdx]
  const notes = useNotes()
  const isFounder = readIsFounder()
  const visibleTabs = TOP_TABS.filter(t => !t.founderOnly || isFounder)

  // Keep NotesContext.activePage in lockstep with the current view so
  // the side panel's textarea binds to the right note.
  useEffect(() => {
    const slideId = SLIDE_DEFS[slideIdx]?.id
    notes.setActivePage(deriveActivePage(topTab, slideId))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topTab, slideIdx])

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif" }}>

      {/* Top header — brand + tab buttons + notes cluster + back-to-Borough */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:48, background:'var(--ink-2)', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0 }}>
        <div className="serif" style={{ fontSize:15, color:'var(--gold)' }}>No Dice Hackney</div>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          {visibleTabs.map(t => (
            <button key={t.key} onClick={() => setTopTab(t.key)} style={{ padding:'10px 24px', fontSize:13, borderRadius:8, cursor:'pointer', background:topTab===t.key?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)', border:`2px solid ${topTab===t.key?'var(--gold)':'rgba(255,255,255,0.1)'}`, color:topTab===t.key?'var(--gold)':'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em', fontWeight:topTab===t.key?600:400 }}>{t.label}</button>
          ))}
          {WORKBOOK_URL && (
            <button onClick={() => window.open(WORKBOOK_URL, '_blank', 'noopener,noreferrer')} style={{ padding:'10px 24px', fontSize:13, borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'2px solid rgba(255,255,255,0.1)', color:'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em' }}>Workbook</button>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button
            onClick={() => setTopTab('notes')}
            title="Main Notes — every note you've written, in one place"
            style={{ padding:'8px 16px', fontSize:12, borderRadius:8, cursor:'pointer', background:topTab==='notes'?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)', border:`2px solid ${topTab==='notes'?'var(--gold)':'rgba(255,255,255,0.1)'}`, color:topTab==='notes'?'var(--gold)':'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em', fontWeight:topTab==='notes'?600:400 }}
          >Main Notes</button>
          <button
            onClick={notes.toggle}
            title="Open the page-notes panel for the current page"
            style={{ padding:'8px 14px', fontSize:12, borderRadius:8, cursor:'pointer', background:notes.isOpen?'rgba(192,132,252,0.15)':'rgba(255,255,255,0.04)', border:`2px solid ${notes.isOpen?'#C084FC':'rgba(255,255,255,0.1)'}`, color:notes.isOpen?'#C084FC':'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em' }}
          >📝 Page Notes</button>
          <a href="/" style={{ fontSize:11, color:'var(--cream-dim)', textDecoration:'none', letterSpacing:'0.1em', textTransform:'uppercase', marginLeft:8 }}>← Borough deck</a>
        </div>
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
        {topTab === 'tokenShare' && isFounder && <div style={{ flex:1, overflowY:'auto' }}><TokenShare /></div>}
        {topTab === 'notes' && <div style={{ flex:1, overflowY:'auto' }}><NotesTab /></div>}
      </div>
      <NotesPanel />
    </div>
  )
}
