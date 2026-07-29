// Opportunities tracker ("Key Dates") — external moments that drive footfall/sales.
// Founder-gated CRUD on the shared `rota` edge function. The same list feeds the
// Key Dates page, the Staff Rota builder and the DJ calendar (alarm markers).
import { SUPABASE_URL, SEND_SECRET } from '../../marketing/data/backend.js'

const FN_URL = `${SUPABASE_URL}/functions/v1/rota`
async function call(payload) {
  const res = await fetch(FN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, secret: SEND_SECRET }) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}
export const eventsList = () => call({ action: 'eventsList' })
export const eventAdd = (e) => call({ action: 'eventAdd', ...e })
export const eventUpdate = (id, patch) => call({ action: 'eventUpdate', id, ...patch })
export const eventDelete = (id) => call({ action: 'eventDelete', id })

export const EVENT_CATEGORIES = {
  festival:     { label: 'Festival',        icon: '🎪', color: '#A855F7' },
  local:        { label: 'Local / market',  icon: '📍', color: '#60A5FA' },
  half_term:    { label: 'School holiday',   icon: '🎒', color: '#F59E0B' },
  fireworks:    { label: 'Fireworks',        icon: '🎆', color: '#DA1B33' },
  bank_holiday: { label: 'Bank holiday',     icon: '🏖️', color: '#34D399' },
  drink_day:    { label: 'Drink / food day', icon: '🍹', color: '#EC4899' },
  cultural:     { label: 'Cultural',         icon: '🎉', color: '#FBBF24' },
  sport:        { label: 'Sport',            icon: '⚽', color: '#22D3EE' },
  holiday:      { label: 'Holiday',          icon: '🎄', color: '#34D399' },
  other:        { label: 'Other',            icon: '📌', color: 'rgba(255,255,255,0.65)' },
}
export const CATEGORY_ORDER = ['festival', 'local', 'half_term', 'fireworks', 'bank_holiday', 'drink_day', 'cultural', 'sport', 'holiday', 'other']
export const catMeta = (c) => EVENT_CATEGORIES[c] || EVENT_CATEGORIES.other

// True if `dateStr` (YYYY-MM-DD) falls on/within an event (single day or a range).
export const eventOnDate = (ev, dateStr) => ev.end_date ? (dateStr >= ev.start_date && dateStr <= ev.end_date) : ev.start_date === dateStr
// All events touching a date — used for the rota/DJ calendar alarm markers.
export const eventsForDate = (events, dateStr) => (events || []).filter(ev => eventOnDate(ev, dateStr))

// Short human date / range label.
export function eventDateLabel(ev) {
  const f = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  return ev.end_date && ev.end_date !== ev.start_date ? `${f(ev.start_date)} → ${f(ev.end_date)}` : f(ev.start_date)
}
