import React, { useEffect, useState } from 'react'
import { insertSubscriber, BACKEND_READY } from '../marketing/data/backend.js'

// NewsletterPopup — first-visit email-capture overlay for the public landing.
//
// Mounted inside Landing.jsx (so it only ever shows on the public root page —
// never on /ops, /marketing, /borough, /hackney, which all return before the
// Landing fallback in App.jsx).
//
// Writes straight into the central Supabase `subscribers` table via
// insertSubscriber() — the SAME list the /marketing Newsletter sends to.
// Tagged source:'landing-popup' so we can see where each signup came from.
//
// Behaviour, modelled on CookieBanner.jsx:
//   • Shows once. After a signup OR a dismiss we store a flag in localStorage
//     and never prompt again (key: nodice_newsletter_popup_v1).
//   • Appears after a short delay so it doesn't slam the visitor (and lets
//     them deal with the cookie banner first). zIndex 1100 = above cookies.
//   • Renders null until storage is read → no flash for returning visitors.

const KEY = 'nodice_newsletter_popup_v1'
const BRAND_RED = '#DA1B33'
const SHOW_AFTER_MS = 4500

function alreadyHandled() {
  try { return !!JSON.parse(localStorage.getItem(KEY) || 'null')?.done } catch { return false }
}
function markHandled(how) {
  try { localStorage.setItem(KEY, JSON.stringify({ done: true, how, ts: new Date().toISOString() })) } catch { /* private mode */ }
}

export default function NewsletterPopup() {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // 'idle' | 'sending' | 'ok' | 'err'
  const [error, setError] = useState('')

  // Decide whether to show, after a delay, on first paint only.
  useEffect(() => {
    if (alreadyHandled()) return
    const t = setTimeout(() => { if (!alreadyHandled()) setShow(true) }, SHOW_AFTER_MS)
    return () => clearTimeout(t)
  }, [])

  if (!show) return null

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const close = () => { markHandled('dismissed'); setShow(false) }

  const submit = async (e) => {
    e.preventDefault()
    if (!isValidEmail || state === 'sending') return
    setState('sending'); setError('')
    if (!BACKEND_READY) { markHandled('signup'); setState('ok'); return }
    try {
      await insertSubscriber({ email: email.trim(), source: 'landing-popup', consent: true })
      markHandled('signup')
      setState('ok')
    } catch (err) {
      setState('err'); setError(err.message || 'Network error')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Join the No Dice list"
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(0,0,0,0.78)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(440px, calc(100vw - 32px))',
          background: '#0A0A0A',
          border: '1px solid rgba(218,27,51,0.45)',
          borderRadius: 14,
          padding: '34px 28px 28px',
          boxShadow: '0 18px 60px rgba(0,0,0,0.7)',
          color: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        {/* Close (×) */}
        <button
          onClick={close}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 22,
            lineHeight: 1,
            cursor: 'pointer',
            padding: 6,
            fontFamily: 'inherit',
          }}
        >
          ×
        </button>

        {state === 'ok' ? (
          <>
            <div style={{ fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: BRAND_RED, fontWeight: 700, marginBottom: 10 }}>
              You're on the list
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, marginBottom: 18 }}>
              Thanks — we'll be in touch with opening news, events and the odd very good drink.
            </div>
            <button
              onClick={close}
              style={{
                padding: '11px 24px', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
                fontWeight: 700, background: BRAND_RED, color: '#FFFFFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Done
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: BRAND_RED, fontWeight: 700, marginBottom: 10 }}>
              Join the list
            </div>
            <h2 className="serif" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', margin: '0 0 8px', color: '#FFFFFF', lineHeight: 1.1 }}>
              Don't miss the opening
            </h2>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55, marginBottom: 20 }}>
              Opening news, events and new drinks at No Dice, London Fields — straight to your inbox.
            </div>

            <form onSubmit={submit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                required
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '14px 16px', fontSize: 15, borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)', color: '#FFFFFF',
                  outline: 'none', fontFamily: 'inherit', marginBottom: 10, textAlign: 'center', letterSpacing: '0.02em',
                }}
              />
              <button
                type="submit"
                disabled={!isValidEmail || state === 'sending'}
                style={{
                  width: '100%', padding: '14px 16px', fontSize: 13, borderRadius: 8,
                  background: isValidEmail ? BRAND_RED : 'rgba(218,27,51,0.45)', color: '#FFFFFF', border: 'none',
                  cursor: isValidEmail ? 'pointer' : 'default', fontWeight: 700, letterSpacing: '0.18em',
                  textTransform: 'uppercase', fontFamily: 'inherit', transition: 'background 0.15s',
                }}
              >
                {state === 'sending' ? 'Joining…' : 'Sign me up'}
              </button>
            </form>

            {state === 'err' && (
              <div style={{ marginTop: 10, fontSize: 12, color: BRAND_RED }}>
                Couldn't sign you up — {error}. Please try again.
              </div>
            )}

            <button
              onClick={close}
              style={{
                marginTop: 14, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              No thanks
            </button>

            <div style={{ marginTop: 14, fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, letterSpacing: '0.04em' }}>
              By signing up you agree to receive emails from No Dice. Unsubscribe any time.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
