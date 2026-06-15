/**
 * No Dice — Hackney Investor Agreement Signatures
 * Cross-device sync for the e-signatures captured on the LeonieAgreement,
 * MikeAgreement, LeeAgreement (and future investor) pages.
 *
 * UNLIKE the existing lock-sync endpoint (LOCK_SYNC_URL), which stores
 * one row PER ACCESS CODE, this endpoint stores one row PER AGREEMENT.
 * That's because a signature has to be visible to both the Investor (on
 * their personal access code, e.g. LEONIE) AND the Founder (on 888999) —
 * so a per-code store wouldn't work.
 *
 * ── SHEET SHAPE ─────────────────────────────────────────────────────────
 * Sheet name: "Signatures"
 * Columns:
 *   A  agreementId        (string — e.g. "leonie", "mike", "lee")
 *   B  investor_name      (string)
 *   C  investor_date      (yyyy-mm-dd)
 *   D  investor_signedAt  (ISO timestamp)
 *   E  founder_name       (string)
 *   F  founder_date       (yyyy-mm-dd)
 *   G  founder_signedAt   (ISO timestamp)
 *   H  updatedAt          (ISO timestamp of the last write)
 *
 * ── API ─────────────────────────────────────────────────────────────────
 * GET ?agreementId=<id>
 *   → { ok:true, signatures: { investor:{name,date,signedAt}|null,
 *                              founder:{name,date,signedAt}|null,
 *                              updatedAt:<ISO>|null } }
 * GET (no params)
 *   → { ok:true, signatures: { <id>: { investor, founder, updatedAt }, ... } }
 *
 * POST { agreementId, side:'investor'|'founder', sig:{name,date,signedAt} | null }
 *   → { ok:true }
 *   • Upserts the row keyed by agreementId.
 *   • Only touches the columns for the specified `side`.
 *   • sig === null clears that side (used by the "Clear signature" button).
 *
 * ── DEPLOY ──────────────────────────────────────────────────────────────
 * 1. Create a fresh Google Sheet (e.g. "No Dice — Signatures Sync").
 *    Copy its ID from the URL → /d/<THIS-IS-THE-ID>/edit
 * 2. In that Sheet, Extensions → Apps Script.
 * 3. Paste this entire file in as Code.gs (overwrite the default).
 * 4. Set SHEET_ID below to the ID you copied in step 1.
 * 5. Save (cmd-S).
 * 6. Deploy → New deployment → Type: Web app
 *      • Description: "Signatures sync v1"
 *      • Execute as: Me (your Google account)
 *      • Who has access: Anyone
 *    Click Deploy. Authorise when prompted.
 * 7. Copy the Web app URL.
 * 8. Paste it into src/data/hackney.js as SIGNATURES_SYNC_URL.
 * 9. Commit. The agreements will start syncing immediately.
 *
 * To roll out a fix later: paste the new file → Save → Deploy → Manage
 * deployments → ✏️ pencil → Version: New version → Deploy.
 */

const SHEET_ID   = ''           // ← paste the Sheet ID here (between /d/ and /edit)
const SHEET_NAME = 'Signatures'

// Headers in the exact column order documented above.
const HEADERS = [
  'agreementId',
  'investor_name', 'investor_date', 'investor_signedAt',
  'founder_name',  'founder_date',  'founder_signedAt',
  'updatedAt',
]

function doGet(e) {
  try {
    const sheet = openSheet_()
    const id = (e && e.parameter && e.parameter.agreementId) || ''
    const container = readAll_(sheet)
    if (id) {
      return jsonOut_({ ok: true, signatures: container[id] || emptyRow_() })
    }
    return jsonOut_({ ok: true, signatures: container })
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err && err.message || err) }, 500)
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}')
    const agreementId = String(body.agreementId || '').trim().toLowerCase()
    const side        = String(body.side || '').trim().toLowerCase()
    const sig         = body.sig === null ? null : body.sig
    if (!agreementId)              return jsonOut_({ ok: false, error: 'missing agreementId' }, 400)
    if (side !== 'investor' && side !== 'founder')
                                   return jsonOut_({ ok: false, error: 'side must be investor or founder' }, 400)
    if (sig && (typeof sig !== 'object' || typeof sig.name !== 'string' || sig.name.length < 1))
                                   return jsonOut_({ ok: false, error: 'sig must be { name, date, signedAt } or null' }, 400)

    const lock = LockService.getScriptLock()
    lock.waitLock(5000)
    try {
      const sheet = openSheet_()
      upsertSide_(sheet, agreementId, side, sig)
    } finally {
      try { lock.releaseLock() } catch (_) {}
    }
    return jsonOut_({ ok: true })
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err && err.message || err) }, 500)
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────

function openSheet_() {
  if (!SHEET_ID) throw new Error('SHEET_ID is not set — paste your Sheet ID into the constant at the top of this file')
  const ss = SpreadsheetApp.openById(SHEET_ID)
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold')
    sheet.setFrozenRows(1)
  } else if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold')
    sheet.setFrozenRows(1)
  }
  return sheet
}

function readAll_(sheet) {
  const last = sheet.getLastRow()
  const container = {}
  if (last < 2) return container
  const rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues()
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const agreementId = String(r[0] || '').trim().toLowerCase()
    if (!agreementId) continue
    container[agreementId] = {
      investor: r[1] ? { name: String(r[1]), date: normalizeDate_(r[2]), signedAt: normalizeISO_(r[3]) } : null,
      founder:  r[4] ? { name: String(r[4]), date: normalizeDate_(r[5]), signedAt: normalizeISO_(r[6]) } : null,
      updatedAt: r[7] ? normalizeISO_(r[7]) : null,
    }
  }
  return container
}

// Google Sheets auto-converts "2026-06-16" strings into Date cell values
// on write. When we read them back getValues() returns a JS Date object,
// which Stringifies to "Tue Jun 16 2026 00:00:00 GMT+0100 …" — useless
// to the client's prettyDate() helper. Normalise back to yyyy-mm-dd.
function normalizeDate_(v) {
  if (v == null || v === '') return ''
  if (Object.prototype.toString.call(v) === '[object Date]') {
    const y = v.getFullYear()
    const m = String(v.getMonth() + 1).padStart(2, '0')
    const d = String(v.getDate()).padStart(2, '0')
    return y + '-' + m + '-' + d
  }
  return String(v)
}

// Same idea but for ISO timestamps (signedAt, updatedAt).
function normalizeISO_(v) {
  if (v == null || v === '') return ''
  if (Object.prototype.toString.call(v) === '[object Date]') return v.toISOString()
  return String(v)
}

function findRow_(sheet, agreementId) {
  const last = sheet.getLastRow()
  if (last < 2) return -1
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues()
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0] || '').trim().toLowerCase() === agreementId) return i + 2
  }
  return -1
}

function upsertSide_(sheet, agreementId, side, sig) {
  let row = findRow_(sheet, agreementId)
  if (row < 0) {
    row = sheet.getLastRow() + 1
    if (row < 2) row = 2
    sheet.getRange(row, 1).setValue(agreementId)
  }

  // Column ranges per side. Investor = B/C/D, Founder = E/F/G.
  const nameCol      = side === 'investor' ? 2 : 5
  const dateCol      = side === 'investor' ? 3 : 6
  const signedAtCol  = side === 'investor' ? 4 : 7

  if (sig === null) {
    sheet.getRange(row, nameCol).setValue('')
    sheet.getRange(row, dateCol).setValue('')
    sheet.getRange(row, signedAtCol).setValue('')
  } else {
    sheet.getRange(row, nameCol).setValue(String(sig.name || ''))
    sheet.getRange(row, dateCol).setValue(String(sig.date || ''))
    sheet.getRange(row, signedAtCol).setValue(String(sig.signedAt || new Date().toISOString()))
  }
  sheet.getRange(row, 8).setValue(new Date().toISOString())
}

function emptyRow_() {
  return { investor: null, founder: null, updatedAt: null }
}

function jsonOut_(obj, _status) {
  // Apps Script ContentService doesn't expose setStatus(); errors travel
  // inside the JSON body as { ok:false, error:... }. The optional second
  // arg is accepted for call-site clarity but ignored.
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
