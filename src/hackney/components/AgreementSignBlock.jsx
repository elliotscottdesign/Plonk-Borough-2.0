import React, { useEffect, useState } from 'react'
import { namespacedKey } from '../../lib/access-code.js'

// AgreementSignBlock — drop-in replacement for the static "Signatures
// — to be added on execution" block at the bottom of LeonieAgreement
// and LeeAgreement.
//
// Provides:
//   • Inline e-signature form (typed full name + date + affirmative
//     "I agree" checkbox)
//   • Signed-state display: cursive-style signature + date with a
//     visible "Signed by ... on ..." status pill
//   • Three action buttons:
//       1. "Save Signed PDF" — opens browser print dialog; user picks
//          "Save as PDF" from the destination. Disabled until signed.
//       2. "Download Blank for In-Person Signing" — temporarily clears
//          the signature, opens print dialog, restores after print.
//       3. "Print" — just opens print dialog with the current state
//   • localStorage persistence under the active access-code namespace
//     so the signature survives a page reload (under their LEE01 /
//     LEONIE / 888999 slot).
//
// PRINT STYLING: the component injects a one-time <style> tag with
// @media print rules that hide the entire app shell (header, slide nav,
// notes panel, action buttons themselves, draft banners) so the printed
// PDF shows only the agreement body + the signature block. The
// .print-hide class on any wrapper element marks it for print-time
// removal; .print-only marks elements that only appear in print.
//
// The agreementId prop is used as the localStorage key suffix:
//   namespacedKey('agreement_sig_' + agreementId)
// so 'leonie' and 'lee' get separate signature slots, and a single
// access code (e.g. 888999 reviewing both) doesn't cross-contaminate.

const GOLD       = 'var(--gold)'
const CREAM      = 'var(--cream)'
const CREAM_D    = 'var(--cream-dim)'
const TEAL       = 'var(--teal)'
const INK_BG     = 'var(--ink-2)'
const BORDER     = '1px solid rgba(201,168,76,0.18)'

// Inject print styles once at module load — these are global because the
// print dialog reads the live DOM, and we need to hide chrome that lives
// outside this component's tree (the HackneyApp header, slide nav etc).
function installPrintStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('ndb-agreement-print-styles')) return
  const style = document.createElement('style')
  style.id = 'ndb-agreement-print-styles'
  style.textContent = `
    @media print {
      /* Page setup — A4 portrait with comfortable margins */
      @page { size: A4 portrait; margin: 18mm 16mm; }

      /* White paper, dark ink */
      html, body { background: #ffffff !important; color: #111 !important; }

      /* ── Whole-page strategy ────────────────────────────────────
         Hide EVERYTHING except the agreement body, then explicitly
         re-show the agreement body's ancestor chain so the React
         tree path back up to <body> stays in the layout flow. */
      body * { visibility: hidden !important; }
      [data-agreement-body], [data-agreement-body] * { visibility: visible !important; }

      /* Pull the agreement body out of any flex / overflow chrome that
         HackneyApp uses for its tab + slide nav. Absolutely-position
         to top-left so the printed page starts at the page margin. */
      [data-agreement-body] {
        position: absolute !important;
        top: 0 !important; left: 0 !important; right: 0 !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        color: #1a1a1a !important;
        background: #ffffff !important;
      }

      /* Belt-and-braces — never let .print-hide elements appear in print */
      .print-hide, .print-hide * { display: none !important; visibility: hidden !important; }

      /* Make the agreement readable on white paper */
      [data-agreement-body] * {
        color: #1a1a1a !important;
        background: transparent !important;
        border-color: #999 !important;
      }
      [data-agreement-body] strong { color: #000 !important; }
      [data-agreement-body] h1 { color: #000 !important; }
      [data-agreement-body] h2 { color: #6b0000 !important; }
      [data-agreement-body] em  { color: #000 !important; font-style: italic; }
      [data-agreement-body] a   { color: #000 !important; text-decoration: underline; }

      /* The yellow "Not yet executed" amber draft banner — too loud for
         print. Replace with a soft grey palette. */
      .agreement-draft-banner {
        background: #f6f6f6 !important;
        border: 1px solid #aaa !important;
        border-left: 4px solid #888 !important;
        color: #444 !important;
        page-break-inside: avoid !important;
      }
      .agreement-draft-banner strong { color: #222 !important; }

      /* Keep the signature block on one page */
      [data-agreement-signblock] { page-break-inside: avoid !important; }

      /* Show "print-only" helpers */
      .print-only { display: block !important; visibility: visible !important; }
    }
    @media screen {
      .print-only { display: none; }
    }
  `
  document.head.appendChild(style)
}

function readSig(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.name === 'string' && parsed.name.length > 0) {
      return parsed
    }
    return null
  } catch { return null }
}

function writeSig(storageKey, sig) {
  try { localStorage.setItem(storageKey, JSON.stringify(sig)) } catch { /* swallow */ }
}

function clearSig(storageKey) {
  try { localStorage.removeItem(storageKey) } catch { /* swallow */ }
}

// Today as a yyyy-mm-dd for the date input default
function todayISO() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// "12 June 2026" style for the signed-state display
function prettyDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return `${d} ${months[m - 1]} ${y}`
}

export default function AgreementSignBlock({ agreementId, investorName, founderName }) {
  useEffect(() => { installPrintStyles() }, [])

  // localStorage namespacing — per-access-code so signatures don't bleed
  // across sessions. agreementId distinguishes Leonie's vs Lee's draft.
  // Two slots per agreement now — one for the Investor, one for the
  // Founder counter-signature. Each side has its own fillable form
  // so the founder can sign when reviewing under 888999.
  const investorKey = namespacedKey('agreement_sig_'        + agreementId)
  const founderKey  = namespacedKey('agreement_founder_sig_' + agreementId)

  const [investorSig, setInvestorSig] = useState(() => readSig(investorKey))
  const [founderSig,  setFounderSig]  = useState(() => readSig(founderKey))

  // Temporary suppression flag — when set, both signatures render as
  // empty lines so the print dialog generates the blank-version PDF.
  const [forceBlank, setForceBlank] = useState(false)

  const showInvestorSigned = !!investorSig && !forceBlank
  const showFounderSigned  = !!founderSig  && !forceBlank

  // The signed PDF is downloadable as soon as the INVESTOR has signed.
  // Founder counter-signature can come later — if it's also signed at
  // print time it shows up too.
  const isSigned = showInvestorSigned

  const saveInvestor = (sig) => { writeSig(investorKey, sig); setInvestorSig(sig) }
  const clearInvestor = () => { clearSig(investorKey); setInvestorSig(null) }
  const saveFounder  = (sig) => { writeSig(founderKey, sig); setFounderSig(sig) }
  const clearFounder = () => { clearSig(founderKey); setFounderSig(null) }

  // "Save Signed PDF" — just opens the print dialog. Browser handles
  // the "Save as PDF" choice in the destination menu.
  const handlePrintSigned = () => {
    if (!isSigned) return
    window.print()
  }

  // "Download Blank for In-Person Signing" — temporarily render as
  // if unsigned, fire print, then restore the signature on close.
  const handlePrintBlank = () => {
    setForceBlank(true)
    setTimeout(() => {
      window.print()
      const restore = () => { setForceBlank(false); window.removeEventListener('afterprint', restore) }
      window.addEventListener('afterprint', restore)
      setTimeout(restore, 4000)
    }, 50)
  }

  // "Print" — current state, whatever it is
  const handlePrintCurrent = () => { window.print() }

  // Status banner copy depends on which combination of signatures
  // are in place — gives clear feedback in all 4 states.
  let statusTone = 'amber'
  let statusBody = null
  if (showInvestorSigned && showFounderSigned) {
    statusTone = 'teal'
    statusBody = <>✓ <strong>Counter-signed.</strong> Investor: {investorSig.name} on {prettyDate(investorSig.date)} · Founder: {founderSig.name} on {prettyDate(founderSig.date)} · stored locally — click "Save Signed PDF" to download a printable copy.</>
  } else if (showInvestorSigned) {
    statusTone = 'teal'
    statusBody = <>✓ <strong>Signed by Investor</strong> ({investorSig.name} on {prettyDate(investorSig.date)}) · Founder counter-signature still pending. Click "Save Signed PDF" to download.</>
  } else if (showFounderSigned) {
    statusTone = 'amber'
    statusBody = <>✓ <strong>Founder signed</strong> ({founderSig.name} on {prettyDate(founderSig.date)}) · awaiting Investor signature below.</>
  } else {
    statusBody = <>⚠ <strong>Awaiting signatures.</strong> Both sides can e-sign below by typing the full name + date and ticking the "I agree" box.</>
  }

  return (
    <div data-agreement-signblock style={{ marginTop: 36 }}>

      {/* Action buttons row — hidden in print */}
      <div className="print-hide" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <button
          onClick={handlePrintSigned}
          disabled={!isSigned}
          style={primaryBtn(isSigned)}
          title={isSigned ? 'Open print dialog — choose "Save as PDF" as the destination' : 'Sign the agreement below first'}
        >
          📄 Save Signed PDF
        </button>
        <button
          onClick={handlePrintBlank}
          style={secondaryBtn}
          title='Generates a blank version with empty signature lines — for in-person signing'
        >
          📋 Download Blank for In-Person Signing
        </button>
        <button
          onClick={handlePrintCurrent}
          style={ghostBtn}
          title='Open the browser print dialog with the current view'
        >
          🖨 Print
        </button>
      </div>

      {/* Status banner — reflects both signature states */}
      <div style={{
        padding: '10px 14px',
        background: statusTone === 'teal' ? 'rgba(45,212,191,0.08)' : 'rgba(252,211,77,0.06)',
        border: '1px solid ' + (statusTone === 'teal' ? 'rgba(45,212,191,0.4)' : 'rgba(252,211,77,0.3)'),
        borderRadius: 8,
        marginBottom: 18,
        fontSize: 12,
        color: statusTone === 'teal' ? '#5EEAD4' : '#FCD34D',
        letterSpacing: '0.04em',
        lineHeight: 1.55,
      }}>
        {statusBody}
      </div>

      {/* Signature block — Founder and Investor side by side. BOTH are
          fillable forms (founder fills in when signing under 888999;
          investor fills in when signing under LEONIE / LEE01). */}
      <div style={{
        padding: '22px 26px',
        background: INK_BG,
        border: BORDER,
        borderRadius: 12,
      }}>
        <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 18 }}>
          Signatures
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>

          {/* LEFT — Founder counter-signature */}
          <SignatureSide
            roleLabel="Founder"
            defaultName={founderName || 'Elliot Scott'}
            signedSubLabel="Signature · countersigned"
            sig={showFounderSigned ? founderSig : null}
            forceBlank={forceBlank}
            onSign={saveFounder}
            onClear={clearFounder}
          />

          {/* RIGHT — Investor */}
          <SignatureSide
            roleLabel="Investor"
            defaultName={investorName || ''}
            signedSubLabel="Signature · e-signed"
            sig={showInvestorSigned ? investorSig : null}
            forceBlank={forceBlank}
            onSign={saveInvestor}
            onClear={clearInvestor}
          />
        </div>
      </div>

      {/* Footer note — visible on screen and in print */}
      <div style={{ marginTop: 16, fontSize: 11, color: CREAM_D, textAlign: 'center', lineHeight: 1.55, opacity: 0.85 }}>
        E-signature is for draft acceptance only. Final execution may require a counter-signed wet-signature copy on advice of the parties' solicitors. Subject to contract · Confidential.
      </div>

    </div>
  )
}

// ─── SignatureSide ───────────────────────────────────────────────────
// One column of the side-by-side Signatures grid. Self-contained: holds
// its own form state (name, date, agreed) so the Founder and Investor
// forms don't share validation. Parent owns the persisted `sig` and the
// onSign/onClear callbacks that write to localStorage.
function SignatureSide({ roleLabel, defaultName, signedSubLabel, sig, forceBlank, onSign, onClear }) {
  const [name, setName]     = useState(defaultName || '')
  const [date, setDate]     = useState(todayISO())
  const [agreed, setAgreed] = useState(false)

  const isSigned = !!sig && !forceBlank
  const canSign  = !isSigned && name.trim().length >= 2 && date && agreed

  const handleSign = () => {
    if (!canSign) return
    onSign({
      name:     name.trim(),
      date,
      signedAt: new Date().toISOString(),
    })
  }

  const handleClear = () => {
    if (!sig) return
    if (!window.confirm(`Clear the ${roleLabel.toLowerCase()} signature?`)) return
    onClear()
    setAgreed(false)
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: CREAM_D, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{roleLabel}</div>
      <div className="serif" style={{ fontSize: 16, color: CREAM, marginBottom: 18 }}>{defaultName}</div>

      {isSigned ? (
        <>
          {/* Signature line filled in — typed name styled cursively */}
          <div style={{ borderBottom: '1px solid rgba(201,168,76,0.4)', height: 32, position: 'relative' }}>
            <span style={{
              position: 'absolute',
              bottom: 4,
              left: 0,
              fontFamily: "'DM Serif Display', serif",
              fontStyle: 'italic',
              fontSize: 22,
              color: '#FCD34D',
            }}>{sig.name}</span>
          </div>
          <div style={{ fontSize: 11, color: CREAM_D, marginTop: 6 }}>{signedSubLabel}</div>
          <div style={{ borderBottom: '1px solid rgba(201,168,76,0.4)', height: 32, marginTop: 12, position: 'relative' }}>
            <span style={{ position: 'absolute', bottom: 4, left: 0, fontSize: 14, color: CREAM }}>{prettyDate(sig.date)}</span>
          </div>
          <div style={{ fontSize: 11, color: CREAM_D, marginTop: 6 }}>Date</div>
          <button
            onClick={handleClear}
            className="print-hide"
            style={{
              marginTop: 16,
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid rgba(229,57,53,0.4)',
              color: '#E53935',
              borderRadius: 6,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >Clear signature</button>
        </>
      ) : (
        <>
          {/* Empty signature lines (in print) */}
          <div className="print-only">
            <div style={{ borderBottom: '1px solid #555', height: 32 }} />
            <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>Signature</div>
            <div style={{ borderBottom: '1px solid #555', height: 32, marginTop: 12 }} />
            <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>Date</div>
          </div>
          {/* Interactive form (on screen) */}
          <div className="print-hide">
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: CREAM_D, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Type your full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={defaultName || 'Full name'}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: CREAM_D, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <label style={{ display: 'flex', gap: 10, fontSize: 12, color: CREAM_D, lineHeight: 1.5, marginBottom: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>I confirm I have read and agree to all clauses of this Investment Agreement. By ticking this box and entering my name, I provide my electronic signature.</span>
            </label>
            <button
              onClick={handleSign}
              disabled={!canSign}
              style={signBtn(canSign)}
            >
              Sign Agreement
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Inline styles ─────────────────────────────────────────────────────

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 6,
  color: '#FFFFFF',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

const primaryBtn = (enabled) => ({
  padding: '11px 18px',
  background: enabled ? '#10B981' : 'rgba(16,185,129,0.18)',
  color: enabled ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
  border: 'none',
  borderRadius: 8,
  cursor: enabled ? 'pointer' : 'not-allowed',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontSize: 11,
  fontFamily: 'inherit',
})

const secondaryBtn = {
  padding: '11px 18px',
  background: 'transparent',
  color: CREAM,
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700,
  letterSpacing: '0.12em',
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
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontSize: 11,
  fontFamily: 'inherit',
}

const signBtn = (enabled) => ({
  padding: '12px 22px',
  background: enabled ? GOLD : 'rgba(201,168,76,0.18)',
  color: enabled ? '#0A0A0F' : 'rgba(255,255,255,0.4)',
  border: 'none',
  borderRadius: 8,
  cursor: enabled ? 'pointer' : 'not-allowed',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontSize: 12,
  fontFamily: 'inherit',
})
