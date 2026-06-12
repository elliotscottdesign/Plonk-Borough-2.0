// DJ portal / admin API helpers (Supabase edge functions).
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

export const DJ_PORTAL_FN_URL = `${SUPABASE_URL}/functions/v1/dj-portal`
export const DJ_ADMIN_FN_URL = `${SUPABASE_URL}/functions/v1/dj-admin`
export const EVENTS_FEED_URL = `${SUPABASE_URL}/functions/v1/events-feed`
export const DJ_CAPTION_FN_URL = `${SUPABASE_URL}/functions/v1/dj-caption`

// DJ-facing calls — authed by the DJ's private token (from their invite link).
export async function djPortal(token, action, payload = {}) {
  const res = await fetch(DJ_PORTAL_FN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, action, ...payload }) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// Founder-facing calls — authed by SEND_SECRET (gated /ops admin).
export async function djAdmin(action, payload = {}) {
  const res = await fetch(DJ_ADMIN_FN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: SEND_SECRET, action, ...payload }) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

export const inviteLink = (token) => `${window.location.origin}/dj?t=${encodeURIComponent(token)}`

// AI rewrite of a night's Instagram caption (Claude, via the dj-caption edge
// function). Admin-only (SEND_SECRET). `event` is the confirmed slot; we also
// send the free template caption as the source of truth for date/time/address.
// `avoid` (the previous AI caption) makes "Try again" produce something new.
// Returns { caption } — or throws with a friendly message (incl. setup hint).
export async function djCaption(event, avoid = '') {
  const res = await fetch(DJ_CAPTION_FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: SEND_SECRET, event, template: instagramCaption(event), avoid }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) { const e = new Error(data.error || `Error ${res.status}`); e.setup = !!data.setup; throw e }
  return data
}

// Weekly sessions (JS getDay: Mon=1 … Sat=6).
//   Thu/Fri/Sat = paid DJ sessions (genre picker, adjacent-day rule, 1 per month).
//   Mon/Tue/Wed = Open Decks (unpaid, no genre rules, unlimited).
export const SESSIONS = {
  1: { day: 'Monday', start: '19:00', end: '23:00', kind: 'opendecks' },
  2: { day: 'Tuesday', start: '19:00', end: '23:00', kind: 'opendecks' },
  3: { day: 'Wednesday', start: '19:00', end: '23:00', kind: 'opendecks' },
  4: { day: 'Thursday', start: '19:00', end: '23:00', kind: 'session' },
  5: { day: 'Friday', start: '20:00', end: '00:00', kind: 'session' },
  6: { day: 'Saturday', start: '20:00', end: '00:00', kind: 'session' },   // slot 'main' = Saturday evening
}
// Extra bookable sessions on a weekday, beyond the single 'main' slot above.
// Saturday has a second PAID session in the afternoon (4–8pm).
export const EXTRA_SLOTS = {
  6: [{ slot: 'sat_pm', day: 'Saturday', start: '16:00', end: '20:00', kind: 'session' }],
}
const wdOf = (dateStr) => new Date(dateStr + 'T00:00:00').getDay()
// All bookable slots for a date (main + extras), earliest start first.
export function slotsForDate(dateStr) {
  const wd = wdOf(dateStr)
  const out = []
  if (SESSIONS[wd]) out.push({ slot: 'main', ...SESSIONS[wd] })
  for (const e of (EXTRA_SLOTS[wd] || [])) out.push({ ...e })
  return out.sort((a, b) => a.start.localeCompare(b.start))
}
// Session definition for a specific (date, slot). Defaults to the 'main' slot.
export function sessionForSlot(dateStr, slot) {
  return slotsForDate(dateStr).find(s => s.slot === (slot || 'main')) || SESSIONS[wdOf(dateStr)] || null
}
// Short label when a day has >1 session ('Afternoon' / 'Evening'); '' otherwise.
export function slotLabel(dateStr, slot) {
  const all = slotsForDate(dateStr)
  if (all.length < 2) return ''
  return (all.findIndex(s => s.slot === (slot || 'main')) === 0) ? 'Afternoon' : 'Evening'
}
export const sessionFor = (dateStr, slot) => sessionForSlot(dateStr, slot)
export const kindFor = (dateStr, slot) => sessionForSlot(dateStr, slot)?.kind || 'session'
export const SET_TYPES = [
  { value: 'dj_set', label: 'Full DJ set' },
  { value: 'records', label: 'Record selections' },
  { value: 'listening', label: 'Album listening party' },
]
export const setTypeLabel = (v) => (SET_TYPES.find(s => s.value === v) || {}).label || v

// Ready-to-post Instagram caption for a confirmed night. Accepts the admin slot
// shape ({date, dj:{dj_name,instagram}, subgenres, night_name, set_type, kind})
// or the feed shape ({date, dj, instagram, genres, ...}).
export function instagramCaption(ev) {
  const dj = ev?.dj?.dj_name || ev?.dj || 'TBA'
  const ig = ev?.dj?.instagram || ev?.instagram || ''
  const subs = ev?.subgenres || ev?.genres || []
  const fmt = ev?.dj?.format || ev?.format || ''
  const s = sessionForSlot(ev.date, ev.slot)
  const dateStr = new Date(ev.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const session = (ev?.kind || kindFor(ev.date, ev.slot)) === 'session'
  const title = ev?.night_name ? `“${ev.night_name}”` : (session ? 'No Dice Sessions' : 'Open Decks')
  const igTag = ig ? ig.split(/[\s/]/)[0] : ''
  const lines = [
    `🎧 ${title} — ${dateStr}`,
    '',
    `${dj}${igTag ? ` (${igTag})` : ''} on the decks at No Dice, London Fields.`,
  ]
  if (subs.length) lines.push(subs.join(' · '))
  if (fmt) lines.push(`🎛️ ${fmt}`)
  lines.push(`${session ? '' : (setTypeLabel(ev.set_type) || 'Open Decks') + ' · free entry · '}${s?.day || ''} ${timeLabel(s)}`)
  lines.push('📍 407 Mentmore Terrace, London Fields, E8 3PH')
  lines.push('')
  lines.push(['#NoDice', '#LondonFields', '#Hackney', '#DJ', ...subs.slice(0, 3).map(g => '#' + g.replace(/[^a-z0-9]/gi, ''))].join(' '))
  return lines.join('\n')
}
export const fmtDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
export const timeLabel = (s) => s ? `${s.start.replace(':00', '')}${Number(s.start.slice(0, 2)) < 12 ? 'am' : 'pm'}–${s.end === '00:00' ? '12am' : s.end.replace(':00', '') + 'pm'}` : ''

// Decode an image File → downscaled JPEG data URL (keeps uploads small).
// Tries createImageBitmap (broad format support + correct orientation), falls
// back to <img>. Throws a friendly error for formats the browser can't read
// (e.g. a HEIC photo opened on a desktop browser).
export async function resizeImage(file, maxPx = 1000, quality = 0.85) {
  // HEIC/HEIF (iPhone & Mac photos) can't be drawn to a canvas — convert to JPEG
  // first via heic2any, loaded on demand from a CDN only when a HEIC is picked.
  if (/heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name || '')) {
    try {
      const mod = await import(/* @vite-ignore */ 'https://esm.sh/heic2any@0.0.4')
      const out = await mod.default({ blob: file, toType: 'image/jpeg', quality: 0.9 })
      file = new File([Array.isArray(out) ? out[0] : out], 'photo.jpg', { type: 'image/jpeg' })
    } catch { throw new Error("Couldn't convert that HEIC photo — please try a JPG or PNG.") }
  }
  let src
  try {
    src = await createImageBitmap(file)
  } catch {
    src = await new Promise((res, rej) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => { URL.revokeObjectURL(url); res(img) }
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Couldn’t read that photo — please use a JPG or PNG.')) }
      img.src = url
    })
  }
  const iw = src.width || 0, ih = src.height || 0
  if (!iw || !ih) throw new Error('That photo looks empty — try another one.')
  const scale = Math.min(1, maxPx / Math.max(iw, ih))
  const w = Math.max(1, Math.round(iw * scale)), h = Math.max(1, Math.round(ih * scale))
  const c = document.createElement('canvas'); c.width = w; c.height = h
  c.getContext('2d').drawImage(src, 0, 0, w, h)
  const out = c.toDataURL('image/jpeg', quality)
  if (!out || out.length < 200) throw new Error("Couldn't process that photo — please try a different one.")
  return out
}
