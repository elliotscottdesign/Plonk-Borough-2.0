import React, { useState, useEffect } from 'react'

// "Save to your phone" for the DJ portal. Unlike the staff one this deliberately
// shows the MANUAL Add-to-Home-Screen steps (not the Android auto-install prompt),
// because the DJ's page carries their personal ?t=token — the manual flow bookmarks
// the exact current URL (token kept), whereas a PWA install would open the app's
// generic start page and lose the token. Dismissible + hidden once installed.

const DISMISS_KEY = 'nd_dj_a2hs_dismissed'
const RED = '#DA1B33', CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'

const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)
// iPadOS 13+ Safari reports a desktop Mac UA, so also treat a touch "MacIntel" as iOS.
const isIOS = () => typeof navigator !== 'undefined' && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)) && !window.MSStream

const ShareGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', margin: '0 2px' }}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
  </svg>
)

export default function DJAddToHome() {
  const [show, setShow] = useState(false)
  const [ios, setIos] = useState(false)
  useEffect(() => {
    if (isStandalone()) return
    try { if (localStorage.getItem(DISMISS_KEY)) return } catch { /* ignore */ }
    setIos(isIOS()); setShow(true)
  }, [])
  if (!show) return null
  const dismiss = () => { try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ } setShow(false) }
  return (
    <div style={{ background: 'rgba(218,27,51,0.08)', border: `1px solid ${RED}55`, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 22, lineHeight: 1 }}>📲</div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
        <strong style={{ color: '#fff' }}>Save this to your phone</strong> — one tap gets you back to your profile & the open nights any time.
        <div style={{ marginTop: 5, color: 'rgba(255,255,255,0.7)' }}>
          {ios
            ? <>Tap <strong style={{ color: '#fff' }}>Share <ShareGlyph /></strong> then <strong style={{ color: '#fff' }}>Add to Home Screen</strong>.</>
            : <>Tap the browser menu <strong style={{ color: '#fff' }}>⋮</strong> then <strong style={{ color: '#fff' }}>Add to Home screen</strong>.</>}
        </div>
      </div>
      <button onClick={dismiss} title="Dismiss" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>✕</button>
    </div>
  )
}
