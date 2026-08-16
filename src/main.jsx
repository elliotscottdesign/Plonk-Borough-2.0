import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/i18n-setup.js'
import App from './App.jsx'
import './index.css'
import { bootstrapDataFromSheet } from './data-bootstrap.js'
import { bootstrapHackneyLocks } from './hackney/data-bootstrap.js'

// SPA fallback restore — public/404.html stashes the original path here
// when GitHub Pages can't find the route (e.g. /hackney) as a static file.
// We rewrite the URL back before React mounts so App sees the real pathname.
const stashed = sessionStorage.getItem('ndb_redirect')
if (stashed) {
  sessionStorage.removeItem('ndb_redirect')
  if (stashed !== location.pathname + location.search + location.hash) {
    history.replaceState(null, '', stashed)
  }
}

// Day = light, night = black — ONLY on the internal staff tools
// (/ops · /rota · /today · /marketing). Flag the document BEFORE React mounts
// so the scoped light-theme rule in index.css paints from the first frame (no
// dark flash), and point the mobile status-bar colour at the shade that matches
// the device's current theme. Investor decks + public pages stay dark on every
// device.
const isStaffSurface = /^\/(ops|operations|rota|today|marketing|onaroll)(\/|$)/.test(location.pathname)
if (isStaffSurface) {
  document.documentElement.setAttribute('data-theme', 'auto')
  const bar = document.querySelector('meta[name="theme-color"]')
  const mq = window.matchMedia('(prefers-color-scheme: light)')
  const syncBar = () => { if (bar) bar.setAttribute('content', mq.matches ? '#F5F5F0' : '#0A0A0F') }
  syncBar()
  mq.addEventListener('change', syncBar)
}

const root = ReactDOM.createRoot(document.getElementById('root'))

// Path-based bootstrap dispatch.
//   /                → public Landing page (no Sheet sync needed)
//   /privacy, /terms → public legal pages (no Sheet sync needed)
//   /hackney         → Hackney lock-sync only (separate workbook)
//   /borough (and anything else) → Borough gviz Sheet + lock-sync
// The "syncing live data…" placeholder only paints when we actually
// have something to fetch, so the public pages render instantly.
const isHackneyPath = /^\/hackney(\/|$)/.test(location.pathname)
const isBoroughPath = /^\/borough(\/|$)/.test(location.pathname)
const needsBootstrap = isHackneyPath || isBoroughPath

if (needsBootstrap) {
  document.getElementById('root').innerHTML =
    '<div style="height:100dvh;display:flex;align-items:center;justify-content:center;' +
    'background:#0A0A0F;color:#9CA3AF;font-family:system-ui,sans-serif;font-size:13px;' +
    'letter-spacing:0.08em">syncing live data…</div>'
}

const bootstrap = needsBootstrap
  ? (isHackneyPath ? bootstrapHackneyLocks() : bootstrapDataFromSheet())
  : Promise.resolve()

bootstrap.finally(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})

// Register the service worker so Chrome (Android + desktop) treats No Dice as an
// installable app — enabling "Install app" / the add-to-home-screen prompt.
// (iOS ignores this and installs via Safari's Share → Add to Home Screen.)
// The worker does no caching, so it can't serve a stale build.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* non-fatal */ })
  })
}
