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
// The Hackney container shape (4 surfaces, all cross-device):
//   {
//     useOfFunds: <funding/use-of-funds snapshot>      | null,
//     wages:      <4-role wage calculator snapshot>     | null,
//     forecast:   <2026 forecast snapshot>              | null,
//     barPrice:   { value: <number>, lockedAt: <ISO> }  | null
//   }
//
// Backwards-compat:
//   • v2 deployments stored { forecast, barPrice }     → useOfFunds and
//     wages default to null until the next time those surfaces are
//     locked, which writes the new 4-surface shape.
//   • Pre-v2 flat-forecast snapshots (with .growth.bar at the top
//     level) → adopted as forecast only.
//
// Window globals (separate from Borough's __NDB_LOCK_SNAPSHOT and
// __NDB_TICKET_VOLUME_LOCK so a visitor switching between decks during a
// session doesn't end up with one deck reading the other's cache):
//   • window.__NDB_HACKNEY_USE_OF_FUNDS_LOCK  — funding/use-of-funds lock
//   • window.__NDB_HACKNEY_WAGE_LOCK          — wage calculator lock
//   • window.__NDB_HACKNEY_LOCK_SNAPSHOT      — 2026 forecast snapshot
//   • window.__NDB_HACKNEY_BAR_PRICE_LOCK     — bar-price slider lock
//   • window.__NDB_HACKNEY_FIXED_COSTS_LOCK   — fixed-costs editor lock
//   • window.__NDB_HACKNEY_OFFICE_COSTS_LOCK  — office-costs editor lock
//   • window.__NDB_HACKNEY_PRICING_LOCK       — ticket-pricing editor lock
//   • window.__NDB_HACKNEY_GOLF_HOST_LOCK     — golf-host wage lock
//
// Note: Hackney does NOT replicate Borough's gviz Sheet fetch. Hackney's
// data/hackney.js is hand-curated from the workbook; live cell hydration
// is a Borough-only path for now.

import { LOCK_SYNC_URL } from '../data/hackney.js'

// 10s default — Apps Script cold-start was empirically observed at 7.65s
// on a fresh GET to the Hackney endpoint. The 8s value Borough uses had
// only ~350ms of margin against that worst case, which clipped fetches
// intermittently. 10s gives a safer cushion. Don't shrink below 8s.
export async function bootstrapHackneyLocks({ timeoutMs = 10000 } = {}) {
  const start = (typeof performance !== 'undefined' ? performance.now() : Date.now())
  if (!LOCK_SYNC_URL) {
    // eslint-disable-next-line no-console
    console.info('[hackney] no LOCK_SYNC_URL configured — locks will load from localStorage only')
    return { source: 'local-only' }
  }
  // Per-tenant: the server stores ONE ROW PER ACCESS CODE. We pass the
  // active code as ?code=<CODE>. On first visit (fresh tab) sessionStorage
  // is empty — bootstrap runs before PasswordGate clears — so the server
  // falls back to its legacy single-tenant cell. Once the user signs in,
  // the LockedUseOfFundsProvider re-fetches with the right code via its
  // on-mount useEffect.
  let code = ''
  try { code = sessionStorage.getItem('ndb_access_code') || '' } catch {}
  const url = code ? `${LOCK_SYNC_URL}?code=${encodeURIComponent(code)}` : LOCK_SYNC_URL
  try {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal })
    clearTimeout(timeout)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()
    if (data && typeof data === 'object') {
      const raw = data.snapshot ?? null

      let useOfFunds  = null
      let wages       = null
      let forecast    = null
      let barPrice    = null
      let fixedCosts  = null
      let officeCosts = null
      let pricing     = null
      let golfHost    = null
      if (raw && typeof raw === 'object') {
        if ('useOfFunds' in raw || 'wages' in raw || 'forecast' in raw || 'barPrice' in raw || 'fixedCosts' in raw || 'officeCosts' in raw || 'pricing' in raw || 'golfHost' in raw) {
          // Container shape (current).
          useOfFunds  = raw.useOfFunds  ?? null
          wages       = raw.wages       ?? null
          forecast    = raw.forecast    ?? null
          barPrice    = raw.barPrice    ?? null
          fixedCosts  = raw.fixedCosts  ?? null
          officeCosts = raw.officeCosts ?? null
          pricing     = raw.pricing     ?? null
          golfHost    = raw.golfHost    ?? null
        } else if (raw.growth && Number.isFinite(raw.growth.bar)) {
          // Legacy flat-forecast shape — adopt as forecast, others null.
          forecast = raw
        }
      }

      window.__NDB_HACKNEY_USE_OF_FUNDS_LOCK  = useOfFunds
      window.__NDB_HACKNEY_WAGE_LOCK          = wages
      window.__NDB_HACKNEY_LOCK_SNAPSHOT      = forecast
      window.__NDB_HACKNEY_BAR_PRICE_LOCK     = barPrice
      window.__NDB_HACKNEY_FIXED_COSTS_LOCK   = fixedCosts
      window.__NDB_HACKNEY_OFFICE_COSTS_LOCK  = officeCosts
      window.__NDB_HACKNEY_PRICING_LOCK       = pricing
      window.__NDB_HACKNEY_GOLF_HOST_LOCK     = golfHost

      const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start)
      // eslint-disable-next-line no-console
      console.info(
        `[hackney] ✓ locks synced from server · ${ms}ms` +
        ` · useOfFunds=${useOfFunds ? 'set' : 'empty'}` +
        ` · wages=${wages ? 'set' : 'empty'}` +
        ` · forecast=${forecast ? 'set' : 'empty'}` +
        ` · barPrice=${barPrice ? 'set' : 'empty'}` +
        ` · fixedCosts=${fixedCosts ? 'set' : 'empty'}` +
        ` · officeCosts=${officeCosts ? 'set' : 'empty'}` +
        ` · pricing=${pricing ? 'set' : 'empty'}` +
        ` · golfHost=${golfHost ? 'set' : 'empty'}`
      )
    }
    return { source: 'server' }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[hackney] lock snapshot fetch failed, using local state:', e.message)
    return { source: 'fallback', error: e.message }
  }
}
