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

// The 3 weekly sessions (JS getDay: Thu=4, Fri=5, Sat=6).
export const SESSIONS = {
  4: { day: 'Thursday', start: '19:00', end: '23:00' },
  5: { day: 'Friday', start: '20:00', end: '00:00' },
  6: { day: 'Saturday', start: '20:00', end: '00:00' },
}
export const sessionFor = (dateStr) => SESSIONS[new Date(dateStr + 'T00:00:00').getDay()]
export const fmtDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
export const timeLabel = (s) => s ? `${s.start.replace(':00', '')}${Number(s.start.slice(0, 2)) < 12 ? 'am' : 'pm'}–${s.end === '00:00' ? '12am' : s.end.replace(':00', '') + 'pm'}` : ''

// Shrink an image File to <=maxPx and return a JPEG data URL (keeps uploads small).
export function resizeImage(file, maxPx = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale)
      const c = document.createElement('canvas'); c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}
