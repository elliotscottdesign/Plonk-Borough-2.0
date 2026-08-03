// Minimal service worker — makes No Dice an installable app in Chrome
// (Android & desktop Chrome/Edge). It deliberately does NO caching: every
// request goes straight to the network, so staff always get the latest version
// (this app ships often — a caching SW would risk serving a stale build). Its
// only job is to exist with a real fetch handler, which is what Chrome looks for
// before it offers "Install app" / fires the install prompt.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  // Network pass-through — never cache.
  event.respondWith(fetch(event.request))
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
