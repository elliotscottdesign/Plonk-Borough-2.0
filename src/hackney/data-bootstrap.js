// ─── Hackney lock-sync bootstrap ──────────────────────────────────────
// Sibling of src/data-bootstrap.js (Borough). Runs on every Hackney page
// load (from src/main.jsx, gated on isHackneyPath()) BEFORE <App /> mounts.
//
// Responsibilities:
//   • Fetch the locked container from Hackney's LOCK_SYNC_URL (set in
//     src/data/hackney.js after the Hackney Apps Script is deployed —
//     see infra/lock-sync-apps-script-hackney.gs).
//   • Split the container into per-surface globals on `window` so the
//     LockedUseOfFundsProvider can prefer them over localStorage at init.
//   • Fall back silently on any error (no URL configured, network down,
//     malformed payload) — the provider will use localStorage.
//
// The Hackney container shape is:
//   {
//     forecast: <Hackney 2026 forecast snapshot> | null,
//     barPrice: { value: <number>, lockedAt: <ISO> } | null
//   }
//
// Legacy detection: if the server still holds a flat forecast snapshot
// (with .growth.bar at the top level instead of .forecast.growth.bar),
// adopt as { forecast: <legacy>, barPrice: null }. Same backwards-compat
// path Borough's bootstrap implements for its v1 → v2 migration.
//
// Window globals (separate from Borough's __NDB_LOCK_SNAPSHOT and
// __NDB_TICKET_VOLUME_LOCK so a visitor switching between decks during a
// session doesn't end up with one deck reading the other's cache):
//   • window.__NDB_HACKNEY_LOCK_SNAPSHOT     — forecast snapshot
//   • window.__NDB_HACKNEY_BAR_PRICE_LOCK    — bar-price slider lock
//
// Note: Hackney does NOT replicate Borough's gviz Sheet fetch. Hackney's
// data/hackney.js is hand-curated from the workbook; live cell hydration
// is a Borough-only path for now.

import { LOCK_SYNC_URL } from '../data/hackney.js'

// 8s default — Apps Script cold-start can take 3-5s per call (verified
// empirically). 3s was clipping the fetch and breaking cross-device sync.
export async function bootstrapHackneyLocks({ timeoutMs = 8000 } = {}) {
  const start = (typeof performance !== 'undefined' ? performance.now() : Date.now())
  if (!LOCK_SYNC_URL) {
    // eslint-disable-next-line no-console
    console.info('[hackney] no LOCK_SYNC_URL configured — locks will load from localStorage only')
    return { source: 'local-only' }
  }
  try {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(LOCK_SYNC_URL, { cache: 'no-store', signal: ctrl.signal })
    clearTimeout(timeout)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()
    if (data && typeof data === 'object') {
      const raw = data.snapshot ?? null

      let forecast = null
      let barPrice = null
      if (raw && typeof raw === 'object') {
        if ('forecast' in raw || 'barPrice' in raw) {
          // Container shape (current).
          forecast = raw.forecast ?? null
          barPrice = raw.barPrice ?? null
        } else if (raw.growth && Number.isFinite(raw.growth.bar)) {
          // Legacy flat-forecast shape — adopt as forecast, no bar-price.
          forecast = raw
        }
      }

      window.__NDB_HACKNEY_LOCK_SNAPSHOT  = forecast
      window.__NDB_HACKNEY_BAR_PRICE_LOCK = barPrice

      const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start)
      // eslint-disable-next-line no-console
      console.info(
        `[hackney] ✓ locks synced from server · ${ms}ms` +
        ` · forecast=${forecast ? 'set' : 'empty'}` +
        ` · barPrice=${barPrice ? 'set' : 'empty'}`
      )
    }
    return { source: 'server' }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[hackney] lock snapshot fetch failed, using local state:', e.message)
    return { source: 'fallback', error: e.message }
  }
}
