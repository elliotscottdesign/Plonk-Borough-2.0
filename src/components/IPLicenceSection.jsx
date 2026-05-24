import React, { useState } from 'react'
import { IP_LICENCE_DOC, downloadIPLicence } from '../templates/ipLicenceDoc.js'

// IPLicenceSection — founder-only embedded card for the Group Structure
// slide on both decks (Borough + Hackney).
//
// Visibility: returns null unless sessionStorage.ndb_role_founder === '1'
// (set by the 888999 access code in PasswordGate.jsx). Other access codes
// — BRAZIL, JOHN1, LEONIE — see nothing at all.
//
// Render shape:
//   • Compact "Founder-only · Group Templates" header card
//   • Brief description of what the licence does
//   • Two action buttons: Download as Word (.doc), Print / Save as PDF
//   • "Show / hide full preview" toggle reveals the full document text
//     inline (same content as /templates/ip-licence)
//
// Why embedded here:
//   • The standalone /templates/ip-licence page is convenient for a
//     direct link, but the founder asked to "work on it" from the deck
//   • Lives on the Company Structure slide because that's the natural
//     parent context (parent-co + operating-co licensing flow)
//
// Customising per-deck:
//   • Pass `licensee` prop to override the licensee name shown in the
//     download file (e.g. "No Dice Borough Ltd" for the Borough deck).
//     Defaults to "No Dice Hackney Ltd" to match the underlying doc.

const BRAND_RED = '#FF3D1F'
const GOLD      = 'var(--gold)'
const CREAM     = 'var(--cream)'
const CREAM_D   = 'var(--cream-dim)'

function readIsFounder() {
  try { return sessionStorage.getItem('ndb_role_founder') === '1' } catch { return false }
}

const paraStyle = { margin: '0 0 10px 0', fontSize: 13, lineHeight: 1.65, color: CREAM_D }
const clauseHeadStyle = { fontFamily: "'DM Serif Display', serif", fontSize: 16, fontWeight: 400, color: GOLD, margin: '18px 0 8px 0', lineHeight: 1.25 }

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

export default function IPLicenceSection({ licensee }) {
  const [open, setOpen] = useState(false)
  if (!readIsFounder()) return null

  const filename = licensee
    ? `NoDice-IP-and-Data-Licence-DRAFT-${licensee.replace(/\s+/g, '-')}.doc`
    : 'NoDice-IP-and-Data-Licence-DRAFT.doc'

  return (
    <div style={{
      marginTop: 32,
      padding: '22px 24px',
      background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(255,61,31,0.05))',
      border: '1px solid rgba(201,168,76,0.32)',
      borderLeft: '4px solid ' + BRAND_RED,
      borderRadius: 12,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: BRAND_RED, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Founder-only · Group templates
          </div>
          <div className="serif" style={{ fontSize: 20, color: CREAM, lineHeight: 1.2 }}>
            Brand, IP &amp; Customer-Data Licence
          </div>
        </div>
        <div style={{ fontSize: 10, color: CREAM_D, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Access code 888999
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: 13, color: CREAM_D, lineHeight: 1.65, marginTop: 8, marginBottom: 16 }}>
        Group-level licence between <strong style={{ color: CREAM }}>No Dice Bars Ltd</strong> (holding co, owns brand + customer database) and{' '}
        <strong style={{ color: CREAM }}>{licensee || 'No Dice Hackney Ltd'}</strong> (operating subsidiary). Nominal £1/yr royalty, customer-data dual-control,
        Y3 termination triggers, and brand reverting to parent on insolvency. Draft for solicitor review &mdash; expect a final review fee of c.£300&ndash;£600.
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => downloadIPLicence(filename)} style={primaryBtn}>
          ↓ Download as Word (.doc)
        </button>
        <button onClick={() => window.print()} style={secondaryBtn}>
          🖨 Print / Save as PDF
        </button>
        <button onClick={() => setOpen(o => !o)} style={ghostBtn}>
          {open ? 'Hide full preview' : 'Show full preview'}
        </button>
        <a href="/templates/ip-licence" target="_blank" rel="noopener noreferrer" style={{ ...ghostBtn, display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
          Open in new tab ↗
        </a>
      </div>

      {/* Expandable full preview */}
      {open && (
        <div style={{ marginTop: 22, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={clauseHeadStyle}>Parties</h3>
          {IP_LICENCE_DOC.parties.map((p, i) => (
            <p key={i} style={paraStyle}>
              <strong style={{ color: CREAM }}>{p.label}.</strong> {p.body.map((b, j) => renderInline(b, j))}
            </p>
          ))}
          <p style={{ ...paraStyle, fontStyle: 'italic' }}>{IP_LICENCE_DOC.partiesNote}</p>

          <h3 style={clauseHeadStyle}>Background</h3>
          {IP_LICENCE_DOC.background.map((para, i) => (
            <p key={i} style={paraStyle}>{para}</p>
          ))}

          <h3 style={clauseHeadStyle}>Operative provisions</h3>
          {IP_LICENCE_DOC.clauses.map((c) => (
            <section key={c.n} style={{ marginBottom: 18 }}>
              <h4 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, fontWeight: 400, color: BRAND_RED, margin: '14px 0 6px 0', lineHeight: 1.25 }}>{c.n}. {c.title}</h4>
              {c.paras.map((para, i) => (
                <p key={i} style={paraStyle}>
                  {Array.isArray(para) ? para.map((b, j) => renderInline(b, j)) : para}
                </p>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Button styles ─────────────────────────────────────────────────────

const primaryBtn = {
  padding: '11px 18px',
  background: BRAND_RED,
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontSize: 11,
  fontFamily: 'inherit',
}
const secondaryBtn = {
  padding: '11px 18px',
  background: 'transparent',
  color: CREAM,
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontSize: 11,
  fontFamily: 'inherit',
}
const ghostBtn = {
  padding: '11px 18px',
  background: 'transparent',
  color: CREAM_D,
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontSize: 11,
  fontFamily: 'inherit',
}
