/**
 * No Dice Hackney — Sheets Write Bridge (Google Apps Script web app)
 * ──────────────────────────────────────────────────────────────────
 *
 * General-purpose write endpoint for the Hackney master workbook. Lets the
 * deck developer (or any authorised client) update tabs, ranges, cells, or
 * append rows without manual copy-paste. All writes go through doPost with
 * a JSON body. Reads are also available via doGet for verify-after-write.
 *
 * Security model:
 *   - Optional shared secret (HACKNEY_WRITE_SECRET below). When set, every
 *     POST must include it in the body or the call is rejected.
 *   - Script runs as YOU (the script owner), so the workbook stays
 *     "Anyone with link · Viewer" externally — only this script can write.
 *
 * SETUP (one-time, ~5 minutes):
 *
 *  1) Open the master Hackney workbook:
 *     https://docs.google.com/spreadsheets/d/1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg/edit
 *
 *  2) Extensions → Apps Script. Paste this file's full contents into Code.gs
 *     (replace any existing code). Save with Cmd+S.
 *
 *  3) Set a shared secret. In the script header below, change
 *     HACKNEY_WRITE_SECRET to a non-trivial random string. Keep a copy.
 *
 *  4) Click Deploy → New deployment → gear icon → Web app.
 *       Description:    Hackney sheets write bridge
 *       Execute as:     Me (your account)
 *       Who has access: Anyone
 *     Click Deploy. Authorise when prompted (script needs read/write on
 *     the workbook on your behalf).
 *
 *  5) Copy the resulting Web app URL (looks like
 *     https://script.google.com/macros/s/AKfycb.../exec). Send it back to
 *     Claude along with your HACKNEY_WRITE_SECRET so writes can be issued
 *     from chat.
 *
 *  UPDATING the script later:
 *     Deploy → Manage deployments → pencil → Version: New version → Deploy.
 *     The same URL persists across deployments.
 *
 * REQUEST FORMATS (all POST, JSON body, Content-Type: text/plain to skip
 * the CORS preflight Apps Script doesn't support):
 *
 *   { secret, action: "writeRange", tab, range, values: [[...], [...]] }
 *   { secret, action: "writeCell",  tab, cell, value }
 *   { secret, action: "clearRange", tab, range }
 *   { secret, action: "replaceTab", tab, values: [[...], ...] }
 *     // Clears the entire tab and writes values starting at A1.
 *   { secret, action: "appendRow",  tab, values: [...] }
 *   { secret, action: "listTabs" }
 *
 * GET — read-only verification (no secret required for reads):
 *   ?action=readRange&tab=Wages%20Breakdown&range=A41:E46
 *   ?action=listTabs
 */

const HACKNEY_WORKBOOK_ID = '1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg'
const HACKNEY_WRITE_SECRET = ''   // ← set this before deploying

// ─── Helpers ──────────────────────────────────────────────────────────

function _ss() { return SpreadsheetApp.openById(HACKNEY_WORKBOOK_ID) }

function _tab(name) {
  const sh = _ss().getSheetByName(name)
  if (!sh) throw new Error('Tab not found: ' + name)
  return sh
}

function _json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}

function _checkSecret(body) {
  if (HACKNEY_WRITE_SECRET && body.secret !== HACKNEY_WRITE_SECRET) {
    throw new Error('unauthorised')
  }
}

// ─── Write actions ────────────────────────────────────────────────────

function _writeRange({ tab, range, values }) {
  if (!Array.isArray(values) || !Array.isArray(values[0])) {
    throw new Error('values must be a 2D array')
  }
  const sh = _tab(tab)
  const r = sh.getRange(range)
  if (r.getNumRows() !== values.length || r.getNumColumns() !== values[0].length) {
    // Auto-fit: write to a range starting at the top-left of the requested
    // range, sized to the values array. Avoids "range mismatch" errors when
    // the caller passes A1 notation that's smaller than the data.
    const tl = sh.getRange(range).getCell(1, 1)
    sh.getRange(tl.getRow(), tl.getColumn(), values.length, values[0].length).setValues(values)
  } else {
    r.setValues(values)
  }
  return { ok: true, wrote: values.length + 'x' + values[0].length }
}

function _writeCell({ tab, cell, value }) {
  _tab(tab).getRange(cell).setValue(value)
  return { ok: true, cell }
}

function _clearRange({ tab, range }) {
  _tab(tab).getRange(range).clear({ contentsOnly: true })
  return { ok: true, cleared: range }
}

function _replaceTab({ tab, values }) {
  if (!Array.isArray(values) || !Array.isArray(values[0])) {
    throw new Error('values must be a 2D array')
  }
  const sh = _tab(tab)
  sh.clear({ contentsOnly: true })
  sh.getRange(1, 1, values.length, values[0].length).setValues(values)
  return { ok: true, wrote: values.length + 'x' + values[0].length }
}

function _appendRow({ tab, values }) {
  _tab(tab).appendRow(values)
  return { ok: true, appended: values.length + ' cols' }
}

function _listTabs() {
  return { ok: true, tabs: _ss().getSheets().map(s => ({ name: s.getName(), rows: s.getLastRow(), cols: s.getLastColumn() })) }
}

function _readRange({ tab, range }) {
  return { ok: true, values: _tab(tab).getRange(range).getValues() }
}

// ─── doPost / doGet routers ───────────────────────────────────────────

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}')
    _checkSecret(body)
    switch (body.action) {
      case 'writeRange':  return _json(_writeRange(body))
      case 'writeCell':   return _json(_writeCell(body))
      case 'clearRange':  return _json(_clearRange(body))
      case 'replaceTab':  return _json(_replaceTab(body))
      case 'appendRow':   return _json(_appendRow(body))
      case 'listTabs':    return _json(_listTabs())
      case 'readRange':   return _json(_readRange(body))
      default:            return _json({ error: 'unknown action: ' + body.action })
    }
  } catch (err) {
    return _json({ error: err.toString() })
  }
}

function doGet(e) {
  try {
    const p = (e && e.parameter) || {}
    switch (p.action) {
      case 'listTabs':   return _json(_listTabs())
      case 'readRange':  return _json(_readRange({ tab: p.tab, range: p.range }))
      default:           return _json({ ok: true, message: 'Hackney sheets write bridge — POST to write, GET ?action=listTabs|readRange to read.' })
    }
  } catch (err) {
    return _json({ error: err.toString() })
  }
}
