// ─── AI rota engine ──────────────────────────────────────────────────────────
// Deterministic auto-scheduler from the venue's rules. Produces a CONCEPT week the
// founder reviews, amends, then applies. Times are minutes from the date's midnight
// (next-day > 1440), matching the roster grid / staff_shifts.
//
// The rules are DATA now (DEFAULT_RULES below), so the founder edits them in the
// AI Rota tab ("Rota rules") — no code change. generateWeek/hoursFor/daySlots/
// holidayName all take an optional `rules` object; omit it and the venue defaults
// (identical to the previous hard-coded behaviour) are used.
//
// Rules captured:
//  • Per weekday: opening hours + how many people (base), plus an optional evening
//    bump (extra bodies from a given time).
//  • A manager/assistant manager on from `managerMargin` before open to after close.
//  • At least one kitchen-capable person each day (requireKitchen).
//  • School / bank holidays → their own hours every day.

// Weekday index = JS getUTCDay: 0=Sun … 6=Sat. Minutes from midnight (next-day > 1440).
export const DEFAULT_RULES = {
  days: {
    1: { open: 900, close: 1380, base: 2, eveAt: null, eveAdd: 0 },   // Mon 3pm–11pm · 2
    2: { open: 900, close: 1380, base: 2, eveAt: null, eveAdd: 0 },   // Tue 3pm–11pm · 2
    3: { open: 900, close: 1380, base: 2, eveAt: null, eveAdd: 0 },   // Wed 3pm–11pm · 2
    4: { open: 960, close: 1380, base: 2, eveAt: null, eveAdd: 0 },   // Thu 4pm–11pm · 2
    5: { open: 720, close: 1500, base: 2, eveAt: 1080, eveAdd: 2 },   // Fri 12pm–1am · 2 → 4 from 6pm
    6: { open: 720, close: 1440, base: 3, eveAt: 1080, eveAdd: 1 },   // Sat 12pm–12am · 3 → 4 from 6pm
    0: { open: 720, close: 1380, base: 2, eveAt: null, eveAdd: 0 },   // Sun 12pm–11pm · 2
  },
  holiday: { open: 720, close: 1440 },   // school/bank holidays: 12pm–12am
  // UK London state-school holidays (approx — easy to edit). [startISO, endISO, name] inclusive.
  holidayDates: [
    ['2026-07-22', '2026-09-02', 'Summer holidays'],
    ['2026-10-26', '2026-10-30', 'October half-term'],
    ['2026-12-21', '2027-01-02', 'Christmas holidays'],
    ['2027-02-15', '2027-02-19', 'February half-term'],
    ['2027-03-29', '2027-04-11', 'Easter holidays'],
    ['2027-05-31', '2027-06-04', 'May half-term'],
    ['2027-07-22', '2027-09-01', 'Summer holidays'],
  ],
  managerMargin: 60,       // manager on from open-margin to close+margin
  requireManager: true,    // reserve a manager/asst-manager slot
  requireKitchen: true,    // steer one body toward kitchen cover + warn if none
}

// Legacy exports (kept so anything importing them still resolves) — derived from defaults.
export const OPENING_HOURS = Object.fromEntries(Object.entries(DEFAULT_RULES.days).map(([k, d]) => [k, [d.open, d.close]]))
export const HOLIDAY_HOURS = [DEFAULT_RULES.holiday.open, DEFAULT_RULES.holiday.close]
export const SCHOOL_HOLIDAYS = DEFAULT_RULES.holidayDates

// Merge a (possibly partial) saved rules object over the defaults, defensively — a
// missing field can never crash the generator.
export function withDefaults(rules) {
  const src = (rules && typeof rules === 'object' && !Array.isArray(rules)) ? rules : {}
  const days = {}
  for (let w = 0; w <= 6; w++) days[w] = { ...DEFAULT_RULES.days[w], ...(src.days?.[w] || {}) }
  return {
    days,
    holiday: { ...DEFAULT_RULES.holiday, ...(src.holiday || {}) },
    holidayDates: Array.isArray(src.holidayDates) ? src.holidayDates.map(r => [...r]) : DEFAULT_RULES.holidayDates.map(r => [...r]),
    managerMargin: Number.isFinite(+src.managerMargin) ? +src.managerMargin : DEFAULT_RULES.managerMargin,
    requireManager: src.requireManager !== false,
    requireKitchen: src.requireKitchen !== false,
  }
}

const wd = (dateStr) => new Date(dateStr + 'T00:00:00Z').getUTCDay()
export const addDaysISO = (d, n) => { const dt = new Date(d + 'T00:00:00Z'); dt.setUTCDate(dt.getUTCDate() + n); return dt.toISOString().slice(0, 10) }

// The holiday covering a date, if any (name), else null.
export const holidayName = (dateStr, rules) => {
  const R = withDefaults(rules)
  for (const [a, b, n] of (R.holidayDates || [])) if (dateStr >= a && dateStr <= b) return n
  return null
}

// Opening hours for a date (holiday override → the holiday's hours).
export function hoursFor(dateStr, rules) {
  const R = withDefaults(rules)
  if (holidayName(dateStr, R)) return { open: R.holiday.open, close: R.holiday.close }
  const d = R.days[wd(dateStr)] || R.days[0]
  return { open: d.open, close: d.close }
}

// The shift SLOTS a day needs, before assigning people. The manager slot spans
// managerMargin before open → after close (opener + closer + coverage). One slot per body.
export function daySlots(dateStr, rules) {
  const R = withDefaults(rules)
  const { open, close } = hoursFor(dateStr, R)   // holiday-aware hours
  const d = R.days[wd(dateStr)] || {}
  // Headcount + evening bump come from the weekday; holidays change only the HOURS.
  const base = Math.max(0, d.base ?? 2)
  const eveAt = d.eveAt ?? null
  const eveAdd = Math.max(0, d.eveAdd ?? 0)
  const margin = R.managerMargin ?? 60
  const slots = []
  if (R.requireManager) slots.push({ start: open - margin, end: close + margin, role: 'manager', label: 'Manager' })
  const floorN = Math.max(0, base - (R.requireManager ? 1 : 0))
  for (let i = 0; i < floorN; i++) slots.push({ start: open, end: close, role: 'any', label: 'Floor' })
  // Evening bump: extra bodies from eveAt to close (only if eveAt sits inside opening hours).
  if (eveAt != null && eveAdd > 0 && eveAt > open && eveAt < close) for (let i = 0; i < eveAdd; i++) slots.push({ start: eveAt, end: close, role: 'any', label: 'Evening' })
  return { slots, open, close, holiday: holidayName(dateStr, R) }
}

const isManager = (s) => s.role === 'Manager' || s.role === 'Asst. Manager'
const isKitchen = (s) => (s.abilities || []).includes('kitchen') || s.role === 'Kitchen / Barback'

// unavailByStaff: { staffId: Set('YYYY-MM-DD') } of days each member marked OFF.
// Everyone's available by default; only an explicit `{ unavailable: true }` counts.
function buildUnavail(availabilityRows) {
  const map = {}
  for (const r of availabilityRows || []) {
    const set = (map[r.staff_id] ||= new Set())
    for (const [d, v] of Object.entries(r.data || {})) if (v && v.unavailable === true) set.add(d)
  }
  return map
}
// Available by default; a day the member explicitly marked off ranks lowest so the
// builder avoids them there (but can still fall back to them if no one else is free).
function availState(unavailSet, date) {
  return unavailSet.has(date) ? 0 : 2   // marked off = 0 (avoid); otherwise available = 2
}

// Generate a concept week. Returns { days: [{ date, hours, holiday, slots:[{...}] }], warnings }
// Each slot: { start, end, label, role, staffId|null, name|null, kitchen, warn }
export function generateWeek(weekStart, staff, availabilityRows, rules) {
  const R = withDefaults(rules)
  const active = (staff || []).filter(s => s.active !== false)
  const unavail = buildUnavail(availabilityRows)
  const tally = {}   // staffId → minutes assigned this week (fairness)
  const dur = (a, b) => Math.max(0, b - a)
  const targetOf = (s) => { const t = Number(s.target_hours); return Number.isFinite(t) && t > 0 ? t * 60 : null }

  const days = []
  const warnings = []
  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(weekStart, i)
    const { slots, open, close, holiday } = daySlots(date, R)
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
      const needKitchen = R.requireKitchen && !kitchenCovered && slot.role !== 'manager'
      const avOk = (s) => (availState(unavail[s.id] || new Set(), date) >= 1 ? 1 : 0)
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
      const unavailable = availState(unavail[pick.id] || new Set(), date) === 0
      usedToday.add(pick.id)
      tally[pick.id] = (tally[pick.id] || 0) + dur(slot.start, slot.end)
      if (isKitchen(pick)) kitchenCovered = true
      out.push({ ...slot, staffId: pick.id, name: pick.name, kitchen: isKitchen(pick), warn: unavailable ? 'Marked unavailable' : '' })
      if (unavailable) warnings.push(`${date}: ${pick.name} marked themselves off`)
    }
    if (R.requireKitchen && !kitchenCovered && out.some(o => o.staffId)) warnings.push(`${date}: no kitchen-trained member on`)
    days.push({ date, open, close, holiday, slots: out })
  }
  return { days, warnings }
}
