/**
 * No Dice Hackney — Notes Sync (Google Apps Script web app)
 * ─────────────────────────────────────────────────────────
 *
 * SIBLING SCRIPT: infra/notes-apps-script.gs serves the Borough deck.
 * The two are byte-identical except SHEET_ID + the email subject. Each
 * MUST be deployed as a separate web app with its own URL — sharing one
 * endpoint would mean Borough investor notes land in the Hackney sheet
 * and vice versa.
 *
 *   • Borough sibling     → src/data.js → NOTES_SYNC_URL
 *   • This file (Hackney) → src/data/hackney.js → NOTES_SYNC_URL
 *
 * Stores per-user notes (one row per access code) and emails the founder
 * whenever a note is saved. Sibling to lock-sync-apps-script-hackney.gs
 * but in its own deployment so the lock + notes endpoints stay
 * independent.
 *
 * Sheet structure (tab name: "Notes"):
 *   Row 1 (header):  code | notes | updated_at | last_email_at
 *   Row 2+:          one data row per access code
 *
 * The `notes` column holds the user's full per-page blob:
 *   { byPage: { [pageId]: { text, updatedAt, label } } }
 *
 * Endpoints:
 *   GET  ?code=<CODE>            → { notes: <blob>|null }
 *   GET  ?all=1&secret=<SECRET>  → { rows: [{code, notes, updatedAt}] }
 *   POST { code, notes, page, text } → upserts row + emails founder
 *
 * Email throttle: at most one email per access code per 5 minutes,
 * regardless of how many edits the user makes. Keeps inbox sane while
 * the user is actively typing.
 *
 * SETUP (one-time, ~3 minutes):
 *
 * 1) Open the Hackney workbook in Google Sheets and add a new sheet
 *    named exactly:  Notes
 *
 *    Hackney workbook:
 *    https://docs.google.com/spreadsheets/d/1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg/edit
 *
 * 2) Go to https://script.google.com/home → click "+ New project".
 *    A FRESH project, not the existing Hackney lock-sync project — both
 *    declare SHEET_ID at the top so sharing one project would crash the
 *    whole script with "Identifier 'SHEET_ID' has already been declared".
 *
 *    Rename it (top-left) to: Hackney Notes Sync
 *
 *    Delete the default `function myFunction()` stub from Code.gs and
 *    paste this file's contents in. Save (⌘/Ctrl + S).
 *
 * 3) (Optional) Set NOTES_SECRET below to require an auth header on
 *    POST + the founder's "all rows" GET. Copy the same value into
 *    src/data/hackney.js → NOTES_SYNC_SECRET. Leave both empty if you
 *    don't want a secret check.
 *
 * 4) Deploy → New deployment.
 *      Type: Web app
 *      Execute as: Me   ← important, MailApp needs your account
 *      Who has access: Anyone
 *    Click Deploy. Authorise (the script needs Sheets + Mail access).
 *
 * 5) Copy the Web app URL and paste it into src/data/hackney.js →
 *    NOTES_SYNC_URL. Commit + push.
 *
 * 6) (Optional) Edit FOUNDER_EMAIL below if you want notes to go to a
 *    different inbox than elliotscottdesign@gmail.com.
 *
 * UPDATING (after editing this file):
 *    Deploy → Manage deployments → pencil icon → Version: New version → Deploy.
 *    Same URL persists across deployments.
 */

const SHEET_ID         = '1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg'  // Hackney workbook
const SHEET_NAME       = 'Notes'
const HEADER_ROW       = ['code', 'notes', 'updated_at', 'last_email_at']
const NOTES_SECRET     = ''                              // optional shared secret
const FOUNDER_EMAIL    = 'elliotscottdesign@gmail.com'   // notification recipient
const EMAIL_THROTTLE_MS = 5 * 60 * 1000                  // 5 minutes per access code
const FOUNDER_CODES    = ['888999']                      // codes allowed to post replies into other users' rows

// ─── DATA-LOSS DEFENCES ───────────────────────────────────────────
// HistoryRow: append-only audit log. Every successful write inserts
// one row here so the Notes tab can be reconstructed even if it gets
// wiped. Recovery query: filter by `code`, sort by `ts` desc, take
// the latest non-empty `notes_blob` per pageId.
const HISTORY_SHEET_NAME = 'NotesHistory'
const HISTORY_HEADER_ROW = ['ts', 'code', 'op', 'page_id', 'page_label', 'text_snippet', 'page_count', 'notes_blob']
// Daily snapshot tabs are named Notes_Backup_YYYY-MM-DD. Kept for
// BACKUP_RETENTION_DAYS days; older tabs are removed by the trigger.
const BACKUP_SHEET_PREFIX = 'Notes_Backup_'
const BACKUP_RETENTION_DAYS = 30

function _sheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID)
  let sh = ss.getSheetByName(SHEET_NAME)
  if (!sh) sh = ss.insertSheet(SHEET_NAME)
  return sh
}

function _ensureHeader(sh) {
  const a1 = sh.getRange('A1').getValue()
  if (a1 === HEADER_ROW[0]) return
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

function _readLastEmailAt(sh, code) {
  const row = _findRow(sh, code)
  if (row < 2) return 0
  const raw = sh.getRange(row, 4).getValue()
  if (!raw) return 0
  const t = (raw instanceof Date) ? raw.getTime() : Date.parse(raw)
  return isNaN(t) ? 0 : t
}

function _writeForCode(sh, code, notes, lastEmailAt) {
  _ensureHeader(sh)
  const ts = new Date().toISOString()
  const row = _findRow(sh, code)
  const json = notes ? JSON.stringify(notes) : ''
  const emailTs = lastEmailAt ? new Date(lastEmailAt).toISOString() : ''
  if (row >= 2) {
    sh.getRange(row, 2, 1, 3).setValues([[json, ts, emailTs]])
  } else {
    sh.appendRow([code, json, ts, emailTs])
  }
}

function _allRows(sh) {
  const lastRow = sh.getLastRow()
  if (lastRow < 2) return []
  const data = sh.getRange(2, 1, lastRow - 1, 3).getValues()
  return data.map(([code, raw, ts]) => {
    let notes = null
    if (raw) {
      try { notes = typeof raw === 'string' ? JSON.parse(raw) : raw }
      catch {}
    }
    return { code: String(code), notes, updatedAt: ts ? String(ts) : null }
  })
}

function _json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}

// ─── Page-count helper — used by the empty-write guard ─────────────
function _pageCount(blob) {
  if (!blob || typeof blob !== 'object') return 0
  var bp = blob.byPage
  if (!bp || typeof bp !== 'object') return 0
  var n = 0
  for (var k in bp) if (Object.prototype.hasOwnProperty.call(bp, k)) n++
  return n
}

// ─── Append-only history sheet ────────────────────────────────────
// Returns the NotesHistory sheet (creating it on first call). Every
// successful write appends a row so the canonical Notes tab can be
// rebuilt even if it's been wiped.
function _historySheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID)
  var sh = ss.getSheetByName(HISTORY_SHEET_NAME)
  if (!sh) sh = ss.insertSheet(HISTORY_SHEET_NAME)
  var a1 = sh.getRange('A1').getValue()
  if (a1 !== HISTORY_HEADER_ROW[0]) {
    sh.getRange(1, 1, 1, HISTORY_HEADER_ROW.length).setValues([HISTORY_HEADER_ROW])
    sh.setFrozenRows(1)
  }
  return sh
}

function _appendHistory(code, op, page, text, blob) {
  try {
    var sh = _historySheet()
    var ts = new Date().toISOString()
    var pageId    = page && page.id    ? String(page.id)    : ''
    var pageLabel = page && page.label ? String(page.label) : pageId
    var snippet   = String(text || '').slice(0, 500)
    var count     = _pageCount(blob)
    var json      = blob ? JSON.stringify(blob) : ''
    sh.appendRow([ts, String(code), String(op || ''), pageId, pageLabel, snippet, count, json])
  } catch (err) {
    // Never let a history-write error break the main write path.
  }
}

function _maybeEmailFounder(sh, code, page, text, notes) {
  if (!FOUNDER_EMAIL) return false
  const now = Date.now()
  const last = _readLastEmailAt(sh, code)
  if (now - last < EMAIL_THROTTLE_MS) return false
  const pageLabel = (page && page.label) ? page.label : (page && page.id) || 'Unknown page'
  const subject = 'Hackney deck — note from ' + code
  const snippet = (text || '').slice(0, 1000)

  // Workbook + Notes-tab deep links — derived dynamically so the URL
  // tracks SHEET_ID without a second source of truth. The Notes-tab
  // link drops the founder straight into the row for this access code.
  let workbookUrl = ''
  let notesTabUrl = ''
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID)
    workbookUrl = ss.getUrl()
    notesTabUrl = workbookUrl + '#gid=' + sh.getSheetId()
  } catch (e) {}

  // Full JSON blob (capped at 60KB so very large states don't bounce
  // emails). Your inbox becomes a free, immutable backup for every
  // saved note — searchable by access code or page id.
  var fullBlob = ''
  try { fullBlob = notes ? JSON.stringify(notes, null, 2) : '' } catch (e) { fullBlob = '' }
  if (fullBlob.length > 60000) fullBlob = fullBlob.slice(0, 60000) + '\n…[truncated]'

  const body = [
    'Someone from "' + code + '" has left a note on the Hackney deck.',
    '',
    'Page: ' + pageLabel,
    'Saved at: ' + new Date().toISOString(),
    'Total pages on this user blob: ' + _pageCount(notes),
    '',
    '— Note text ——————————————————————',
    snippet,
    '———————————————————————————————',
    '',
    'Open the Hackney workbook:',
    workbookUrl || '(workbook URL unavailable)',
    '',
    'Jump straight to the Notes sheet (one row per access code):',
    notesTabUrl || '(notes-sheet URL unavailable)',
    '',
    'Or open the deck → Main Notes tab for the formatted view.',
    '',
    'Throttle: at most one email per user every 5 minutes (further edits within',
    'the window are saved silently and visible on the Main Notes tab in real time).',
    '',
    '— Full backup of this user\'s notes (JSON) —————————',
    fullBlob || '(empty)',
    '———————————————————————————————',
    'Keep this email — it is a recoverable snapshot of every page this user',
    'had notes on at the moment of the save. Use it alongside the NotesHistory',
    'tab and the daily Notes_Backup_YYYY-MM-DD snapshots to reconstruct state',
    'if the live Notes tab is ever lost or wiped.',
  ].join('\n')
  try {
    MailApp.sendEmail({ to: FOUNDER_EMAIL, subject: subject, body: body })
    return true
  } catch (err) {
    return false
  }
}

function doGet(e) {
  try {
    const sh = _sheet()
    const params = (e && e.parameter) || {}

    // ─── Health probe (founder-only banner) ───────────────────────
    // Reports sheet/tab metadata so the deck can warn the founder if
    // the backend is empty or wired to the wrong workbook.
    if (params.health === '1') {
      if (NOTES_SECRET && params.secret !== NOTES_SECRET) {
        return _json({ error: 'unauthorised' })
      }
      var hist = null
      try { hist = _historySheet() } catch (e2) {}
      var sheetRowCount   = Math.max(0, sh.getLastRow() - 1)
      var historyRowCount = hist ? Math.max(0, hist.getLastRow() - 1) : 0
      return _json({
        health: 'ok',
        sheetId: SHEET_ID,
        sheetName: SHEET_NAME,
        historySheetName: HISTORY_SHEET_NAME,
        sheetRowCount: sheetRowCount,
        historyRowCount: historyRowCount,
        backupPrefix: BACKUP_SHEET_PREFIX,
        backupRetentionDays: BACKUP_RETENTION_DAYS,
        serverTime: new Date().toISOString(),
      })
    }

    if (params.all === '1') {
      if (NOTES_SECRET && params.secret !== NOTES_SECRET) {
        return _json({ error: 'unauthorised' })
      }
      return _json({ rows: _allRows(sh) })
    }
    const code = params.code ? String(params.code) : ''
    if (!code) return _json({ notes: null })
    return _json({ notes: _readForCode(sh, code) })
  } catch (err) {
    return _json({ error: err.toString(), notes: null })
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}')
    if (NOTES_SECRET && body.secret !== NOTES_SECRET) {
      return _json({ error: 'unauthorised' })
    }
    const sh = _sheet()
    const code = body.code ? String(body.code) : ''
    if (!code) return _json({ error: 'missing code' })

    // ─── Founder target path ─────────────────────────────────────
    // Shape: { code, target: { code, pageId }, replyText?, reviewed? }
    //   - replyText present → set/clear founderReply
    //   - reviewed === true → mark reviewed; === false → unmark
    if (body.target && body.target.code && body.target.pageId) {
      if (FOUNDER_CODES.indexOf(code) === -1) {
        return _json({ error: 'requires founder code' })
      }
      const targetCode = String(body.target.code)
      const pageId     = String(body.target.pageId)
      const blob = _readForCode(sh, targetCode) || { byPage: {} }
      if (!blob.byPage) blob.byPage = {}
      const entry = blob.byPage[pageId] || { text: '', label: pageId, updatedAt: '' }

      // `replyColor` carries the founder's text-colour preference
      // (cyan / magenta / yellow / white). Saved on the reply record
      // so the visitor sees the chosen colour. Falls back to the
      // existing colour on the row, then to white.
      if (Object.prototype.hasOwnProperty.call(body, 'replyText')) {
        const replyText  = String(body.replyText || '').trim()
        const replyColor = body.replyColor ? String(body.replyColor) : ''
        if (replyText) {
          entry.founderReply = {
            text:       replyText,
            color:      replyColor || (entry.founderReply && entry.founderReply.color) || 'white',
            updatedAt:  new Date().toISOString(),
            authorCode: code,
          }
        } else {
          delete entry.founderReply
        }
      }

      if (Object.prototype.hasOwnProperty.call(body, 'reviewed')) {
        if (body.reviewed === true) {
          entry.reviewed = { at: new Date().toISOString(), by: code }
        } else {
          delete entry.reviewed
        }
      }

      blob.byPage[pageId] = entry
      _writeForCode(sh, targetCode, blob, _readLastEmailAt(sh, targetCode))
      _appendHistory(targetCode, 'founder_target', { id: pageId, label: pageId }, '', blob)
      return _json({ ok: true, mode: 'target', targetCode: targetCode, pageId: pageId })
    }

    // ─── Standard user-notes write ───────────────────────────────
    const notes = body.notes
    const page  = body.page || null
    const text  = body.text || ''
    const intent = body.intent ? String(body.intent) : ''

    // ─── EMPTY-WRITE GUARD ───────────────────────────────────────
    // If the incoming blob has zero pages AND the row on disk already
    // had pages, refuse the write unless the client explicitly flagged
    // intent='delete'. This is the safety net against bug-induced
    // wipes: a misbehaving client cannot blank a populated row.
    var incomingCount = _pageCount(notes)
    var existingBlob  = _readForCode(sh, code)
    var existingCount = _pageCount(existingBlob)
    if (incomingCount === 0 && existingCount > 0 && intent !== 'delete') {
      _appendHistory(code, 'REFUSED_EMPTY_WRITE', page, text, existingBlob)
      return _json({
        error: 'refused empty write',
        reason: 'incoming blob has 0 pages but existing row has ' + existingCount + ' pages; intent="delete" not set',
        existingPageCount: existingCount,
      })
    }

    let emailed = false
    if (text && text.trim().length > 0) {
      emailed = _maybeEmailFounder(sh, code, page, text, notes)
    }
    const lastEmailAt = emailed ? Date.now() : _readLastEmailAt(sh, code)
    _writeForCode(sh, code, notes, lastEmailAt)
    _appendHistory(code, intent === 'delete' ? 'delete' : 'write', page, text, notes)
    return _json({ ok: true, emailed: emailed })
  } catch (err) {
    return _json({ error: err.toString() })
  }
}

// ─── Daily snapshot trigger ───────────────────────────────────────
// Copies the live Notes tab to a dated tab (Notes_Backup_YYYY-MM-DD)
// once per day. Pruning removes snapshots older than
// BACKUP_RETENTION_DAYS. Run installDailyTrigger() ONCE from the
// Apps Script editor (Run → installDailyTrigger) to register the
// 03:00 time-driven trigger. Subsequent code redeploys do not need
// to re-install the trigger.
function dailySnapshot() {
  var ss = SpreadsheetApp.openById(SHEET_ID)
  var src = ss.getSheetByName(SHEET_NAME)
  if (!src) return
  var tz = ss.getSpreadsheetTimeZone() || 'Etc/UTC'
  var dateStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd')
  var name = BACKUP_SHEET_PREFIX + dateStr
  // Idempotent — skip if today's snapshot already exists.
  if (ss.getSheetByName(name)) return
  src.copyTo(ss).setName(name)
  _pruneOldSnapshots(ss, tz)
}

function _pruneOldSnapshots(ss, tz) {
  var sheets = ss.getSheets()
  var cutoff = Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000
  for (var i = 0; i < sheets.length; i++) {
    var s = sheets[i]
    var n = s.getName()
    if (n.indexOf(BACKUP_SHEET_PREFIX) !== 0) continue
    var dStr = n.substring(BACKUP_SHEET_PREFIX.length)
    var parsed = Date.parse(dStr + 'T00:00:00Z')
    if (!isNaN(parsed) && parsed < cutoff) {
      try { ss.deleteSheet(s) } catch (e) {}
    }
  }
}

// One-time install — run this from the Apps Script editor after
// pasting the file. It will list any existing dailySnapshot triggers
// and avoid creating a duplicate. Re-running is safe.
function installDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers()
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'dailySnapshot') {
      Logger.log('dailySnapshot trigger already installed')
      return
    }
  }
  ScriptApp.newTrigger('dailySnapshot')
    .timeBased()
    .atHour(3)
    .everyDays(1)
    .create()
  Logger.log('Installed daily 03:00 snapshot trigger')
}
