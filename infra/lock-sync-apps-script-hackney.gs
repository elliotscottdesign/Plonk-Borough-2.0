/**
 * No Dice Hackney — Lock Sync (Google Apps Script web app)
 * ─────────────────────────────────────────────────────────
 *
 * Sibling of infra/lock-sync-apps-script.gs (Borough). The two are byte-
 * identical EXCEPT SHEET_ID points to the Hackney workbook below. They
 * MUST stay deployed as separate web apps with separate URLs — sharing
 * one endpoint would cause the two decks to overwrite each other's
 * locked snapshot row on every founder lock.
 *
 * v3+ — PER-ACCESS-CODE STORAGE
 * ──────────────────────────────
 * From this version the script stores ONE ROW PER ACCESS CODE on the
 * "Lock State" sheet so every signed-in user gets a private playground
 * their drags and locks persist into independently. Sheet structure:
 *
 *   Row 1 (header):  code | snapshot | updated_at
 *   Row 2+:          one data row per access code
 *
 * Each row's snapshot column holds the merged container:
 *   { useOfFunds, wages, forecast, barPrice }
 *
 * Endpoints:
 *   GET  ?code=<CODE>          → { snapshot: <row's container> | null }
 *   POST { code, snapshot }    → upserts the row for that code
 *
 * Backwards-compat: requests without ?code default to the legacy A1
 * cell so older clients still resolve while the per-tenant rollout
 * propagates.
 *
 * SETUP (one-time, ~3 minutes):
 *
 * 1) Open the Hackney workbook in Google Sheets:
 *    https://docs.google.com/spreadsheets/d/1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg/edit
 *
 * 2) Add a new sheet named exactly:  Lock State
 *    The script will lay out the header row on first write.
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

const SHEET_ID    = '1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg'  // Hackney workbook ID
const SHEET_NAME  = 'Lock State'                                       // tab name
const HEADER_ROW  = ['code', 'snapshot', 'updated_at']                 // col layout
const LEGACY_CELL = 'A1'                                               // pre-per-tenant single-cell
const LOCK_SECRET = ''                                                 // optional shared secret; '' = no check

function _sheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID)
  let sh = ss.getSheetByName(SHEET_NAME)
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME)
  }
  return sh
}

function _ensureHeader(sh) {
  const a1 = sh.getRange('A1').getValue()
  if (a1 === HEADER_ROW[0]) return
  if (typeof a1 === 'string' && a1.length > 0 && a1[0] === '{') {
    sh.insertRowBefore(1)
  }
  sh.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW])
  sh.setFrozenRows(1)
}

function _findRow(sh, code) {
  const lastRow = sh.getLastRow()
  if (lastRow < 2) return -1
  const codes = sh.getRange(2, 1, lastRow - 1, 1).getValues()
  for (let i = 0; i < codes.length; i++) {
    if (String(codes[i][0]) === String(code)) return i + 2
  }
  return -1
}

function _readForCode(sh, code) {
  const row = _findRow(sh, code)
  if (row < 2) return null
  const raw = sh.getRange(row, 2).getValue()
  if (raw === '' || raw == null) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw }
  catch { return null }
}

function _writeForCode(sh, code, snapshot) {
  _ensureHeader(sh)
  const ts = new Date().toISOString()
  const row = _findRow(sh, code)
  if (snapshot === null || snapshot === undefined) {
    if (row >= 2) {
      sh.getRange(row, 2).clearContent()
      sh.getRange(row, 3).setValue(ts)
    }
    return
  }
  const json = JSON.stringify(snapshot)
  if (row >= 2) {
    sh.getRange(row, 2, 1, 2).setValues([[json, ts]])
  } else {
    sh.appendRow([code, json, ts])
  }
}

function _readLegacy(sh) {
  const raw = sh.getRange(LEGACY_CELL).getValue()
  if (raw === '' || raw == null) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw }
  catch { return null }
}

function _json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}

function doGet(e) {
  try {
    const sh = _sheet()
    const code = (e && e.parameter && e.parameter.code) ? String(e.parameter.code) : ''
    if (!code) {
      const legacy = _readLegacy(sh)
      return _json({ snapshot: legacy })
    }
    const snap = _readForCode(sh, code)
    return _json({ snapshot: snap })
  } catch (err) {
    return _json({ error: err.toString(), snapshot: null })
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}')

    if (LOCK_SECRET && body.secret !== LOCK_SECRET) {
      return _json({ error: 'unauthorised' })
    }

    const sh = _sheet()
    const code = body.code ? String(body.code) : ''
    const snapshot = body.snapshot

    if (!code) {
      if (snapshot === null || snapshot === undefined) {
        sh.getRange(LEGACY_CELL).clearContent()
        sh.getRange(LEGACY_CELL).clearNote()
      } else {
        sh.getRange(LEGACY_CELL).setValue(JSON.stringify(snapshot))
        sh.getRange(LEGACY_CELL).setNote('Locked at ' + new Date().toISOString())
      }
      return _json({ ok: true, mode: 'legacy' })
    }

    _writeForCode(sh, code, snapshot)
    return _json({ ok: true, mode: 'per-code', code })
  } catch (err) {
    return _json({ error: err.toString() })
  }
}
