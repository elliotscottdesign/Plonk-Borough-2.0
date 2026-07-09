// ─── AI rota engine ──────────────────────────────────────────────────────────
// Deterministic auto-scheduler from the venue's rules. Produces a CONCEPT week the
// founder reviews, amends, then applies. Times are minutes from the date's midnight
// (next-day > 1440), matching the roster grid / staff_shifts.
//
// Rules (founder, July 2026):
//  • A manager or assistant manager must be on from 1h before open to 1h after close.
//  • One member opens 1h early; the rest work to close (the manager block covers both).
//  • Headcount (total at venue, incl. kitchen): Mon–Thu 2 · Fri 2 then 4 from 6pm ·
//    Sat 3 then 4 from 6pm · Sun 2.
//  • At least one kitchen-capable person on each day. Elliot can be manager + kitchen.
//  • UK London state-school holidays → open 12pm–12am every day.

// Public opening hours (JS getUTCDay: 0=Sun..6=Sat), minutes from midnight.
export const OPENING_HOURS = {
  1: [900, 1380],   // Mon 3pm–11pm
  2: [900, 1380],   // Tue 3pm–11pm
  3: [900, 1380],   // Wed 3pm–11pm
  4: [960, 1380],   // Thu 4pm–11pm
  5: [720, 1500],   // Fri 12pm–1am
  6: [720, 1440],   // Sat 12pm–12am
  0: [720, 1380],   // Sun 12pm–11pm
}
export const HOLIDAY_HOURS = [720, 1440]   // school holidays: 12pm–12am every day
const EVE = 1080   // 6pm — the evening staffing bump

// UK London state-school holidays (approx — easy to edit). [startISO, endISO, name] inclusive.
export const SCHOOL_HOLIDAYS = [
  ['2026-07-22', '2026-09-02', 'Summer holidays'],
  ['2026-10-26', '2026-10-30', 'October half-term'],
  ['2026-12-21', '2027-01-02', 'Christmas holidays'],
  ['2027-02-15', '2027-02-19', 'February half-term'],
  ['2027-03-29', '2027-04-11', 'Easter holidays'],
  ['2027-05-31', '2027-06-04', 'May half-term'],
  ['2027-07-22', '2027-09-01', 'Summer holidays'],
]
export const holidayName = (dateStr) => { for (const [a, b, n] of SCHOOL_HOLIDAYS) if (dateStr >= a && dateStr <= b) return n; return null }

const wd = (dateStr) => new Date(dateStr + 'T00:00:00Z').getUTCDay()
export const addDaysISO = (d, n) => { const dt = new Date(d + 'T00:00:00Z'); dt.setUTCDate(dt.getUTCDate() + n); return dt.toISOString().slice(0, 10) }

// Opening hours for a date (school-holiday override → 12pm–12am).
export function hoursFor(dateStr) {
  if (holidayName(dateStr)) return { open: HOLIDAY_HOURS[0], close: HOLIDAY_HOURS[1] }
  const [o, c] = OPENING_HOURS[wd(dateStr)] || [720, 1380]
  return { open: o, close: c }
}

// Headcount tiers (total bodies incl. manager & kitchen) as [from, to, need].
function staffingTiers(dateStr, open, close) {
  const w = wd(dateStr)
  if (w === 5) return [[open, EVE, 2], [EVE, close, 4]]   // Fri: 2 then 4 from 6pm
  if (w === 6) return [[open, EVE, 3], [EVE, close, 4]]   // Sat: 3 then 4 from 6pm
  return [[open, close, 2]]                               // Mon–Thu + Sun: 2 all day
}

// The shift SLOTS a day needs, before assigning people. The manager slot spans
// 1h before open → 1h after close (opener + closer + coverage). One slot per body.
export function daySlots(dateStr) {
  const { open, close } = hoursFor(dateStr)
  const tiers = staffingTiers(dateStr, open, close)
  const baseN = tiers[0][2]
  const eve = tiers.find(t => t[2] > baseN)
  const slots = [{ start: open - 60, end: close + 60, role: 'manager', label: 'Manager' }]
  for (let i = 0; i < baseN - 1; i++) slots.push({ start: open, end: close, role: 'any', label: 'Floor' })
  if (eve) for (let i = 0; i < eve[2] - baseN; i++) slots.push({ start: EVE, end: close, role: 'any', label: 'Evening' })
  return { slots, open, close, holiday: holidayName(dateStr) }
}

const isManager = (s) => s.role === 'Manager' || s.role === 'Asst. Manager'
const isKitchen = (s) => (s.abilities || []).includes('kitchen')

// availByStaff: { staffId: Set('YYYY-MM-DD') } of days each member marked available.
function buildAvail(availabilityRows) {
  const map = {}
  for (const r of availabilityRows || []) {
    const set = (map[r.staff_id] ||= new Set())
    for (const d of Object.keys(r.data || {})) set.add(d)
  }
  return map
}
// A member "has availability" if they've marked ANY day at all — then we respect it
// strictly. If they've never set availability, they're treated as open (available).
function availState(availSet, everSet, date) {
  if (!everSet) return 1              // never set availability → assume available (rank 1)
  return availSet.has(date) ? 2 : 0  // set + marked this day = 2 (best); set but not this day = 0
}

// Generate a concept week. Returns { days: [{ date, hours, holiday, slots:[{...}] }], warnings }
// Each slot: { start, end, label, role, staffId|null, name|null, kitchen, warn }
export function generateWeek(weekStart, staff, availabilityRows) {
  const active = (staff || []).filter(s => s.active !== false)
  const avail = buildAvail(availabilityRows)
  const everSet = {}; for (const s of active) everSet[s.id] = !!(avail[s.id] && avail[s.id].size)
  const tally = {}   // staffId → minutes assigned this week (fairness)
  const dur = (a, b) => Math.max(0, b - a)
  const targetOf = (s) => { const t = Number(s.target_hours); return Number.isFinite(t) && t > 0 ? t * 60 : null }

  const days = []
  const warnings = []
  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(weekStart, i)
    const { slots, open, close, holiday } = daySlots(date)
    const usedToday = new Set()
    let kitchenCovered = false
    const out = []
    for (const slot of slots) {
      let pool = active.filter(s => !usedToday.has(s.id))
      if (slot.role === 'manager') pool = pool.filter(isManager)
      // Rank: (1) availability, (2) cover kitchen if not yet covered, (3) stay under target,
      // (4) fewest hours so far (fair spread), (5) name for stability.
      // Only steer BODY slots toward kitchen cover — never the manager slot, or the
      // kitchen-manager (Elliot) would be picked to manage every single day.
      const needKitchen = !kitchenCovered && slot.role !== 'manager'
      // Availability as a hard-ish gate (binary): available OR never-set beat someone
      // who set availability but NOT this day. Binary (not the finer rank) so managers
      // still rotate by hours instead of one person who marked every day winning always.
      const avOk = (s) => (availState(avail[s.id] || new Set(), everSet[s.id], date) >= 1 ? 1 : 0)
      pool.sort((a, b) => {
        // Kitchen cover is a hard service requirement — for the reserved kitchen slot it
        // outranks even availability (better an unavailable cook than no kitchen; flagged below).
        if (needKitchen) { const k = (isKitchen(b) ? 1 : 0) - (isKitchen(a) ? 1 : 0); if (k) return k }
        const ao = avOk(a), bo = avOk(b); if (ao !== bo) return bo - ao   // marked-unavailable sinks
        const ta = targetOf(a), tb = targetOf(b)
        const oa = ta != null && (tally[a.id] || 0) >= ta ? 1 : 0
        const ob = tb != null && (tally[b.id] || 0) >= tb ? 1 : 0
        if (oa !== ob) return oa - ob   // someone already at target sinks
        const hd = (tally[a.id] || 0) - (tally[b.id] || 0)
        if (hd) return hd               // fewest hours first — spreads & rotates managers
        return (a.name || '').localeCompare(b.name || '')
      })
      const pick = pool[0]
      if (!pick) {
        out.push({ ...slot, staffId: null, name: null, kitchen: false, warn: slot.role === 'manager' ? 'No manager free' : 'No one free' })
        warnings.push(`${date}: ${slot.role === 'manager' ? 'no manager available' : 'short-staffed'} for ${slot.label}`)
        continue
      }
      const unavailable = availState(avail[pick.id] || new Set(), everSet[pick.id], date) === 0
      usedToday.add(pick.id)
      tally[pick.id] = (tally[pick.id] || 0) + dur(slot.start, slot.end)
      if (isKitchen(pick)) kitchenCovered = true
      out.push({ ...slot, staffId: pick.id, name: pick.name, kitchen: isKitchen(pick), warn: unavailable ? 'Not marked available' : '' })
      if (unavailable) warnings.push(`${date}: ${pick.name} isn't marked available`)
    }
    if (!kitchenCovered && out.some(o => o.staffId)) warnings.push(`${date}: no kitchen-trained member on`)
    days.push({ date, open, close, holiday, slots: out })
  }
  return { days, warnings }
}
