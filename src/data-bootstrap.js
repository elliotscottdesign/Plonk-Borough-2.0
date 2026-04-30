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

export async function bootstrapDataFromSheet({ timeoutMs = 4000 } = {}) {
  const start = (typeof performance !== 'undefined' ? performance.now() : Date.now())

  // Hard cap so the deck doesn't hang if Google is slow / unreachable
  const timeoutP = new Promise((_, rej) =>
    setTimeout(() => rej(new Error(`bootstrap timeout (${timeoutMs}ms)`)), timeoutMs)
  )

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

    // Best-effort: also pull the locked-forecast snapshot from the sync
    // endpoint (if configured). Stored on window for LockedForecastContext
    // to pick up at provider init.
    await fetchLockedSnapshot()

    return { source: 'sheet', appliedCount, durationMs: ms }
  } catch (err) {
    const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start)
    // eslint-disable-next-line no-console
    console.warn(`[deck-data] ✗ Sheet fetch failed (${ms}ms), using data.js defaults: ${err.message}`)
    // Try the lock snapshot fetch even if the Sheet bootstrap failed —
    // they are independent endpoints.
    await fetchLockedSnapshot()
    return { source: 'fallback', error: err.message, durationMs: ms }
  }
}

// Fetch the locked-forecast snapshot from LOCK_SYNC_URL (if set) and store
// it on window.__NDB_LOCK_SNAPSHOT for LockedForecastContext to read at init.
// Falls back silently — the provider will use localStorage if this fails.
async function fetchLockedSnapshot() {
  if (!LOCK_SYNC_URL) return
  try {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 3000)
    const res = await fetch(LOCK_SYNC_URL, { cache: 'no-store', signal: ctrl.signal })
    clearTimeout(timeout)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()
    if (data && typeof data === 'object') {
      // Server responds with { snapshot: <object>|null }
      window.__NDB_LOCK_SNAPSHOT = data.snapshot ?? null
      // eslint-disable-next-line no-console
      console.info('[deck-data] ✓ lock snapshot synced from server' + (data.snapshot ? '' : ' (empty)'))
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[deck-data] lock snapshot fetch failed, using local state:', e.message)
  }
}
