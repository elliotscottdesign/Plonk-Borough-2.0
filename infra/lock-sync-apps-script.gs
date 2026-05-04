/**
 * No Dice Borough — Lock Sync (Google Apps Script web app)
 * ─────────────────────────────────────────────────────────
 *
 * Stores the founder's locked deck state in a single cell of the existing
 * workbook. The deck (LockedDeckContext + data-bootstrap) GETs from this
 * web app on every page boot and POSTs whenever any lock is set or cleared.
 *
 * The stored value is a JSON CONTAINER carrying every lockable surface in
 * one document so each writer can refresh the cell without clobbering the
 * others. From v2 the shape is:
 *
 *   {
 *     forecast: <2026 forecast snapshot> | null,
 *     ticketVolume: { value: <number>, lockedAt: <ISO string> } | null
 *   }
 *
 * v1 deployments stored a flat forecast snapshot (with .revenue at top
 * level). The client auto-detects that legacy shape and adopts it as
 * { forecast: <legacy>, ticketVolume: null }, so existing servers keep
 * working without redeployment until the next time the founder locks
 * anything (which writes the new container shape).
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
  const ss = SpreadsheetApp.openById(SHEET_ID)
  let sh = ss.getSheetByName(SHEET_NAME)
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME)
    sh.getRange('A1').setNote('Auto-created by lock-sync web app — holds the locked 2026 forecast snapshot as JSON.')
  }
  return sh
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
