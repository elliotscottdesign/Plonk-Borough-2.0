import React, { useState, useEffect } from 'react'
import { TOURNAMENT, PACKAGES } from './data.js'

// Public, customer-facing World Cup 2026 bookings HOLDING page.
// Served at nodice.bar/world-cup (no gate — see App.jsx). This is the
// "bookings opening soon" page: it previews the packages + community
// nights, foreshadows the booking flow, and captures emails for the
// waitlist. The live tickets/slots/availability/Stripe flow (mirroring
// the Plonk Golf booking system) lands here later — this page is the
// placeholder until then.
//
// Distinct from src/worldcup/WorldCupPage.jsx, which is the FOUNDER-only
// planning sheet at /worldcup (888999-gated). This page deliberately
// shows only customer-safe copy — no TENs, staffing, licensing or
// internal sell-out targets.

// Reuses the same Apps Script endpoint as the homepage signup form
// (infra/signup-apps-script.gs). World Cup signups are tagged in the
// `ref` field so the founder can tell them apart in the Signups sheet.
const SIGNUP_SYNC_URL = 'https://script.google.com/macros/s/AKfycbwLehtnnnSy3e8H7_9Vxs7VIHeQGD4_LV6-G7h8ZnZA8tCCg2m2h7o86UoyNSB7XD7C/exec'
const FOUNDER_EMAIL   = 'elliotscottdesign@gmail.com'

const BG      = '#000000'
const PANEL   = '#101014'
const RED     = '#DA1B33'   // No Dice brand red (sampled from the wordmark)
const CREAM   = '#F5F0E8'
const WHITE   = '#FFFFFF'
const MUTED   = 'rgba(255,255,255,0.60)'
const FAINT   = 'rgba(255,255,255,0.40)'
const LINE    = 'rgba(255,255,255,0.12)'

function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00Z')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })
}

export default function WorldCupBookings() {
  // Paint the whole viewport black + set page metadata. Kept noindex —
  // this is a soft-launch holding page, not yet for search engines.
  useEffect(() => {
    const prevBg    = document.body.style.background
    const prevColor = document.body.style.color
    const prevTitle = document.title
    document.body.style.background = BG
    document.body.style.color      = WHITE
    document.title = 'No Dice Borough — World Cup 2026 Bookings'

    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex,nofollow'
    document.head.appendChild(robots)

    return () => {
      document.body.style.background = prevBg
      document.body.style.color      = prevColor
      document.title = prevTitle
      document.head.removeChild(robots)
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: BG, color: WHITE, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: `1px solid ${LINE}`, padding: '28px 24px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <img
            src="/nodice-wordmark.png"
            alt="No Dice"
            style={{ width: 'min(280px, 64vw)', height: 'auto', display: 'block', margin: '0 auto 28px' }}
          />

          <div style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: MUTED, marginBottom: 18 }}>
            No Dice Borough · Borough Market
          </div>

          <h1 style={{
            fontFamily: "'Bebas Neue', 'Impact', sans-serif",
            fontSize: 'clamp(2.8rem, 11vw, 6.5rem)',
            lineHeight: 0.92,
            letterSpacing: '0.02em',
            margin: '0 0 6px',
            color: WHITE,
            textTransform: 'uppercase',
          }}>
            World Cup<br /><span style={{ color: RED }}>2026</span>
          </h1>

          <div style={{ fontSize: 'clamp(0.8rem, 2.4vw, 1.05rem)', letterSpacing: '0.14em', textTransform: 'uppercase', color: CREAM, marginTop: 14 }}>
            {formatDate(TOURNAMENT.start)} – {formatDate(TOURNAMENT.end)} · {TOURNAMENT.host}
          </div>

          <p style={{ maxWidth: 540, margin: '24px auto 30px', fontSize: 15, lineHeight: 1.65, color: MUTED }}>
            Every match, live on the big screens — in the heart of Borough Market. Reserve a
            table, book a package, or grab a spot for the nights that matter. Online bookings
            open soon.
          </p>

          {/* Status pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '10px 20px', borderRadius: 999,
            border: `1px solid ${RED}`, background: 'rgba(218,27,51,0.08)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: RED, boxShadow: `0 0 0 4px rgba(218,27,51,0.18)` }} />
            <span style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE, fontWeight: 600 }}>
              Bookings open soon
            </span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1040, margin: '0 auto', padding: '0 24px' }}>

        {/* ─── Waitlist ───────────────────────────────────────────────── */}
        <section style={{ padding: '52px 0', borderBottom: `1px solid ${LINE}` }}>
          <div style={{
            maxWidth: 560, margin: '0 auto', textAlign: 'center',
            background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: '36px 28px',
          }}>
            <h2 className="serif" style={{ fontSize: 28, color: WHITE, margin: '0 0 8px' }}>Be first to book</h2>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: '0 0 24px' }}>
              England nights and the knockouts will sell out. Join the list and we'll email
              you the moment tables and packages go live — before they're announced anywhere else.
            </p>
            <WaitlistForm />
          </div>
        </section>

        {/* ─── How it will work ───────────────────────────────────────── */}
        <section style={{ padding: '52px 0', borderBottom: `1px solid ${LINE}` }}>
          <SectionHeading kicker="The plan" title="How booking will work" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginTop: 28 }}>
            {[
              { n: '01', t: 'Pick your match', d: 'Choose the fixture and kick-off slot you want to watch — from group-stage nights to the Final.' },
              { n: '02', t: 'Choose a table or package', d: 'Reserve a table for your group or upgrade to a match package with drinks and sharing food included.' },
              { n: '03', t: 'Secure it online', d: 'Pay securely to lock in your spot. Instant confirmation — no phone calls, no waiting.' },
            ].map(step => (
              <div key={step.n} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: 22 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, color: RED, lineHeight: 1 }}>{step.n}</div>
                <div className="serif" style={{ fontSize: 19, color: WHITE, margin: '8px 0 6px' }}>{step.t}</div>
                <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6 }}>{step.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Packages ───────────────────────────────────────────────── */}
        <section style={{ padding: '52px 0', borderBottom: `1px solid ${LINE}` }}>
          <SectionHeading kicker="The menu" title="Match-night packages" />
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 560, marginTop: 12 }}>
            A taste of what you'll be able to book. Final pricing and availability confirmed when bookings open.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 28 }}>
            {PACKAGES.map(p => <PackageCard key={p.id} p={p} />)}
          </div>
        </section>

        {/* ─── Closing CTA ────────────────────────────────────────────── */}
        <section style={{ padding: '60px 0', textAlign: 'center' }}>
          <h2 className="serif" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', color: WHITE, margin: '0 0 12px' }}>
            Don't miss kick-off
          </h2>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 28px' }}>
            Bookings open soon. Get on the list now so you're ready when tables go live.
          </p>
          <a
            href="#waitlist-top"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            style={{
              display: 'inline-block', padding: '15px 34px', borderRadius: 999,
              background: RED, color: WHITE, textDecoration: 'none',
              fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
            }}
          >
            Join the waitlist
          </a>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${LINE}`, padding: '28px 24px 40px' }}>
        <div style={{
          maxWidth: 1040, margin: '0 auto', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 16,
        }}>
          <a href="/" style={{ fontSize: 11, color: FAINT, letterSpacing: '0.14em', textDecoration: 'none', textTransform: 'uppercase' }}>← nodice.bar</a>
          <div style={{ display: 'flex', gap: 18, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            <a href="/privacy" style={{ color: FAINT, textDecoration: 'none' }}>Privacy</a>
            <a href="/terms" style={{ color: FAINT, textDecoration: 'none' }}>Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Section heading ───────────────────────────────────────────────────
function SectionHeading({ kicker, title }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: RED, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 8 }}>{kicker}</div>
      <h2 className="serif" style={{ fontSize: 'clamp(1.7rem, 4.5vw, 2.4rem)', color: WHITE, margin: 0, lineHeight: 1.05 }}>{title}</h2>
    </div>
  )
}

// ─── Package card ──────────────────────────────────────────────────────
function PackageCard({ p }) {
  return (
    <div style={{
      background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14,
      padding: 22, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <div className="serif" style={{ fontSize: 21, color: WHITE, lineHeight: 1.1 }}>{p.name}</div>
        <div style={{ fontSize: 16, color: RED, whiteSpace: 'nowrap', fontWeight: 600 }}>{p.price}</div>
      </div>
      <div style={{ fontSize: 10.5, color: FAINT, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {p.forMatch}{p.covers && p.covers !== '—' ? ` · seats ${p.covers}` : ''}
      </div>
      <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, flex: 1 }}>{p.includes}</div>
      <div style={{ fontSize: 10, color: FAINT, letterSpacing: '0.16em', textTransform: 'uppercase', paddingTop: 4 }}>
        Booking opens soon
      </div>
    </div>
  )
}

// ─── Waitlist form ─────────────────────────────────────────────────────
// Mirrors the homepage signup form (Landing.jsx) but tags submissions
// with a worldcup marker in the `ref` field so the founder can filter
// them in the shared Signups sheet. Falls back to a mailto: if the
// endpoint is unset or errors.
function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle')   // 'idle' | 'sending' | 'ok' | 'err'
  const [error, setError] = useState('')

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const submit = async (e) => {
    e.preventDefault()
    if (!isValidEmail || state === 'sending') return
    setState('sending'); setError('')

    const refTag = 'worldcup-bookings' + (document.referrer ? ' · ' + document.referrer : '')

    if (SIGNUP_SYNC_URL) {
      try {
        const res = await fetch(SIGNUP_SYNC_URL, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            email: email.trim(),
            ts: new Date().toISOString(),
            ua: navigator.userAgent,
            ref: refTag,
          }),
        })
        if (!res.ok) throw new Error('HTTP ' + res.status)
        setState('ok')
      } catch (err) {
        setState('err'); setError(err.message || 'Network error')
      }
    } else {
      const subject = encodeURIComponent('No Dice · World Cup bookings waitlist')
      const body    = encodeURIComponent('Add me to the World Cup bookings waitlist.\n\nEmail: ' + email.trim())
      window.location.href = `mailto:${FOUNDER_EMAIL}?subject=${subject}&body=${body}`
      setState('ok')
    }
  }

  if (state === 'ok') {
    return (
      <div style={{ padding: '18px 20px', border: `1px solid ${RED}`, borderRadius: 12, background: 'rgba(218,27,51,0.06)' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: RED, marginBottom: 8, fontWeight: 700 }}>
          You're on the list
        </div>
        <div style={{ fontSize: 14, color: CREAM }}>
          We'll email you the moment World Cup bookings open.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
          required
          style={{
            flex: '1 1 240px', minWidth: 0, padding: '14px 18px', fontSize: 15, borderRadius: 8,
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`, color: WHITE,
            outline: 'none', fontFamily: 'inherit', letterSpacing: '0.02em',
          }}
        />
        <button
          type="submit"
          disabled={!isValidEmail || state === 'sending'}
          style={{
            padding: '14px 26px', fontSize: 13, borderRadius: 8,
            background: isValidEmail ? RED : 'rgba(218,27,51,0.45)', color: WHITE, border: 'none',
            cursor: isValidEmail ? 'pointer' : 'default', fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', fontFamily: 'inherit', transition: 'background 0.15s',
          }}
        >
          {state === 'sending' ? 'Sending…' : 'Notify me'}
        </button>
      </div>

      {state === 'err' && (
        <div style={{ marginTop: 12, fontSize: 12, color: RED }}>
          Couldn't send — {error}. Try again, or email {FOUNDER_EMAIL}.
        </div>
      )}

      <div style={{ marginTop: 14, fontSize: 10, color: FAINT, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        One email when we launch. No spam.
      </div>
    </form>
  )
}
