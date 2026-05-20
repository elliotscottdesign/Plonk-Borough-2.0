/**
 * No Dice — Public landing-page email signup (Google Apps Script web app)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Receives POST { email, ts, ua, ref } from nodice.bar/ (the public
 * landing page) and:
 *   1. Appends one row to the Signups sheet (deduped on email)
 *   2. Sends the founder a notification email per new signup
 *
 * Sheet structure (tab name: "Signups"):
 *   Row 1 (header):  email | first_seen | last_seen | count | user_agent | referrer
 *   Row 2+:          one data row per unique email
 *
 * Endpoints:
 *   POST { email, ts, ua, ref } → upserts row + emails founder
 *   GET  ?count=1               → { count: <total signups> }   (lightweight ping)
 *   GET  ?all=1&secret=<SECRET> → { rows: [...] }              (founder-only export)
 *
 * Email throttle: at most one founder notification per address per day,
 * regardless of how many times the form is submitted. Keeps inbox sane
 * if someone reloads the page repeatedly.
 *
 * ─── ONE-TIME SETUP (~3 minutes) ──────────────────────────────────────
 *
 * 1) Open ANY Google Sheet you control (or create a new one — name it
 *    "No Dice — Signups"). Add a tab called exactly:  Signups
 *    Copy its ID from the URL (the long string between /d/ and /edit)
 *    and paste it into SHEET_ID below.
 *
 * 2) Extensions → Apps Script. Open a NEW project (not an existing
 *    lock-sync or notes project — keep this in its own deployment so
 *    it's independent). Delete the default `function myFunction()` stub
 *    and paste this file's contents in. Save.
 *
 * 3) Deploy → New deployment.
 *      Type:            Web app
 *      Execute as:      Me   ← important, MailApp needs your account
 *      Who has access:  Anyone
 *    Click Deploy. Authorise (the script needs Sheets + Mail access).
 *
 * 4) Copy the Web app URL and paste it into:
 *      src/Landing.jsx → const SIGNUP_SYNC_URL = '...'
 *    Commit + push.
 *
 * ─── UPDATING (after editing this file) ───────────────────────────────
 *
 * Save → Deploy → Manage deployments → ✏️ pencil → Version: New version → Deploy.
 * The same URL persists across deployments.
 */

const SHEET_ID          = '14gsy9cpuaUs22tQWg1P9l29xGFfYwIC0kB4pOvjuZDs'  // No Dice — Signups workbook
const SHEET_NAME        = 'Signups'
const HEADER_ROW        = ['email', 'first_seen', 'last_seen', 'count', 'user_agent', 'referrer']
const FOUNDER_EMAIL     = 'elliotscottdesign@gmail.com'   // notification recipient
const EMAIL_THROTTLE_MS = 24 * 60 * 60 * 1000             // one founder email per address per day
const ALLOW_LIST_SECRET = ''                              // optional: require ?secret=<value> for the GET ?all=1 export

function _sheet() {
  if (!SHEET_ID) throw new Error('SHEET_ID is not set. Paste your workbook ID into signup-apps-script.gs.')
  const ss = SpreadsheetApp.openById(SHEET_ID)
  let sh = ss.getSheetByName(SHEET_NAME)
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME)
    sh.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW]).setFontWeight('bold')
    sh.setFrozenRows(1)
  }
  return sh
}

function _now() { return new Date() }

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}')
    const email = String(body.email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return _json({ ok: false, error: 'invalid_email' })
    }

    const sh   = _sheet()
    const data = sh.getDataRange().getValues()      // first row is header
    const now  = _now()

    // Find existing row by email
    let rowIdx = -1
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === email) { rowIdx = i + 1; break }   // 1-based row number
    }

    let isNew = false
    let prevCount = 0
    let prevLastSeen = null
    if (rowIdx === -1) {
      // New signup — append row
      isNew = true
      sh.appendRow([email, now, now, 1, String(body.ua || ''), String(body.ref || '')])
    } else {
      // Existing signup — bump count + last_seen
      prevCount    = Number(data[rowIdx - 1][3]) || 0
      prevLastSeen = data[rowIdx - 1][2] ? new Date(data[rowIdx - 1][2]) : null
      sh.getRange(rowIdx, 3).setValue(now)                       // last_seen
      sh.getRange(rowIdx, 4).setValue(prevCount + 1)             // count
      sh.getRange(rowIdx, 5).setValue(String(body.ua || ''))
      sh.getRange(rowIdx, 6).setValue(String(body.ref || ''))
    }

    // Email throttle — only ping the founder once per day per email
    const shouldEmail = isNew || !prevLastSeen || (now.getTime() - prevLastSeen.getTime() > EMAIL_THROTTLE_MS)
    if (shouldEmail) {
      const subject = isNew
        ? '🎲 No Dice — new signup: ' + email
        : '🎲 No Dice — repeat signup: ' + email
      const body =
        'Email:        ' + email + '\n' +
        'Time:         ' + now.toISOString() + '\n' +
        'User agent:   ' + (body && body.ua ? body.ua : '(none)') + '\n' +
        'Referrer:     ' + (body && body.ref ? body.ref : '(none)') + '\n' +
        'Status:       ' + (isNew ? 'NEW' : 'repeat (count ' + (prevCount + 1) + ')')
      try { MailApp.sendEmail(FOUNDER_EMAIL, subject, body) } catch (mailErr) { /* don't block the signup on a mail failure */ }
    }

    return _json({ ok: true, isNew: isNew })
  } catch (err) {
    return _json({ ok: false, error: String(err && err.message || err) })
  }
}

function doGet(e) {
  try {
    const p = (e && e.parameter) || {}
    if (p.count === '1') {
      const sh = _sheet()
      return _json({ count: Math.max(0, sh.getLastRow() - 1) })
    }
    if (p.all === '1') {
      if (ALLOW_LIST_SECRET && p.secret !== ALLOW_LIST_SECRET) return _json({ ok: false, error: 'forbidden' })
      const sh = _sheet()
      const data = sh.getDataRange().getValues()
      const header = data.shift() || HEADER_ROW
      const rows = data.map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])))
      return _json({ ok: true, rows: rows })
    }
    return _json({ ok: true, hint: 'POST { email } to sign up · GET ?count=1 for total · GET ?all=1&secret=... for export' })
  } catch (err) {
    return _json({ ok: false, error: String(err && err.message || err) })
  }
}
