// No Dice — "Help us open" portal config (categories, time-blocks, dates).
// Shared by the sign-up form AND the jobs board so the two never drift.

// The deadline to have the bar open by. Every day from today up to and
// including this date is offered as a help day. Bump this if it moves.
export const DEADLINE = '2026-06-19'

// ─── Skill categories ────────────────────────────────────────────────────
// What a friend can tick "I'm up for…". The same `key`s tag every job on the
// board, so picking "carpentry" shows a friend exactly which jobs they'd do.
export const CATEGORIES = [
  { key: 'bartending', icon: '🍸', label: 'Bartending',            blurb: 'Pulling pints & making drinks once we open' },
  { key: 'serving',    icon: '🧑‍🍳', label: 'Serving / front of house', blurb: 'Greeting, running drinks, looking after guests' },
  { key: 'cleaning',   icon: '🧽', label: 'Cleaning',              blurb: 'Deep cleans, glasswash, trailer, mopping' },
  { key: 'tidying',    icon: '🧹', label: 'Venue tidying',         blurb: 'Clearing, sorting & resetting spaces' },
  { key: 'carpentry',  icon: '🪚', label: 'Carpentry & joinery',   blurb: 'Frames, trim, benches, timber work' },
  { key: 'handyman',   icon: '🔧', label: 'Handyman / general',    blurb: 'Hanging, fixing, bolting, odd jobs' },
  { key: 'painting',   icon: '🎨', label: 'Painting & finishing',  blurb: 'Walls, varnish, oiling, rust treatment' },
  { key: 'electrics',  icon: '💡', label: 'Electrics & wiring',    blurb: 'Fans, lighting, sockets (with our electrician)' },
  { key: 'plumbing',   icon: '🚿', label: 'Plumbing',              blurb: 'Taps, leaks, irrigation, cellar cooling' },
  { key: 'tech',       icon: '🎛️', label: 'Tech, AV & sound',      blurb: 'DJ cables, TVs/projector, sound system' },
  { key: 'gardening',  icon: '🌿', label: 'Gardening & outdoors',  blurb: 'Plants, pruning, park games, garden refresh' },
  { key: 'admin',      icon: '📋', label: 'Admin & online help',   blurb: 'Calls, orders, research, eBay listings' },
  { key: 'marketing',  icon: '📣', label: 'Marketing',             blurb: 'Street, park & social — spreading the word' },
  { key: 'errands',    icon: '🚐', label: 'Errands & collections', blurb: 'Driving, pickups & runs to Borough' },
  { key: 'design',     icon: '✒️', label: 'Design & signage',      blurb: 'Signs, menu boards, posters, CNC artwork' },
]

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.key, c.label]))
export const CATEGORY_ICON  = Object.fromEntries(CATEGORIES.map(c => [c.key, c.icon]))

// ─── Time blocks ──────────────────────────────────────────────────────────
// We're at the venue ~9am–midnight every day, so people can come before work,
// on a break, or after work. Friends pick whichever windows suit them.
export const TIME_BLOCKS = [
  { key: 'morning',   label: 'Morning',   hint: '9am – 12pm' },
  { key: 'afternoon', label: 'Afternoon', hint: '12 – 5pm' },
  { key: 'evening',   label: 'Evening',   hint: '5 – 8pm' },
  { key: 'late',      label: 'Late',      hint: '8pm – midnight' },
  { key: 'anytime',   label: 'Flexible',  hint: 'whenever helps most' },
]
export const TIME_BLOCK_LABEL = Object.fromEntries(TIME_BLOCKS.map(b => [b.key, b.label]))

// ─── Shift times (per-date start/finish picker) ─────────────────────────────
// We're at the venue ~9am–midnight. A helper picks the exact hours they can do
// on each date; that shift is then filled with ~30-min jobs.
export const HELP_START_MIN = 9 * 60      // 9:00am
export const HELP_END_MIN = 24 * 60       // midnight
const pad2 = (n) => String(n).padStart(2, '0')
export const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0) }
export const toHHMM = (min) => `${pad2(Math.floor(min / 60) % 24)}:${pad2(min % 60)}`
export function fmtTime(min) {
  if (min >= HELP_END_MIN) return 'midnight'
  const h = Math.floor(min / 60), m = min % 60
  const h12 = ((h + 11) % 12) + 1
  return `${h12}${m ? ':' + pad2(m) : ''}${h < 12 ? 'am' : 'pm'}`
}
// Selectable times every 30 min between two bounds (inclusive).
export const timeOptions = (fromMin = HELP_START_MIN, toMinV = HELP_END_MIN) => {
  const out = []
  for (let m = fromMin; m <= toMinV; m += 30) out.push({ min: m, value: toHHMM(m), label: fmtTime(m) })
  return out
}
export const DEFAULT_SHIFT = { start: '17:00', end: '20:00' }   // after-work default
export const shiftLabel = (s) => s ? `${fmtTime(toMin(s.start))}–${fmtTime(toMin(s.end))}` : ''

// ─── Auto-assignment sizing ─────────────────────────────────────────────────
// Each task is ~30 min. A shift of N minutes is worth N/30 jobs. Capped so the
// pool spreads across more people. SAME numbers live in the help-out edge
// function — keep them in sync.
export const TASK_MIN = 30
export const MAX_TASKS = 20
export const shiftSlots = (s) => Math.max(0, Math.round((toMin(s.end) - toMin(s.start)) / TASK_MIN))
export function slotsForShifts(shifts) {
  const sum = (shifts || []).reduce((n, s) => n + shiftSlots(s), 0)
  return Math.max(1, Math.min(MAX_TASKS, sum))
}

// ─── Concurrency cap — no more than this many helpers at once ────────────────
// Default value; the admin can change the global default or bump a busy day to
// 3. SAME default lives in the help-out function.
export const MAX_CONCURRENT = 2
// Resolve the cap for a date from a config (per-day override else default).
export const capFor = (date, defaultCap = MAX_CONCURRENT, dayCaps = {}) => (dayCaps || {})[date] ?? defaultCap
// All helpers (by hid) covering each 30-min slot, for ONE date's shifts.
// shiftsOnDate = [{ start:'HH:MM', end:'HH:MM', hid }]
function slotPeople(shiftsOnDate) {
  const m = {}
  for (const s of shiftsOnDate || []) for (let t = toMin(s.start); t < toMin(s.end); t += TASK_MIN) (m[t] ||= new Set()).add(s.hid)
  return m
}
// How many distinct people are booked at `minute` on that date.
export function countAt(shiftsOnDate, minute) {
  const set = new Set()
  for (const s of shiftsOnDate || []) if (toMin(s.start) <= minute && minute < toMin(s.end)) set.add(s.hid)
  return set.size
}
export function maxConcurrency(shiftsOnDate) {
  const m = slotPeople(shiftsOnDate)
  let mx = 0
  for (const k in m) mx = Math.max(mx, m[k].size)
  return mx
}
// Would a new [start,end) on this date push any slot to/over the cap given
// `othersOnDate` (everyone else already booked that date)?
export function rangeBlocked(othersOnDate, start, end, cap = MAX_CONCURRENT) {
  for (let t = toMin(start); t < toMin(end); t += TASK_MIN) if (countAt(othersOnDate, t) >= cap) return true
  return false
}

// Priority bands used on the admin jobs board.
export const PRIORITY = {
  p1: { label: 'Before we open', tone: '#DA1B33' },
  p2: { label: 'Important',      tone: '#FCD34D' },
  p3: { label: 'When we can',    tone: '#34D399' },
}

// ─── Date helpers ──────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Every day from today (local) up to and including DEADLINE. If it's already
// past the deadline we still show the final day so the page never goes empty.
export function helpDays() {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const end = new Date(DEADLINE + 'T00:00:00')
  let start = today > end ? end : today
  const out = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) out.push(iso(new Date(d)))
  return out
}

export const dayLabel = (isoStr) =>
  new Date(isoStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
export const dayWeekday = (isoStr) =>
  new Date(isoStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })
export const dayNum = (isoStr) =>
  new Date(isoStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric' })
