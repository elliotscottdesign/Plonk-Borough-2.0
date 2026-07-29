// Staff availability interpretation — shared by the rota builder so the manual
// grid and the staff's own "Availability" tab agree.
//
// Model (since Jul 2026): everyone is AVAILABLE by default. Staff (or the founder)
// only ever mark the days they CANNOT work. Storage (staff_availability table):
// one row per (staff_id, month) with a `data` object keyed by 'YYYY-MM-DD'; a day
// is "off" ONLY when its entry is `{ unavailable: true }`. Any other entry — an
// old `{ available: true }` / `{ from,to }` mark from the previous "mark when you
// CAN work" model, or no entry at all — means AVAILABLE. This keeps the flip
// non-destructive: nothing in the table is deleted, old marks simply read as the
// new default (available), and only an explicit off-mark blocks a day.

// True only for an explicit "can't work that day" entry.
export const isDayOff = (entry) => !!(entry && entry.unavailable === true)

// Build { [staffId]: { [month]: Set('YYYY-MM-DD') } } of the days each member
// marked OFF, from the admin load's availability array ([{ staff_id, month, data }]).
export function availabilityIndex(rows) {
  const idx = {}
  for (const r of rows || []) {
    if (!r || !r.staff_id || !r.month) continue
    const off = Object.keys(r.data || {}).filter(d => isDayOff(r.data[d]))
    ;(idx[r.staff_id] ||= {})[r.month] = new Set(off)
  }
  return idx
}

// 'available' | 'unavailable' for one staffer on one date. Default is available;
// only an explicit off-mark returns 'unavailable'.
export function availabilityStatus(idx, staffId, date) {
  const set = idx?.[staffId]?.[(date || '').slice(0, 7)]
  return set && set.has(date) ? 'unavailable' : 'available'
}
