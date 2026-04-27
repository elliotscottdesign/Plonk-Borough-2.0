/**
 * No Dice Borough — Lock Sync (Google Apps Script web app)
 * ─────────────────────────────────────────────────────────
 *
 * Stores the founder's "locked 2026 Performance forecast" in a single cell
 * of the existing workbook. The deck (LockedForecastContext + data-bootstrap)
 * GETs from this web app on every page boot and POSTs whenever the founder
 * locks/unlocks.
 *
 * SETUP (one-time, ~3 minutes):
 *
 * 1) Open the workbook in Google Sheets:
 *    https://docs.google.com/spreadsheets/d/1dtqbmoKK01oRY-0Zi1ZllVh82NiIGk8eS-l8aKJG_8Y/edit
 *
 * 2) Add a new sheet named exactly:  Lock State
 *    Leave A1 empty — the script will fill it.
 *
 * 3) Extensions → Apps Script → paste this file's contents into Code.gs
 *    (replace any existing code). Save (⌘/Ctrl + S).
 *
 * 4) (Optional) Set a shared secret to authorise writes. Edit LOCK_SECRET
 *    below; copy the same value into src/data.js → LOCK_SYNC_SECRET.
 *    Leave both empty if you don't want a secret check.
 *
 * 5) Click Deploy → New deployment.
 *      Type: Web app
 *      Execute as: Me
 *      Who has access: Anyone
 *    Click Deploy. Authorise when prompted (the script needs to
 *    read/write the Sheet on your behalf).
 *
 * 6) Copy the resulting Web app URL (looks like
 *    https://script.google.com/macros/s/.../exec) and paste it into
 *    src/data.js → LOCK_SYNC_URL. Commit + push to deploy the deck.
 *
 * UPDATING (after editing this file):
 *    Deploy → Manage deployments → pencil icon → Version: New version → Deploy.
 *    Same URL persists across deployments.
 */

const SHEET_ID   = '1dtqbmoKK01oRY-0Zi1ZllVh82NiIGk8eS-l8aKJG_8Y'  // workbook ID (same as deck)
const SHEET_NAME = 'Lock State'                                       // tab name
const CELL       = 'A1'                                               // cell holding the JSON snapshot
const LOCK_SECRET = ''                                                // optional shared secret; '' = no check

function _sheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)
}

function _json(payload, status) {
  const out = ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
  // Note: Apps Script doesn't support custom response headers via web app —
  // CORS is handled implicitly (the response is publicly readable).
  return out
}

function doGet(e) {
  try {
    const raw = _sheet().getRange(CELL).getValue()
    if (raw === '' || raw == null) return _json({ snapshot: null })
    let snapshot
    try { snapshot = typeof raw === 'string' ? JSON.parse(raw) : raw }
    catch { snapshot = null }
    return _json({ snapshot, updatedAt: _sheet().getRange(CELL).getNote() || null })
  } catch (err) {
    return _json({ error: err.toString(), snapshot: null })
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}')

    // Optional auth — if LOCK_SECRET is set, the client must include it.
    if (LOCK_SECRET && body.secret !== LOCK_SECRET) {
      return _json({ error: 'unauthorised' })
    }

    const sheet = _sheet()
    const snapshot = body.snapshot
    if (snapshot === null || snapshot === undefined) {
      sheet.getRange(CELL).clearContent()
      sheet.getRange(CELL).clearNote()
    } else {
      sheet.getRange(CELL).setValue(JSON.stringify(snapshot))
      sheet.getRange(CELL).setNote('Locked at ' + new Date().toISOString())
    }
    return _json({ ok: true })
  } catch (err) {
    return _json({ error: err.toString() })
  }
}
