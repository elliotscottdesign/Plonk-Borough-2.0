// ─── Pay maths (founder rules, 14 Sep 2026) ──────────────────────────────────
// What a staffer is owed, from their rostered shift + what they actually clocked:
//
//  • Paid START = clock-in ROUNDED TO THE NEAREST HOUR, never earlier than the
//    rostered start ("late clocking-in is rounded to the closest hour as per
//    their commencement"). e.g. rostered 5pm: clock 5:10 → paid from 5pm;
//    clock 5:40 → paid from 6pm; clock 4:50 → paid from 5pm (rostered).
//  • Paid END = clock-out as recorded (an auto-out already equals rostered end).
//  • UNPAID BREAK on shifts over 6 hours: 5 minutes per full worked hour,
//    deducted ALWAYS — taken, tapped, or not ("heavy net"). The break buttons
//    on /today are the compliance record, not the maths.
//  • Didn't clock in at all → not paid for that shift (unless marked 🤒 sick).
//  • 🤒 SICK day (marked by the founder on the rota): paid HALF the rostered
//    hours at their normal rate; no break deduction; tracked as a sick day.
//
// All times are minutes; money is £ to 2dp. Pure functions — no network.

const LONDON = 'Europe/London'

// A clock timestamp → minutes past the SHIFT DATE's midnight (London), so a
// 00:30 clock-out on an evening shift comes back as 1470, not 30.
export function clockMins(ts, shiftDate) {
  if (!ts) return null
  const d = new Date(ts)
  const [hh, mm] = d.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: LONDON }).split(':').map(Number)
  const dayISO = d.toLocaleDateString('en-CA', { timeZone: LONDON })
  let m = hh * 60 + mm
  if (dayISO > shiftDate) m += 1440           // after midnight → next-day minutes
  if (dayISO < shiftDate) m -= 1440           // (never expected, but keep it sane)
  return m
}

export const roundToHour = (m) => Math.round(m / 60) * 60

// Break deduction for a worked span: 6h+ → 5 min per FULL worked hour.
export const breakDeduction = (spanMin) => (spanMin > 360 ? Math.floor(spanMin / 60) * 5 : 0)

// One rostered shift + its clock row → the pay breakdown for that day.
// shift: { start_min, end_min }  clock: { clock_in, clock_out } | null  sick: bool
export function shiftPay(shift, clock, date, { sick = false } = {}) {
  const rosteredMin = Math.max(0, shift.end_min - shift.start_min)
  if (sick) return { kind: 'sick', paidMin: Math.round(rosteredMin / 2), breakMin: 0, rosteredMin, start: shift.start_min, end: shift.end_min }
  const inM = clockMins(clock?.clock_in, date)
  const outM = clockMins(clock?.clock_out, date)
  if (inM == null || outM == null) return { kind: 'unworked', paidMin: 0, breakMin: 0, rosteredMin, start: null, end: null }
  const start = Math.max(shift.start_min, roundToHour(inM))
  const end = outM
  const span = Math.max(0, end - start)
  const breakMin = breakDeduction(span)
  return { kind: 'worked', paidMin: Math.max(0, span - breakMin), breakMin, rosteredMin, start, end }
}

export const money = (n) => Math.round(n * 100) / 100
export const payFor = (paidMin, rate) => money((paidMin / 60) * (Number(rate) || 0))
