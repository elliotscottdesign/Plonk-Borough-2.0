/**
 * No Dice Borough — Notes Sync (Google Apps Script web app)
 * ─────────────────────────────────────────────────────────
 *
 * Stores per-user notes (one row per access code) and emails the founder
 * whenever a note is saved. Sibling to lock-sync-apps-script.gs but in
 * its own deployment so the two endpoints stay independent.
 *
 * Sheet structure (tab name: "Notes"):
 *   Row 1 (header):  code | notes | updated_at
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
 * 1) Open the Borough workbook in Google Sheets and add a new sheet
 *    named exactly:  Notes
 *
 * 2) Extensions → Apps Script. Open a NEW project (not the existing
 *    lock-sync project). Delete the default `function myFunction()` stub
 *    and paste this file's contents in. Save.
 *
 * 3) (Optional) Set NOTES_SECRET below to require an auth header on
 *    POST + the founder's "all rows" GET. Copy the same value into
 *    src/data.js → NOTES_SYNC_SECRET. Leave both empty if you don't
 *    want a secret check.
 *
 * 4) Deploy → New deployment.
 *      Type: Web app
 *      Execute as: Me   ← important, MailApp needs your account
 *      Who has access: Anyone
 *    Click Deploy. Authorise (the script needs Sheets + Mail access).
 *
 * 5) Copy the Web app URL and paste it into src/data.js → NOTES_SYNC_URL.
 *    Commit + push.
 *
 * 6) (Optional) Edit FOUNDER_EMAIL below if you want notes to go to a
 *    different inbox than elliotscottdesign@gmail.com.
 *
 * UPDATING (after editing this file):
 *    Deploy → Manage deployments → pencil icon → Version: New version → Deploy.
 *    Same URL persists across deployments.
 */

const SHEET_ID       = '1dtqbmoKK01oRY-0Zi1ZllVh82NiIGk8eS-l8aKJG_8Y'  // Borough workbook
const SHEET_NAME     = 'Notes'
const HEADER_ROW     = ['code', 'notes', 'updated_at', 'last_email_at']
const NOTES_SECRET   = ''                              // optional shared secret
const FOUNDER_EMAIL  = 'elliotscottdesign@gmail.com'   // notification recipient
const EMAIL_THROTTLE_MS = 5 * 60 * 1000                // 5 minutes per access code
const FOUNDER_CODES  = ['888999']                      // codes allowed to post replies into other users' rows

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

function _maybeEmailFounder(sh, code, page, text, notes) {
  if (!FOUNDER_EMAIL) return false
  const now = Date.now()
  const last = _readLastEmailAt(sh, code)
  if (now - last < EMAIL_THROTTLE_MS) return false
  const pageLabel = (page && page.label) ? page.label : (page && page.id) || 'Unknown page'
  const subject = 'Borough deck — note from ' + code
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

  const body = [
    'Someone from "' + code + '" has left a note.',
    '',
    'Page: ' + pageLabel,
    'Saved at: ' + new Date().toISOString(),
    '',
    '— Note text ——————————————————————',
    snippet,
    '———————————————————————————————',
    '',
    'Open the workbook:',
    workbookUrl || '(workbook URL unavailable)',
    '',
    'Jump straight to the Notes sheet (one row per access code):',
    notesTabUrl || '(notes-sheet URL unavailable)',
    '',
    'Or open the deck → Notes tab (after Workbook) for the formatted view.',
    '',
    'Throttle: at most one email per user every 5 minutes (further edits within',
    'the window are saved silently and visible on the Notes tab in real time).',
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
    // Shape: { code: '888999', target: { code, pageId }, replyText?, reviewed? }
    //   - replyText present → set/clear founderReply on the entry
    //   - reviewed === true → mark entry as reviewed (timestamp + author)
    //   - reviewed === false → unmark
    // Either / both can be set in one POST. Locates the target row,
    // mutates the matching page entry, writes back. Target user sees
    // the change on their own deck after refreshOwnNotes (auto-poll on
    // mount + manual Replies button).
    if (body.target && body.target.code && body.target.pageId) {
      if (FOUNDER_CODES.indexOf(code) === -1) {
        return _json({ error: 'requires founder code' })
      }
      const targetCode = String(body.target.code)
      const pageId     = String(body.target.pageId)
      const blob = _readForCode(sh, targetCode) || { byPage: {} }
      if (!blob.byPage) blob.byPage = {}
      const entry = blob.byPage[pageId] || { text: '', label: pageId, updatedAt: '' }

      // Reply: only acts when replyText is explicitly present in body
      // (an undefined replyText means "leave the existing reply alone").
      if (Object.prototype.hasOwnProperty.call(body, 'replyText')) {
        const replyText = String(body.replyText || '').trim()
        if (replyText) {
          entry.founderReply = { text: replyText, updatedAt: new Date().toISOString(), authorCode: code }
        } else {
          delete entry.founderReply
        }
      }

      // Reviewed flag: same idea — only acts when present in the body.
      if (Object.prototype.hasOwnProperty.call(body, 'reviewed')) {
        if (body.reviewed === true) {
          entry.reviewed = { at: new Date().toISOString(), by: code }
        } else {
          delete entry.reviewed
        }
      }

      blob.byPage[pageId] = entry
      _writeForCode(sh, targetCode, blob, _readLastEmailAt(sh, targetCode))
      return _json({ ok: true, mode: 'target', targetCode: targetCode, pageId: pageId })
    }

    // ─── Standard user-notes write ───────────────────────────────
    const notes = body.notes
    const page  = body.page || null
    const text  = body.text || ''

    let emailed = false
    if (text && text.trim().length > 0) {
      emailed = _maybeEmailFounder(sh, code, page, text, notes)
    }
    const lastEmailAt = emailed ? Date.now() : _readLastEmailAt(sh, code)
    _writeForCode(sh, code, notes, lastEmailAt)
    return _json({ ok: true, emailed: emailed })
  } catch (err) {
    return _json({ error: err.toString() })
  }
}
