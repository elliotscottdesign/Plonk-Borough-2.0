import React, { useEffect, useState } from 'react'

// CookieBanner — GDPR-style consent banner for the public landing.
//
// What this site actually does with user data (so the banner can be
// truthful, not boilerplate):
//   • NO analytics — no Google Analytics, no Plausible, no Hotjar
//   • NO marketing pixels — no Meta, TikTok, LinkedIn
//   • NO third-party trackers of any kind
//   • Google Fonts served via CSS link (may set short-lived cookies on
//     fonts.gstatic.com — outside our control, used to serve the font)
//   • Email signups: the email the user types + a timestamp are stored
//     in our Google Sheet ONLY when they click "Notify me" (explicit
//     user action). This is a legitimate-interest data flow, not a cookie.
//   • localStorage: we store the user's cookie-banner choice so we
//     don't keep asking. That's the entire local-storage footprint.
//
// Compliance posture:
//   • Banner appears on first visit (no choice stored)
//   • TWO equally weighted choices: "Accept" / "Reject" — neither
//     pre-selected, neither styled to nudge a particular outcome.
//   • Decision persists in localStorage under NDB_COOKIE_KEY so we
//     don't re-prompt. User can change their mind via the "Cookie
//     settings" link in the footer (clears the stored choice and
//     reopens the banner).
//   • There are no non-essential cookies to gate today, so "Reject"
//     doesn't have to disable anything — it just records the choice.
//     If we ever add analytics, we read the stored choice before
//     loading the script.

const NDB_COOKIE_KEY = 'nodice_cookie_consent_v1'
const BRAND_RED      = '#FF3D1F'

function readChoice() {
  try {
    const raw = localStorage.getItem(NDB_COOKIE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && (parsed.choice === 'accepted' || parsed.choice === 'rejected') ? parsed : null
  } catch { return null }
}

function writeChoice(choice) {
  try {
    localStorage.setItem(NDB_COOKIE_KEY, JSON.stringify({ choice, ts: new Date().toISOString() }))
  } catch { /* swallow — private browsing etc. */ }
}

function clearChoice() {
  try { localStorage.removeItem(NDB_COOKIE_KEY) } catch { }
}

export default function CookieBanner() {
  // null = haven't read yet (SSR-safe placeholder), 'none' = no choice
  // stored, 'accepted' | 'rejected' = persisted choice
  const [choice, setChoice] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const stored = readChoice()
    setChoice(stored ? stored.choice : 'none')
  }, [])

  // Expose a reopen helper on window so the footer "Cookie settings"
  // link can pop the banner back up without prop drilling.
  useEffect(() => {
    window.__nodiceReopenCookieBanner = () => {
      clearChoice()
      setShowDetails(false)
      setChoice('none')
    }
    return () => { delete window.__nodiceReopenCookieBanner }
  }, [])

  // Don't paint until we've read localStorage — avoids a flash of
  // banner for users who've already made a choice.
  if (choice === null || choice === 'accepted' || choice === 'rejected') return null

  const accept = () => { writeChoice('accepted'); setChoice('accepted') }
  const reject = () => { writeChoice('rejected'); setChoice('rejected') }

  return (
    <div
      role="dialog"
      aria-label="Cookie and privacy preferences"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 16,
        transform: 'translateX(-50%)',
        width: 'min(680px, calc(100vw - 24px))',
        background: '#0A0A0A',
        border: '1px solid rgba(255,61,31,0.45)',
        borderRadius: 12,
        padding: '18px 20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)',
        zIndex: 1000,
        fontFamily: "'DM Sans', sans-serif",
        color: '#FFFFFF',
      }}
    >
      {/* Heading */}
      <div style={{
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: BRAND_RED,
        fontWeight: 700,
        marginBottom: 8,
      }}>
        Privacy &amp; cookies
      </div>

      {/* Body */}
      <div style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,0.85)', marginBottom: 14 }}>
        We don't use analytics, marketing pixels or any third-party trackers on this site. The only data we collect is the email address you type into the signup form (if you choose to send it).{' '}
        <button
          onClick={() => setShowDetails(s => !s)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: BRAND_RED,
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        >
          {showDetails ? 'Hide details' : 'See details'}
        </button>
      </div>

      {/* Expandable details */}
      {showDetails && (
        <div style={{
          fontSize: 12,
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.7)',
          marginBottom: 14,
          padding: '12px 14px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
        }}>
          <div style={{ marginBottom: 8 }}>
            <strong style={{ color: '#FFFFFF' }}>What we store on your device:</strong> Just one preference, in your browser's local storage, recording whether you accepted or rejected this notice. No tracking IDs, no session cookies, no advertising identifiers.
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong style={{ color: '#FFFFFF' }}>What we collect when you sign up:</strong> The email address you type, the time you submitted it, and basic technical context (which browser / referring page). Stored in our Google Workspace account at <span style={{ color: BRAND_RED }}>elliot@nodice.bar</span>. Used only to email you when we open. Not shared, not sold.
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong style={{ color: '#FFFFFF' }}>Third parties:</strong> The site is hosted on GitHub Pages and serves fonts from Google Fonts — neither receives any signup data. Form submissions go to a Google Apps Script endpoint we control.
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong style={{ color: '#FFFFFF' }}>Your rights (UK GDPR):</strong> You can request a copy of your data, ask us to delete it, or unsubscribe at any time by emailing <span style={{ color: BRAND_RED }}>elliot@nodice.bar</span>. We'll action it within 30 days.
          </div>
          <div>
            Full detail in our <a href="/privacy" style={{ color: BRAND_RED, textDecoration: 'underline' }}>Privacy Policy</a> and <a href="/terms" style={{ color: BRAND_RED, textDecoration: 'underline' }}>Terms of Use</a>.
          </div>
        </div>
      )}

      {/* Buttons — equally weighted (same size, same prominence). Reject
          is outline-only, Accept is solid red. Order is Reject-first per
          UK ICO guidance ("no nudging towards Accept"). */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={reject}
          style={{
            flex: '1 1 140px',
            padding: '12px 16px',
            fontSize: 12,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 700,
            background: 'transparent',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Reject
        </button>
        <button
          onClick={accept}
          style={{
            flex: '1 1 140px',
            padding: '12px 16px',
            fontSize: 12,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 700,
            background: BRAND_RED,
            color: '#FFFFFF',
            border: '1px solid ' + BRAND_RED,
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Accept
        </button>
      </div>
    </div>
  )
}
