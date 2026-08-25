// Give the Till its own app identity when the Till tab is open, so
// Safari's Share → Add to Home Screen from this screen installs "No Dice Till"
// (gold icon, opens straight on the register) instead of the generic staff app.
// Everything is restored if the person navigates to another tab, so the staff
// sign-in app installs unchanged from everywhere else.
export function adoptTillAppIdentity() {
  const swap = (selector, attr, value) => {
    const el = document.head.querySelector(selector)
    if (!el) return () => {}
    const prev = el.getAttribute(attr)
    el.setAttribute(attr, value)
    return () => el.setAttribute(attr, prev)
  }
  const undo = [
    swap('link[rel="manifest"]', 'href', '/till-manifest.webmanifest'),
    swap('link[rel="apple-touch-icon"]', 'href', '/till-icon-180.png'),
    swap('meta[name="apple-mobile-web-app-title"]', 'content', 'Till'),
  ]
  return () => undo.forEach(fn => fn())
}
