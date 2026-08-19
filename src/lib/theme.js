// ─── Theme — Auto / Dark / Light for the staff tools ─────────────────────────
// The app is DESIGNED dark. Light mode is produced by inverting the whole page
// (see the filter rule in src/index.css), which is why there is only ever one
// set of colours to maintain.
//
// Until now the choice was made entirely by the DEVICE: staff surfaces were
// flagged data-theme="auto", and any phone reporting prefers-color-scheme:light
// got the inverted (light) treatment with no way to say otherwise. A founder
// whose phone sits on Light — or on Automatic during daylight — therefore never
// saw the dark app at all, no matter what he wanted. (Founder, Aug 2026: "my app
// never shows dark mode… only ever light mode".)
//
// Three settings now:
//   'auto'  — follow the device (the previous behaviour, still the default)
//   'dark'  — always the designed dark look, whatever the phone says
//   'light' — always inverted, whatever the phone says
//
// Stored in localStorage so it survives a reload and the tab closing, and
// applied to <html> BEFORE React mounts so there's no flash of the wrong theme.

export const THEME_KEY = 'ndb_theme'
export const THEMES = ['auto', 'dark', 'light']

// Which paths get a light option at all. The investor decks and public pages are
// designed dark on every device and are deliberately left out.
export const STAFF_SURFACE = /^\/(ops|operations|rota|today|marketing|onaroll)(\/|$)/

export function getTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return THEMES.includes(v) ? v : 'auto'
  } catch { return 'auto' }
}

export function setTheme(v) {
  const next = THEMES.includes(v) ? v : 'auto'
  try { localStorage.setItem(THEME_KEY, next) } catch { /* private mode — session only */ }
  applyTheme()
  return next
}

// Cycle order matches how people expect a 3-state toggle to read.
export function nextTheme(v = getTheme()) {
  return THEMES[(THEMES.indexOf(v) + 1) % THEMES.length]
}

export const THEME_LABEL = { auto: '◑ Auto', dark: '🌙 Dark', light: '☀️ Light' }
export const THEME_HINT = {
  auto: 'Follows your phone',
  dark: 'Always dark',
  light: 'Always light',
}

// Stamp <html>. Non-staff paths get no attribute at all, so they keep the
// designed dark look regardless of the stored preference.
export function applyTheme() {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  if (!STAFF_SURFACE.test(window.location.pathname)) { el.removeAttribute('data-theme'); return }
  el.setAttribute('data-theme', getTheme())
  syncStatusBar()
}

// Point the mobile status bar at whichever shade is actually being shown.
function syncStatusBar() {
  const bar = document.querySelector('meta[name="theme-color"]')
  if (!bar) return
  const t = getTheme()
  const deviceLight = window.matchMedia('(prefers-color-scheme: light)').matches
  const showingLight = t === 'light' || (t === 'auto' && deviceLight)
  bar.setAttribute('content', showingLight ? '#F5F5F0' : '#0A0A0F')
}
