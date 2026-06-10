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
import GroupStructure from './slides/GroupStructure.jsx'
import HackneyApp from './hackney/HackneyApp.jsx'
import Landing from './Landing.jsx'
import TeamLanding from './TeamLanding.jsx'
import SiteSplash from './site/SiteSplash.jsx'
import SiteHome from './site/SiteHome.jsx'
import PrivacyPolicy from './legal/PrivacyPolicy.jsx'
import Terms from './legal/Terms.jsx'
import IPLicenceTemplate from './templates/IPLicenceTemplate.jsx'
// WorldCupPage is now mounted inside OpsApp's "World Cup" tab, not as a
// standalone route — see src/ops/sections/WorldCup.jsx.
// WorldCupBookings was a holding page superseded by the real customer
// schedule in the nodice.bar repo.
import DecemberSales from './borough/DecemberSales.jsx'
import OpsApp from './ops/OpsApp.jsx'
import MarketingApp from './marketing/MarketingApp.jsx'
import DJPortal from './dj/DJPortal.jsx'
import HelpOutPortal from './help/HelpOutPortal.jsx'
import { LockedDeckProvider } from './components/LockedDeckContext.jsx'
import { NotesProvider, useNotes } from './components/NotesContext.jsx'
import { RotaProvider } from './components/EditableRotaContext.jsx'
import NotesPanel from './components/NotesPanel.jsx'
import NotesHealthBanner from './components/NotesHealthBanner.jsx'
import { WORKBOOK_URL } from './data.js'

// Path-based deck dispatch.
//   /                     → public Landing page (marketing, no gate)
//   /borough  (and nested)→ Borough investor deck (PasswordGate)
//   /hackney  (and nested)→ Hackney investor deck (PasswordGate)
// Combined with public/404.html (SPA fallback) this works on GitHub Pages
// without a router dependency.
const isHackneyPath = () =>
  typeof window !== 'undefined' &&
  /^\/hackney(\/|$)/.test(window.location.pathname)

const isBoroughPath = () =>
  typeof window !== 'undefined' &&
  /^\/borough(\/|$)/.test(window.location.pathname)

// Founder-only December sales report (POS export dashboard). Sits under
// /borough so it inherits the Borough unlock, but is gated a step further
// to the Plonk/founder tier below.
const isBoroughDecemberPath = () =>
  typeof window !== 'undefined' &&
  /^\/borough\/december-sales\/?$/.test(window.location.pathname)

const isRootPath = () =>
  typeof window !== 'undefined' &&
  /^\/?$/.test(window.location.pathname)

// Internal team Operations hub. Gated to the `ops` flag (founder-tier + the
// dedicated NDTEAM staff code).
const isOpsPath = () =>
  typeof window !== 'undefined' &&
  /^\/ops(\/|$)/.test(window.location.pathname)

// Marketing hub — own gated area (GA4 / Ads / Search / social via Windsor.ai).
// Gated to the `marketing` flag (founder-tier + NDTEAM team code).
const isMarketingPath = () =>
  typeof window !== 'undefined' &&
  /^\/marketing(\/|$)/.test(window.location.pathname)

// DJ portal — DJ-only page at /dj?t=<token>. No gate, no team/investor access;
// authed by the DJ's private token inside the function calls.
const isDJPath = () =>
  typeof window !== 'undefined' &&
  /^\/dj(\/|$)/.test(window.location.pathname)

// Help Out portal — public, shareable volunteer sign-up at /help-out. No gate:
// friends getting the bar open won't have a staff code. Standalone like /dj.
const isHelpOutPath = () =>
  typeof window !== 'undefined' &&
  /^\/help-out(\/|$)/.test(window.location.pathname)

const isPrivacyPath = () =>
  typeof window !== 'undefined' &&
  /^\/privacy\/?$/.test(window.location.pathname)

const isTermsPath = () =>
  typeof window !== 'undefined' &&
  /^\/terms\/?$/.test(window.location.pathname)

const isIPLicencePath = () =>
  typeof window !== 'undefined' &&
  /^\/templates\/ip-licence\/?$/.test(window.location.pathname)

// /worldcup and /world-cup are no longer served by THIS app.
// • The founder strategy planner moved into /ops as the "World Cup"
//   tab (src/ops/sections/WorldCup.jsx).
// • The customer-facing match schedule lives in the separate
//   nodice.bar repo and owns the /world-cup URL on the live domain.
// Both path checks below kept as no-ops in case any router code
// elsewhere still references them.
const isWorldCupPath = () => false
const isWorldCupBookingsPath = () => false

// New No Dice bar website — hidden behind the public Landing during dev.
//   /site          → Schmuck-style splash (logo + portrait video + ENTER)
//   /site/inside   → All-My-Friends-style main page (sections, bookings)
// Type the URL directly to preview; not linked from the public landing.
const isSiteSplashPath = () =>
  typeof window !== 'undefined' &&
  /^\/site\/?$/.test(window.location.pathname)

const isSiteInsidePath = () =>
  typeof window !== 'undefined' &&
  /^\/site\/inside\/?$/.test(window.location.pathname)

const SLIDE_DEFS = [
  { id:'cover',      labelKey:'cover',     Component: Cover },
  { id:'summary',    labelKey:'summary',   Component: InvestmentSummary },
  { id:'group',      labelKey:'group',     Component: GroupStructure },
  { id:'funds',      labelKey:'funds',     Component: UseOfFunds },
  { id:'drivers',    labelKey:'drivers',   Component: GrowthDrivers },
  { id:'market',     labelKey:'market',    Component: MarketContext },
  { id:'waterfall',  labelKey:'waterfall', Component: WaterfallReturns },
  { id:'case',       labelKey:'case',      Component: InvestmentCase },
]

// Plonk top-tab is PRIVATE — only the founder (888999) and JOHN1 see it.
// BRAZIL and LEONIE get the 3-tab investor view.
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
  const [hackneyAccess, setHackneyAccess] = useState(() => sessionStorage.getItem('ndb_hackney_access') === '1')
  const [opsAccess, setOpsAccess] = useState(() => sessionStorage.getItem('ndb_ops_access') === '1')
  const [marketingAccess, setMarketingAccess] = useState(() => sessionStorage.getItem('ndb_marketing_access') === '1')
  const [boroughAccess, setBoroughAccess] = useState(() => sessionStorage.getItem('ndb_borough_access') === '1')
  const [topTab, setTopTab] = useState('investorDeck')
  const [slideIdx, setSlideIdx] = useState(0)
  const go = (i) => setSlideIdx(Math.max(0, Math.min(SLIDE_DEFS.length - 1, i)))

  // Path-change subscription. App.jsx reads location.pathname inline on
  // each render to decide which screen to mount; without a popstate
  // listener, history.pushState() inside child components (e.g. the new
  // SiteSplash → SiteHome handoff) would change the URL silently without
  // re-rendering. The counter is a deliberate no-op state — its only job
  // is to trigger React to re-evaluate the path-based dispatch below.
  const [, setPathTick] = useState(0)
  useEffect(() => {
    const onPath = () => setPathTick(n => n + 1)
    window.addEventListener('popstate', onPath)
    return () => window.removeEventListener('popstate', onPath)
  }, [])

  // Top tabs depend on plonk access. Tabs the user can't see are stripped
  // from the array so the "plonk" key can never become the active tab.
  const topTabKeys = plonkAccess ? TOP_TAB_KEYS_PLONK : TOP_TAB_KEYS_BASE

  // Public legal pages — no gate, indexable.
  if (isPrivacyPath()) return <PrivacyPolicy />
  if (isTermsPath())   return <Terms />

  // Internal templates — unlinked from the public site but reachable
  // by direct URL so the founder can preview + download legal drafts.
  if (isIPLicencePath()) return <IPLicenceTemplate />

  // /world-cup used to render a holding-page bookings widget. Now that
  // the real customer schedule lives in the nodice.bar repo, this app no
  // longer claims the URL. (See note at the top of file.)

  // New No Dice bar website — both screens served public, no gate.
  // /site = splash, /site/inside = the full site. These sit BEFORE the
  // Landing fallback so the path dispatcher picks them up.
  if (isSiteSplashPath()) return <SiteSplash />
  if (isSiteInsidePath()) return <SiteHome />

  // DJ portal — DJ-only page (authed by the DJ's private token in the URL).
  // Standalone: no team hub, no investor decks, no password gate.
  if (isDJPath()) return <DJPortal />

  // Help Out portal — public volunteer sign-up. Shared by text/email with
  // friends, so no password gate; sits before the root fallback below.
  if (isHelpOutPath()) return <HelpOutPortal />

  // Public landing page — served at the root. No password gate.
  // The investor deck moved to /borough; Hackney remains at /hackney.
  // Any unrecognised path (incl. the SPA fallback) also lands here so
  // the public site has a clean entry point. /worldcup is an exception
  // — gated below, founder-only planning sheet. /site is also excluded
  // because it's a public dev preview of the new bar website.
  if (isRootPath() || (!isHackneyPath() && !isBoroughPath() && !isWorldCupPath() && !isSiteSplashPath() && !isSiteInsidePath() && !isOpsPath() && !isMarketingPath() && !isDJPath() && !isHelpOutPath())) {
    // This repo now lives at team.nodice.bar (the public customer site owns
    // nodice.bar). Root + any unrecognised path shows the branded team hub —
    // four gated doors: Operations, Marketing, Investors Hackney/Borough.
    // (Landing.jsx, the old public "coming soon" page, is retired here.)
    return <TeamLanding />
  }

  if (!unlocked) {
    return <PasswordGate onUnlock={({ plonk, founder, hackney, borough, ops, marketing, role, lang: chosenLang, accessCode }) => {
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
      // Plonk visibility — 888999 and JOHN1 get the Plonk top-tab;
      // BRAZIL and LEONIE do not. Stripped from the tab array below.
      if (plonk) sessionStorage.setItem('ndb_plonk_access', '1')
      else       sessionStorage.removeItem('ndb_plonk_access')
      // Hackney deck visibility — NODICE88 is the dedicated Hackney
      // investor code. Founder-tier (888999, JOHN1), LEONIE and BRAZIL
      // also hold it.
      if (hackney) sessionStorage.setItem('ndb_hackney_access', '1')
      else         sessionStorage.removeItem('ndb_hackney_access')
      // Ops hub visibility — founder-tier + the dedicated NDTEAM staff code.
      if (ops) sessionStorage.setItem('ndb_ops_access', '1')
      else     sessionStorage.removeItem('ndb_ops_access')
      // Marketing hub visibility — founder-tier + the NDTEAM team code.
      if (marketing) sessionStorage.setItem('ndb_marketing_access', '1')
      else           sessionStorage.removeItem('ndb_marketing_access')
      // Borough deck visibility — founder (888999) + the NODICE99 Borough code.
      if (borough) sessionStorage.setItem('ndb_borough_access', '1')
      else         sessionStorage.removeItem('ndb_borough_access')
      // Role tag — components can branch on this for role-specific UI
      // (e.g. BRAZIL sees an explicit "ticket slider locked" badge).
      sessionStorage.setItem('ndb_role', role || 'investor')
      const targetLang = chosenLang && chosenLang !== 'en' ? chosenLang : 'en'
      i18n.changeLanguage(targetLang)
      setPlonkAccess(!!plonk)
      setHackneyAccess(!!hackney)
      setOpsAccess(!!ops)
      setMarketingAccess(!!marketing)
      setBoroughAccess(!!borough)
      setUnlocked(true)
    }} />
  }

  // After unlock, dispatch by path. Hackney is restricted to codes that
  // hold the `hackney` flag (NODICE88, founder-tier and LEONIE).
  // Plonk top-tab on Borough requires 888999 / JOHN1.
  if (isHackneyPath()) {
    if (!hackneyAccess) {
      return (
        <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", padding:24, textAlign:'center' }}>
          <div className="serif" style={{ fontSize:28, color:'var(--gold)' }}>Restricted view</div>
          <div style={{ fontSize:13, color:'var(--cream-dim)', maxWidth:360 }}>
            The Hackney deck is restricted. Sign in with the dedicated Hackney access code to view.
          </div>
          <a href="/" style={{ fontSize:11, color:'var(--cream-dim)', letterSpacing:'0.14em', textDecoration:'none', marginTop:12 }}>← back to nodice.bar</a>
        </div>
      )
    }
    return <HackneyApp />
  }

  // /worldcup — old standalone strategy planner route. Moved into
  // /ops as the "World Cup" tab to free the URL for the customer site
  // in the nodice.bar repo. (See note at the top of file.)

  // /ops — internal team Operations hub. Requires the `ops` flag (founder-tier
  // or the NDTEAM staff code); others get a polite kick-back.
  if (isOpsPath()) {
    if (!opsAccess) {
      return (
        <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", padding:24, textAlign:'center' }}>
          <div className="serif" style={{ fontSize:28, color:'var(--gold)' }}>Restricted view</div>
          <div style={{ fontSize:13, color:'var(--cream-dim)', maxWidth:360 }}>
            The Operations hub is for the No Dice team. Sign in with the team access code to view.
          </div>
          <a href="/" style={{ fontSize:11, color:'var(--cream-dim)', letterSpacing:'0.14em', textDecoration:'none', marginTop:12 }}>← back to nodice.bar</a>
        </div>
      )
    }
    return <OpsApp />
  }

  // /marketing — own gated area (GA4/Ads/Search/social via Windsor.ai).
  // Requires the `marketing` flag (founder-tier + NDTEAM); others kicked back.
  if (isMarketingPath()) {
    if (!marketingAccess) {
      return (
        <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", padding:24, textAlign:'center' }}>
          <div className="serif" style={{ fontSize:28, color:'var(--gold)' }}>Restricted view</div>
          <div style={{ fontSize:13, color:'var(--cream-dim)', maxWidth:360 }}>
            The Marketing hub is for the No Dice team. Sign in with the team access code to view.
          </div>
          <a href="/" style={{ fontSize:11, color:'var(--cream-dim)', letterSpacing:'0.14em', textDecoration:'none', marginTop:12 }}>← back to nodice.bar</a>
        </div>
      )
    }
    return <MarketingApp />
  }

  // /borough/december-sales — founder-only POS sales dashboard. Requires the
  // Plonk/founder tier (888999 / JOHN1); other unlocked Borough users get a
  // polite kick-back. Checked before the BoroughShell fall-through because
  // the path also matches isBoroughPath().
  if (isBoroughDecemberPath()) {
    if (!plonkAccess) {
      return (
        <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", padding:24, textAlign:'center' }}>
          <div className="serif" style={{ fontSize:28, color:'var(--gold)' }}>Restricted view</div>
          <div style={{ fontSize:13, color:'var(--cream-dim)', maxWidth:360 }}>
            The December sales report is founder-only. Sign in with the founder code to view.
          </div>
          <a href="/borough" style={{ fontSize:11, color:'var(--cream-dim)', letterSpacing:'0.14em', textDecoration:'none', marginTop:12 }}>← back to deck</a>
        </div>
      )
    }
    return <DecemberSales />
  }

  // Borough deck — gated to the `borough` flag (888999 + the NODICE99
  // Borough-investor code). Anyone without it is kicked back: team users
  // (NDTEAM) to Operations, Hackney-only investors (NODICE88) to a restricted
  // notice. Keeps the Hackney and Borough investor groups cleanly separated.
  if (!boroughAccess) {
    if (opsAccess) {
      return (
        <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", padding:24, textAlign:'center' }}>
          <div className="serif" style={{ fontSize:28, color:'var(--gold)' }}>No Dice · Team</div>
          <div style={{ fontSize:13, color:'var(--cream-dim)', maxWidth:360 }}>
            Your access is the team Operations &amp; Marketing hubs. The investor decks are a separate login.
          </div>
          <a href="/ops" style={{ fontSize:13, color:'var(--gold)', letterSpacing:'0.1em', textDecoration:'none', marginTop:8, border:'1px solid var(--gold)', borderRadius:8, padding:'10px 20px' }}>→ Go to Operations</a>
        </div>
      )
    }
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", padding:24, textAlign:'center' }}>
        <div className="serif" style={{ fontSize:28, color:'var(--gold)' }}>Restricted view</div>
        <div style={{ fontSize:13, color:'var(--cream-dim)', maxWidth:360 }}>
          The Borough deck is for Borough investors. Sign in with the Borough access code to view.
        </div>
        <a href="/" style={{ fontSize:11, color:'var(--cream-dim)', letterSpacing:'0.14em', textDecoration:'none', marginTop:12 }}>← back to the hub</a>
      </div>
    )
  }

  return (
    <LockedDeckProvider>
      <NotesProvider>
        <RotaProvider>
          <BoroughShell
            topTab={topTab} setTopTab={setTopTab}
            slideIdx={slideIdx} setSlideIdx={setSlideIdx}
            topTabKeys={topTabKeys} plonkAccess={plonkAccess}
            go={go}
          />
        </RotaProvider>
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
      {/* Founder-only safety banner — hidden when backend looks healthy.
          Sits above the header so it can't be missed. */}
      <NotesHealthBanner />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:48, background:'var(--ink-2)', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0 }}>
        <div className="serif" style={{ fontSize:15, color:'var(--gold)' }}>{t('shell.brand')}</div>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          {topTabKeys.map(k => (
            <button key={k} onClick={() => setTopTab(k)} style={{ padding:'10px 24px', fontSize:13, borderRadius:8, cursor:'pointer', background:topTab===k?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)', border:`2px solid ${topTab===k?'var(--gold)':'rgba(255,255,255,0.1)'}`, color:topTab===k?'var(--gold)':'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em', fontWeight:topTab===k?600:400 }}>{t(`tabs.${k}`)}</button>
          ))}
          <button onClick={() => window.open(WORKBOOK_URL, '_blank', 'noopener,noreferrer')} style={{ padding:'10px 24px', fontSize:13, borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'2px solid rgba(255,255,255,0.1)', color:'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em' }}>{t('tabs.workbook')}</button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button
            onClick={() => setTopTab('notes')}
            title="Main Notes — every note you've written, in one place"
            style={{ padding:'8px 16px', fontSize:12, borderRadius:8, cursor:'pointer', background:topTab==='notes'?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)', border:`2px solid ${topTab==='notes'?'var(--gold)':'rgba(255,255,255,0.1)'}`, color:topTab==='notes'?'var(--gold)':'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em', fontWeight:topTab==='notes'?600:400 }}
          >{t('tabs.notes')}</button>
          <button
            onClick={notes.toggle}
            title="Open the page-notes panel for the current page"
            style={{ padding:'8px 14px', fontSize:12, borderRadius:8, cursor:'pointer', background:notes.isOpen?'rgba(192,132,252,0.15)':'rgba(255,255,255,0.04)', border:`2px solid ${notes.isOpen?'#C084FC':'rgba(255,255,255,0.1)'}`, color:notes.isOpen?'#C084FC':'var(--cream)', transition:'all 0.2s', letterSpacing:'0.05em' }}
          >{t('tabs.notesAction')}</button>
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
