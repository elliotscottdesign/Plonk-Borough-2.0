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
//  • Kitchen: a per-day 🍳 shift (days[w].kitchen + kitchenStart/End) — nothing global.
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
  requireKitchen: true,    // RETIRED (ignored) — kitchen is per-day via days[w].kitchen; kept so old saved rules still parse
  // ── Founder's manual rules (editable in the AI Rota tab, no code change) ──────
  houseRules: [],          // free-text reminders shown on every generated week
  strength: {},            // staffId → 1..5 priority/strength (default 3); higher = picked first
  stagger: false,          // one opener + one closer instead of two full floor shifts
  staggerGap: 90,          // minutes the opener leaves early / the closer starts late
  earlyCutMin: 30,         // on a "quiet" day, send the floor home this many min early
  afterCloseMin: 30,       // floor staff stay this many min after close (wind-down with the manager); per-day override via days[w].afterClose
  minShiftMin: 360,        // no floor/evening shift shorter than this (founder: 6h); manager + kitchen are exact by design
  // (per-weekday `quiet: true` lives inside days[w], added via withDefaults below)
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
  for (let w = 0; w <= 6; w++) days[w] = { quiet: false, ...DEFAULT_RULES.days[w], ...(src.days?.[w] || {}) }
  return {
    days,
    holiday: { ...DEFAULT_RULES.holiday, ...(src.holiday || {}) },
    holidayDates: Array.isArray(src.holidayDates) ? src.holidayDates.map(r => [...r]) : DEFAULT_RULES.holidayDates.map(r => [...r]),
    managerMargin: Number.isFinite(+src.managerMargin) ? +src.managerMargin : DEFAULT_RULES.managerMargin,
    requireManager: src.requireManager !== false,
    requireKitchen: src.requireKitchen !== false,
    houseRules: Array.isArray(src.houseRules) ? src.houseRules.filter(x => typeof x === 'string') : [],
    strength: (src.strength && typeof src.strength === 'object' && !Array.isArray(src.strength)) ? { ...src.strength } : {},
    stagger: src.stagger === true,
    staggerGap: Number.isFinite(+src.staggerGap) ? Math.max(0, +src.staggerGap) : DEFAULT_RULES.staggerGap,
    earlyCutMin: Number.isFinite(+src.earlyCutMin) ? Math.max(0, +src.earlyCutMin) : DEFAULT_RULES.earlyCutMin,
    afterCloseMin: Number.isFinite(+src.afterCloseMin) ? Math.max(0, +src.afterCloseMin) : DEFAULT_RULES.afterCloseMin,
    minShiftMin: Number.isFinite(+src.minShiftMin) ? Math.max(60, +src.minShiftMin) : DEFAULT_RULES.minShiftMin,
    // AI-compiled directives from the founder's typed house rules (see applyCompiled)
    // + the per-rule "how I read it" notes. Passed through untouched so a manual-rules
    // save never wipes what the AI compiled.
    compiled: (src.compiled && typeof src.compiled === 'object' && !Array.isArray(src.compiled)) ? src.compiled : null,
    compiledNotes: Array.isArray(src.compiledNotes) ? src.compiledNotes : [],
  }
}

// ── AI-compiled directives ────────────────────────────────────────────────────
// The founder types house rules in plain English; the rota edge function has
// Claude compile them into this structured object (rules.compiled). Here we layer
// it over the manual settings: manual UI values are the base, compiled directives
// win where they speak (they encode the founder's latest typed intent). Every
// field is validated defensively — a bad compile can never crash the engine.
const asObj = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}
export function applyCompiled(R) {
  const c = R.compiled
  const base = { ...R, neverTogether: [], preferDays: {}, avoidDays: {}, maxShiftsWeek: {}, dateRules: {}, minRestHours: null }
  if (!c) return base
  const days = { ...R.days }
  const cDays = asObj(c.days)
  for (let w = 0; w <= 6; w++) {
    const manual = days[w] || {}
    if (cDays[w] && typeof cDays[w] === 'object') days[w] = { ...manual, ...cDays[w] }
    // The Kitchen COLUMN in the rules table is the most explicit statement — when
    // the founder has set it (kitchen true/false), it beats any typed kitchen rule.
    if (typeof manual.kitchen === 'boolean') {
      days[w] = { ...days[w], kitchen: manual.kitchen }
      if (manual.kitchen) { days[w].kitchenStart = manual.kitchenStart ?? days[w].kitchenStart ?? null; days[w].kitchenEnd = manual.kitchenEnd ?? days[w].kitchenEnd ?? null }
      else { delete days[w].kitchenStart; delete days[w].kitchenEnd }
    }
    // Same for the per-day "stay after close" column — set in the table, it wins.
    if (Number.isFinite(+manual.afterClose) && manual.afterClose !== null && manual.afterClose !== '') days[w] = { ...days[w], afterClose: +manual.afterClose }
  }
  const num = (v, fb) => Number.isFinite(+v) ? Math.max(0, +v) : fb
  return {
    ...base,
    days,
    stagger: typeof c.stagger === 'boolean' ? c.stagger : R.stagger,
    staggerGap: c.staggerGap != null ? num(c.staggerGap, R.staggerGap) : R.staggerGap,
    earlyCutMin: c.earlyCutMin != null ? num(c.earlyCutMin, R.earlyCutMin) : R.earlyCutMin,
    afterCloseMin: c.afterCloseMin != null ? num(c.afterCloseMin, R.afterCloseMin) : R.afterCloseMin,
    minShiftMin: c.minShiftHours != null && Number.isFinite(+c.minShiftHours) && +c.minShiftHours > 0 ? Math.max(60, +c.minShiftHours * 60) : R.minShiftMin,
    managerMargin: c.managerMargin != null ? num(c.managerMargin, R.managerMargin) : R.managerMargin,
    requireKitchen: typeof c.requireKitchen === 'boolean' ? c.requireKitchen : R.requireKitchen,
    requireManager: typeof c.requireManager === 'boolean' ? c.requireManager : R.requireManager,
    strength: { ...R.strength, ...asObj(c.strength) },
    neverTogether: Array.isArray(c.neverTogether) ? c.neverTogether.filter(p => Array.isArray(p) && p.length === 2) : [],
    preferDays: asObj(c.preferDays),     // staffId → [weekday…] lean toward
    avoidDays: asObj(c.avoidDays),       // staffId → [weekday…] lean away
    maxShiftsWeek: asObj(c.maxShiftsWeek), // staffId → max shifts per week
    dateRules: asObj(c.dateRules),       // 'YYYY-MM-DD' → { closed?, open?, close?, base?, eveAt?, eveAdd?, quiet?, kitchen? }
    // Minimum hours of rest between one shift's end and the next shift's start
    // (e.g. "12 hours between shifts" → 12). null = no rule.
    minRestHours: (c.minRestHours != null && Number.isFinite(+c.minRestHours) && +c.minRestHours > 0) ? +c.minRestHours : null,
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

// Opening hours for a date (specific-date AI rule → holiday override → weekday).
export function hoursFor(dateStr, rules) {
  const R = applyCompiled(withDefaults(rules))
  const dr = R.dateRules[dateStr]
  const d = R.days[wd(dateStr)] || R.days[0]
  let open = d.open, close = d.close
  if (holidayName(dateStr, R)) { open = R.holiday.open; close = R.holiday.close }
  if (dr && Number.isFinite(+dr.open)) open = +dr.open
  if (dr && Number.isFinite(+dr.close)) close = +dr.close
  return { open, close }
}

// The shift SLOTS a day needs, before assigning people. The manager slot spans
// managerMargin before open → after close (opener + closer + coverage). One slot per body.
export function daySlots(dateStr, rules) {
  const R = applyCompiled(withDefaults(rules))
  const { open, close } = hoursFor(dateStr, R)   // date-rule/holiday-aware hours
  // Specific-date AI rule (e.g. "closed on the 25th", "3 staff on the 14th") wins
  // over the weekday pattern for that one date.
  const dr = R.dateRules[dateStr] || null
  if (dr && dr.closed === true) return { slots: [], open, close, holiday: holidayName(dateStr, R), closed: true, kitchen: false }
  const d = { ...(R.days[wd(dateStr)] || {}), ...(dr || {}) }
  // Kitchen cover per day: an AI day-rule (kitchen: true/false on the weekday or the
  // specific date) overrides the global "always a kitchen-trained person" option.
  // Kitchen requirement comes ONLY from the per-day 🍳 column (or an AI day rule) —
  // the old global 'always a kitchen-trained person' option is retired.
  const kitchenReq = d.kitchen === true
  // Dedicated kitchen shift times (e.g. "kitchen 5pm–11pm"): when set, the kitchen
  // person gets their own slot with exactly these times — they replace one of the
  // floor bodies (same total headcount) and only kitchen-trained staff can fill it.
  const kStart = Number.isFinite(+d.kitchenStart) ? +d.kitchenStart : null
  const kEnd = Number.isFinite(+d.kitchenEnd) ? +d.kitchenEnd : null
  const kitchenSlot = kitchenReq && kStart != null && kEnd != null && kEnd > kStart
  // Headcount + evening bump come from the weekday; holidays change only the HOURS.
  const base = Math.max(0, d.base ?? 2)
  const eveAt = d.eveAt ?? null
  const eveAdd = Math.max(0, d.eveAdd ?? 0)
  const margin = R.managerMargin ?? 60
  // "Quiet" day → send the floor home `earlyCutMin` before close (the manager still
  // covers the close via their margin). Off = no trim.
  const cut = (d.quiet === true) ? Math.max(0, R.earlyCutMin ?? 0) : 0
  // Floor staff stay on after close for the wind-down (founder rule: everyone
  // leaves with the manager). Per-day `afterClose` minutes (AI/day rule) else the
  // global default. A quiet-day early cut still trims from that finish time.
  const stay = Number.isFinite(+d.afterClose) ? Math.max(0, +d.afterClose) : Math.max(0, R.afterCloseMin ?? 0)
  const floorClose = Math.max(open + 60, close + stay - cut)
  const slots = []
  // Manager: in `margin` before open to set up; leaves WITH everyone at the stay-on
  // time (close + stay) — never later. So Sun–Thu (stay 30) the manager finishes
  // 11:30pm like the floor; Fri/Sat (stay 60) 1am. `margin` is now the before-open span only.
  if (R.requireManager) slots.push({ start: open - margin, end: close + stay, role: 'manager', label: 'Manager' })
  // Dedicated kitchen slot right after the manager, so the kitchen-trained person
  // is claimed before the floor slots swallow them. Exact times as the rule states —
  // never trimmed by the quiet-day cut.
  if (kitchenSlot) slots.push({ start: kStart, end: kEnd, role: 'kitchen', label: 'Kitchen' })
  // "Staff" = manager + floor. The kitchen shift is on TOP of that (founder rule,
  // 16 Aug 2026: kitchen no longer counts as one of the day's staff).
  const floorN = Math.max(0, base - (R.requireManager ? 1 : 0))
  const floor = []
  for (let i = 0; i < floorN; i++) floor.push({ start: open, end: floorClose, role: 'any', label: 'Floor' })
  // Stagger: instead of two people both open→close, one OPENS (leaves `staggerGap`
  // early) and one CLOSES (starts `staggerGap` late) — saves the dead hour at each
  // end while they still overlap through the busy middle. Manager covers open & close.
  if (R.stagger && floor.length >= 2) {
    const gap = Math.max(0, R.staggerGap ?? 0)
    const last = floor.length - 1
    floor[0] = { ...floor[0], end: Math.max(floor[0].start + 60, floorClose - gap), label: 'Opener' }
    floor[last] = { ...floor[last], start: Math.min(floorClose - 60, open + gap), label: 'Closer' }
  }
  // Shortest-shift rule: no floor/opener/closer shift shorter than minShiftMin —
  // grow it earlier (never before open); if the day itself is shorter, it spans the day.
  const minS = Math.max(60, R.minShiftMin ?? 0)
  const grow = (s) => (s.end - s.start >= minS) ? s : { ...s, start: Math.max(open, s.end - minS) }
  slots.push(...floor.map(grow))
  // Evening bump: extra bodies from eveAt to close (only if eveAt sits inside opening
  // hours). On a quiet day they leave with the floor (floorClose), not at full close.
  if (eveAt != null && eveAdd > 0 && eveAt > open && eveAt < close) {
    const eveEnd = Math.max(eveAt + 60, floorClose)
    for (let i = 0; i < eveAdd; i++) slots.push(grow({ start: eveAt, end: eveEnd, role: 'any', label: 'Evening' }))
  }
  return { slots, open, close, holiday: holidayName(dateStr, R), kitchen: kitchenReq }
}

const isManager = (s) => s.role === 'Manager' || s.role === 'Asst. Manager'
export const isKitchen = (s) => (s.abilities || []).includes('kitchen') || s.role === 'Kitchen / Barback'

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
// opts.slotsByDate: { 'YYYY-MM-DD': { slots, open, close } } — when present for a
// date, those slots are used instead of the rules' daySlots (the Historical build
// shapes slots to last week's till demand, then hands off here so every people
// rule — availability, rest, keep-apart, priority — still applies).
export function generateWeek(weekStart, staff, availabilityRows, rules, opts = {}) {
  const R = applyCompiled(withDefaults(rules))
  const active = (staff || []).filter(s => s.active !== false)
  const unavail = buildUnavail(availabilityRows)
  const tally = {}   // staffId → minutes assigned this week (fairness)
  const shiftCount = {}   // staffId → shifts this week (for AI max-shift rules)
  const dur = (a, b) => Math.max(0, b - a)
  const targetOf = (s) => { const t = Number(s.target_hours); return Number.isFinite(t) && t > 0 ? t * 60 : null }
  // Founder's per-person strength / priority (1..5, default 3). Higher = a head-start
  // so stronger / this-week's-priority people get picked more — a weighting, not an
  // override, so hours still spread. 2h of "credit" per level above/below the middle.
  const strengthOf = (s) => { const v = +(R.strength?.[s.id]); return Number.isFinite(v) && v >= 1 && v <= 5 ? v : 3 }
  const effHours = (s) => (tally[s.id] || 0) - (strengthOf(s) - 3) * 120
  // AI people-rules: pairs to keep apart, days each person prefers/avoids, weekly shift caps.
  const badPair = {}   // staffId → Set(staffIds not to roster the same day)
  for (const [x, y] of R.neverTogether) { (badPair[x] ||= new Set()).add(y); (badPair[y] ||= new Set()).add(x) }
  const nameOf = (id) => (active.find(s => s.id === id) || {}).name || 'someone'
  const maxOf = (s) => { const m = +(R.maxShiftsWeek[s.id]); return Number.isFinite(m) && m > 0 ? m : null }
  // Minimum rest between shifts ("12 hours between shifts"). Track each person's
  // latest shift end in absolute week-minutes (dayIndex*1440 + end); someone whose
  // gap before this slot would be too short sinks to the bottom of the pool (picked
  // only if literally no one else is free — flagged in warnings).
  const restMin = R.minRestHours != null ? R.minRestHours * 60 : null
  const lastEnd = {}   // staffId → absolute minutes their latest assigned shift ends
  const dayBias = (s, w) => {
    const av = Array.isArray(R.avoidDays[s.id]) && R.avoidDays[s.id].map(Number).includes(w)
    const pf = Array.isArray(R.preferDays[s.id]) && R.preferDays[s.id].map(Number).includes(w)
    return av ? 1 : pf ? -1 : 0
  }

  const days = []
  const warnings = []
  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(weekStart, i)
    const base = daySlots(date, R)
    const ov = opts.slotsByDate && opts.slotsByDate[date]
    const { slots, open, close, holiday, kitchen: kitchenReq } = ov ? { ...base, ...ov, slots: ov.slots || base.slots } : base
    const usedToday = new Set()
    let kitchenCovered = false
    const out = []
    const w = wd(date)
    // A dedicated kitchen slot (exact times) makes the generic "steer a floor body
    // toward kitchen" behaviour unnecessary for this day.
    const hasKitchenSlot = slots.some(s => s.role === 'kitchen')
    for (const slot of slots) {
      let pool = active.filter(s => !usedToday.has(s.id))
      if (slot.role === 'manager') pool = pool.filter(isManager)
      if (slot.role === 'kitchen') pool = pool.filter(isKitchen)
      // Keep-apart pairs (AI rule): drop anyone paired with someone already on today —
      // unless that empties the pool, in which case staffing the day wins (flagged below).
      const apart = pool.filter(s => !badPair[s.id] || ![...usedToday].some(u => badPair[s.id].has(u)))
      if (apart.length > 0) pool = apart
      // Rank: (1) availability, (2) cover kitchen if not yet covered, (3) stay under target,
      // (4) fewest hours so far (fair spread), (5) name for stability.
      // Only steer BODY slots toward kitchen cover — never the manager slot, or the
      // kitchen-manager (Elliot) would be picked to manage every single day.
      const needKitchen = kitchenReq && !hasKitchenSlot && !kitchenCovered && slot.role !== 'manager'
      const avOk = (s) => (availState(unavail[s.id] || new Set(), date) >= 1 ? 1 : 0)
      // Enough rest since their last shift? (1 = fine / no rule, 0 = too soon.)
      const restOk = (s) => (restMin == null || lastEnd[s.id] == null || (i * 1440 + slot.start) - lastEnd[s.id] >= restMin) ? 1 : 0
      pool.sort((a, b) => {
        // Kitchen cover is a hard service requirement — for the reserved kitchen slot it
        // outranks even availability (better an unavailable cook than no kitchen; flagged below).
        if (needKitchen) { const k = (isKitchen(b) ? 1 : 0) - (isKitchen(a) ? 1 : 0); if (k) return k }
        const ao = avOk(a), bo = avOk(b); if (ao !== bo) return bo - ao   // marked-unavailable sinks
        const rea = restOk(a), reb = restOk(b); if (rea !== reb) return reb - rea   // too little rest sinks
        const ta = targetOf(a), tb = targetOf(b)
        const ma = maxOf(a), mb = maxOf(b)
        const oa = (ta != null && (tally[a.id] || 0) >= ta) || (ma != null && (shiftCount[a.id] || 0) >= ma) ? 1 : 0
        const ob = (tb != null && (tally[b.id] || 0) >= tb) || (mb != null && (shiftCount[b.id] || 0) >= mb) ? 1 : 0
        if (oa !== ob) return oa - ob   // someone already at target / their weekly shift cap sinks
        const ba = dayBias(a, w), bb = dayBias(b, w)
        if (ba !== bb) return ba - bb   // AI rule: prefers-this-day rises, avoids-this-day sinks
        const hd = effHours(a) - effHours(b)
        if (hd) return hd               // fewest (strength-adjusted) hours first — spreads, rotates, favours priority
        return (a.name || '').localeCompare(b.name || '')
      })
      const pick = pool[0]
      if (!pick) {
        out.push({ ...slot, staffId: null, name: null, kitchen: false, warn: slot.role === 'manager' ? 'No manager free' : slot.role === 'kitchen' ? 'No kitchen-trained member free' : 'No one free' })
        warnings.push(`${date}: ${slot.role === 'manager' ? 'no manager available' : slot.role === 'kitchen' ? 'no kitchen-trained member available' : 'short-staffed'} for ${slot.label}`)
        continue
      }
      const unavailable = availState(unavail[pick.id] || new Set(), date) === 0
      // If short staffing forced a keep-apart pair onto the same day, say so.
      if (badPair[pick.id]) for (const u of usedToday) if (badPair[pick.id].has(u)) warnings.push(`${date}: ${pick.name} and ${nameOf(u)} are both on — your rule says keep them apart, but no one else was free`)
      // Same if the rest rule had to bend: flag exactly how short the gap is.
      if (!restOk(pick)) {
        const gapH = Math.round(((i * 1440 + slot.start) - lastEnd[pick.id]) / 6) / 10
        warnings.push(`${date}: ${pick.name} gets only ${gapH}h rest before this shift (your rule says ${R.minRestHours}h) — no one else was free`)
      }
      usedToday.add(pick.id)
      tally[pick.id] = (tally[pick.id] || 0) + dur(slot.start, slot.end)
      shiftCount[pick.id] = (shiftCount[pick.id] || 0) + 1
      lastEnd[pick.id] = Math.max(lastEnd[pick.id] ?? -Infinity, i * 1440 + slot.end)
      if (isKitchen(pick)) kitchenCovered = true
      out.push({ ...slot, staffId: pick.id, name: pick.name, kitchen: isKitchen(pick), warn: unavailable ? 'Marked unavailable' : '' })
      if (unavailable) warnings.push(`${date}: ${pick.name} marked themselves off`)
    }
    if (kitchenReq && !kitchenCovered && out.some(o => o.staffId)) warnings.push(`${date}: no kitchen-trained member on`)
    days.push({ date, open, close, holiday, slots: out })
  }
  return { days, warnings }
}
