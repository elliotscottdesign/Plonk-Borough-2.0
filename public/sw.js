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
