// Staff availability interpretation — shared by the rota builder so the manual
// grid and the staff's own "Availability" tab agree.
//
// Storage (staff_availability table): one row per (staff_id, month) with a `data`
// object keyed by 'YYYY-MM-DD' — the days that member marked they CAN work.
// There is no explicit "off" flag, so we infer it the same way the rota engine
// does: if a member has set availability for a month, we respect it strictly —
// any day in that month they did NOT mark is treated as "unavailable". If they
// haven't set anything for that month, we don't know, so it's "unset" (never
// flagged — we don't want to block someone who simply hasn't filled it in).

// Build { [staffId]: { [month]: Set('YYYY-MM-DD') } } from the admin load's
// availability array ([{ staff_id, month, data }]).
export function availabilityIndex(rows) {
  const idx = {}
  for (const r of rows || []) {
    if (!r || !r.staff_id || !r.month) continue
    ;(idx[r.staff_id] ||= {})[r.month] = new Set(Object.keys(r.data || {}))
  }
  return idx
}

// 'available' | 'unavailable' | 'unset' for one staffer on one date.
export function availabilityStatus(idx, staffId, date) {
  const set = idx?.[staffId]?.[(date || '').slice(0, 7)]
  if (!set || set.size === 0) return 'unset'
  return set.has(date) ? 'available' : 'unavailable'
}
