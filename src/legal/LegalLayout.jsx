import React, { useEffect } from 'react'

// LegalLayout — shared shell for /privacy and /terms.
//
// Matches the landing's dark / red aesthetic (DM Serif Display for the
// title, DM Sans for body) so the legal pages feel part of the same
// site, not a clinical afterthought. ICO actively prefers plain English
// + readable typography over dense legalese, so we lean into that:
//   • generous line-height, max ~720px content width
//   • h2 sections gold-red, h3 white, body off-white
//   • back link top-left to return to the homepage

export const BRAND_RED = '#FF3D1F'
export const INK       = '#000000'
export const CREAM     = '#FFFFFF'
export const CREAM_D   = 'rgba(255,255,255,0.7)'
export const CREAM_DD  = 'rgba(255,255,255,0.45)'

export default function LegalLayout({ eyebrow, title, lastUpdated, children }) {
  useEffect(() => {
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = INK
    document.body.style.color = CREAM
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: INK,
      color: CREAM,
      fontFamily: "'DM Sans', sans-serif",
      padding: '32px 24px 80px',
    }}>
      {/* Header bar — brand wordmark + back link */}
      <div style={{
        maxWidth: 720,
        margin: '0 auto 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 18,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <a
          href="/"
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 20,
            color: BRAND_RED,
            textDecoration: 'none',
            letterSpacing: '0.02em',
          }}
        >
          No Dice
        </a>
        <a
          href="/"
          style={{
            fontSize: 11,
            color: CREAM_DD,
            textDecoration: 'none',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          ← Back to site
        </a>
      </div>

      {/* Heading block */}
      <div style={{ maxWidth: 720, margin: '0 auto 32px' }}>
        {eyebrow && (
          <div style={{
            fontSize: 11,
            color: BRAND_RED,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: 10,
          }}>
            {eyebrow}
          </div>
        )}
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
            fontWeight: 400,
            color: CREAM,
            margin: '0 0 12px 0',
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        {lastUpdated && (
          <div style={{ fontSize: 12, color: CREAM_DD, letterSpacing: '0.1em' }}>
            Last updated: <span style={{ color: CREAM_D }}>{lastUpdated}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="legal-body" style={{
        maxWidth: 720,
        margin: '0 auto',
        fontSize: 15,
        lineHeight: 1.75,
        color: CREAM_D,
      }}>
        {children}
      </div>

      {/* Footer cross-links */}
      <div style={{
        maxWidth: 720,
        margin: '60px auto 0',
        paddingTop: 24,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        gap: 24,
        justifyContent: 'center',
        flexWrap: 'wrap',
        fontSize: 11,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}>
        <a href="/privacy"   style={{ color: CREAM_DD, textDecoration: 'none' }}>Privacy</a>
        <a href="/terms"     style={{ color: CREAM_DD, textDecoration: 'none' }}>Terms</a>
        <a href="/"          style={{ color: CREAM_DD, textDecoration: 'none' }}>Home</a>
        <a href="mailto:elliot@nodice.bar" style={{ color: CREAM_DD, textDecoration: 'none' }}>Contact</a>
      </div>
    </div>
  )
}

// ─── Typography helpers used by both legal pages ────────────────────

export function H2({ children, id }) {
  return (
    <h2
      id={id}
      style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 22,
        fontWeight: 400,
        color: BRAND_RED,
        margin: '36px 0 12px 0',
        lineHeight: 1.25,
        scrollMarginTop: 24,
      }}
    >
      {children}
    </h2>
  )
}

export function H3({ children }) {
  return (
    <h3 style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 15,
      fontWeight: 700,
      color: CREAM,
      margin: '22px 0 8px 0',
      letterSpacing: '0.01em',
    }}>
      {children}
    </h3>
  )
}

export function P({ children, style }) {
  return <p style={{ margin: '0 0 14px 0', ...style }}>{children}</p>
}

export function UL({ children }) {
  return <ul style={{ margin: '0 0 14px 0', paddingLeft: 22, color: CREAM_D }}>{children}</ul>
}

export function LI({ children }) {
  return <li style={{ marginBottom: 6 }}>{children}</li>
}

export function Strong({ children }) {
  return <strong style={{ color: CREAM, fontWeight: 600 }}>{children}</strong>
}

export function Em({ children }) {
  return <em style={{ color: CREAM, fontStyle: 'normal', fontWeight: 600 }}>{children}</em>
}

// Inline link that matches the brand. Use for cross-page navigation.
export function A({ href, children, external }) {
  const extProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <a
      href={href}
      {...extProps}
      style={{
        color: BRAND_RED,
        textDecoration: 'underline',
        textDecorationColor: 'rgba(255,61,31,0.4)',
        textUnderlineOffset: 2,
      }}
    >
      {children}
    </a>
  )
}

// Two-column key/value table used for processor lists, retention periods, etc.
export function Table({ headers, rows }) {
  return (
    <div style={{
      margin: '8px 0 18px',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: 'left',
                padding: '10px 14px',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: CREAM_DD,
                fontWeight: 600,
                background: 'rgba(255,255,255,0.03)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {r.map((c, j) => (
                <td key={j} style={{ padding: '12px 14px', color: CREAM_D, lineHeight: 1.5 }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
