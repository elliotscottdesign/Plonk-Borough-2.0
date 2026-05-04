/**
 * No Dice Hackney — Lock Sync (Google Apps Script web app)
 * ─────────────────────────────────────────────────────────
 *
 * Sibling of infra/lock-sync-apps-script.gs (Borough). The two are byte-
 * identical EXCEPT SHEET_ID points to the Hackney workbook below. They
 * MUST stay deployed as separate web apps with separate URLs — sharing
 * one endpoint would cause the two decks to overwrite each other's
 * locked snapshot container on every founder lock.
 *
 * Stores the founder's locked Hackney deck state in a single cell of
 * the Hackney workbook. The Hackney deck (LockedUseOfFundsContext +
 * src/hackney/data-bootstrap.js) GETs from this web app on every page
 * boot and POSTs whenever any lock is set or cleared.
 *
 * The stored value is a JSON CONTAINER carrying every lockable surface
 * in one document so each writer can refresh the cell without clobbering
 * the others. Shape:
 *
 *   {
 *     forecast: <2026 Hackney forecast snapshot> | null,
 *     barPrice: { value: <number>, lockedAt: <ISO string> } | null
 *   }
 *
 * If a flat forecast snapshot ever lands here (with .growth.bar at the
 * top level), the client auto-detects it and adopts as
 * { forecast: <legacy>, barPrice: null } — same backwards-compat path
 * as Borough.
 *
 * SETUP (one-time, ~3 minutes):
 *
 * 1) Open the Hackney workbook in Google Sheets:
 *    https://docs.google.com/spreadsheets/d/1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg/edit
 *
 * 2) Add a new sheet named exactly:  Lock State
 *    Leave A1 empty — the script will fill it.
 *
 * 3) Extensions → Apps Script. In the Code.gs editor, FIRST select all
 *    existing code (⌘/Ctrl + A) and DELETE it — Apps Script ships a stub
 *    `function myFunction() {}` by default and any leftover from a previous
 *    deployment must be removed, otherwise you'll end up with duplicate
 *    function declarations and the script will fail to save. Then paste
 *    this file's contents in. Save (⌘/Ctrl + S).
 *
 * 4) (Optional) Set a shared secret to authorise writes. Edit LOCK_SECRET
 *    below; copy the same value into src/data/hackney.js → LOCK_SYNC_SECRET.
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
 *    src/data/hackney.js → LOCK_SYNC_URL. Commit + push to deploy the deck.
 *
 * UPDATING (after editing this file):
 *    Deploy → Manage deployments → pencil icon → Version: New version → Deploy.
 *    Same URL persists across deployments.
 */

const SHEET_ID   = '1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg'  // Hackney workbook ID
const SHEET_NAME = 'Lock State'                                       // tab name
const CELL       = 'A1'                                               // cell holding the JSON snapshot
const LOCK_SECRET = ''                                                // optional shared secret; '' = no check

function _sheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID)
  let sh = ss.getSheetByName(SHEET_NAME)
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME)
    sh.getRange('A1').setNote('Auto-created by lock-sync web app — holds the Hackney locked container as JSON.')
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
