/**
 * No Dice Hackney — Workbook Organiser (one-shot admin script)
 * ────────────────────────────────────────────────────────────
 *
 * Single-purpose tool: cleans up the Hackney workbook so investors
 * (and the founder) can tell at a glance which sheets are which.
 *
 * What it does, in one run of `organiseHackneyWorkbook()`:
 *   1. Creates/refreshes a "📖 Sheet Guide" tab at position 1 with
 *      a legend explaining the colour code.
 *   2. Tags every other sheet with one of six tab colours by
 *      pattern-matching its name.
 *   3. Reorders sheets so they group by category (guide → investor
 *      input → deck source of truth → raw data → system →
 *      internal/uncategorised).
 *   4. Logs a full report so you can paste it back to me — anything
 *      that ended up in "uncategorised" (yellow with ❓) is a sheet
 *      I need a tag for.
 *
 * What it does NOT do:
 *   • Never deletes any sheet. Compaction/removal is a manual call;
 *     after running this, send me the report and I'll list which
 *     sheets are safe to archive or merge.
 *   • Never touches cell contents. Tab colour / order / a new guide
 *     sheet only.
 *
 * INSTALL (~2 minutes, ONE time):
 *   1. Open the Hackney workbook:
 *      https://docs.google.com/spreadsheets/d/1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg/edit
 *   2. Extensions → Apps Script. A new project opens.
 *      Rename it (top-left) to: Hackney Workbook Organiser
 *   3. Delete the default Code.gs stub. Paste this entire file in.
 *      Save (⌘/Ctrl + S).
 *   4. Run menu → organiseHackneyWorkbook. Authorise if prompted
 *      (needs Sheets access; no email, no web deploy).
 *   5. Open the workbook — every tab is now colour-coded and the
 *      📖 Sheet Guide sits at position 1.
 *   6. Send me the View → Logs output. Anything tagged with ❓ in
 *      that log is something I need a rule for.
 *
 * Safe to re-run any time — it's idempotent. Adding new sheets to
 * the workbook later? Just re-run and they get tagged + ordered.
 */

const HACKNEY_SHEET_ID = '1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg'

// ─── Categories ───────────────────────────────────────────────────
// Order here = display order in the workbook. Each entry has a code,
// a human label, an emoji prefix shown on the guide sheet, a tab
// colour, and an explanation that appears on the guide sheet.
const CATEGORIES = [
  {
    code:  'guide',
    label: 'Sheet Guide',
    emoji: '📖',
    color: '#C9A84C', // gold
    desc:  'Legend for this workbook. Read this first.',
  },
  {
    code:  'investor_input',
    label: 'Investor Input',
    emoji: '🟢',
    color: '#16A34A', // green
    desc:  'Where investor notes land. One row per access code. Leave as-is — the React deck writes here automatically when an investor saves a note.',
  },
  {
    code:  'deck_source',
    label: 'Deck Source of Truth',
    emoji: '🔵',
    color: '#2563EB', // blue
    desc:  'Financial sheets that mirror what appears in the React investor deck (Weekly Merge, Monthly Summary, Forecast, Cashflow, Use of Funds, etc.). Edit here → I update the deck constants.',
  },
  {
    code:  'raw_data',
    label: 'Raw Data',
    emoji: '🟣',
    color: '#7E22CE', // purple
    desc:  'Unprocessed exports (Goodtill till data, raw imports). Audit trail — never edited in place. Source files for the cleaned datasets that feed the deck.',
  },
  {
    code:  'system',
    label: 'System / Backups',
    emoji: '🟡',
    color: '#CA8A04', // amber
    desc:  'Apps Script writes here automatically — NotesHistory audit log, daily Notes_Backup_YYYY-MM-DD snapshots, lock-sync state. Don\'t edit.',
  },
  {
    code:  'internal',
    label: 'Internal / Founder',
    emoji: '⚪',
    color: '#6B7280', // grey
    desc:  'Working sheets, scratch calculations, ad-hoc analysis. Not shown to investors via the deck; not on the audit path either.',
  },
  {
    code:  'archive',
    label: 'Archive',
    emoji: '🗄',
    color: '#374151', // dark grey
    desc:  'Retained for audit but no longer in use. Prefixed with _ARCHIVE_ so they always sort to the bottom. Safe to delete manually if you don\'t need the historical content.',
  },
  {
    code:  'uncategorised',
    label: 'Uncategorised (needs a rule)',
    emoji: '❓',
    color: '#DC2626', // red — visible warning state
    desc:  'No pattern matched this sheet — tell Claude what category it belongs to and the rule will be added.',
  },
]

const CAT_BY_CODE = (() => {
  const m = {}
  CATEGORIES.forEach(c => { m[c.code] = c })
  return m
})()

// ─── Categorisation rules ─────────────────────────────────────────
// Order matters — first match wins. Patterns are case-INSENSITIVE
// regular expressions tested against the raw sheet name.
//
// Add a new sheet name to the list and re-run. If it doesn't match
// here it gets tagged 'uncategorised' (red) so it's impossible to
// miss in the workbook.
const RULES = [
  // ─── Archive (always wins — prefix is the marker) ─────────────
  { code: 'archive',        pattern: /^_ARCHIVE_/i },

  // ─── System (NotesHistory, daily backups, lock state) ─────────
  { code: 'system',         pattern: /^NotesHistory$/i },
  { code: 'system',         pattern: /^Notes_Backup_\d{4}-\d{2}-\d{2}$/i },
  { code: 'system',         pattern: /lock.*sync|sync.*lock|forecast.*lock/i },
  { code: 'system',         pattern: /^lock[\s_-]*state$/i },
  // Note: 'Error Log' previously matched here; now archived so it
  // goes via the _ARCHIVE_ prefix above.

  // ─── Investor input — the live Notes sheet ────────────────────
  { code: 'investor_input', pattern: /^Notes$/i },

  // ─── Raw data — Goodtill exports and other untouched dumps ────
  { code: 'raw_data',       pattern: /goodtill|raw[\s_-]*(till|data|export)|export[\s_-]*raw|till[\s_-]*export/i },
  // 'Sales' is the 1.44M-cell raw Goodtill dump in this workbook.
  // Exact-match rule placed BEFORE the deck_source `^sales$` rule
  // used to live here (now removed) so it correctly classifies as
  // raw data on every run.
  { code: 'raw_data',       pattern: /^sales$/i },

  // ─── Deck source of truth — sheets that drive the React deck ──
  // Generic patterns (apply across both Borough and Hackney workbooks)
  { code: 'deck_source',    pattern: /weekly[\s_-]*merge|weekly[\s_-]*merged/i },
  { code: 'deck_source',    pattern: /monthly[\s_-]*summary|monthly[\s_-]*p&?l|monthly[\s_-]*pnl/i },
  { code: 'deck_source',    pattern: /\bforecast\b|\bcashflow\b|cash[\s_-]*flow/i },
  { code: 'deck_source',    pattern: /use[\s_-]*of[\s_-]*funds|use[\s_-]*of[\s_-]*fund|UoF/i },
  { code: 'deck_source',    pattern: /\brota\b|\bwages?\b|\bpayroll\b/i },
  { code: 'deck_source',    pattern: /income[\s_-]*sources?|cost[\s_-]*categor|fixed[\s_-]*costs?|office[\s_-]*costs?/i },
  { code: 'deck_source',    pattern: /investor[\s_-]*returns?|waterfall|deal[\s_-]*terms?/i },
  { code: 'deck_source',    pattern: /discount[s]?[\s_-]*(summary|analysis|breakdown)/i },
  { code: 'deck_source',    pattern: /till[\s_-]*sales?[\s_-]*(by[\s_-]*category|clean|cleaned)|2025[\s_-]*till|hackney[\s_-]*till/i },
  // Hackney workbook-specific named sheets
  { code: 'deck_source',    pattern: /^(investor|investment)[\s_-]*(summary|valuation|rounds?|model)/i },
  { code: 'deck_source',    pattern: /^dividend[\s_-]*(&[\s_-]*)?distribution/i },
  { code: 'deck_source',    pattern: /^scenario[\s_-]*planning$/i },
  { code: 'deck_source',    pattern: /^downside[\s_-]*scenario$/i },
  { code: 'deck_source',    pattern: /^events?[\s_-]*strategy$/i },
  { code: 'deck_source',    pattern: /^growth[\s_-]*drivers?$/i },
  { code: 'deck_source',    pattern: /^capacity[\s_-]*model$/i },
  { code: 'deck_source',    pattern: /^tech[\s_-]*optimisation$/i },
  { code: 'deck_source',    pattern: /^inputs?$/i },
  { code: 'deck_source',    pattern: /^annual[\s_-]*overview$/i },
  { code: 'deck_source',    pattern: /^performance[\s_-]*charts?$/i },
  { code: 'deck_source',    pattern: /^\d{4}[\s_-]*weekly[\s_-]*totals?$/i },
  { code: 'deck_source',    pattern: /^\d{4}[\s_-]*monthly[\s_-]*data$/i },
  { code: 'deck_source',    pattern: /^weekly[\s_-]*data$/i },
  // Monthly raw-entry tabs (January..December roll up into Weekly Merged)
  { code: 'deck_source',    pattern: /^(january|february|march|april|may|june|july|august|september|october|november|december)$/i },

  // ─── Internal / founder dashboards & working sheets ───────────
  { code: 'internal',       pattern: /scratch|draft|wip|workings?|sandbox|notes?[\s_-]*pad/i },
  { code: 'internal',       pattern: /^control[\s_-]*panel$/i },
  { code: 'internal',       pattern: /^audit[\s_-]*(view|dashboard|panel)$/i },
]

function _categorise(name) {
  for (var i = 0; i < RULES.length; i++) {
    if (RULES[i].pattern.test(name)) return RULES[i].code
  }
  return 'uncategorised'
}

// ─── Tab colour helper ────────────────────────────────────────────
function _setTabColor(sheet, hex) {
  // setTabColorObject is the modern API; setTabColor takes a hex
  // string. Use the string form for compatibility across all Apps
  // Script runtimes.
  try { sheet.setTabColor(hex) } catch (e) { /* ignore — older runtime */ }
}

// ─── Guide sheet content ──────────────────────────────────────────
function _refreshGuideSheet(ss) {
  var GUIDE_NAME = '📖 Sheet Guide'
  var sh = ss.getSheetByName(GUIDE_NAME)
  if (!sh) sh = ss.insertSheet(GUIDE_NAME, 0)
  sh.clear()
  sh.setTabColor(CAT_BY_CODE.guide.color)

  // ─── Top banner ───
  sh.getRange('A1').setValue('No Dice Hackney — Workbook Sheet Guide').setFontSize(18).setFontWeight('bold').setFontFamily('Inter')
  sh.getRange('A2').setValue('Every tab in this workbook is colour-coded by what it does. Use this legend to navigate.').setFontSize(11).setFontStyle('italic').setFontColor('#6B7280')
  sh.getRange('A3').setValue('Last refreshed: ' + new Date().toISOString().replace('T',' ').slice(0,16) + ' (re-run organiseHackneyWorkbook in Apps Script to refresh)').setFontSize(9).setFontColor('#9CA3AF')

  // ─── Legend table ───
  sh.getRange('A5').setValue('Colour key').setFontSize(13).setFontWeight('bold')
  var legendStart = 7
  sh.getRange(legendStart - 1, 1, 1, 3)
    .setValues([['Category', 'Tab colour', 'What it means']])
    .setFontWeight('bold').setBackground('#F3F4F6').setFontColor('#111827')

  var legendRows = CATEGORIES.map(function(c) {
    return [c.emoji + ' ' + c.label, c.color, c.desc]
  })
  sh.getRange(legendStart, 1, legendRows.length, 3).setValues(legendRows).setVerticalAlignment('top').setWrap(true)

  // Paint each "Tab colour" cell with that category's colour
  CATEGORIES.forEach(function(c, i) {
    var cell = sh.getRange(legendStart + i, 2)
    cell.setBackground(c.color).setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center')
  })

  // ─── Footer ───
  var footerRow = legendStart + legendRows.length + 2
  sh.getRange(footerRow, 1).setValue('Notes for investors').setFontSize(13).setFontWeight('bold')
  var notes = [
    ['• Green (Investor Input) is where your notes land when you save them in the deck. The deck writes here automatically — you do not need to open this workbook to use the Notes feature.'],
    ['• Blue (Deck Source of Truth) sheets are the financial figures behind the React deck. If a number changes here it changes in the deck too (after the founder ships an update).'],
    ['• Some Blue sheets are MANUALLY-MAINTAINED REFERENCE SHEETS — they have no formula links inside this workbook but are still the canonical source for figures published in the React deck. Weekly Merged 2024-2026 is the primary one. Do not delete a Blue sheet on the basis that nothing inside the workbook reads it — the deck reads it directly via constants exported into the React codebase.'],
    ['• Purple (Raw Data) sheets are the underlying till exports — they are kept untouched as an audit trail. The numbers in the deck come from the cleaned, deduplicated versions of these files.'],
    ['• Amber (System / Backups) sheets are written automatically by the back-end scripts. Treat them as read-only — they protect your data against accidental loss.'],
    ['• Dark-grey (Archive) sheets are retained for audit but no longer in use. Safe to delete manually if you do not need the historical content.'],
  ]
  sh.getRange(footerRow + 1, 1, notes.length, 1).setValues(notes).setFontSize(10).setFontColor('#374151').setWrap(true)

  // ─── Layout ───
  sh.setColumnWidth(1, 280)
  sh.setColumnWidth(2, 140)
  sh.setColumnWidth(3, 720)
  sh.setFrozenRows(1)
  sh.setHiddenGridlines(true)

  return sh
}

// ─── Main entrypoint ──────────────────────────────────────────────
function organiseHackneyWorkbook() {
  var ss = SpreadsheetApp.openById(HACKNEY_SHEET_ID)
  var guide = _refreshGuideSheet(ss)

  // Group sheets by category. The guide sheet is in its own slot
  // (always position 0).
  var sheets = ss.getSheets()
  var report = { byCategory: {}, uncategorised: [] }

  CATEGORIES.forEach(function(c) { report.byCategory[c.code] = [] })

  sheets.forEach(function(sh) {
    var name = sh.getName()
    if (sh.getSheetId() === guide.getSheetId()) {
      report.byCategory.guide.push(name)
      return
    }
    var code = _categorise(name)
    report.byCategory[code].push(name)
    if (code === 'uncategorised') report.uncategorised.push(name)
    _setTabColor(sh, CAT_BY_CODE[code].color)
  })

  // Reorder: guide first, then each category's sheets in
  // alphabetical order. Apps Script's moveActiveSheet works on
  // 1-based positions; we collect the desired order and place each
  // sheet by name.
  var desiredOrder = []
  CATEGORIES.forEach(function(c) {
    var names = (report.byCategory[c.code] || []).slice().sort(function(a, b) {
      // Backup snapshots — newest first (descending date)
      if (c.code === 'system') return b.localeCompare(a)
      return a.localeCompare(b)
    })
    names.forEach(function(n) { desiredOrder.push(n) })
  })

  // Apply order — move each sheet in desired position 1, 2, 3 ...
  for (var i = 0; i < desiredOrder.length; i++) {
    var sh = ss.getSheetByName(desiredOrder[i])
    if (!sh) continue
    ss.setActiveSheet(sh)
    ss.moveActiveSheet(i + 1)
  }

  // ─── Build a human-readable report and dump to Logger.log ─────
  var lines = []
  lines.push('═══════════════════════════════════════════════════════')
  lines.push(' Hackney Workbook Organiser — run report')
  lines.push(' ' + new Date().toISOString())
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('')
  lines.push('Workbook: ' + ss.getName())
  lines.push('Total sheets: ' + sheets.length)
  lines.push('')
  CATEGORIES.forEach(function(c) {
    var names = report.byCategory[c.code] || []
    lines.push(c.emoji + '  ' + c.label.toUpperCase() + '  (' + c.color + ')  — ' + names.length + ' sheet(s)')
    if (names.length === 0) {
      lines.push('    (none)')
    } else {
      names.forEach(function(n) { lines.push('    • ' + n) })
    }
    lines.push('')
  })

  if (report.uncategorised.length > 0) {
    lines.push('───────────────────────────────────────────────────────')
    lines.push(' ⚠  ' + report.uncategorised.length + ' sheet(s) need a categorisation rule:')
    report.uncategorised.forEach(function(n) { lines.push('    ❓ ' + n) })
    lines.push('')
    lines.push(' Send this list to Claude — they will be added to the')
    lines.push(' RULES array in this script and re-run will tag them.')
    lines.push('───────────────────────────────────────────────────────')
  } else {
    lines.push('✅ Every sheet matched a rule. Workbook is clean.')
  }

  Logger.log(lines.join('\n'))
  return lines.join('\n')
}

// ─── Read-only audit (no changes) ─────────────────────────────────
// Run this first if you'd like to preview without touching anything.
// Just lists every sheet with its current tab colour and what
// category the rules WOULD assign.
function auditHackneyWorkbook() {
  var ss = SpreadsheetApp.openById(HACKNEY_SHEET_ID)
  var sheets = ss.getSheets()
  var lines = []
  lines.push('Audit (no changes made) — ' + new Date().toISOString())
  lines.push('Workbook: ' + ss.getName() + '   sheets: ' + sheets.length)
  lines.push('')
  lines.push(_pad('Sheet name', 50) + _pad('Rows', 8) + _pad('Cols', 8) + _pad('Current colour', 18) + 'Would assign')
  lines.push(new Array(110).join('─'))
  sheets.forEach(function(sh) {
    var name = sh.getName()
    var code = _categorise(name)
    var cat  = CAT_BY_CODE[code]
    lines.push(
      _pad(name, 50) +
      _pad(String(sh.getLastRow()), 8) +
      _pad(String(sh.getLastColumn()), 8) +
      _pad(String(sh.getTabColor() || '—'), 18) +
      cat.emoji + ' ' + cat.label
    )
  })
  Logger.log(lines.join('\n'))
  return lines.join('\n')
}

function _pad(s, n) {
  s = String(s)
  if (s.length >= n) return s.slice(0, n - 1) + ' '
  return s + new Array(n - s.length + 1).join(' ')
}

// Convert a 0-indexed column number to its A1 letter (0 → A, 26 → AA).
function _colLetter(n) {
  var s = ''
  n = n + 1
  while (n > 0) {
    var rem = (n - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

// ─── Hard-delete every _ARCHIVE_* sheet ───────────────────────────
// Safety: the prefix is the only thing that qualifies a sheet for
// deletion. Anything not starting with _ARCHIVE_ is untouched.
function deleteArchivedSheets() {
  var ss = SpreadsheetApp.openById(HACKNEY_SHEET_ID)
  var sheets = ss.getSheets()
  var deleted = []
  sheets.forEach(function(sh) {
    var name = sh.getName()
    if (/^_ARCHIVE_/i.test(name)) {
      ss.deleteSheet(sh)
      deleted.push(name)
    }
  })
  var lines = []
  lines.push('═══════════════════════════════════════════════════════')
  lines.push(' Hard-delete archived sheets · ' + new Date().toISOString())
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('Deleted ' + deleted.length + ' sheet(s):')
  if (deleted.length === 0) lines.push('  (none — nothing carried the _ARCHIVE_ prefix)')
  deleted.forEach(function(n) { lines.push('  ✓ ' + n) })
  lines.push('')
  lines.push('Remaining sheet count: ' + ss.getSheets().length)
  Logger.log(lines.join('\n'))
  return lines.join('\n')
}

// ─── Month-sheet consolidation ────────────────────────────────────
// Merges January..December into a single '2025 Monthly Data' sheet
// with the month as a column. Rewrites every formula in Monthly
// Summary + Weekly Data that points at the old month sheets.
//
//   planMonthConsolidation()    → DRY RUN: shows what would change,
//                                  modifies nothing. ALWAYS run first.
//   executeMonthConsolidation() → LIVE: creates the new sheet,
//                                  rewrites consumer formulas,
//                                  archives the 12 source sheets
//                                  (rename to _ARCHIVE_<Month>).
//
// Recovery: if anything looks wrong after execution, the 12 source
// sheets are still in the workbook as _ARCHIVE_<Month>. Rename them
// back to revert.
function planMonthConsolidation()    { return _consolidateMonths(true)  }
function executeMonthConsolidation() { return _consolidateMonths(false) }

function _consolidateMonths(dryRun) {
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  var ss = SpreadsheetApp.openById(HACKNEY_SHEET_ID)
  var NEW_SHEET = '2025 Monthly Data'

  // Phase 1: read source month sheets
  var monthData = {}
  MONTHS.forEach(function(mName) {
    var sh = ss.getSheetByName(mName)
    if (!sh) return
    var rows = sh.getLastRow()
    var cols = sh.getLastColumn()
    monthData[mName] = {
      rows: rows, cols: cols,
      values: sh.getRange(1, 1, rows, cols).getValues(),
      formulas: sh.getRange(1, 1, rows, cols).getFormulas(),
    }
  })

  // Phase 2: plan target layout + row map
  // Target: Month | Week | Dates | Income | All Costs | Fixed | Variable | Wages | VAT Diff | Profit
  // Source columns A..I shift to target B..J (Month is the new col A)
  var newRows = [['Month','Week','Dates','Income','All Costs','Fixed Costs','Variable Costs','Wages','VAT Diff','Profit']]
  var rowMap = {} // {month: {srcRow: tgtRow}}

  MONTHS.forEach(function(mName) {
    var d = monthData[mName]
    if (!d) return
    rowMap[mName] = {}
    // Source row 1 = title, 2 = header, 3..(rows-1) = weeks, rows = TOTAL
    for (var srcRow = 3; srcRow < d.rows; srcRow++) {
      var dataRow = [mName]
      for (var c = 0; c < d.cols; c++) {
        dataRow.push(d.formulas[srcRow - 1][c] || d.values[srcRow - 1][c])
      }
      newRows.push(dataRow)
      rowMap[mName][srcRow] = newRows.length // 1-indexed
    }
  })
  var weekRowsEnd = newRows.length

  // Phase 3: Monthly Totals block (replaces the per-sheet TOTAL row)
  newRows.push(['', '', '', '', '', '', '', '', '', ''])
  newRows.push(['Monthly Totals — per-month sums across the weeks above', '', '', '', '', '', '', '', '', ''])
  newRows.push(['Month', '', '', 'Income', 'All Costs', 'Fixed Costs', 'Variable Costs', 'Wages', 'VAT Diff', 'Profit'])
  var totalsStartRow = newRows.length + 1
  var totalsCols = ['D','E','F','G','H','I','J'] // Income..Profit in target
  MONTHS.forEach(function(mName, idx) {
    var d = monthData[mName]
    if (!d) return
    var tgtTotalRow = totalsStartRow + idx
    rowMap[mName][d.rows] = tgtTotalRow
    var row = [mName, '', '']
    totalsCols.forEach(function(col) {
      row.push('=SUMIFS(' + col + '2:' + col + weekRowsEnd + ',A2:A' + weekRowsEnd + ',"' + mName + '")')
    })
    newRows.push(row)
  })

  // Phase 4: rewrite in-sheet formulas that came from source (col +1, row remap)
  function shiftCol(letter) { return letter.length === 1 ? String.fromCharCode(letter.charCodeAt(0) + 1) : letter }
  MONTHS.forEach(function(mName) {
    var d = monthData[mName]; if (!d) return
    for (var srcRow = 3; srcRow < d.rows; srcRow++) {
      var tgtRow = rowMap[mName][srcRow]
      if (!tgtRow) continue
      for (var c = 0; c < d.cols; c++) {
        var f = d.formulas[srcRow - 1][c]
        if (!f) continue
        var newF = f.replace(/([A-Z]+)(\d+)/g, function(m, col, row) {
          var nr = rowMap[mName][parseInt(row)]
          if (!nr) return m
          return shiftCol(col) + nr
        })
        newRows[tgtRow - 1][c + 1] = newF
      }
    }
  })

  // Phase 5: build external rewrite map for consumer formulas
  var externalMap = {} // {Month!CellRef: NewCellRef}
  MONTHS.forEach(function(mName) {
    var d = monthData[mName]; if (!d) return
    for (var srcRow = 3; srcRow <= d.rows; srcRow++) {
      var tgtRow = rowMap[mName][srcRow]
      if (!tgtRow) continue
      for (var c = 0; c < d.cols; c++) {
        var srcCol = String.fromCharCode(65 + c)
        externalMap[mName + '!' + srcCol + srcRow] = shiftCol(srcCol) + tgtRow
      }
    }
  })

  // Phase 6: walk consumers, rewrite formulas (ranges before singletons)
  var rewrites = []
  var consumers = ['Monthly Summary', 'Weekly Data']
  consumers.forEach(function(cName) {
    var sh = ss.getSheetByName(cName); if (!sh) return
    var rows = sh.getLastRow(); var cols = sh.getLastColumn()
    if (rows === 0 || cols === 0) return
    var fmls = sh.getRange(1, 1, rows, cols).getFormulas()
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var f = fmls[r][c]; if (!f) continue
        var hasMonth = false
        for (var i = 0; i < MONTHS.length; i++) {
          if (f.indexOf(MONTHS[i] + '!') !== -1 || f.indexOf("'" + MONTHS[i] + "'!") !== -1) { hasMonth = true; break }
        }
        if (!hasMonth) continue
        var newF = f
        MONTHS.forEach(function(mName) {
          // ranges first
          var rxRQ = new RegExp("'" + mName + "'!([A-Z]+)(\\d+):([A-Z]+)(\\d+)", 'g')
          newF = newF.replace(rxRQ, function(m, c1, r1, c2, r2) {
            var t1 = externalMap[mName + '!' + c1 + r1]; var t2 = externalMap[mName + '!' + c2 + r2]
            return (t1 && t2) ? ("'" + NEW_SHEET + "'!" + t1 + ":" + t2) : m
          })
          var rxR = new RegExp("(^|[^A-Za-z0-9_'])" + mName + "!([A-Z]+)(\\d+):([A-Z]+)(\\d+)", 'g')
          newF = newF.replace(rxR, function(m, pre, c1, r1, c2, r2) {
            var t1 = externalMap[mName + '!' + c1 + r1]; var t2 = externalMap[mName + '!' + c2 + r2]
            return (t1 && t2) ? (pre + "'" + NEW_SHEET + "'!" + t1 + ":" + t2) : m
          })
          // singletons
          var rxSQ = new RegExp("'" + mName + "'!([A-Z]+)(\\d+)", 'g')
          newF = newF.replace(rxSQ, function(m, col, row) {
            var t = externalMap[mName + '!' + col + row]
            return t ? ("'" + NEW_SHEET + "'!" + t) : m
          })
          var rxS = new RegExp("(^|[^A-Za-z0-9_'])" + mName + "!([A-Z]+)(\\d+)", 'g')
          newF = newF.replace(rxS, function(m, pre, col, row) {
            var t = externalMap[mName + '!' + col + row]
            return t ? (pre + "'" + NEW_SHEET + "'!" + t) : m
          })
        })
        // Safety: if any Month! ref still remains after rewriting, flag and DO NOT apply
        var stillHasMonth = false
        for (var i = 0; i < MONTHS.length; i++) {
          if (newF.indexOf(MONTHS[i] + '!') !== -1 || newF.indexOf("'" + MONTHS[i] + "'!") !== -1) { stillHasMonth = true; break }
        }
        if (stillHasMonth) {
          rewrites.push({ sheet: cName, cell: _colLetter(c) + (r+1), row: r+1, col: c+1, old: f, neu: f, error: 'partial — left unchanged. Best attempt: ' + newF })
        } else if (newF !== f) {
          rewrites.push({ sheet: cName, cell: _colLetter(c) + (r+1), row: r+1, col: c+1, old: f, neu: newF })
        }
      }
    }
  })

  // Phase 7: report
  var lines = []
  lines.push('═══════════════════════════════════════════════════════')
  lines.push(' Month consolidation ' + (dryRun ? '(DRY RUN — no changes)' : '(LIVE — applying)'))
  lines.push(' ' + new Date().toISOString())
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('')
  lines.push('New sheet: ' + NEW_SHEET)
  lines.push('  Header + ' + (weekRowsEnd - 1) + ' weekly rows + 12-row Monthly Totals block = ' + newRows.length + ' total rows')
  lines.push('')
  lines.push('Source month sheets to archive (rename to _ARCHIVE_<Month>):')
  Object.keys(monthData).forEach(function(mName) {
    lines.push('  • ' + mName + ' (' + monthData[mName].rows + ' rows)')
  })
  lines.push('')
  var failed = rewrites.filter(function(rw) { return rw.error })
  lines.push('Consumer formula rewrites: ' + rewrites.length + ' total, ' + failed.length + ' flagged for manual review')
  rewrites.slice(0, 30).forEach(function(rw) {
    lines.push('  ' + (rw.error ? '⚠ ' : '✓ ') + rw.sheet + '!' + rw.cell)
    lines.push('    OLD: ' + rw.old)
    if (rw.error) lines.push('    !!  ' + rw.error)
    else          lines.push('    NEW: ' + rw.neu)
  })
  if (rewrites.length > 30) lines.push('  … ' + (rewrites.length - 30) + ' more')

  if (failed.length > 0) {
    lines.push('')
    lines.push('⚠  ' + failed.length + ' formula(s) could not be fully migrated. They will be LEFT UNCHANGED if you run execute — investigate them manually after.')
  }

  if (dryRun) {
    lines.push('')
    lines.push('DRY RUN — nothing modified. If the rewrites above look correct, run executeMonthConsolidation() to apply.')
    Logger.log(lines.join('\n'))
    return lines.join('\n')
  }

  // Phase 8: live
  var existing = ss.getSheetByName(NEW_SHEET)
  if (existing) ss.deleteSheet(existing)
  var newSh = ss.insertSheet(NEW_SHEET)
  newSh.getRange(1, 1, newRows.length, newRows[0].length).setValues(newRows)
  newSh.getRange(1, 1, 1, newRows[0].length).setFontWeight('bold').setBackground('#1E40AF').setFontColor('#FFFFFF')
  newSh.setFrozenRows(1)

  rewrites.forEach(function(rw) {
    if (rw.error) return // safety: skip partial migrations
    var sh = ss.getSheetByName(rw.sheet); if (!sh) return
    sh.getRange(rw.row, rw.col).setFormula(rw.neu)
  })

  var archived = []
  MONTHS.forEach(function(mName) {
    var sh = ss.getSheetByName(mName); if (!sh) return
    sh.setName('_ARCHIVE_' + mName)
    archived.push(mName)
  })

  organiseHackneyWorkbook()

  lines.push('')
  lines.push('✅ Applied:')
  lines.push('  • Created sheet: ' + NEW_SHEET)
  lines.push('  • Rewrote ' + (rewrites.length - failed.length) + ' consumer formulas (' + failed.length + ' skipped — flagged above)')
  lines.push('  • Archived ' + archived.length + ' month sheets (renamed to _ARCHIVE_<Month>)')
  lines.push('')
  lines.push('NEXT: open 2025 Monthly Data, Monthly Summary, Weekly Data — sanity-check the numbers. If anything looks broken, rename the _ARCHIVE_<Month> sheets back to their original names to fully revert.')
  Logger.log(lines.join('\n'))
  return lines.join('\n')
}

// ─── Inspect the 12 month sheets (read-only) ──────────────────────
// Dumps the full content of January..December so we can see whether
// they share a layout, plus every formula in Monthly Summary +
// Weekly Data that references them. Output is the input for planning
// the merge into a single 2025 Monthly Data sheet — without seeing
// the layout we can't rewrite the formulas safely.
function inspectMonthSheets() {
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  var ss = SpreadsheetApp.openById(HACKNEY_SHEET_ID)
  var lines = []
  lines.push('═══════════════════════════════════════════════════════')
  lines.push(' Month-sheet inspection (read-only) · ' + new Date().toISOString())
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('')

  // 1. Dump each month's content (values + formulas)
  MONTHS.forEach(function(mName) {
    var sh = ss.getSheetByName(mName)
    if (!sh) { lines.push('── ' + mName + ' — NOT FOUND ──'); lines.push(''); return }
    var rows = sh.getLastRow()
    var cols = sh.getLastColumn()
    lines.push('── ' + mName + '   (' + rows + ' rows × ' + cols + ' cols) ──')
    if (rows > 0 && cols > 0) {
      var values = sh.getRange(1, 1, rows, cols).getValues()
      var fmls   = sh.getRange(1, 1, rows, cols).getFormulas()
      for (var r = 0; r < rows; r++) {
        var rowStrs = []
        for (var c = 0; c < cols; c++) {
          var v = fmls[r][c] || values[r][c]
          var s = String(v == null ? '' : v)
          if (s.length > 18) s = s.slice(0, 17) + '…'
          while (s.length < 18) s += ' '
          rowStrs.push(s)
        }
        lines.push('  R' + (r+1) + '  ' + rowStrs.join('| '))
      }
    }
    lines.push('')
  })

  // 2. Every formula in the two consumers that points at a month sheet
  lines.push('── Formula consumers (sheets that read from month tabs) ──')
  var consumers = ['Monthly Summary', 'Weekly Data']
  consumers.forEach(function(consumerName) {
    var sh = ss.getSheetByName(consumerName)
    if (!sh) { lines.push(''); lines.push('  ' + consumerName + ': NOT FOUND'); return }
    var rows = sh.getLastRow()
    var cols = sh.getLastColumn()
    if (rows === 0 || cols === 0) return
    var fmls = sh.getRange(1, 1, rows, cols).getFormulas()
    var hits = []
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var f = fmls[r][c]
        if (!f) continue
        var hitsMonth = false
        for (var i = 0; i < MONTHS.length; i++) {
          var m = MONTHS[i]
          if (f.indexOf(m + '!') !== -1 || f.indexOf("'" + m + "'!") !== -1) { hitsMonth = true; break }
        }
        if (hitsMonth) {
          hits.push(_colLetter(c) + (r+1) + '  =' + f)
        }
      }
    }
    lines.push('')
    lines.push('  ' + consumerName + ' — ' + hits.length + ' formula cell(s) point at month sheets:')
    hits.slice(0, 80).forEach(function(h) { lines.push('    ' + h) })
    if (hits.length > 80) lines.push('    … ' + (hits.length - 80) + ' more (truncated)')
  })

  Logger.log(lines.join('\n'))
  return lines.join('\n')
}

// ─── Compaction (round 1) ─────────────────────────────────────────
// Renames the four sheets we agreed to archive — adds the _ARCHIVE_
// prefix so the categoriser picks them up as 🗄 Archive on the next
// organise run, and runs the organiser to apply colours + order in
// one go.
//
// Archived sheets:
//   • Summary               — orphan, superseded by Annual Overview
//   • Error Log             — old system file (NotesHistory replaces it)
//   • Category Aggregates   — orphan, not maintained
//   • Rota Analysis 2025    — orphan, not feeding any other sheet
//
// Re-run safely: if the sheet already has the _ARCHIVE_ prefix it
// is left alone, so calling this twice is a no-op for the second
// call. Never deletes anything — only renames.
function compactHackneyWorkbook() {
  var TARGETS = [
    'Summary',
    'Error Log',
    'Category Aggregates',
    'Rota Analysis 2025',
  ]
  var ss = SpreadsheetApp.openById(HACKNEY_SHEET_ID)
  var renamed = []
  var skipped = []
  TARGETS.forEach(function(name) {
    var sh = ss.getSheetByName(name)
    if (!sh) { skipped.push(name + ' (not found)'); return }
    var newName = '_ARCHIVE_' + name
    if (ss.getSheetByName(newName)) { skipped.push(name + ' (already archived)'); return }
    sh.setName(newName)
    renamed.push(name + ' → ' + newName)
  })

  // Now run the standard organiser — colours and reorder follow
  var organiseLog = organiseHackneyWorkbook()

  var lines = []
  lines.push('═══════════════════════════════════════════════════════')
  lines.push(' Hackney Workbook · Compaction Round 1')
  lines.push(' ' + new Date().toISOString())
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('')
  lines.push('Renamed for archive:')
  if (renamed.length === 0) lines.push('  (none — all targets already archived or missing)')
  renamed.forEach(function(r) { lines.push('  ✓ ' + r) })
  if (skipped.length > 0) {
    lines.push('')
    lines.push('Skipped:')
    skipped.forEach(function(s) { lines.push('  – ' + s) })
  }
  lines.push('')
  lines.push('─── Organiser run that followed ───')
  lines.push(organiseLog)
  Logger.log(lines.join('\n'))
  return lines.join('\n')
}

// ─── Usage audit — scans formula references across the workbook ───
// For each sheet, counts how many other sheets read it (incoming
// refs) and how many it reads from (outgoing refs), then classifies:
//   HUB         — read by others AND reads from others (live compute)
//   SOURCE-only — read by others, doesn't read anything (pure data)
//   OUTPUT-only — reads from others, nothing reads it (dashboard / view)
//   ORPHAN      — no formula links in either direction (suspect)
//   EMPTY       — fewer than 20 non-empty cells total (likely dead)
//
// Use the report to decide what to merge/archive/delete. Read-only —
// never modifies the workbook.
function auditSheetUsage() {
  var ss = SpreadsheetApp.openById(HACKNEY_SHEET_ID)
  var sheets = ss.getSheets()

  // ─── Pass 1: collect basic stats + every formula on every sheet ───
  var info = []
  var allFormulas = {}
  sheets.forEach(function(sh) {
    var name = sh.getName()
    var rows = sh.getLastRow()
    var cols = sh.getLastColumn()
    var nonEmpty = 0
    var formulas = []
    if (rows > 0 && cols > 0) {
      var values = sh.getRange(1, 1, rows, cols).getValues()
      var fmls   = sh.getRange(1, 1, rows, cols).getFormulas()
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          if (values[r][c] !== '' && values[r][c] !== null) nonEmpty++
          if (fmls[r][c]) formulas.push(fmls[r][c])
        }
      }
    }
    allFormulas[name] = formulas
    info.push({
      name: name, rows: rows, cols: cols,
      nonEmpty: nonEmpty, formulaCount: formulas.length,
      incomingRefs: 0, outgoingRefs: 0,
      referencedBy: [], references: [],
      status: '',
    })
  })

  // ─── Pass 2: incoming refs (other sheets pointing at me) ──────────
  info.forEach(function(s) {
    var nameEsc = s.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Quoted form: 'Sheet Name'!  — needed for any name with spaces
    var rxQuoted   = new RegExp("'" + nameEsc.replace(/'/g, "''") + "'!", 'i')
    // Unquoted form: SheetName!   — only valid for names without special chars
    var rxUnquoted = new RegExp("(^|[^A-Za-z0-9_'])" + nameEsc + "!", 'i')
    var refByMap = {}
    Object.keys(allFormulas).forEach(function(otherName) {
      if (otherName === s.name) return
      var fmls = allFormulas[otherName]
      var hits = 0
      for (var i = 0; i < fmls.length; i++) {
        var f = fmls[i]
        if (rxQuoted.test(f) || rxUnquoted.test(f)) hits++
      }
      if (hits > 0) {
        s.incomingRefs += hits
        refByMap[otherName] = hits
      }
    })
    s.referencedBy = Object.keys(refByMap).map(function(k) { return k + '(' + refByMap[k] + ')' })
  })

  // ─── Pass 3: outgoing refs (which sheets I read from) ─────────────
  info.forEach(function(s) {
    var fmls = allFormulas[s.name]
    var refMap = {}
    for (var i = 0; i < fmls.length; i++) {
      var f = fmls[i]
      // Find every 'Quoted Name'! and UnquotedName! pattern in the formula
      var qMatches = f.match(/'([^']+)'!/g) || []
      qMatches.forEach(function(m) {
        var n = m.slice(1, -2)  // strip leading ' and trailing '!
        if (n && n !== s.name) refMap[n] = (refMap[n] || 0) + 1
      })
      var uMatches = f.match(/(?:^|[^A-Za-z0-9_'])([A-Za-z_][A-Za-z0-9_]*)!/g) || []
      uMatches.forEach(function(m) {
        var n = m.replace(/!$/, '').replace(/^[^A-Za-z_]+/, '')
        if (n && n !== s.name) refMap[n] = (refMap[n] || 0) + 1
      })
    }
    Object.keys(refMap).forEach(function(k) {
      s.outgoingRefs += refMap[k]
      s.references.push(k + '(' + refMap[k] + ')')
    })
  })

  // ─── Classify ─────────────────────────────────────────────────────
  info.forEach(function(s) {
    var emptyish = s.nonEmpty < 20
    var isolated = s.incomingRefs === 0 && s.outgoingRefs === 0
    if (emptyish && isolated)              s.status = 'EMPTY+ORPHAN'
    else if (emptyish)                     s.status = 'EMPTY'
    else if (isolated)                     s.status = 'ORPHAN'
    else if (s.incomingRefs === 0 && s.outgoingRefs > 0) s.status = 'OUTPUT-only'
    else if (s.incomingRefs > 0  && s.outgoingRefs === 0) s.status = 'SOURCE-only'
    else                                    s.status = 'HUB'
  })

  // ─── Output ──────────────────────────────────────────────────────
  var lines = []
  lines.push('═══════════════════════════════════════════════════════════════════════════════')
  lines.push(' Hackney Workbook · Sheet Usage Audit  · ' + new Date().toISOString())
  lines.push('═══════════════════════════════════════════════════════════════════════════════')
  lines.push('Workbook: ' + ss.getName() + '   ·   ' + sheets.length + ' sheets scanned')
  lines.push('')
  lines.push(_pad('Sheet name', 38) + _pad('Rows', 6) + _pad('Cols', 5) + _pad('Cells', 7) + _pad('In', 5) + _pad('Out', 5) + _pad('Status', 15) + 'Top links')
  lines.push(new Array(140).join('─'))
  info.forEach(function(s) {
    var note = ''
    if (s.status === 'EMPTY' || s.status === 'EMPTY+ORPHAN') {
      note = '⚠ archive candidate (empty)'
    } else if (s.status === 'ORPHAN') {
      note = '⚠ archive candidate (no formula links)'
    } else if (s.incomingRefs === 0) {
      note = 'reads ' + s.references.slice(0, 3).join(', ') + (s.references.length > 3 ? ' …' : '')
    } else if (s.outgoingRefs === 0) {
      note = 'read by ' + s.referencedBy.slice(0, 3).join(', ') + (s.referencedBy.length > 3 ? ' …' : '')
    } else {
      note = 'in:' + s.referencedBy.slice(0, 2).join(',') + ' | out:' + s.references.slice(0, 2).join(',')
    }
    lines.push(
      _pad(s.name, 38) +
      _pad(String(s.rows), 6) +
      _pad(String(s.cols), 5) +
      _pad(String(s.nonEmpty), 7) +
      _pad(String(s.incomingRefs), 5) +
      _pad(String(s.outgoingRefs), 5) +
      _pad(s.status, 15) +
      note
    )
  })

  // ─── Summary by status ────────────────────────────────────────────
  lines.push('')
  lines.push('─── Summary by status ─────────────────────────────────────')
  var counts = {}
  info.forEach(function(s) { counts[s.status] = (counts[s.status] || 0) + 1 })
  Object.keys(counts).sort().forEach(function(k) {
    lines.push('  ' + _pad(k, 16) + counts[k] + ' sheet(s)')
  })

  // ─── Archive candidates ──────────────────────────────────────────
  var archiveCandidates = info.filter(function(s) {
    return s.status === 'ORPHAN' || s.status === 'EMPTY' || s.status === 'EMPTY+ORPHAN'
  })
  if (archiveCandidates.length > 0) {
    lines.push('')
    lines.push('─── Archive candidates (no formula links / empty) ────────')
    archiveCandidates.forEach(function(s) {
      lines.push('  • ' + _pad(s.name, 36) + s.status + '   ' + s.nonEmpty + ' cells')
    })
  }

  // ─── Largest sheets (cells) ──────────────────────────────────────
  var byCells = info.slice().sort(function(a, b) { return b.nonEmpty - a.nonEmpty })
  lines.push('')
  lines.push('─── Top 10 by populated cell count ───────────────────────')
  byCells.slice(0, 10).forEach(function(s) {
    lines.push('  ' + _pad(s.name, 36) + _pad(String(s.nonEmpty), 8) + 'cells   ' + s.status)
  })

  Logger.log(lines.join('\n'))
  return lines.join('\n')
}
