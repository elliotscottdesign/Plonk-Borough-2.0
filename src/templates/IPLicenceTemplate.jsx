import React, { useEffect } from 'react'
import { IP_LICENCE_DOC, downloadIPLicence } from './ipLicenceDoc.js'

// IPLicenceTemplate — standalone preview + downloadable page for the
// Brand, IP & Customer-Data Licence template. Source content + download
// generator live in ./ipLicenceDoc.js; this file is presentation only.
//
// Lives at /templates/ip-licence (unlisted public URL). For embedded
// founder-only access from inside the investor decks, see
// src/components/IPLicenceSection.jsx — same source content, gated by
// session role.

const BRAND_RED = '#FF3D1F'
const INK       = '#000000'
const CREAM     = '#FFFFFF'
const CREAM_D   = 'rgba(255,255,255,0.78)'
const CREAM_DD  = 'rgba(255,255,255,0.45)'

const paraStyle = { margin: '0 0 12px 0' }
const clauseHeadStyle = { fontFamily: "'DM Serif Display', serif", fontSize: 18, fontWeight: 400, color: BRAND_RED, margin: '20px 0 10px 0', lineHeight: 1.25 }

const btnPrimary = {
  padding: '12px 22px',
  background: BRAND_RED,
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontSize: 12,
  fontFamily: 'inherit',
}
const btnSecondary = {
  padding: '12px 22px',
  background: 'transparent',
  color: CREAM,
  border: '1px solid rgba(255,255,255,0.35)',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontSize: 12,
  fontFamily: 'inherit',
}

function H2({ children }) {
  return (
    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: BRAND_RED, margin: '32px 0 14px 0', lineHeight: 1.25 }}>
      {children}
    </h2>
  )
}

function renderInline(part, key) {
  if (typeof part === 'string') return part
  if (part && part.type === 'placeholder') {
    return (
      <span key={key} style={{ color: BRAND_RED, fontWeight: 700, background: 'rgba(255,61,31,0.08)', padding: '0 4px', borderRadius: 3 }}>
        {part.text}
      </span>
    )
  }
  return null
}

function SignatureBlock({ label, name }) {
  return (
    <div style={{ marginTop: 22, marginBottom: 22 }}>
      <p style={{ ...paraStyle, color: CREAM, fontWeight: 600 }}>{label}:</p>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.4)', height: 28 }} />
      <div style={{ fontSize: 11, color: CREAM_DD, marginTop: 4 }}>Signature</div>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.4)', height: 28, marginTop: 14 }} />
      <div style={{ fontSize: 11, color: CREAM_DD, marginTop: 4 }}>{name}</div>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.4)', height: 28, marginTop: 14 }} />
      <div style={{ fontSize: 11, color: CREAM_DD, marginTop: 4 }}>Date</div>
    </div>
  )
}

export default function IPLicenceTemplate() {
  useEffect(() => {
    const prevTitle = document.title
    document.title = 'IP & Data Licence (draft) — No Dice'
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = INK
    document.body.style.color = CREAM
    return () => {
      document.title = prevTitle
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  const DOC = IP_LICENCE_DOC

  return (
    <div style={{ minHeight: '100vh', background: INK, color: CREAM, fontFamily: "'DM Sans', sans-serif", padding: '32px 24px 80px' }}>

      <div style={{ maxWidth: 820, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <a href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: BRAND_RED, textDecoration: 'none' }}>No Dice</a>
        <a href="/" style={{ fontSize: 11, color: CREAM_DD, textDecoration: 'none', letterSpacing: '0.18em', textTransform: 'uppercase' }}>← Back to site</a>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto 28px' }}>
        <div style={{ fontSize: 11, color: BRAND_RED, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
          Group Template · Draft for solicitor
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 400, margin: '0 0 8px', lineHeight: 1.15 }}>
          {DOC.title}
        </h1>
        <div style={{ fontSize: 14, color: CREAM_D, marginBottom: 22 }}>
          {DOC.subtitle}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
          <button onClick={() => downloadIPLicence()} style={btnPrimary}>↓ Download as Word (.doc)</button>
          <button onClick={() => window.print()} style={btnSecondary}>🖨 Print / Save as PDF</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.45)', borderLeft: '4px solid #F87171', borderRadius: 8 }}>
          <div style={{ fontSize: 22, lineHeight: 1, color: '#F87171', paddingTop: 2 }}>⚠</div>
          <div style={{ flex: 1, fontSize: 13, color: '#FECACA', lineHeight: 1.6 }}>
            <strong style={{ color: '#FCA5A5' }}>Draft for solicitor review — not legal advice.</strong> This template is a structured starting point for a qualified solicitor to finalise into a binding agreement. Placeholders in red below need real values before execution. Expect your solicitor to refine wording, especially around clause 6 (Customer Data dual-control) and clause 7 (termination triggers).
          </div>
        </div>
      </div>

      <article style={{ maxWidth: 820, margin: '0 auto', fontSize: 14, lineHeight: 1.7, color: CREAM_D }}>

        <H2>Parties</H2>
        {DOC.parties.map((p, i) => (
          <p key={i} style={paraStyle}>
            <strong style={{ color: CREAM }}>{p.label}.</strong> {p.body.map((b, j) => renderInline(b, j))}
          </p>
        ))}
        <p style={{ ...paraStyle, fontStyle: 'italic' }}>{DOC.partiesNote}</p>

        <H2>Background</H2>
        {DOC.background.map((para, i) => (
          <p key={i} style={paraStyle}>{para}</p>
        ))}

        <H2>Operative provisions</H2>
        {DOC.clauses.map((c) => (
          <section key={c.n} style={{ marginBottom: 22 }}>
            <h3 style={clauseHeadStyle}>{c.n}. {c.title}</h3>
            {c.paras.map((para, i) => (
              <p key={i} style={{ ...paraStyle, marginBottom: 10 }}>
                {Array.isArray(para) ? para.map((b, j) => renderInline(b, j)) : para}
              </p>
            ))}
          </section>
        ))}

        <H2>Signed by the Parties</H2>
        <SignatureBlock label="For and on behalf of NO DICE BARS LTD (Licensor)" name="Elliot Scott · Director" />
        <SignatureBlock label="For and on behalf of NO DICE HACKNEY LTD (Licensee)" name="Elliot Scott · Director" />

      </article>

      <div style={{ maxWidth: 820, margin: '60px auto 0', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        <a href="/"        style={{ color: CREAM_DD, textDecoration: 'none' }}>Home</a>
        <a href="/privacy" style={{ color: CREAM_DD, textDecoration: 'none' }}>Privacy</a>
        <a href="/terms"   style={{ color: CREAM_DD, textDecoration: 'none' }}>Terms</a>
        <a href="mailto:elliot@nodice.bar" style={{ color: CREAM_DD, textDecoration: 'none' }}>Contact</a>
      </div>
    </div>
  )
}
