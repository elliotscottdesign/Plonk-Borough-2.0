import React, { useEffect, useState } from 'react'

// Landing — public-facing page at nodice.bar/ (the root).
//
// Mounts ONLY for unauthenticated users hitting the root path. The
// investor deck (formerly here) now lives at /borough behind the
// PasswordGate. Hackney's deck stays at /hackney.
//
// What's on the page:
//   • Two-cube dice logo in red on black (inline SVG; can be replaced
//     by dropping /public/nodice-logo.png — the <img> falls back to
//     the SVG when the PNG is absent, no rebuild needed)
//   • Headline: "OPEN 28/5"
//   • Subhead: "FKA PLONK · E8 3PH"
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

const SIGNUP_SYNC_URL  = '' // ← paste deployed Apps Script URL here
const FOUNDER_EMAIL    = 'elliotscottdesign@gmail.com'
const BRAND_RED        = '#FF3D1F'
const INK              = '#000000'

export default function Landing() {
  // Make sure the dark background paints the whole viewport, even
  // outside our component's box.
  useEffect(() => {
    const prevBg   = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = INK
    document.body.style.color      = '#FFFFFF'
    document.title = 'No Dice — London Fields · OPEN 28/5'
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

      {/* Logo */}
      <div style={{ width: 'min(280px, 60vw)', marginBottom: 36 }}>
        <DiceLogo />
      </div>

      {/* OPEN 28/5 — the headline */}
      <h1
        className="serif"
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(3rem, 12vw, 7.5rem)',
          lineHeight: 0.95,
          letterSpacing: '0.02em',
          color: BRAND_RED,
          margin: '0 0 14px 0',
          textAlign: 'center',
          textTransform: 'uppercase',
          fontWeight: 400,
        }}
      >
        Open 28 / 5
      </h1>

      {/* FKA PLONK · E8 3PH */}
      <div style={{
        fontSize: 'clamp(0.85rem, 1.6vw, 1rem)',
        letterSpacing: '0.32em',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        marginBottom: 56,
        textAlign: 'center',
        opacity: 0.92,
      }}>
        FKA Plonk · E8 3PH
      </div>

      {/* Email signup */}
      <SignupForm />

      {/* Tiny investor-area shortcut (bottom-right) */}
      <a
        href="/borough"
        style={{
          position: 'absolute',
          bottom: 16,
          right: 20,
          fontSize: 10,
          color: 'rgba(255,255,255,0.35)',
          textDecoration: 'none',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        Investor area →
      </a>
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
        'Add me to the No Dice waitlist for the 28/5 opening.\n\nEmail: ' + email.trim()
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
        border: '1px solid rgba(255,61,31,0.45)',
        borderRadius: 10,
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: BRAND_RED, marginBottom: 8, fontWeight: 700 }}>
          You're on the list
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
          We'll let you know the moment doors open. 28 / 5.
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
            background: isValidEmail ? BRAND_RED : 'rgba(255,61,31,0.35)',
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
// Two hand-drawn isometric cubes in red, sitting side-by-side with the
// right cube slightly behind & overlapping. Renders inline so the page
// works with no asset uploads. If a designer drops a final PNG at
// /public/nodice-logo.png, swap this <DiceLogo /> for <img src="/nodice-logo.png" />.

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
