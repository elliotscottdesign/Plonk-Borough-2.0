// Path C — Live data sync from Google Sheets
//
// At deck load (in main.jsx, before <App />), this fetches the current values
// of headline cells from the canonical Google Sheet at WORKBOOK_URL and
// mutates the data.js exports in place. Slides then render with the latest
// values from the Sheet, regardless of who changed them last (human or Claude).
//
// Fallback behaviour: any fetch error / timeout / parse failure → keep the
// hardcoded data.js defaults. The deck always renders something sensible.
//
// Cell mapping (kept narrow for v1 — only the headline numbers that change
// most often). Values not listed here remain at data.js defaults:
//
//   Investment Valuation 1!F7..G7                 → DEAL.founderEq / DEAL.investorEq
//   Dividend & Distribution Model!B14             → FORECAST.profit (operating profit override)
//   2025 Weekly Categorised Costs!BB78..BB88      → ACTUALS_2025 (9 cost lines + revenue)
//
// As of 2026-04-30 funding-amount + use-of-funds + multiple + CoC + payback
// + A-share threshold all flex live from the FundingSlider on Cover via
// LockedDeckContext, NOT from the workbook. The bootstrap therefore only
// hydrates the equity split (which is structural, not slider-driven) and
// the operating profit / cost reference data.

import { DEAL, FORECAST, ACTUALS_2025, LOCK_SYNC_URL } from './data.js'

const SHEET_ID = '1dtqbmoKK01oRY-0Zi1ZllVh82NiIGk8eS-l8aKJG_8Y'

/**
 * Fetch a range from the Sheet via gviz JSON.
 * Returns a 2D array [rowIdx][colIdx] of raw cell values (numbers, strings, dates),
 * or throws on error.
 */
async function fetchGviz(sheetName, range) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
              `?sheet=${encodeURIComponent(sheetName)}&range=${encodeURIComponent(range)}`
  const res = await fetch(url, { mode: 'cors', cache: 'no-store' })
  if (!res.ok) throw new Error(`gviz ${sheetName} ${range}: HTTP ${res.status}`)
  const text = await res.text()

  // gviz wraps JSON in JSONP: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  // Extract the JSON payload between setResponse( and the trailing );
  const match = text.match(/setResponse\(([\s\S]*)\);?\s*$/)
  if (!match) throw new Error(`gviz ${sheetName} ${range}: malformed response`)
  const payload = JSON.parse(match[1])
  if (payload.status !== 'ok') {
    const err = payload.errors?.[0]?.detailed_message || 'unknown'
    throw new Error(`gviz ${sheetName} ${range}: ${err}`)
  }

  return (payload.table?.rows || []).map(r =>
    (r.c || []).map(cell => (cell ? cell.v : null))
  )
}

export async function bootstrapDataFromSheet({ timeoutMs = 9000 } = {}) {
  const start = (typeof performance !== 'undefined' ? performance.now() : Date.now())

  // Hard cap so the deck doesn't hang if Google is slow / unreachable.
  // Bumped from 4s → 9s after Apps Script cold-start latency was clipping
  // the lock-sync fetch and breaking cross-device lock propagation.
  const timeoutP = new Promise((_, rej) =>
    setTimeout(() => rej(new Error(`bootstrap timeout (${timeoutMs}ms)`)), timeoutMs)
  )

  // Kick off the lock-sync fetch in parallel with the gviz fetches so the
  // two share the time budget. Captured here so we can `await` it before
  // returning, regardless of whether the gviz fetches succeed or time out.
  const lockFetchP = fetchLockedSnapshot()

  try {
    const fetches = Promise.all([
      fetchGviz('Investment Valuation 1', 'F7:G7'),
      fetchGviz('Dividend & Distribution Model', 'B14'),
      fetchGviz('2025 Weekly Categorised Costs', 'BB78:BB88'),
    ])

    const [iv7, ddmB14, wkBB] = await Promise.race([fetches, timeoutP])

    let appliedCount = 0
    const apply = (obj, key, val) => {
      if (val != null && Number.isFinite(val)) {
        obj[key] = val
        appliedCount++
      }
    }

    // ─── Investment Valuation 1!F7..G7 → DEAL.founderEq / investorEq ─────
    if (iv7?.[0]) {
      const [founderEq, investorEq] = iv7[0]
      apply(DEAL, 'founderEq',  founderEq)
      apply(DEAL, 'investorEq', investorEq)
    }

    // ─── Dividend & Distribution Model!B14 → FORECAST.profit ─────────────
    apply(FORECAST, 'profit', ddmB14?.[0]?.[0])

    // ─── 2025 Weekly Categorised Costs!BB78..BB88 → ACTUALS_2025 ─────────
    // Row offsets in wkBB[]:  78→0  79→1  80→2  81→3  82→4  83→5  84→6
    //                         85→7  86→8  87→9  88→10
    // Rows 78-85 = cost lines, 86-87 = blank/header, 88 = BM Total (revenue)
    if (wkBB) {
      apply(ACTUALS_2025, 'wages',       wkBB[0]?.[0])
      apply(ACTUALS_2025, 'fixedCosts',  wkBB[1]?.[0])
      apply(ACTUALS_2025, 'drinksGas',   wkBB[2]?.[0])
      apply(ACTUALS_2025, 'cleaning',    wkBB[3]?.[0])
      apply(ACTUALS_2025, 'food',        wkBB[4]?.[0])
      apply(ACTUALS_2025, 'arcades',     wkBB[5]?.[0])
      apply(ACTUALS_2025, 'googleAds',   wkBB[6]?.[0])
      apply(ACTUALS_2025, 'cardCharges', wkBB[7]?.[0])
      apply(ACTUALS_2025, 'revenue',     wkBB[10]?.[0])
    }

    // ─── Derived metrics ─────────────────────────────────────────────────
    // FORECAST.revenue = 2026 base case revenue (ACTUALS × 1.15) — derived
    // here so it reflects whatever ACTUALS_2025.revenue resolves to from the
    // Sheet. Same derivation used by InvestmentSummary's calcReturns.
    if (ACTUALS_2025.revenue > 0) {
      FORECAST.revenue = Math.round(ACTUALS_2025.revenue * 1.15)
    }
    // FORECAST.margin = profit / revenue
    if (FORECAST.revenue > 0 && FORECAST.profit > 0) {
      FORECAST.margin = FORECAST.profit / FORECAST.revenue
    }

    const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start)
    // eslint-disable-next-line no-console
    console.info(`[deck-data] ✓ live from Sheet · ${appliedCount} fields · ${ms}ms`)

    // Wait for the parallel lock fetch (started before the gviz fetches)
    // to settle so window globals are populated before main.jsx mounts.
    await lockFetchP

    return { source: 'sheet', appliedCount, durationMs: ms }
  } catch (err) {
    const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start)
    // eslint-disable-next-line no-console
    console.warn(`[deck-data] ✗ Sheet fetch failed (${ms}ms), using data.js defaults: ${err.message}`)
    // The lock fetch was kicked off in parallel — wait for it regardless.
    await lockFetchP
    return { source: 'fallback', error: err.message, durationMs: ms }
  }
}

// Fetch the lock container from LOCK_SYNC_URL (if set) and split into the
// individual surfaces on window for LockedDeckContext to read at init.
//
// Server stores a single JSON value at the configured cell. From v3 the
// shape is a 3-surface container:
//   { funding:      <fundingSnapshot>|null,
//     forecast:     <forecastSnapshot>|null,
//     ticketVolume: <{value,lockedAt}>|null }
//
// Backwards-compat:
//   • v2 container { forecast, ticketVolume }   → funding defaults to null.
//   • v1 flat-forecast snapshot (.revenue top-level) → adopted as forecast,
//     funding and ticketVolume default to null.
// Existing servers keep working without redeployment until the next lock
// write upgrades the cell to the v3 container shape.
//
// Falls back silently — the provider will use localStorage if this fails.
async function fetchLockedSnapshot() {
  if (!LOCK_SYNC_URL) return
  // Per-tenant: the server stores ONE ROW PER ACCESS CODE. We pass the
  // active code as ?code=<CODE>. On first visit (fresh tab) sessionStorage
  // is empty here — bootstrap runs before PasswordGate clears — so the
  // server falls back to its legacy single-tenant cell, which is
  // harmless. Once the user signs in, the LockedDeckProvider re-fetches
  // with the right code via its on-mount useEffect.
  let code = ''
  try { code = sessionStorage.getItem('ndb_access_code') || '' } catch {}
  const url = code ? `${LOCK_SYNC_URL}?code=${encodeURIComponent(code)}` : LOCK_SYNC_URL
  try {
    // 8s timeout — Apps Script cold-start can take 3-5s per call (verified
    // empirically against the deployed endpoint), and a redirect hop adds
    // latency on top. 3s was clipping the fetch before it ever resolved,
    // which silently broke cross-device sync (locks worked within the
    // same browser via localStorage but never reached Incognito / other
    // devices because the server payload was thrown away).
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal })
    clearTimeout(timeout)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()
    if (data && typeof data === 'object') {
      // Server responds with { snapshot: <object>|null }
      const raw = data.snapshot ?? null

      let funding = null
      let forecast = null
      let ticketVolume = null
      if (raw && typeof raw === 'object') {
        if ('funding' in raw || 'forecast' in raw || 'ticketVolume' in raw) {
          // v2 / v3 container shape.
          funding      = raw.funding      ?? null
          forecast     = raw.forecast     ?? null
          ticketVolume = raw.ticketVolume ?? null
        } else if (Number.isFinite(raw.revenue)) {
          // Legacy flat-forecast shape.
          forecast = raw
        }
      }

      window.__NDB_FUNDING_LOCK       = funding
      window.__NDB_LOCK_SNAPSHOT      = forecast
      window.__NDB_TICKET_VOLUME_LOCK = ticketVolume
      // eslint-disable-next-line no-console
      console.info(
        '[deck-data] ✓ locks synced from server' +
        ` · funding=${funding ? 'set' : 'empty'}` +
        ` · forecast=${forecast ? 'set' : 'empty'}` +
        ` · ticketVolume=${ticketVolume ? 'set' : 'empty'}`
      )
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[deck-data] lock snapshot fetch failed, using local state:', e.message)
  }
}
