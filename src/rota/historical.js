// ─── Historical build — shape a rota from last week's till data ──────────────
// Reads the Lightspeed-derived TILL_HISTORY (30-min sales buckets per trading
// day, who was on the tills, what sold) and turns it into:
//   • a demand curve   — how many people each half-hour needed, given a
//                        "£ one person can serve per half-hour" capacity;
//   • shaped slots     — manager + kitchen from the house rules, then floor
//                        shifts peeled off the demand curve (start when the
//                        second body is needed, end when it isn't) — handed to
//                        generateWeek so every people rule still applies;
//   • insights         — quiet stretches that were over-staffed (shave), the
//                        peak stretch (overlap shifts here), £ per staff-hour.
import { TILL_HISTORY, LOGIN_TO_NAME, TILL_HISTORY_META } from './tillHistory.js'
import { daySlots, hoursFor, withDefaults, applyCompiled, addDaysISO } from './rotaEngine.js'

export { LOGIN_TO_NAME, TILL_HISTORY_META }
export const TILL_BY_DATE = Object.fromEntries(TILL_HISTORY.map(d => [d.date, d]))
const BUCKET = TILL_HISTORY_META.bucketMin || 30
const wd = (d) => new Date(d + 'T00:00:00Z').getUTCDay()
export const mondayOf = (d) => addDaysISO(d, -((wd(d) + 6) % 7))
const snap = (m) => Math.round(m / BUCKET) * BUCKET

// The week the Historical build mirrors for a target week: the week before it,
// or — if that has too little till data — the latest week that does. Returns
// { monday, dates[7], exact, covered } (covered = how many of the 7 have data).
export function sourceWeekFor(targetMonday) {
  const cover = (mon) => Array.from({ length: 7 }, (_, i) => addDaysISO(mon, i)).filter(d => TILL_BY_DATE[d]).length
  const prev = addDaysISO(targetMonday, -7)
  let monday = prev, exact = true
  if (cover(prev) < 4) {
    exact = false
    // walk back from the latest data to the most recent Monday with ≥4 days
    let m = mondayOf(TILL_HISTORY_META.to)
    for (let i = 0; i < 20 && cover(m) < 4; i++) m = addDaysISO(m, -7)
    monday = m
  }
  return { monday, dates: Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i)), exact, covered: cover(monday) }
}

// Sales per half-hour across a span → [{ t, s, n }] (zeros filled in).
export function seriesFor(day, from, to) {
  const map = Object.fromEntries((day?.buckets || []).map(b => [b.t, b]))
  const out = []
  for (let t = snap(from); t < to; t += BUCKET) { const b = map[t]; out.push({ t, s: b ? b.s : 0, n: b ? b.n : 0, by: b ? b.by : {} }) }
  return out
}

// Demand curve: people needed each half-hour = ceil(sales / capacity), min 1
// (someone has to be there), so `need` is TOTAL heads incl. the manager.
export function demandCurve(series, capacity) {
  const cap = Math.max(20, capacity || 110)
  return series.map(p => ({ ...p, need: Math.max(1, Math.ceil(p.s / cap)) }))
}

// Peel floor shifts off the demand curve. Layer k covers every half-hour where
// (need − managerHeads − kitchenHeads) ≥ k. Each contiguous run becomes one shift,
// stretched to at least minShift, snapped to the half-hour, clamped to open→close.
function peel(curve, open, close, { minShift = 180, floorMin = 1, cap = 5, reserved = 1 }) {
  const slots = []
  const need = curve.map(p => Math.max(0, p.need - reserved))
  for (let k = 1; k <= cap; k++) {
    const on = curve.map((_, i) => need[i] >= k || (k <= floorMin))   // floorMin layers are always on
    let i = 0
    while (i < on.length) {
      if (!on[i]) { i++; continue }
      let j = i; while (j < on.length && on[j]) j++
      let start = curve[i].t, end = curve[j - 1].t + BUCKET
      if (end - start < minShift) {   // grow to minShift, centred, inside opening hours
        const grow = minShift - (end - start)
        start = Math.max(open, start - Math.ceil(grow / 2 / BUCKET) * BUCKET)
        end = Math.min(close, start + minShift)
        start = Math.max(open, end - minShift)
      }
      const last = slots[slots.length - 1]
      if (last && last.layer === k && start - last.end <= 60) last.end = Math.max(last.end, end)   // merge near-adjacent runs
      else slots.push({ start, end, layer: k })
      i = j
    }
  }
  return slots.map(s => ({ start: s.start, end: s.end, role: 'any', label: s.layer === 1 ? 'Floor' : 'Extra', fromDemand: true }))
}

// Shape one target day from a source till day.
// opts: { capacity (£/person/half-hour), minShift (min), floorMin, cap }
export function shapeDay(targetDate, sourceDay, rules, opts = {}) {
  const R = applyCompiled(withDefaults(rules))   // manual settings + the AI-compiled layer
  const base = daySlots(targetDate, R)             // manager + kitchen + rules floor
  const { open, close } = base
  if (base.closed) return { ...base, slots: [], demand: [], shadow: null }
  const fixed = base.slots.filter(s => s.role === 'manager' || s.role === 'kitchen')
  const reserved = fixed.length ? 1 : 0             // manager counts as a serving head; kitchen doesn't
  if (!sourceDay) return { ...base, demand: [], shadow: null }   // no data → rules as-is
  const series = seriesFor(sourceDay, open, close)
  const curve = demandCurve(series, opts.capacity)
  const minShift = opts.minShift ?? R.minShiftMin ?? 360
  const floor = peel(curve, open, close, { minShift, floorMin: opts.floorMin ?? 1, cap: opts.cap ?? 5, reserved })
  // House rule: floor staff stay on after close with the manager for the wind-down —
  // any floor shift that runs to close is stretched to the same finish the rules
  // builder uses (per-day afterClose, else the global afterCloseMin).
  const dw = { ...(R.days[wd(targetDate)] || {}), ...((R.dateRules || {})[targetDate] || {}) }
  const stay = Number.isFinite(+dw.afterClose) ? Math.max(0, +dw.afterClose) : Math.max(0, R.afterCloseMin ?? 0)
  const floorOut = floor.map(s => (s.end >= close - 1 ? { ...s, end: close + stay } : s)).map(s => (s.end - s.start >= minShift ? s : { ...s, start: Math.max(open, s.end - minShift) }))
  return { ...base, slots: [...fixed, ...floorOut], demand: curve, shadow: { sourceDate: sourceDay.date, series, total: sourceDay.total, orders: sourceDay.orders, src: sourceDay.src } }
}

// Insights for a source day, given who was actually staffed (bars: [{name,start,end}]).
export function analyseDay(sourceDay, bars, opts = {}) {
  if (!sourceDay) return null
  const from = Math.min(sourceDay.first, ...bars.map(b => b.start).filter(Number.isFinite))
  const to = Math.max(sourceDay.last + BUCKET, ...bars.map(b => b.end).filter(Number.isFinite))
  const series = seriesFor(sourceDay, snap(from), snap(to) + BUCKET)
  const peak = Math.max(1, ...series.map(p => p.s))
  const staffedAt = (t) => bars.filter(b => b.start <= t && b.end > t).length
  const quietCut = Math.max(25, peak * 0.2), peakCut = peak * 0.6
  const runs = (pred) => {
    const out = []; let cur = null
    for (const p of series) {
      const ok = pred(p)
      if (ok && !cur) cur = { start: p.t, end: p.t + BUCKET, sales: p.s, staffed: staffedAt(p.t) }
      else if (ok) { cur.end = p.t + BUCKET; cur.sales += p.s; cur.staffed = Math.max(cur.staffed, staffedAt(p.t)) }
      else if (cur) { out.push(cur); cur = null }
    }
    if (cur) out.push(cur)
    return out
  }
  const quiet = runs(p => p.s < quietCut && staffedAt(p.t) >= 2).filter(r => r.end - r.start >= 60)
  const peaks = runs(p => p.s >= peakCut)
  const peakRun = peaks.sort((a, b) => b.sales - a.sales)[0] || null
  const staffHours = bars.reduce((a, b) => a + Math.max(0, b.end - b.start), 0) / 60
  const shaveHours = quiet.reduce((a, r) => a + ((r.end - r.start) / 60) * Math.max(0, r.staffed - 1), 0)
  return {
    total: sourceDay.total, orders: sourceDay.orders, peak, quiet, peakRun, staffHours,
    salesPerStaffHour: staffHours > 0 ? sourceDay.total / staffHours : null,
    shaveHours: Math.round(shaveHours * 2) / 2,
    series,
  }
}

// Which staff member a till login is (first-name match against the team list).
export function personForLogin(login, staff) {
  const first = LOGIN_TO_NAME[login] || login
  return (staff || []).find(s => (s.name || '').split(' ')[0].toLowerCase() === String(first).toLowerCase()) || null
}

// Rostered bars for a date from the saved rota (shifts + claims): [{ staffId, name, start, end }]
export function rosteredBars(date, shifts, claims, staff) {
  const nameOf = (id) => (staff || []).find(s => s.id === id)?.name || '?'
  const out = []
  for (const sh of shifts || []) {
    if (sh.date !== date) continue
    for (const c of claims || []) if (c.shift_id === sh.id) out.push({ staffId: c.staff_id, name: nameOf(c.staff_id), start: sh.start_min, end: sh.end_min })
  }
  return out
}

export const fmtT = (m) => { const mm = ((m % 1440) + 1440) % 1440; const h = Math.floor(mm / 60), mi = mm % 60; const ap = h >= 12 ? 'pm' : 'am'; const h12 = h % 12 === 0 ? 12 : h % 12; return mi ? `${h12}:${String(mi).padStart(2, '0')}${ap}` : `${h12}${ap}` }
export const gbp0 = (n) => '£' + Math.round(n).toLocaleString('en-GB')
