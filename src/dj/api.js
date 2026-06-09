// DJ portal / admin API helpers (Supabase edge functions).
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

export const DJ_PORTAL_FN_URL = `${SUPABASE_URL}/functions/v1/dj-portal`
export const DJ_ADMIN_FN_URL = `${SUPABASE_URL}/functions/v1/dj-admin`

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

// Weekly sessions (JS getDay: Mon=1 … Sat=6).
//   Thu/Fri/Sat = paid DJ sessions (genre picker, adjacent-day rule, 1 per month).
//   Mon/Tue/Wed = Open Decks (unpaid, no genre rules, unlimited).
export const SESSIONS = {
  1: { day: 'Monday', start: '19:00', end: '23:00', kind: 'opendecks' },
  2: { day: 'Tuesday', start: '19:00', end: '23:00', kind: 'opendecks' },
  3: { day: 'Wednesday', start: '19:00', end: '23:00', kind: 'opendecks' },
  4: { day: 'Thursday', start: '19:00', end: '23:00', kind: 'session' },
  5: { day: 'Friday', start: '20:00', end: '00:00', kind: 'session' },
  6: { day: 'Saturday', start: '20:00', end: '00:00', kind: 'session' },
}
export const sessionFor = (dateStr) => SESSIONS[new Date(dateStr + 'T00:00:00').getDay()]
export const kindFor = (dateStr) => sessionFor(dateStr)?.kind || 'session'
export const SET_TYPES = [
  { value: 'dj_set', label: 'Full DJ set' },
  { value: 'records', label: 'Record selections' },
  { value: 'listening', label: 'Album listening party' },
]
export const setTypeLabel = (v) => (SET_TYPES.find(s => s.value === v) || {}).label || v
export const fmtDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
export const timeLabel = (s) => s ? `${s.start.replace(':00', '')}${Number(s.start.slice(0, 2)) < 12 ? 'am' : 'pm'}–${s.end === '00:00' ? '12am' : s.end.replace(':00', '') + 'pm'}` : ''

// Decode an image File → downscaled JPEG data URL (keeps uploads small).
// Tries createImageBitmap (broad format support + correct orientation), falls
// back to <img>. Throws a friendly error for formats the browser can't read
// (e.g. a HEIC photo opened on a desktop browser).
export async function resizeImage(file, maxPx = 1000, quality = 0.85) {
  let src
  try {
    src = await createImageBitmap(file)
  } catch {
    src = await new Promise((res, rej) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => { URL.revokeObjectURL(url); res(img) }
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Couldn't read that photo — please use a JPG or PNG. (iPhone 'HEIC' photos may not work on a computer.)")) }
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
