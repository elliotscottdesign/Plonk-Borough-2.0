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

// ── Message templates (the WhatsApp copy the admin sends to DJs) ─────────────
// Live bodies come from the dj_templates table (editable in /ops → DJ Bookings →
// Messages). These DEFAULTS are the fallback before a template is saved, and the
// copy the seed/admin starts from. {name}/{link}/{month} fill per-DJ at send time.
export const TEMPLATE_KEYS = [
  { key: 'invite', label: 'Roster invite', vars: ['name', 'link'], hint: 'Sent from the Roster (📲 WhatsApp invite) and the group blast.' },
  { key: 'release_first', label: 'New dates · first dibs', vars: ['name', 'link', 'month'], hint: 'First-dibs batch — sent on release day to whichever resident group goes first (set by the release order).' },
  { key: 'release_played', label: 'New dates · second batch', vars: ['name', 'link', 'month'], hint: 'Second batch — the other resident group (after the 24h head-start), and the copy used for “all residents at once”.' },
  { key: 'release_6h', label: '6-hour closing nudge', vars: ['name', 'link', 'month'], hint: 'Reminder to first-dibs residents in the final hours.' },
]
export const DEFAULT_TEMPLATES = {
  invite: `Hey {name}, I hope you are well! I have nearly got the business back open and I wanna book the DJs and events in again.

I am struggling a bit to get open with money etc, literally doing this on empty right now, so if there is any way you can do a set for £60 (what I pay bar staff for 4 hours) and drinks and food that would be amazing.

I am hoping to get sponsorship for events soon to get back to normal. I am also making a promotional tool to make DJs more money for mates they bring. So…. either way of course I wanna get you back in again!! So.....

Welcome to the No Dice DJ roster….

Here's your private link to set up your profile and grab the nights you want to play:
{link}

It walks you through everything, any questions, give us a shout. I hope the app makes everyone's lives easier! Much love E`,
  release_first: `Hey {name}, the {month} dates are live at No Dice! 🎧

As a resident you get FIRST pick — grab your night before it opens to the rest. You've got 24 hours on this one.

Your link: {link}

Any Qs, shout. E`,
  release_played: `Hey {name}, the {month} dates are live at No Dice! 🎧

Grab your resident night — get in quick before they go.

Your link: {link}

Any Qs, shout. E`,
  release_6h: `Hey {name}, ⏳ ~6 hours left to grab your No Dice resident slot before it opens to everyone — book here:
{link}
E`,
}
// Replace {name}/{link}/{month} placeholders; leaves unknown {tokens} untouched.
export const fillTemplate = (body, vars = {}) =>
  String(body || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m))
// Look up a template body from the loaded list, falling back to the built-in
// default ONLY when no row is persisted — a saved empty body stays empty (so
// clearing a template in the admin isn't silently reverted to the default).
export const tplBody = (templates, key) => {
  const t = Array.isArray(templates) ? templates.find(x => x.key === key) : null
  return t ? t.body : (DEFAULT_TEMPLATES[key] || '')
}

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

// Weekly sessions (JS getDay: Sun=0 … Sat=6).
//   Thu/Fri/Sat = paid DJ sessions (genre picker, adjacent-day rule, 1 per month).
//   Sun/Mon/Tue/Wed = Open Decks (unpaid, no genre rules, unlimited).
export const SESSIONS = {
  0: { day: 'Sunday', start: '19:00', end: '23:00', kind: 'opendecks' },
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
// One-off special days that override the normal weekday pattern — e.g. a bank-
// holiday Sunday run as a two-session PAID day like a Saturday (4–8pm + 8pm–12am).
export const SPECIAL_DATES = {
  '2026-08-30': [   // August bank-holiday Sunday weekender
    { slot: 'sat_pm', day: 'Sunday', start: '16:00', end: '20:00', kind: 'session' },
    { slot: 'main', day: 'Sunday', start: '20:00', end: '00:00', kind: 'session' },
  ],
}
const wdOf = (dateStr) => new Date(dateStr + 'T00:00:00').getDay()
// All bookable slots for a date (main + extras), earliest start first.
export function slotsForDate(dateStr) {
  if (SPECIAL_DATES[dateStr]) return SPECIAL_DATES[dateStr].slice().sort((a, b) => a.start.localeCompare(b.start))
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

// ── World Cup 2026 knockout clashes ─────────────────────────────────────────
// England/Brazil knockout matches that could clash with a DJ night. UK times;
// `end` includes a worst-case extra-time + penalties window (~2h45 from kick-off).
// Results-dependent fixtures are confirmed:false — CONFIRM as the bracket firms up.
export const WC_MATCHES = [
  { date: '2026-07-01', label: 'England · Round of 32 (v DR Congo)', ko: '17:00', end: '19:45', confirmed: true },
  { date: '2026-07-09', label: 'Quarter-final · England or Brazil?', ko: '21:00', end: '23:45', confirmed: false },
  { date: '2026-07-10', label: 'Quarter-final · England or Brazil?', ko: '21:00', end: '23:45', confirmed: false },
  { date: '2026-07-11', label: 'Quarter-final · England or Brazil?', ko: '21:00', end: '23:45', confirmed: false },
]
const _mins = (t) => +String(t).slice(0, 2) * 60 + +String(t).slice(3, 5)
const _ampm = (t) => { let h = +String(t).slice(0, 2); const m = +String(t).slice(3, 5); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}${m ? ':' + String(m).padStart(2, '0') : ''}${ap}` }
// World Cup clash for a (date, session)? → a tooltip note (match window incl. ET/pens
// + alternative DJ-set times), or '' when there's no overlap.
export function wcClash(dateStr, slot) {
  const mt = (WC_MATCHES || []).find(x => x.date === dateStr)
  if (!mt || !slot || !slot.start) return ''
  const sS = _mins(slot.start), sE = slot.end === '00:00' ? 1440 : _mins(slot.end)
  if (_mins(mt.end) <= sS || _mins(mt.ko) >= sE) return ''   // no time overlap
  const setLabel = `${_ampm(slot.start)}–${slot.end === '00:00' ? '12am' : _ampm(slot.end)}`
  return `⚽ ${mt.label}${mt.confirmed ? '' : ' — confirm fixture'}\nKick-off ${_ampm(mt.ko)} → ~${_ampm(mt.end)} UK (incl. extra time + penalties).\nClashes with this ${setLabel} DJ set.\nOptions: start the DJ ~${_ampm(mt.end)} (after the final whistle) · use the 4–8pm afternoon slot · or move to another night.`
}
export const SET_TYPES = [
  { value: 'dj_set', label: 'Full DJ set' },
  { value: 'records', label: 'Record selections' },
  { value: 'listening', label: 'Album listening party' },
]
export const setTypeLabel = (v) => (SET_TYPES.find(s => s.value === v) || {}).label || v

// Ready-to-post Instagram caption for a confirmed night. Accepts the admin slot
// shape ({date, dj:{dj_name,instagram}, subgenres, night_name, set_type, kind})
// or the feed shape ({date, dj, instagram, genres, ...}).
// Promo artist/track are NAMES only — flag anything that looks like a URL/link:
// a scheme, www., any domain-with-a-path, or a known music-link host. Avoids
// false-positives on dotted names like "will.i.am" / "M.I.A." (no path, not a host).
export const looksLink = (s) => /(https?:\/\/|www\.|[\w-]+\.[a-z]{2,}\/|\b(soundcloud|youtu|spoti|bit\.ly|linktr|hearthis|mixcloud|bandcamp|tidal|deezer|audiomack|hypeddit|fanlink|toneden)\b)/i.test(s || '')

export function instagramCaption(ev) {
  const dj = ev?.dj?.dj_name || ev?.dj || 'TBA'
  const dj2 = (typeof ev?.dj2 === 'string' ? ev.dj2 : '') || ev?.dj2name || ''   // back-to-back partner
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
    `${dj}${dj2 ? ` b2b ${dj2}` : ''}${igTag ? ` (${igTag})` : ''} on the decks at No Dice, London Fields.`,
  ]
  if (subs.length) lines.push(subs.join(' · '))
  if (fmt) lines.push(`🎛️ ${fmt}`)
  const promo = [ev?.promo_artist, ev?.promo_track].filter(Boolean).join(' — ')
  if (promo) lines.push(`🎵 ${promo}`)
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
