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
import RotaPortal from './rota/RotaPortal.jsx'
import DailyHub from './rota/DailyHub.jsx'
import ToiletChecks from './toilets/ToiletChecks.jsx'
import LeisureWatcher from './leisure/LeisureWatcher.jsx'
import { LockedDeckProvider } from './components/LockedDeckContext.jsx'
import { NotesProvider, useNotes } from './components/NotesContext.jsx'
import { RotaProvider } from './components/EditableRotaContext.jsx'
import NotesPanel from './components/NotesPanel.jsx'
import NotesHealthBanner from './components/NotesHealthBanner.jsx'
import { WORKBOOK_URL } from './data.js'
import useIsMobile from './lib/useIsMobile.js'
import { applyAccessSession, ACCESS_CODES } from './lib/access.js'
import { rotaMe } from './rota/api.js'

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
  /^\/(ops|operations)(\/|$)/.test(window.location.pathname)

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

// Help Out portal — public, shareable volunteer sign-up at /helpout. No gate:
// friends getting the bar open won't have a staff code. Standalone like /dj.
// Matches the clean /helpout AND the older /help-out so shared links still work.
const isHelpOutPath = () =>
  typeof window !== 'undefined' &&
  /^\/help-?out(\/|$)/.test(window.location.pathname)

// Staff Rota portal — standalone, at /rota. Staff log in with their own email +
// password (issued a token by the rota edge fn), so no PasswordGate here — like /dj.
const isRotaPath = () =>
  typeof window !== 'undefined' &&
  /^\/rota(\/|$)/.test(window.location.pathname)

// Daily clock-in hub — the shared link the team opens each shift. /today.
const isTodayPath = () =>
  typeof window !== 'undefined' &&
  /^\/today(\/|$)/.test(window.location.pathname)

// Toilet-hygiene reminders — staff opt-in + tick-off, deep-linked from the push
// notification. Uses the rota token (nd_rota_token) for identity, so no gate here.
const isToiletsPath = () =>
  typeof window !== 'undefined' &&
  /^\/toilets(\/|$)/.test(window.location.pathname)

// Leisure Watch — founder-only London Fields Lido slot watcher. /leisure.
// Gated behind the 888999 founder code (the `plonk` flag), so it sits AFTER
// the PasswordGate in the dispatch below (unlike the standalone portals above).
const isLeisurePath = () =>
  typeof window !== 'undefined' &&
  /^\/leisure(\/|$)/.test(window.location.pathname)

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

  // ── Single sign-in: bridge a clocked-in manager's staff token into hub access ─
  // If you're already signed in for your shift (nd_rota_token in localStorage) and
  // you're management, the team hubs unlock without a separate code — /ops and
  // /marketing (the DJ admin lives inside /ops, so it's covered too). Server-verified
  // via the rota `me` action. The FOUNDER (Elliot) gets the full founder tier; other
  // management (Manager / Asst. Manager) get the team tier — ops+marketing only, never
  // the investor decks/IP. Everyone else / any error / timeout → the normal code gate.
  // Only runs on a gated hub path when not already unlocked, so public pages pay nothing.
  const alreadyUnlocked = () => sessionStorage.getItem('ndb_unlocked') === '1' && !!sessionStorage.getItem('ndb_access_code')
  const rotaToken = () => { try { return localStorage.getItem('nd_rota_token') } catch { return null } }
  const needsBridge = () => (isOpsPath() || isMarketingPath()) && !alreadyUnlocked() && !!rotaToken()
  const [bridging, setBridging] = useState(() => needsBridge())
  useEffect(() => {
    if (!bridging) return
    let cancelled = false
    // Never let a slow/hung `me` call pin the loader — time out → fall to the code gate.
    const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
    ;(async () => {
      try {
        const r = await withTimeout(rotaMe(rotaToken()), 7000)
        // Must be an ACTIVE staff member (a deactivated manager's old token must not elevate).
        const s = (r?.ok && r?.staff?.active !== false) ? r.staff : null
        // Founder tier (investor decks + Plonk IP + founder edit) is tied to the FOUNDER
        // specifically, NOT the shared rota role — so promoting another "Manager" for
        // scheduling never leaks the decks. Management gets the team tier (ops+marketing).
        const isFounder = s && String(s.email || '').trim().toLowerCase() === 'elliot@nodice.bar'
        const isMgmt = s && ['Manager', 'Asst. Manager'].includes(s.role)
        const access = isFounder ? ACCESS_CODES['888999'] : isMgmt ? ACCESS_CODES['NDTEAM'] : null
        const code = isFounder ? '888999' : isMgmt ? 'NDTEAM' : null
        if (access && !cancelled) {
          applyAccessSession(access, code)
          // Management flag — set from the person's own staff record (Manager /
          // Asst. Manager), NOT from the shared NDTEAM code. It unlocks the Team
          // section for Rhys without opening it to every staff login.
          try { if (isMgmt || isFounder) sessionStorage.setItem('ndb_role_manager', '1'); else sessionStorage.removeItem('ndb_role_manager') } catch { /* ignore */ }
          setPlonkAccess(!!access.plonk); setHackneyAccess(!!access.hackney); setBoroughAccess(!!access.borough)
          setOpsAccess(!!access.ops); setMarketingAccess(!!access.marketing); setUnlocked(true)
        }
      } catch { /* fall through to the code gate */ }
      finally { if (!cancelled) setBridging(false) }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // Keep the day/night light theme scoped to the staff tools even across
    // in-app (pushState) navigation — mirrors the pre-render flag set in
    // main.jsx so the investor decks/public pages never pick up the light flip.
    const STAFF_SURFACE = /^\/(ops|operations|rota|today|marketing)(\/|$)/
    const syncTheme = () => {
      if (STAFF_SURFACE.test(window.location.pathname))
        document.documentElement.setAttribute('data-theme', 'auto')
      else
        document.documentElement.removeAttribute('data-theme')
    }
    const onPath = () => { syncTheme(); setPathTick(n => n + 1) }
    syncTheme()
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

  // Help Out — CLOSED 13 Aug 2026 (founder: the volunteer drive is done, the bar
  // is open). The sign-up form is retired, but the link was shared widely by text
  // so the URL still answers with a thank-you rather than a dead page. Nothing is
  // deleted: HelpOutPortal, the help-out edge fn and every sign-up still exist —
  // swap the line below back to `return <HelpOutPortal />` to reopen it.
  if (isHelpOutPath()) return <HelpOutClosed />

  // Staff Rota portal — team members log in with their own email + password.
  // Standalone (its own login), sits before the root fallback below.
  if (isRotaPath()) return <RotaPortal />

  // Daily clock-in hub — shared /today link: who's on today → tap name → clock in.
  if (isTodayPath()) return <DailyHub />

  // Toilet-hygiene reminders — staff tick-off + opt-in. /toilets.
  if (isToiletsPath()) return <ToiletChecks />

  // Public landing page — served at the root. No password gate.
  // The investor deck moved to /borough; Hackney remains at /hackney.
  // Any unrecognised path (incl. the SPA fallback) also lands here so
  // the public site has a clean entry point. /worldcup is an exception
  // — gated below, founder-only planning sheet. /site is also excluded
  // because it's a public dev preview of the new bar website.
  if (isRootPath() || (!isHackneyPath() && !isBoroughPath() && !isWorldCupPath() && !isSiteSplashPath() && !isSiteInsidePath() && !isOpsPath() && !isMarketingPath() && !isDJPath() && !isHelpOutPath() && !isRotaPath() && !isTodayPath() && !isLeisurePath())) {
    // This repo now lives at team.nodice.bar (the public customer site owns
    // nodice.bar). Root + any unrecognised path shows the branded team hub —
    // four gated doors: Operations, Marketing, Investors Hackney/Borough.
    // (Landing.jsx, the old public "coming soon" page, is retired here.)
    return <TeamLanding />
  }

  // While verifying a clocked-in manager's token (single sign-in), hold the screen
  // so it doesn't flash the code prompt before auto-unlocking.
  if (bridging) {
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, background:'#000', color:'rgba(255,255,255,0.7)', fontFamily:"'DM Sans',sans-serif" }}>
        <img src="/nodice-wordmark.png" alt="No Dice" style={{ width:'min(220px,60vw)', height:'auto', opacity:0.9 }} />
        <div style={{ fontSize:12, letterSpacing:'0.14em', textTransform:'uppercase' }}>Signing you in…</div>
      </div>
    )
  }

  if (!unlocked) {
    return <PasswordGate onUnlock={({ plonk, founder, hackney, borough, ops, marketing, role, lang: chosenLang, accessCode }) => {
      // Canonical session unlock (shared with the /today management log-in).
      applyAccessSession({ plonk, founder, hackney, borough, ops, marketing, role }, accessCode)
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

  // /leisure — founder-only London Fields Lido slot watcher. Requires the
  // Plonk/founder tier (888999); anyone else unlocked gets a polite kick-back.
  if (isLeisurePath()) {
    if (!plonkAccess) {
      return (
        <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", padding:24, textAlign:'center' }}>
          <div className="serif" style={{ fontSize:28, color:'var(--gold)' }}>Restricted view</div>
          <div style={{ fontSize:13, color:'var(--cream-dim)', maxWidth:360 }}>
            Leisure Watch is founder-only. Sign in with the founder code to view.
          </div>
          <a href="/" style={{ fontSize:11, color:'var(--cream-dim)', letterSpacing:'0.14em', textDecoration:'none', marginTop:12 }}>← back to nodice.bar</a>
        </div>
      )
    }
    return <LeisureWatcher />
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
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)
  const activeLabel = topTab === 'notes' ? t('tabs.notes') : t(`tabs.${topTab}`)
  const pick = (k) => { setTopTab(k); setMenuOpen(false) }

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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', minHeight:48, background:'var(--ink-2)', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0, gap:10, position:'relative', zIndex:30 }}>
        <div className="serif" style={{ fontSize:15, color:'var(--gold)', whiteSpace:'nowrap' }}>{t('shell.brand')}</div>
        {isMobile ? (
          <button onClick={() => setMenuOpen(o => !o)} aria-label="Menu" style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:8, background:'rgba(201,168,76,0.12)', border:'1px solid var(--gold)', color:'var(--gold)', fontSize:13, cursor:'pointer', whiteSpace:'nowrap', maxWidth:'64%' }}>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{activeLabel}</span>
            <span style={{ fontSize:16, lineHeight:1 }}>{menuOpen ? '✕' : '☰'}</span>
          </button>
        ) : (<>
        <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
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
        </>)}
      </div>

      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <div style={{ background:'var(--ink-2)', borderBottom:'1px solid rgba(201,168,76,0.15)', padding:'8px 12px 12px', display:'flex', flexDirection:'column', gap:6, flexShrink:0, position:'relative', zIndex:30 }}>
          {topTabKeys.map(k => (
            <button key={k} onClick={() => pick(k)} style={{ textAlign:'left', padding:'13px 14px', borderRadius:8, cursor:'pointer', background:topTab===k?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${topTab===k?'var(--gold)':'rgba(255,255,255,0.1)'}`, color:topTab===k?'var(--gold)':'var(--cream)', fontSize:14.5, fontWeight:topTab===k?600:400 }}>{t(`tabs.${k}`)}</button>
          ))}
          <button onClick={() => pick('notes')} style={{ textAlign:'left', padding:'13px 14px', borderRadius:8, cursor:'pointer', background:topTab==='notes'?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${topTab==='notes'?'var(--gold)':'rgba(255,255,255,0.1)'}`, color:topTab==='notes'?'var(--gold)':'var(--cream)', fontSize:14.5 }}>{t('tabs.notes')}</button>
          <button onClick={() => { window.open(WORKBOOK_URL, '_blank', 'noopener,noreferrer'); setMenuOpen(false) }} style={{ textAlign:'left', padding:'13px 14px', borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--cream)', fontSize:14.5 }}>{t('tabs.workbook')} ↗</button>
          <button onClick={() => { notes.toggle(); setMenuOpen(false) }} style={{ textAlign:'left', padding:'13px 14px', borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--cream)', fontSize:14.5 }}>{t('tabs.notesAction')}</button>
          <div style={{ display:'flex', alignItems:'center', gap:0, border:'1px solid rgba(201,168,76,0.25)', borderRadius:6, overflow:'hidden', alignSelf:'flex-start', marginTop:4 }}>
            {[{ code:'en', label:'EN' }, { code:'pt-BR', label:'PT' }].map(({code, label}) => {
              const active = i18n.language === code
              return <button key={code} onClick={() => i18n.changeLanguage(code)} style={{ padding:'8px 18px', fontSize:12, cursor:'pointer', background:active?'var(--gold)':'transparent', color:active?'var(--ink)':'var(--cream-dim)', border:'none', fontWeight:active?700:400, letterSpacing:'0.08em' }}>{label}</button>
            })}
          </div>
        </div>
      )}
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


// ─── Help Out — closed notice ────────────────────────────────────────────────
// Stands in for the retired volunteer sign-up so previously-shared links land
// somewhere warm instead of a 404 (founder, 13 Aug 2026).
function HelpOutClosed() {
  return (
    <div style={{ minHeight: '100dvh', background: '#000', color: '#fff', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ maxWidth: 460 }}>
        <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 'min(240px, 62vw)', height: 'auto', marginBottom: 22 }} />
        <div className="serif" style={{ fontSize: 26, marginBottom: 12 }}>We're open — thank you 🙌</div>
        <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)' }}>
          The volunteer sign-up has closed: with a lot of help from a lot of friends,
          No Dice is open at London Fields. If you pitched in — the first one's on us.
        </p>
        <a href="https://nodice.bar" style={{ display: 'inline-block', marginTop: 22, padding: '13px 24px', borderRadius: 10, background: '#DA1B33', color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 15 }}>Come see the place →</a>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginTop: 20 }}>No Dice · 407 Mentmore Terrace, London Fields, E8 3PH</div>
      </div>
    </div>
  )
}
