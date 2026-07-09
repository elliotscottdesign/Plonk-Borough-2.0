import React, { useState, useEffect } from 'react'

// ─── "Add to Home Screen" helper ─────────────────────────────────────────────
// Turns the sign-in page into a one-tap phone app icon. Shown on /today so staff
// can pin No Dice to their home screen straight from the WhatsApp link.
//   • Android/Chrome: captures the native install prompt → one-tap "Add".
//   • iPhone/Safari: no programmatic prompt exists, so we show the Share → "Add
//     to Home Screen" steps.
// Hidden once the app is already installed (running standalone), and dismissible
// (remembered per phone) so it never nags.

const DISMISS_KEY = 'nd_a2hs_dismissed'
const RED = '#DA1B33'

const isStandalone = () =>
  (typeof window !== 'undefined') &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)
const isIOS = () =>
  (typeof navigator !== 'undefined') &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream

// The iOS Share glyph (square with an up-arrow), drawn inline so the steps are unmistakable.
const ShareGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', margin: '0 2px' }}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
)

export default function AddToHome() {
  const [deferred, setDeferred] = useState(null)
  const [show, setShow] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    if (isStandalone()) return                       // already added — nothing to prompt
    try { if (localStorage.getItem(DISMISS_KEY)) return } catch { /* ignore */ }
    if (isIOS()) { setIos(true); setShow(true); return }
    const onBip = (e) => { e.preventDefault(); setDeferred(e); setShow(true) }
    window.addEventListener('beforeinstallprompt', onBip)
    // If it gets installed while open, hide the prompt.
    const onInstalled = () => setShow(false)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  if (!show) return null

  const dismiss = () => { setShow(false); try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ } }
  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    try { await deferred.userChoice } catch { /* ignore */ }
    setDeferred(null); dismiss()
  }

  return (
    <div style={{ position: 'relative', background: '#101018', border: `1px solid ${RED}`, borderRadius: 14, padding: '14px 14px 14px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <img src="/apple-touch-icon.png" alt="No Dice" width="42" height="42" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.45, color: 'rgba(255,255,255,0.85)' }}>
        {ios ? (
          <>Add <strong style={{ color: '#fff' }}>No Dice</strong> to your home screen — tap<ShareGlyph /><strong style={{ color: '#fff' }}>Share</strong>, then <strong style={{ color: '#fff' }}>Add to Home Screen</strong>.</>
        ) : (
          <>Add <strong style={{ color: '#fff' }}>No Dice</strong> to your phone — one tap to sign in every shift.</>
        )}
      </div>
      {!ios && (
        <button onClick={install} style={{ flexShrink: 0, background: RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 15px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Add</button>
      )}
      <button onClick={dismiss} aria-label="Dismiss" style={{ flexShrink: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: '2px 4px' }}>✕</button>
    </div>
  )
}
