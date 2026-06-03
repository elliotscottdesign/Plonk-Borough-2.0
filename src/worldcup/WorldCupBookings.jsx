import React, { useState, useEffect } from 'react'
import { TOURNAMENT } from './data.js'

// Public, customer-facing World Cup 2026 bookings page.
// Served at nodice.bar/world-cup (no gate — see App.jsx). Lets visitors
// pick an England match (group stage through to the Final), choose a
// table size (1–4 people), and pre-register their interest. The actual
// reservation-fee charge is taken via Stripe; that plug-in is still in
// development, so until it lands the "Reserve table" button captures
// match + party-size + email via the existing waitlist Apps Script so
// the founder sees per-match demand and can email the secure Stripe
// link the moment it goes live.
//
// Distinct from src/worldcup/WorldCupPage.jsx, which is the FOUNDER-only
// planning sheet at /worldcup (888999-gated).

// Reuses the homepage signup Apps Script endpoint
// (infra/signup-apps-script.gs). Reservations are tagged in the `ref`
// field so the founder can tell them apart in the Signups sheet.
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

// Every England match that can be booked — three confirmed group games
// plus four knockout rounds and the Final. Knockouts are conditional on
// progression; pre-bookings work as transferable deposits per the
// founder strategy (so listing them is correct).
const ENGLAND_MATCHES = [
  {
    id: 'eng-cro', date: '2026-06-17', day: 'Wed',
    title: 'England v Croatia', phase: 'Group L',
    kickoff: '21:00 BST', arrival: '20:00 BST',
    venue: 'AT&T Stadium, Arlington',
    confirmed: true,
  },
  {
    id: 'eng-gha', date: '2026-06-23', day: 'Tue',
    title: 'England v Ghana', phase: 'Group L',
    kickoff: '21:00 BST', arrival: '20:00 BST',
    venue: 'Gillette Stadium, Boston',
    confirmed: true,
  },
  {
    id: 'eng-pan', date: '2026-06-27', day: 'Sat',
    title: 'England v Panama', phase: 'Group L',
    kickoff: '22:00 BST', arrival: '21:00 BST',
    venue: 'MetLife Stadium, New Jersey',
    confirmed: true,
  },
  {
    id: 'eng-r32', date: '2026-07-01', day: 'Wed',
    title: 'England — Round of 32', phase: 'Knockout · R32',
    kickoff: '17:00 BST', arrival: '16:00 BST',
    venue: 'Mercedes-Benz Stadium, Atlanta',
    confirmed: false, note: 'If England top Group L',
  },
  {
    id: 'eng-r16', date: '2026-07-05', day: 'Sun',
    title: 'England — Round of 16', phase: 'Knockout · R16',
    kickoff: '01:00 BST', arrival: '00:00 BST (Sat night)',
    venue: 'Estadio Azteca, Mexico City',
    confirmed: false, note: 'Overnight kick-off — Sat 4 Jul night → Sun 5 Jul',
  },
  {
    id: 'eng-qf', date: '2026-07-11', day: 'Sat',
    title: 'England — Quarter-final', phase: 'Knockout · QF',
    kickoff: '22:00 BST', arrival: '21:00 BST',
    venue: 'Hard Rock Stadium, Miami',
    confirmed: false, note: 'Possible v Brazil — the blockbuster',
    marquee: true,
  },
  {
    id: 'eng-sf', date: '2026-07-15', day: 'Wed',
    title: 'England — Semi-final', phase: 'Knockout · SF',
    kickoff: 'Late BST (TBC)', arrival: '1 hour before',
    venue: 'Mercedes-Benz Stadium, Atlanta',
    confirmed: false, note: 'If England progress',
  },
  {
    id: 'eng-fin', date: '2026-07-19', day: 'Sun',
    title: 'World Cup Final', phase: 'Final',
    kickoff: '20:00 BST', arrival: '19:00 BST',
    venue: 'MetLife Stadium, New Jersey',
    confirmed: true, note: 'England in the Final = the night of all nights',
  },
]

function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00Z')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })
}
function formatDayMonth(iso) {
  const d = new Date(iso + 'T12:00:00Z')
  return {
    day: d.getUTCDate(),
    month: d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' }),
  }
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
    document.title = 'No Dice London Fields — World Cup 2026 Bookings'

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
            No Dice · In the Heart of London Fields
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
            Every England match, live on big screens indoors and out — in the Heart of London
            Fields. Pick the match, lock in your table for 1–4, arrive an hour before kick-off.
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
              you the moment online payment goes live — before it's announced anywhere else.
            </p>
            <WaitlistForm />
          </div>
        </section>

        {/* ─── England matches ───────────────────────────────────────── */}
        <EnglandMatchesSection />

        {/* ─── Closing CTA ────────────────────────────────────────────── */}
        <section style={{ padding: '60px 0', textAlign: 'center' }}>
          <h2 className="serif" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', color: WHITE, margin: '0 0 12px' }}>
            Don't miss kick-off
          </h2>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 28px' }}>
            Pick your England match and lock in a table for 1–4.
          </p>
          <a
            href="#england-matches"
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById('england-matches')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            style={{
              display: 'inline-block', padding: '15px 34px', borderRadius: 999,
              background: RED, color: WHITE, textDecoration: 'none',
              fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
            }}
          >
            Choose a match
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

// ─── England matches section ───────────────────────────────────────────
// Selectable list of every bookable England fixture, plus a reservation
// panel (party size + email) that posts to the same signup endpoint with
// a per-match tag. Replaces the Stripe checkout step until the payment
// plug-in is built.
function EnglandMatchesSection() {
  const [selectedId, setSelectedId] = useState(null)
  const [guests, setGuests]         = useState(2)
  const [email, setEmail]           = useState('')
  const [state, setState]           = useState('idle')   // 'idle' | 'sending' | 'ok' | 'err'
  const [error, setError]           = useState('')

  const selected = ENGLAND_MATCHES.find(m => m.id === selectedId) || null
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const submit = async (e) => {
    e.preventDefault()
    if (!selected || !isValidEmail || state === 'sending') return
    setState('sending'); setError('')

    const refTag = `worldcup-reserve · ${selected.title} · ${selected.date} · ${guests} guest${guests === 1 ? '' : 's'}`

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
  }

  return (
    <section id="england-matches" style={{ padding: '52px 0', borderBottom: `1px solid ${LINE}` }}>
      <SectionHeading kicker="Book your table" title="England matches" />
      <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 640, marginTop: 12 }}>
        Pick the match you want a table for — group stage through to the Final. Knockout
        rounds are listed in case England progress; pre-bookings transfer if they don't.
      </p>

      {/* Policy strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12, marginTop: 22, marginBottom: 28,
      }}>
        <PolicyCard label="Table size" value="1–4 people" />
        <PolicyCard label="Arrival" value="1 hour before kick-off" />
        <PolicyCard label="Late / no-show" value="Table released 1 hour before the match" />
      </div>

      {/* Match list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ENGLAND_MATCHES.map(m => (
          <MatchListItem key={m.id} m={m} selected={m.id === selectedId} onSelect={() => setSelectedId(m.id)} />
        ))}
      </div>

      {/* Reservation panel */}
      <div style={{
        marginTop: 28, background: PANEL,
        border: `1px solid ${selected ? RED : LINE}`,
        borderRadius: 14, padding: '24px 22px',
      }}>
        {!selected && (
          <div style={{ textAlign: 'center', color: MUTED, fontSize: 13.5, lineHeight: 1.6 }}>
            Pick a match above to reserve your table.
          </div>
        )}

        {selected && state !== 'ok' && (
          <form onSubmit={submit}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: RED, marginBottom: 4 }}>You're reserving</div>
              <div className="serif" style={{ fontSize: 22, color: WHITE, lineHeight: 1.15 }}>{selected.title}</div>
              <div style={{ fontSize: 12.5, color: MUTED, marginTop: 6, lineHeight: 1.55 }}>
                {formatDate(selected.date)} · kick-off {selected.kickoff} · arrive {selected.arrival}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: FAINT, marginBottom: 8 }}>Guests (1–4)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGuests(n)}
                    style={{
                      flex: '1 1 0', padding: '12px 0', borderRadius: 8,
                      background: guests === n ? RED : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${guests === n ? RED : LINE}`,
                      color: WHITE, cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 15, fontWeight: guests === n ? 700 : 400,
                      transition: 'background 0.15s',
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com" autoComplete="email" required
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
                {state === 'sending' ? 'Sending…' : 'Reserve table'}
              </button>
            </div>

            {state === 'err' && (
              <div style={{ marginTop: 12, fontSize: 12, color: RED }}>
                Couldn't send — {error}. Try again, or email {FOUNDER_EMAIL}.
              </div>
            )}

            <div style={{ marginTop: 14, fontSize: 11, color: FAINT, lineHeight: 1.55 }}>
              Secure online payment (Stripe) is being built. Reserving now locks in your match
              and party size — we'll email you the secure payment link the moment Stripe goes
              live, and you confirm there to hold the table.
            </div>
          </form>
        )}

        {selected && state === 'ok' && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: RED, marginBottom: 8, fontWeight: 700 }}>
              You're in
            </div>
            <div className="serif" style={{ fontSize: 22, color: WHITE, marginBottom: 6 }}>{selected.title}</div>
            <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6 }}>
              {formatDate(selected.date)} · {guests} guest{guests === 1 ? '' : 's'} · arrive {selected.arrival}.
            </div>
            <div style={{ marginTop: 14, fontSize: 12.5, color: CREAM, lineHeight: 1.6 }}>
              We'll email you the secure payment link the moment Stripe checkout goes live —
              confirm there to lock in your table. Tables are released 1 hour before kick-off if
              not confirmed.
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Policy strip card ─────────────────────────────────────────────────
function PolicyCard({ label, value }) {
  return (
    <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: RED, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: WHITE, lineHeight: 1.4 }}>{value}</div>
    </div>
  )
}

// ─── Match list item (clickable row) ───────────────────────────────────
function MatchListItem({ m, selected, onSelect }) {
  const d = formatDayMonth(m.date)
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 1fr auto 24px',
        gap: 16, alignItems: 'center',
        padding: '16px 18px', textAlign: 'left',
        background: selected ? 'rgba(218,27,51,0.08)' : PANEL,
        border: `1px solid ${selected ? RED : LINE}`,
        borderRadius: 12, color: WHITE, cursor: 'pointer',
        fontFamily: 'inherit', transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {/* Date */}
      <div>
        <div className="serif" style={{ fontSize: 24, color: m.marquee ? RED : WHITE, lineHeight: 1 }}>{d.day}</div>
        <div style={{ fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: FAINT, marginTop: 4 }}>{d.month} · {m.day}</div>
      </div>

      {/* Title + phase + note */}
      <div style={{ minWidth: 0 }}>
        <div className="serif" style={{ fontSize: 17, color: WHITE, lineHeight: 1.2 }}>{m.title}</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
          <span style={{
            fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase',
            color: m.confirmed ? CREAM : RED,
            padding: '3px 7px', borderRadius: 4,
            background: m.confirmed ? 'rgba(255,255,255,0.06)' : 'rgba(218,27,51,0.12)',
            whiteSpace: 'nowrap',
          }}>{m.phase}</span>
          {m.note && <span style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.4 }}>{m.note}</span>}
        </div>
      </div>

      {/* Kick-off + arrival */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 12, color: WHITE, fontWeight: 600, whiteSpace: 'nowrap' }}>Kick-off {m.kickoff}</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 3, whiteSpace: 'nowrap' }}>Arrive {m.arrival}</div>
      </div>

      {/* Selection indicator */}
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        border: `1.5px solid ${selected ? RED : LINE}`,
        background: selected ? RED : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 6.5 L5 9 L10 3.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  )
}

// ─── Waitlist form ─────────────────────────────────────────────────────
// General "join the list" form for users who don't want to pick a match
// yet. Tagged worldcup-bookings in the ref so it's distinguishable from
// per-match reservations (worldcup-reserve) in the Signups sheet.
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
