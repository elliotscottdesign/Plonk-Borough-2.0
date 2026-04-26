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
//   Founder Tools!C5                              → DEAL.multiple
//   Investment Valuation 1!C7..G7                 → DEAL.preMoney/investment/postMoney/founderEq/investorEq
//   Dividend & Distribution Model!B14             → FORECAST.profit (operating profit override)
//   Dividend & Distribution Model!B41             → DEAL.investorDividend / totalInvestorReturn
//   2025 Weekly Categorised Costs!BB78..BB88      → ACTUALS_2025 (9 cost lines + revenue)
//
// CoC and payback are computed from the fetched investment + investor return.

import { DEAL, FORECAST, ACTUALS_2025 } from './data.js'

const SHEET_ID = '1PY9VuebugqUwZ57UN48tlP-GHuHA5QzB'

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
      fetchGviz('Founder Tools', 'C5'),
      fetchGviz('Investment Valuation 1', 'C7:G7'),
      fetchGviz('Dividend & Distribution Model', 'B14'),
      fetchGviz('Dividend & Distribution Model', 'B41'),
      fetchGviz('2025 Weekly Categorised Costs', 'BB78:BB88'),
    ])

    const [ftC5, iv7, ddmB14, ddmB41, wkBB] = await Promise.race([fetches, timeoutP])

    let appliedCount = 0
    const apply = (obj, key, val) => {
      if (val != null && Number.isFinite(val)) {
        obj[key] = val
        appliedCount++
      }
    }

    // ─── Founder Tools!C5 → DEAL.multiple ────────────────────────────────
    apply(DEAL, 'multiple', ftC5?.[0]?.[0])

    // ─── Investment Valuation 1!C7..G7 → DEAL fields ─────────────────────
    if (iv7?.[0]) {
      const [preMoney, investment, postMoney, founderEq, investorEq] = iv7[0]
      apply(DEAL, 'preMoney',   preMoney)
      apply(DEAL, 'investment', investment)
      apply(DEAL, 'postMoney',  postMoney)
      apply(DEAL, 'founderEq',  founderEq)
      apply(DEAL, 'investorEq', investorEq)
    }

    // ─── Dividend & Distribution Model!B14 → FORECAST.profit ─────────────
    apply(FORECAST, 'profit', ddmB14?.[0]?.[0])

    // ─── Dividend & Distribution Model!B41 → DEAL.investorDividend ───────
    apply(DEAL, 'investorDividend',     ddmB41?.[0]?.[0])
    apply(DEAL, 'totalInvestorReturn',  ddmB41?.[0]?.[0])

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
    if (DEAL.investment > 0 && DEAL.investorDividend > 0) {
      DEAL.coc     = DEAL.investorDividend / DEAL.investment
      DEAL.payback = DEAL.investment / DEAL.investorDividend
    }

    const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start)
    // eslint-disable-next-line no-console
    console.info(`[deck-data] ✓ live from Sheet · ${appliedCount} fields · ${ms}ms`)
    return { source: 'sheet', appliedCount, durationMs: ms }
  } catch (err) {
    const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start)
    // eslint-disable-next-line no-console
    console.warn(`[deck-data] ✗ Sheet fetch failed (${ms}ms), using data.js defaults: ${err.message}`)
    return { source: 'fallback', error: err.message, durationMs: ms }
  }
}
