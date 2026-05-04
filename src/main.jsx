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

const root = ReactDOM.createRoot(document.getElementById('root'))

// Brief loading indicator while we sync from the live Google Sheet.
// If sync takes >4s or fails, we render anyway with data.js defaults.
document.getElementById('root').innerHTML =
  '<div style="height:100vh;display:flex;align-items:center;justify-content:center;' +
  'background:#0A0A0F;color:#9CA3AF;font-family:system-ui,sans-serif;font-size:13px;' +
  'letter-spacing:0.08em">syncing live data…</div>'

// Path-based bootstrap dispatch. Hackney has its own lock-sync endpoint
// (separate Apps Script + workbook), so visiting /hackney hydrates its
// own window globals and skips Borough's gviz Sheet fetch (which targets
// the Borough workbook). Borough's bootstrap also runs the lock-sync
// fetch alongside the Sheet hydration; for Hackney we fetch only the
// lock container.
const isHackneyPath = /^\/hackney(\/|$)/.test(location.pathname)
const bootstrap = isHackneyPath
  ? bootstrapHackneyLocks()
  : bootstrapDataFromSheet()

bootstrap.finally(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
