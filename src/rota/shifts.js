// No Dice bar-team shift patterns (founder's spec, July 2026).
// Times are MINUTES FROM THE SHIFT DATE'S MIDNIGHT, so next-day ends are exact
// and timezone-proof: 14:00=840, 00:00(midnight)=1440, 01:00 next day=1500.
//
//   Mon–Thu : one open-to-close shift, 2pm–midnight (14:00–00:00)      — not split
//   Fri, Sat: 11am–1am, split into Open (11:00–18:00) + Close (18:00–01:00)
//   Sun     : 11am–midnight, split into Open (11:00–17:30) + Close (17:30–00:00)
//   Minimum any shift (or split half) = 6 hours.
// Manager / supervisor patterns are deliberately left out for now (bar team only)
// — add role-tagged entries here later without touching the release/claim logic.

export const MIN_SHIFT_MIN = 360   // 6 hours

// Keyed by weekday (JS getUTCDay: 0=Sun … 6=Sat). Each entry is that day's shifts.
export const SHIFT_PATTERNS = {
  1: [{ key: 'full', label: 'Open–Close', start: 840, end: 1440, role: 'bar' }],  // Mon 14:00–00:00
  2: [{ key: 'full', label: 'Open–Close', start: 840, end: 1440, role: 'bar' }],  // Tue
  3: [{ key: 'full', label: 'Open–Close', start: 840, end: 1440, role: 'bar' }],  // Wed
  4: [{ key: 'full', label: 'Open–Close', start: 840, end: 1440, role: 'bar' }],  // Thu
  5: [                                                                            // Fri 11:00–01:00
    { key: 'open', label: 'Open', start: 660, end: 1080, role: 'bar' },           //   11:00–18:00 (7h)
    { key: 'close', label: 'Close', start: 1080, end: 1500, role: 'bar' },        //   18:00–01:00 (7h)
  ],
  6: [                                                                            // Sat 11:00–01:00
    { key: 'open', label: 'Open', start: 660, end: 1080, role: 'bar' },
    { key: 'close', label: 'Close', start: 1080, end: 1500, role: 'bar' },
  ],
  0: [                                                                            // Sun 11:00–00:00
    { key: 'open', label: 'Open', start: 660, end: 1050, role: 'bar' },           //   11:00–17:30 (6.5h)
    { key: 'close', label: 'Close', start: 1050, end: 1440, role: 'bar' },        //   17:30–00:00 (6.5h)
  ],
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// UTC weekday for a 'YYYY-MM-DD' string (matches the rest of the codebase, avoids TZ drift).
export const wdOf = (dateStr) => new Date(dateStr + 'T00:00:00Z').getUTCDay()
export const dayName = (dateStr) => DAY_NAMES[wdOf(dateStr)]

// The shift defs for a given date (bar team). Each: {key,label,start,end,role,day}.
export function shiftsForDate(dateStr) {
  const wd = wdOf(dateStr)
  return (SHIFT_PATTERNS[wd] || []).map(s => ({ ...s, day: DAY_NAMES[wd] }))
}

// '2pm', '6pm', '12am' (midnight), '1am' (next day). Handles minutes >1440.
export function fmtMin(m) {
  const t = ((m % 1440) + 1440) % 1440
  let h = Math.floor(t / 60); const mm = t % 60
  const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12
  return `${h}${mm ? ':' + String(mm).padStart(2, '0') : ''}${ap}`
}
// Accept both pattern objects (.start/.end) and DB shift rows (.start_min/.end_min).
const _s = (s) => s.start ?? s.start_min
const _e = (s) => s.end ?? s.end_min
export const shiftTimeLabel = (s) => `${fmtMin(_s(s))}–${fmtMin(_e(s))}`
export const shiftHours = (s) => Math.round(((_e(s) - _s(s)) / 60) * 10) / 10

// 'HH:MM' → minutes; and minutes-from-open for a same-clock time on a shift that
// may cross midnight (used later when comparing availability windows to a shift).
export const hhmmToMin = (t) => { const [h, m] = String(t || '').split(':').map(Number); return (h || 0) * 60 + (m || 0) }
// minutes → 'HH:MM' clock time (wraps next-day: 1440→'00:00', 1500→'01:00').
export const minToHHMM = (m) => { const t = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}` }
