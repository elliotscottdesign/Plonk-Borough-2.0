import React, { useEffect, useRef, useState } from 'react'

// ─── 🧾 Receipt designs (founder review, 9 Sep 2026) ─────────────────────────
// What the venue Epsons will print, drawn at real 80mm proportions. Two docs:
//   • CUSTOMER RECEIPT — logo, order, VAT summary, review QR, sign-off
//   • BAR SEND TICKET  — what SEND fires to the bar printer: big, no prices
// The printer renders the QR itself (ePOS addSymbol) from a URL string, and the
// logo goes down as a 1-bit raster — so what prints is exactly this, sharper.
// The QR points at REVIEW_URL below; swap in the Google review link (or stand
// up nodice.bar/review as a redirect we control, so old receipts never die).

export const REVIEW_URL = 'https://nodice.bar/review'

const PAPER = {
  width: 300, background: '#fff', color: '#111', borderRadius: 4,
  padding: '18px 16px 22px', fontFamily: "'Courier New', ui-monospace, monospace",
  fontSize: 12, lineHeight: 1.45, boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
}
const Rule = ({ double }) => (
  <div style={{ borderTop: double ? '3px double #111' : '1px dashed #111', margin: '8px 0' }} />
)
const Row = ({ l, r, bold, size }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: bold ? 700 : 400, fontSize: size }}>
    <span>{l}</span><span style={{ whiteSpace: 'nowrap' }}>{r}</span>
  </div>
)

// QR for the on-screen preview only — the printer draws its own. Same tiny
// cdnjs script the kitchen lane's menu export uses; offline it degrades to a
// labelled placeholder square (the design is unaffected).
function QR({ text, size = 96 }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let dead = false
    const draw = () => { try { ref.current.innerHTML = ''; new window.QRCode(ref.current, { text, width: size, height: size, correctLevel: window.QRCode.CorrectLevel.M }) } catch { setFailed(true) } }
    if (window.QRCode) draw()
    else {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
      s.onload = () => { if (!dead) draw() }
      s.onerror = () => { if (!dead) setFailed(true) }
      document.head.appendChild(s)
    }
    return () => { dead = true }
  }, [text, size])
  if (failed) return <div style={{ width: size, height: size, border: '2px solid #111', display: 'grid', placeItems: 'center', fontSize: 10, textAlign: 'center' }}>QR<br />{'prints here'}</div>
  return <div ref={ref} style={{ width: size, height: size }} />
}

const SAMPLE = {
  lines: [
    { qty: 2, name: 'Camden Hells — Pint', total: 14.0 },
    { qty: 1, name: 'Rhys Peaches ⭐HH', total: 7.0 },
    { qty: 1, name: 'Ting', total: 4.0 },
    { qty: 1, name: 'Gilda (6 for £10)', total: 10.0 },
  ],
  total: 35.0, cash: 40.0,
}
const gb = (n) => `£${n.toFixed(2)}`

function CustomerReceipt() {
  const vat = SAMPLE.total - SAMPLE.total / 1.2
  return (
    <div style={PAPER}>
      <div style={{ textAlign: 'center' }}>
        <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 190, filter: 'brightness(0)', margin: '2px 0 6px' }} />
        <div style={{ fontSize: 11, letterSpacing: 2 }}>HACKNEY · LONDON FIELDS</div>
        <div style={{ fontSize: 11 }}>407 Mentmore Terrace, E8 3PH</div>
        <div style={{ fontSize: 11 }}>nodice.bar</div>
      </div>
      <Rule />
      <Row l="Tue 9 Sep 2026 · 19:42" r="Order #47" />
      <Row l="Table 4" r="Served by Rhys" />
      <Rule />
      {SAMPLE.lines.map((l, i) => <Row key={i} l={`${l.qty} × ${l.name}`} r={gb(l.total)} />)}
      <Rule />
      <Row l="TOTAL" r={gb(SAMPLE.total)} bold size={16} />
      <Row l="Cash" r={gb(SAMPLE.cash)} />
      <Row l="Change" r={gb(SAMPLE.cash - SAMPLE.total)} />
      <div style={{ fontSize: 10.5, marginTop: 4 }}>Includes VAT @ 20%: {gb(vat)} · No Dice Hackney Ltd</div>
      <Rule />
      <div style={{ textAlign: 'center', margin: '10px 0 4px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>★★★★★</div>
        <div style={{ display: 'grid', placeItems: 'center' }}><QR text={REVIEW_URL} /></div>
        <div style={{ fontSize: 11, marginTop: 6, fontWeight: 700 }}>Good night? Tell the internet.</div>
        <div style={{ fontSize: 10 }}>Scan to leave us a review — takes 10 seconds</div>
      </div>
      <Rule />
      <div style={{ textAlign: 'center', fontSize: 11 }}>See you soon 🎲</div>
    </div>
  )
}

function SendTicket() {
  return (
    <div style={{ ...PAPER, alignSelf: 'flex-start' }}>
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, letterSpacing: 3 }}>— BAR —</div>
      <Rule double />
      <div style={{ fontSize: 26, fontWeight: 700, textAlign: 'center', margin: '2px 0' }}>TABLE 4</div>
      <div style={{ textAlign: 'center', fontSize: 11 }}>19:42 · Rhys · Order #47</div>
      <Rule />
      <div style={{ fontSize: 16, fontWeight: 700, display: 'grid', gap: 6 }}>
        <div>2 × Camden Hells — Pint</div>
        <div>1 × Rhys Peaches ⭐HH</div>
        <div>1 × Ting</div>
        <div>1 × Gilda (6 for £10)</div>
      </div>
      <Rule />
      <div style={{ textAlign: 'center', fontSize: 11 }}>· · · end of order · · ·</div>
    </div>
  )
}

export default function ReceiptPreview() {
  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Customer receipt · 80mm</div>
        <CustomerReceipt />
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Bar SEND ticket · 80mm</div>
        <SendTicket />
      </div>
      <div style={{ maxWidth: 320, fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, display: 'grid', gap: 10 }}>
        <div style={{ color: 'var(--gold)', fontWeight: 700 }}>How this prints</div>
        <div>These are drawn at real 80mm till-roll proportions. The venue's Epson printers render the logo as crisp 1-bit black and draw the QR code themselves — no ink, no colour, so what you see here is the design, and the paper version is sharper.</div>
        <div>The SEND ticket is what fires to the bar printer when staff hit SEND — big type, no prices, built to be read at arm's length over a busy bar.</div>
        <div style={{ color: 'var(--gold)', fontWeight: 700 }}>Two things needed to finish</div>
        <div>① The review QR currently points at <b>nodice.bar/review</b> — send me the Google review link (or we make that address redirect to it, which means receipts never go stale if the link changes).</div>
        <div>② The VAT line shows the maths but not a VAT registration number yet — send it over when you have it and it goes under the address.</div>
      </div>
    </div>
  )
}
