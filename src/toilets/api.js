// No Dice — Toilet-hygiene reminders API (bar lane). Talks to the `toilet-check`
// edge function (same staff-token auth + SEND_SECRET admin gate as rota/kitchen).
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

const FN_URL = `${SUPABASE_URL}/functions/v1/toilet-check`

// VAPID application-server PUBLIC key (safe to ship — the private key lives only in
// the edge-function secrets). Must match the VAPID_PUBLIC_KEY secret on the function.
export const VAPID_PUBLIC_KEY =
  'BKYRAJghoXny0iIGJkyjrJrMP8An-SczB8GvHST8KEzlaWIU1Ww64YTBqu4AArhpvStL0h8VglLAZqrw5gm_RYQ'

async function call(payload) {
  const res = await fetch(FN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// ── Staff (token-authed) ─────────────────────────────────────────────────────
export const toiletStatus = (token) => call({ action: 'status', token })
export const toiletComplete = (token) => call({ action: 'complete', token })
export const toiletUnsubscribe = (token, endpoint) => call({ action: 'unsubscribe', token, endpoint })

// ── Manager (founder, SEND_SECRET-gated — /ops log) ──────────────────────────
export const toiletLog = (days = 14) => call({ action: 'toiletLog', secret: SEND_SECRET, days })

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function pushSupported() {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

// Full opt-in flow: ensure the SW is ready, ask permission, subscribe with the
// VAPID key, and register the subscription against the logged-in staff member.
// Returns { ok:true } or throws an Error with a staff-friendly message.
export async function enableReminders(token) {
  if (!token) throw new Error('Log in on the /today hub first, then come back.')
  if (!pushSupported()) throw new Error('This phone/browser can’t do push notifications.')

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Notifications are blocked — turn them on for this site in your phone settings.')

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }
  await call({
    action: 'subscribe', token,
    subscription: sub.toJSON(),
    userAgent: navigator.userAgent,
  })
  return { ok: true }
}

// Is this phone already opted in (has a live push subscription)?
export async function reminderState() {
  if (!pushSupported()) return { supported: false, permission: 'unsupported', subscribed: false }
  const permission = Notification.permission
  let subscribed = false
  try {
    const reg = await navigator.serviceWorker.ready
    subscribed = !!(await reg.pushManager.getSubscription())
  } catch (_) { /* ignore */ }
  return { supported: true, permission, subscribed }
}
