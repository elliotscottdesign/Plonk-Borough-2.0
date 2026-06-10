import React, { useEffect, useState } from 'react'

// TeamLanding — the branded front door at team.nodice.bar.
//
// nodice.bar is the public customer site (separate repo). This repo now lives
// at team.nodice.bar and is the internal hub: four gated doors —
//   Operations (/ops) · Marketing (/marketing) ·
//   Investors · Hackney (/hackney) · Investors · Borough (/borough)
// Each door is protected by the existing PasswordGate codes (see PasswordGate.jsx).
// This menu is just the entry point — the codes protect the contents.
//
// Styled to match the public nodice.bar brand: black, the No Dice wordmark,
// red (#DA1B33) accents, DM Sans / Bebas Neue.

const RED = '#DA1B33'
const INK = '#000000'
const CARD = '#0A0A0A'

const AREAS = [
  { key: 'ops',       href: '/ops',       icon: '🛠️', title: 'Operations',          desc: 'Stock orders, reports & documentation for the team.',  tag: 'Team access' },
  { key: 'marketing', href: '/marketing', icon: '✉️', title: 'Marketing',           desc: 'Newsletter builder, members & loyalty, campaign data.', tag: 'Team access' },
  { key: 'hackney',   href: '/hackney',   icon: '📈', title: 'Investors · Hackney', desc: 'The London Fields (Hackney) investment deck.',          tag: 'Investor access' },
  { key: 'borough',   href: '/borough',   icon: '📊', title: 'Investors · Borough', desc: 'The Borough deck & 2025 trading data.',                 tag: 'Investor access' },
]

function AreaCard({ a }) {
  const [hover, setHover] = useState(false)
  return (
    <a
      href={a.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textDecoration: 'none',
        display: 'block',
        background: CARD,
        border: `1px solid ${hover ? 'rgba(218,27,51,0.7)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 14,
        padding: '24px 22px',
        transition: 'border-color 0.18s, transform 0.18s, box-shadow 0.18s',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? '0 14px 40px rgba(218,27,51,0.12)' : 'none',
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 12 }}>{a.icon}</div>
      <div className="serif" style={{ fontSize: 22, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 6 }}>{a.title}</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', lineHeight: 1.55, marginBottom: 16 }}>{a.desc}</div>
      <div style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: hover ? RED : 'rgba(255,255,255,0.42)', fontWeight: 700, transition: 'color 0.18s' }}>
        {a.tag} · Enter →
      </div>
    </a>
  )
}

export default function TeamLanding() {
  useEffect(() => {
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = INK
    document.body.style.color = '#FFFFFF'
    document.title = 'No Dice — Team & Investor Hub'
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: INK,
      color: '#FFFFFF',
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '56px 24px 48px',
      boxSizing: 'border-box',
    }}>
      {/* Wordmark hero */}
      <img
        src="/nodice-wordmark.png"
        alt="No Dice"
        style={{ width: 'min(320px, 72vw)', height: 'auto', display: 'block', marginBottom: 18 }}
      />
      <div style={{
        fontFamily: "'Bebas Neue', 'Impact', sans-serif",
        fontSize: 'clamp(0.95rem, 2.4vw, 1.25rem)',
        letterSpacing: '0.34em',
        textTransform: 'uppercase',
        color: RED,
        marginBottom: 8,
        textAlign: 'center',
      }}>
        Team &amp; Investor Hub
      </div>
      <div style={{
        fontSize: 'clamp(0.62rem, 1.1vw, 0.72rem)',
        letterSpacing: '0.26em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 44,
        textAlign: 'center',
      }}>
        Staff &amp; investor access only · enter your code
      </div>

      {/* Four doors */}
      <div style={{
        width: '100%',
        maxWidth: 760,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {AREAS.map(a => <AreaCard key={a.key} a={a} />)}
      </div>

      {/* Help us open — public volunteer door (no code). Friends getting the
          bar open won't have a staff code, so this one is open to everyone. */}
      <a
        href="/helpout"
        style={{
          width: '100%', maxWidth: 760, marginTop: 16, boxSizing: 'border-box',
          textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
          background: 'rgba(218,27,51,0.08)', border: `1px solid rgba(218,27,51,0.5)`,
          borderRadius: 14, padding: '18px 22px',
        }}
      >
        <div>
          <div className="serif" style={{ fontSize: 20, color: '#FFFFFF', lineHeight: 1.1 }}>🙌 Help us open</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', marginTop: 4 }}>Volunteer sign-up — share this link with friends, no code needed.</div>
        </div>
        <div style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: RED, fontWeight: 700, whiteSpace: 'nowrap' }}>Open to all · Enter →</div>
      </a>

      {/* Footer */}
      <div style={{
        marginTop: 48,
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.32)',
        textAlign: 'center',
        lineHeight: 1.8,
      }}>
        No Dice · 407 Mentmore Terrace, London Fields, E8 3PH<br />
        <a href="https://nodice.bar" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>nodice.bar →</a> public site
      </div>
    </div>
  )
}
