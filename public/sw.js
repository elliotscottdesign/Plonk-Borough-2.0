// No Dice service worker — installability + SAFE offline caching + web push.
//
// History: v1 deliberately did NO caching ("this app ships often — a caching SW
// would risk serving a stale build"). That guarantee is KEPT: everything except
// content-hashed bundles is fetched NETWORK-FIRST, so whenever the device is
// online it always gets the newest build, exactly as before.
//
// What's new (till lane, 20 Aug 2026 — the till must not die with the wifi):
//   • /assets/*  → cache-first. Vite fingerprints these filenames per build, so
//     a cached copy can never be stale — a new build has new names.
//   • everything else same-origin (and Google Fonts) → network-first, with the
//     last good copy saved and used ONLY when the network fails.
//   • offline navigation falls back to the cached app shell, so the installed
//     app OPENS with no internet and the till keeps ringing (orders live on the
//     device until sync — see docs/till-architecture.md).
// Cross-origin API calls (Supabase) are never touched or cached.

const CACHE = 'nd-cache-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k)
  await self.clients.claim()
})()))

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const sameOrigin = url.origin === self.location.origin
  const isFont = FONT_HOSTS.includes(url.hostname)
  if (!sameOrigin && !isFont) return              // e.g. Supabase — straight through

  // Content-hashed bundles + fonts: immutable → cache-first.
  if ((sameOrigin && url.pathname.startsWith('/assets/')) || isFont) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE)
      const hit = await cache.match(req)
      if (hit) return hit
      const res = await fetch(req)
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone())
      return res
    })())
    return
  }

  // Everything else same-origin: NETWORK-FIRST (never stale when online),
  // cached copy only as the offline fallback.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    try {
      const res = await fetch(req)
      if (res.ok) {
        cache.put(req, res.clone())
        // Keep a canonical shell copy so ANY offline navigation can boot the app.
        if (req.mode === 'navigate') cache.put('/index.html', res.clone())
      }
      return res
    } catch (_) {
      const hit = await cache.match(req)
      if (hit) return hit
      if (req.mode === 'navigate') {
        const shell = await cache.match('/index.html')
        if (shell) return shell
      }
      throw _
    }
  })())
})

// ── Web push (generic — used by the toilet-hygiene reminders; reusable by any
//    future feature) ─────────────────────────────────────────────────────────
// We send DATALESS pushes (VAPID auth only, no encrypted payload) — the server
// only pushes when a reminder is actually outstanding, so any push we receive
// means "still due". If a JSON payload is ever attached later, we honour it.
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} }
  catch (_) { try { data = { body: event.data && event.data.text() } } catch (_) { data = {} } }

  const title = data.title || '🚻 Toilet hygiene check due'
  const options = {
    body: data.body || 'Tap when the toilets have been checked & cleaned.',
    tag: data.tag || 'toilet-check',   // replaces the previous reminder rather than stacking
    renotify: true,
    requireInteraction: true,          // stays on screen until acted on
    icon: data.icon || '/app-icon-192.png',
    badge: data.badge || '/app-icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/toilets' },
  }
  // iOS/Safari require every push to show a notification — always do so.
  event.waitUntil(self.registration.showNotification(title, options))
})

// Tapping the reminder focuses an open /toilets tab, or opens one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/toilets'
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of wins) {
      if (c.url.includes('/toilets') && 'focus' in c) return c.focus()
    }
    if (self.clients.openWindow) return self.clients.openWindow(url)
  })())
})
