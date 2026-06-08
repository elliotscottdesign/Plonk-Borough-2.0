import React, { useEffect, useState } from 'react'
import CookieBanner from './components/CookieBanner.jsx'
import NewsletterPopup from './components/NewsletterPopup.jsx'
import { insertSubscriber, BACKEND_READY } from './marketing/data/backend.js'

// Landing — public-facing page at nodice.bar/ (the root).
//
// Mounts ONLY for unauthenticated users hitting the root path. The
// investor deck (formerly here) now lives at /borough behind the
// PasswordGate. Hackney's deck stays at /hackney.
//
// What's on the page:
//   • "No Dice" wordmark in red on black (PNG at /public/nodice-wordmark.png) — hero
//   • Supporting line: "OPENS 4 / 6"
//   • Subhead: "407 Mentmore Terrace, Hackney, E8 3PH"
//   • Email signup form
//   • Tiny "Investor area" link bottom-right that routes to /borough
//
// Email signup wiring:
//   • POSTs { email, ts, ua } to SIGNUP_SYNC_URL (an Apps Script web app)
//   • If SIGNUP_SYNC_URL is empty, the form still "works" from the user's
//     perspective — falls back to a mailto: open so the email lands in
//     the founder's inbox manually. Set the URL after deploying
//     infra/signup-apps-script.gs.
//   • No external dependencies (no Formspree, no Mailchimp).

const SIGNUP_SYNC_URL  = 'https://script.google.com/macros/s/AKfycbwLehtnnnSy3e8H7_9Vxs7VIHeQGD4_LV6-G7h8ZnZA8tCCg2m2h7o86UoyNSB7XD7C/exec'
const FOUNDER_EMAIL    = 'elliotscottdesign@gmail.com'
const BRAND_RED        = '#DA1B33'   // sampled from the No Dice wordmark artwork (cherry red)
const INK              = '#000000'

export default function Landing() {
  // Make sure the dark background paints the whole viewport, even
  // outside our component's box.
  useEffect(() => {
    const prevBg   = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = INK
    document.body.style.color      = '#FFFFFF'
    document.title = 'No Dice — London Fields · OPENS 17 JUNE'
    return () => {
      document.body.style.background = prevBg
      document.body.style.color      = prevColor
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: INK,
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* "No Dice" wordmark — hero element, sized larger now that the
          dice cubes have been removed from the lockup. PNG in /public. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
        <img
          src="/nodice-wordmark.png"
          alt="No Dice"
          style={{ width: 'min(560px, 88vw)', height: 'auto', display: 'block' }}
        />
      </div>

      {/* OPENS 17 JUNE — supporting line, set smaller than the wordmark.
          (Originally launched as "4 / 6"; pushed to 17 June to line up
          with the World Cup opening England fixture.) */}
      <h1
        style={{
          fontFamily: "'Bebas Neue', 'Impact', sans-serif",
          fontSize: 'clamp(1.4rem, 4vw, 2.6rem)',
          lineHeight: 1,
          letterSpacing: '0.08em',
          color: BRAND_RED,
          margin: '0 0 10px 0',
          textAlign: 'center',
          textTransform: 'uppercase',
          fontWeight: 400,
        }}
      >
        Opens 17 June
      </h1>

      {/* 407 Mentmore Terrace, Hackney, E8 3PH */}
      <div style={{
        fontSize: 'clamp(0.65rem, 1.1vw, 0.78rem)',
        letterSpacing: '0.32em',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        marginBottom: 56,
        textAlign: 'center',
        opacity: 0.85,
      }}>
        407 Mentmore Terrace, Hackney, E8 3PH
      </div>

      {/* Email signup */}
      <SignupForm />

      {/* Footer links — bottom cluster. Sits above the cookie banner
          (which floats centred at bottom) so they never overlap. */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 18,
        flexWrap: 'wrap',
        padding: '0 20px',
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}>
        <a href="/privacy" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Privacy</a>
        <a href="/terms"   style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Terms</a>
        <button
          onClick={() => {
            const reopen = window.__nodiceReopenCookieBanner
            if (typeof reopen === 'function') reopen()
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.35)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontFamily: 'inherit',
          }}
        >
          Cookie settings
        </button>
        <a
          href="/borough"
          style={{
            color: 'rgba(255,255,255,0.35)',
            textDecoration: 'none',
          }}
        >
          Investor area →
        </a>
      </div>

      {/* GDPR cookie / privacy banner — first visit only, persists choice */}
      <CookieBanner />

      {/* First-visit newsletter popup → writes to the central Supabase list */}
      <NewsletterPopup />
    </div>
  )
}

// ─── Email signup form ─────────────────────────────────────────────────

function SignupForm() {
  const [email, setEmail]     = useState('')
  const [state, setState]     = useState('idle')   // 'idle' | 'sending' | 'ok' | 'err'
  const [error, setError]     = useState('')

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const submit = async (e) => {
    e.preventDefault()
    if (!isValidEmail || state === 'sending') return
    setState('sending'); setError('')

    // Add to the central subscriber list (Supabase) — fire-and-forget so it
    // never slows or blocks the signup. The Apps Script notification below
    // still runs regardless (founder gets the per-signup email ping).
    if (BACKEND_READY) {
      insertSubscriber({ email: email.trim(), source: 'landing', consent: true }).catch(() => {})
    }

    if (SIGNUP_SYNC_URL) {
      try {
        // Apps Script web apps don't accept JSON content-type without a
        // preflight CORS dance — use text/plain like the existing
        // lock-sync + notes endpoints.
        const res = await fetch(SIGNUP_SYNC_URL, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            email: email.trim(),
            ts: new Date().toISOString(),
            ua: navigator.userAgent,
            ref: document.referrer || '',
          }),
        })
        if (!res.ok) throw new Error('HTTP ' + res.status)
        setState('ok')
      } catch (err) {
        setState('err'); setError(err.message || 'Network error')
      }
    } else {
      // Endpoint not configured yet — fall back to a mailto so the
      // signup still reaches the founder while the Apps Script is
      // being deployed. The user's mail client opens with the form
      // pre-filled; one click + send and we're done.
      const subject = encodeURIComponent('No Dice · waitlist signup')
      const body    = encodeURIComponent(
        'Add me to the No Dice waitlist for the 17 June opening.\n\nEmail: ' + email.trim()
      )
      window.location.href = `mailto:${FOUNDER_EMAIL}?subject=${subject}&body=${body}`
      setState('ok')
    }
  }

  if (state === 'ok') {
    return (
      <div style={{
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
        padding: '20px 24px',
        border: '1px solid rgba(218,27,51,0.45)',
        borderRadius: 10,
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: BRAND_RED, marginBottom: 8, fontWeight: 700 }}>
          You're on the list
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
          We'll let you know the moment doors open. 17 June.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
      <div style={{
        fontSize: 11,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 14,
        fontWeight: 600,
      }}>
        Get the opening night details
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
          required
          style={{
            flex: '1 1 240px',
            minWidth: 0,
            padding: '14px 18px',
            fontSize: 15,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#FFFFFF',
            outline: 'none',
            fontFamily: 'inherit',
            letterSpacing: '0.02em',
          }}
        />
        <button
          type="submit"
          disabled={!isValidEmail || state === 'sending'}
          style={{
            padding: '14px 26px',
            fontSize: 13,
            borderRadius: 8,
            background: isValidEmail ? BRAND_RED : 'rgba(218,27,51,0.45)',
            color: '#FFFFFF',
            border: 'none',
            cursor: isValidEmail ? 'pointer' : 'default',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
        >
          {state === 'sending' ? 'Sending…' : 'Notify me'}
        </button>
      </div>

      {state === 'err' && (
        <div style={{ marginTop: 12, fontSize: 12, color: BRAND_RED }}>
          Couldn't send — {error}. Try again, or email {FOUNDER_EMAIL}.
        </div>
      )}

      <div style={{
        marginTop: 14,
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}>
        One email. No spam.
      </div>
    </form>
  )
}

// ─── Dice logo ─────────────────────────────────────────────────────────
// Primary path: <DiceLogoImg /> renders the real hand-drawn PNG that
// sits at /public/nodice-logo.png. If the asset 404s for any reason
// (CDN hiccup, bad deploy), we transparently fall back to the inline
// SVG <DiceLogo /> below so the page never paints empty.

function DiceLogoImg() {
  const [errored, setErrored] = React.useState(false)
  if (errored) return <DiceLogo />
  return (
    <img
      src="/nodice-logo.png"
      alt="No Dice"
      onError={() => setErrored(true)}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  )
}

// SVG fallback — two hand-drawn isometric cubes in red, sitting
// side-by-side with the right cube slightly behind & overlapping.
function DiceLogo() {
  const stroke = BRAND_RED
  const sw     = 14         // stroke width — chunky like the source sketch
  const cap    = 'round'
  const join   = 'round'

  // Cube generator. (cx, cy) = centre of front face. size = front-face side.
  // depth = isometric depth offset (top-right shear). The strokes deliberately
  // overshoot each corner by 2-3px to mimic the hand-drawn original.
  const Cube = ({ cx, cy, size, depth, overshoot = 2 }) => {
    const s  = size
    const d  = depth
    const o  = overshoot
    // Front face corners
    const fL = cx - s / 2, fR = cx + s / 2
    const fT = cy - s / 2, fB = cy + s / 2
    // Back-top corners (front face shifted up-right by depth)
    const bT = fT - d
    const bL = fL + d
    const bR = fR + d
    return (
      <g fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap={cap} strokeLinejoin={join}>
        {/* Front face — overshooting corners */}
        <path d={`M ${fL - o} ${fB + o} L ${fR + o} ${fB} L ${fR} ${fT - o} L ${fL - o} ${fT + o} Z`} />
        {/* Top face */}
        <path d={`M ${fL} ${fT} L ${fR + o} ${fT} L ${bR + o} ${bT - o} L ${bL - o} ${bT + o} Z`} />
        {/* Right face */}
        <path d={`M ${fR} ${fT} L ${bR} ${bT} L ${bR + o} ${bT + s - o} L ${fR + o} ${fB} Z`} />
      </g>
    )
  }

  return (
    <svg viewBox="0 0 600 540" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }} aria-label="No Dice logo">
      {/* Left cube — slightly forward, slightly lower */}
      <Cube cx={210} cy={330} size={240} depth={70} overshoot={3} />
      {/* Right cube — back-right, raised */}
      <Cube cx={420} cy={260} size={220} depth={68} overshoot={3} />
    </svg>
  )
}
