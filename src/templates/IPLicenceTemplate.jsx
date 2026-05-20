import React, { useEffect } from 'react'

// IPLicenceTemplate — drafts a Brand, IP & Customer-Data Licence
// between the holding company (No Dice Bars Ltd) and an operating
// subsidiary (No Dice Hackney Ltd as the first example), and exposes
// it as a previewable + downloadable .doc / .pdf page.
//
// Lives at /templates/ip-licence. Not linked from the public site;
// founder navigates to it directly.
//
// Why this structure (per the strategy chat with the founder):
//   • Holding co owns brand + customer data → ring-fences operating
//     risk, keeps majority control of the most valuable group asset
//   • Operating subsidiary licences what it needs to trade
//   • Investor-friendly: clean ownership story, scales to multi-venue
//   • Customer data captured at venue level is "dual-controlled" — the
//     operating co controls it for operational purposes, the holding co
//     controls it for group-wide marketing (clause 6.4)
//
// IMPORTANT: this is a DRAFT for a solicitor. Placeholders flagged in
// red on the page so the founder can spot them at a glance:
//   [DATE OF SIGNATURE]
//   [BARS LTD COMPANY NUMBER]
//   [BARS LTD REGISTERED ADDRESS]
//   [HACKNEY COMPANY NUMBER]
//   [HACKNEY REGISTERED ADDRESS]
//
// Download format:
//   • Word-compatible HTML with a .doc extension. Word opens it natively
//     and treats it as a Word document (editable, paginated, styled).
//   • Also a "Print to PDF" path via the browser's built-in print dialog.

const BRAND_RED = '#FF3D1F'
const INK       = '#000000'
const CREAM     = '#FFFFFF'
const CREAM_D   = 'rgba(255,255,255,0.78)'
const CREAM_DD  = 'rgba(255,255,255,0.45)'

// ─── DOCUMENT CONTENT ────────────────────────────────────────────────
// The licence is rendered both on the page (dark theme, branded) and
// to the download file (light theme, Word-compatible). Keeping the
// content as a single source of truth in JSX would couple presentation
// and content — instead we model it as plain data the renderers can
// each style their own way.

const PLACEHOLDER = (text) => ({ type: 'placeholder', text })

const DOC = {
  title: 'Brand, IP and Customer-Data Licence Agreement',
  subtitle: 'Between No Dice Bars Ltd (Licensor) and No Dice Hackney Ltd (Licensee)',
  draftLabel: 'DRAFT FOR SOLICITOR REVIEW — NOT YET A BINDING AGREEMENT',

  parties: [
    {
      label: '(1) Licensor',
      body: ['NO DICE BARS LTD, a company incorporated in England and Wales with company number ', PLACEHOLDER('[BARS LTD COMPANY NUMBER]'), ', whose registered office is at ', PLACEHOLDER('[BARS LTD REGISTERED ADDRESS]'), ' (the "Licensor").'],
    },
    {
      label: '(2) Licensee',
      body: ['NO DICE HACKNEY LTD, a company incorporated in England and Wales with company number ', PLACEHOLDER('[HACKNEY COMPANY NUMBER]'), ', whose registered office is at ', PLACEHOLDER('[HACKNEY REGISTERED ADDRESS]'), ' (the "Licensee").'],
    },
  ],
  partiesNote: 'Each a "Party" and together the "Parties".',

  background: [
    '(A) The Licensor is the owner of the No Dice brand and related intellectual property, including the trading name "No Dice", the dice mark, the nodice.bar website and domain, and the marketing customer database (collectively, the "Licensed Assets", as defined below).',
    '(B) The Licensee operates a hospitality venue at London Fields, E8 3PH, under the trading name "No Dice" (the "Venue").',
    '(C) The Licensor wishes to grant the Licensee a licence to use the Licensed Assets in connection with the operation of the Venue, on the terms set out in this Agreement.',
  ],

  clauses: [
    {
      n: '1',
      title: 'Definitions and interpretation',
      paras: [
        'In this Agreement, unless the context requires otherwise:',
        '"Brand Standards" means the visual, tonal and operational standards for use of the Licensed IP, as notified by the Licensor to the Licensee from time to time;',
        '"Customer Data" means the personal data of customers and prospective customers of the Venue collected through or held in the Marketing CRM, including names, email addresses, marketing preferences, booking history, and any data derived therefrom;',
        ['"Effective Date" means ', PLACEHOLDER('[DATE OF SIGNATURE]'), ';'],
        '"Licensed Assets" means the Licensed IP and the Customer Data, collectively;',
        '"Licensed IP" means: (a) the trading name "No Dice"; (b) the No Dice dice mark and any related logos, trade marks (registered or unregistered) and design rights; (c) the nodice.bar website and the nodice.bar domain name; (d) all related social media handles, marketing creative, and brand guidelines; (e) any improvements, derivatives or extensions of any of the foregoing;',
        '"Marketing CRM" means the centralised customer-relationship management database operated by the Licensor, including the waitlist signup list, future bookings list, and any subsequent customer-marketing tools the Licensor adopts;',
        '"Permitted Purpose" means the operation of the Venue and the marketing of the Venue\'s goods and services to customers and prospective customers of the No Dice group;',
        '"Term" has the meaning given in clause 7.1;',
        '"Territory" means the United Kingdom of Great Britain and Northern Ireland.',
        'Headings are for convenience only and do not affect interpretation. References to clauses are to clauses of this Agreement.',
      ],
    },
    {
      n: '2',
      title: 'Grant of licence',
      paras: [
        'In consideration of the Royalty (clause 4) and the Licensee\'s compliance with this Agreement, the Licensor grants to the Licensee a non-exclusive, non-transferable, royalty-bearing licence, for the Term and within the Territory, to:',
        '(a) use the Licensed IP to identify, promote and operate the Venue under the No Dice trading name;',
        '(b) display the Licensed IP at the Venue (signage, menus, merchandise, uniforms) and in marketing materials for the Venue, in accordance with the Brand Standards;',
        '(c) use, but not own, the Customer Data for the Permitted Purpose, subject to clause 6 (data terms);',
        '(d) operate at a sub-page of the nodice.bar website specific to the Venue, subject to the Licensor\'s editorial control.',
        'The Licensee shall not, without the prior written consent of the Licensor: (a) sub-licence, assign, transfer, mortgage, charge or otherwise dispose of any of its rights under this Agreement; (b) use the Licensed IP outside the Permitted Purpose or outside the Territory; (c) modify or create derivative works of the Licensed IP; (d) register or attempt to register any trade mark, domain name, business name or other right that incorporates the Licensed IP or any element substantially similar to it.',
      ],
    },
    {
      n: '3',
      title: 'Ownership',
      paras: [
        'The Licensee acknowledges that the Licensor (or its licensors) owns all right, title and interest in and to the Licensed Assets, including all intellectual property rights. Nothing in this Agreement transfers ownership of the Licensed Assets to the Licensee.',
        'All goodwill generated by the Licensee\'s use of the Licensed IP shall accrue to the Licensor. The Licensee assigns to the Licensor (with full title guarantee, free of encumbrances, by way of present assignment of future rights) any goodwill, intellectual property rights, or other proprietary rights that may arise in connection with its use of the Licensed IP.',
        'The Licensor shall be entitled to register the Licensed IP (or any improvement to it) as trade marks, designs or other registered rights at its sole cost and discretion. The Licensee shall co-operate with such applications at the Licensor\'s reasonable request.',
      ],
    },
    {
      n: '4',
      title: 'Royalty',
      paras: [
        'In consideration of the licence granted under clause 2, the Licensee shall pay to the Licensor an annual royalty of £1.00 (one pound sterling) plus VAT (the "Royalty"), payable annually in advance on each anniversary of the Effective Date.',
        'The Parties acknowledge that the Royalty is nominal and reflects the fact that the Licensor and the Licensee are members of the same corporate group. The Parties agree to review the Royalty annually and increase it to a market rate if the corporate-group relationship changes (for example, if the Licensee ceases to be a subsidiary of the Licensor).',
      ],
    },
    {
      n: '5',
      title: 'Brand standards and quality control',
      paras: [
        'The Licensee shall use the Licensed IP only in accordance with the Brand Standards.',
        'The Licensor may inspect the Venue and the Licensee\'s use of the Licensed IP at any reasonable time on reasonable prior notice. If the Licensor identifies any use of the Licensed IP that does not comply with the Brand Standards, the Licensee shall, at its own cost, cure the non-compliance within thirty (30) days of receipt of written notice.',
        'Persistent non-compliance with the Brand Standards is a material breach for the purposes of clause 7.',
      ],
    },
    {
      n: '6',
      title: 'Customer Data',
      paras: [
        'The Licensor is the data controller of the Customer Data for the purposes of UK GDPR and the Data Protection Act 2018. The Licensee is a data processor when acting on instructions of the Licensor in respect of the Customer Data.',
        'The Licensee may access and use the Customer Data only: (a) for the Permitted Purpose; (b) in accordance with the Licensor\'s documented instructions; (c) in compliance with all applicable data protection laws.',
        'The Licensee shall: (a) implement appropriate technical and organisational measures to protect the Customer Data; (b) ensure that all personnel authorised to access the Customer Data are bound by confidentiality; (c) not transfer Customer Data outside the United Kingdom or European Economic Area without the prior written consent of the Licensor; (d) notify the Licensor of any personal data breach affecting the Customer Data without undue delay and in any event within 24 hours of becoming aware; (e) on termination of this Agreement (or earlier on the Licensor\'s written request), return or destroy all copies of the Customer Data in its possession.',
        'Any personal data collected by the Licensee at the Venue (e.g. table reservations, in-venue Wi-Fi signups, payment data) shall be: (a) initially controlled by the Licensee for the operational purpose for which it was collected; (b) simultaneously assigned to the Licensor at the point of collection for the purposes of the group-wide Marketing CRM, provided the customer has given valid consent for marketing use. The Licensee shall obtain any consents required to make this dual-control arrangement lawful, in the form approved by the Licensor.',
      ],
    },
    {
      n: '7',
      title: 'Term and termination',
      paras: [
        'This Agreement commences on the Effective Date and continues until terminated in accordance with this clause 7 (the "Term").',
        'The Licensor may terminate this Agreement immediately by written notice if: (a) the Licensee ceases to be a subsidiary of the Licensor (whether by share transfer, share issuance or otherwise); (b) the Licensee commits a material breach of this Agreement and (if remediable) fails to cure within thirty (30) days of written notice; (c) an insolvency event occurs in respect of the Licensee (administration, liquidation, receivership, suspension of payments, or any equivalent under applicable law); (d) the Licensee ceases trading at the Venue.',
        'The Licensee may terminate this Agreement on six (6) months\' written notice.',
      ],
    },
    {
      n: '8',
      title: 'Consequences of termination',
      paras: [
        'On termination of this Agreement: (a) all rights granted to the Licensee under clause 2 shall cease immediately; (b) the Licensee shall, within thirty (30) days, cease all use of the Licensed IP, remove all signage, marketing materials and other representations of the Licensed IP from the Venue and online, and certify in writing to the Licensor that it has done so; (c) the Licensee shall, within thirty (30) days, return or destroy all copies of the Customer Data in its possession and certify in writing that it has done so; (d) all goodwill in the Licensed IP and all Customer Data, including any collected by the Licensee at the Venue, shall remain or revert to the Licensor.',
        'Clauses 3 (Ownership), 6 (Customer Data), 8 (Consequences of termination), 9 (Confidentiality), 10 (Warranties), 11 (Limitation of liability) and 13 (General) shall survive termination.',
      ],
    },
    {
      n: '9',
      title: 'Confidentiality',
      paras: [
        'Each Party shall keep confidential all information disclosed by the other Party that is marked confidential or that a reasonable person would understand to be confidential, including the Customer Data, the Brand Standards, the Licensor\'s marketing strategy, and the terms of this Agreement.',
        'Confidentiality survives termination of this Agreement.',
      ],
    },
    {
      n: '10',
      title: 'Warranties',
      paras: [
        'The Licensor warrants that, to the best of its knowledge, it has the right to grant the licence set out in clause 2.',
        'Except as set out in clause 10.1, the Licensed Assets are provided "as is" and the Licensor gives no warranties as to fitness for purpose, accuracy, or non-infringement.',
      ],
    },
    {
      n: '11',
      title: 'Limitation of liability',
      paras: [
        'Neither Party shall be liable to the other for any indirect, consequential or special loss, loss of profits, loss of revenue, loss of business or loss of goodwill.',
        'The Licensor\'s total aggregate liability under this Agreement in any 12-month period shall not exceed twelve (12) times the Royalty paid by the Licensee in that period.',
        'Nothing in this Agreement excludes or limits liability for: (a) death or personal injury caused by negligence; (b) fraud or fraudulent misrepresentation; (c) any liability that cannot lawfully be excluded or limited under UK law.',
      ],
    },
    {
      n: '12',
      title: 'Indemnity',
      paras: [
        'The Licensee shall indemnify the Licensor against all losses, costs and expenses (including reasonable legal fees) arising out of any third-party claim resulting from the Licensee\'s misuse of the Licensed IP or breach of clause 6 (Customer Data).',
      ],
    },
    {
      n: '13',
      title: 'General',
      paras: [
        'Entire agreement. This Agreement constitutes the entire agreement between the Parties in respect of its subject matter and supersedes any prior agreements (whether written or oral).',
        'Variation. Any variation must be in writing and signed by both Parties.',
        'Assignment. The Licensee may not assign any rights or obligations under this Agreement without the Licensor\'s prior written consent. The Licensor may assign freely to any successor or affiliate.',
        'Notices. Notices must be in writing, sent to the registered office address of the recipient Party (or such other address as it notifies in writing).',
        'Severability. If any provision is found to be invalid or unenforceable, the rest of this Agreement shall continue in force.',
        'No partnership. Nothing in this Agreement creates a partnership or joint venture between the Parties.',
        'Third party rights. A person who is not a Party to this Agreement has no right under the Contracts (Rights of Third Parties) Act 1999 to enforce any of its terms.',
        'Governing law and jurisdiction. This Agreement is governed by the laws of England and Wales. The Parties submit to the exclusive jurisdiction of the English courts.',
      ],
    },
  ],
}

// ─── DOWNLOAD GENERATOR ──────────────────────────────────────────────
// Produces Word-compatible HTML (light theme, A4-friendly margins).
// The resulting .doc file opens in Word, Pages and Google Docs as an
// editable document with proper headings + paragraph structure.

function paraToHtml(p) {
  if (typeof p === 'string') return p
  if (Array.isArray(p)) return p.map(paraToHtml).join('')
  if (p && p.type === 'placeholder') return `<span style="color:#C2410C;font-weight:bold">${p.text}</span>`
  return ''
}

function buildDocHtml() {
  const css = `
    body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.45; color: #111; max-width: 720px; margin: 24px auto; }
    h1 { font-size: 20pt; margin: 0 0 8px 0; }
    h2 { font-size: 14pt; margin: 18pt 0 6pt 0; color: #C0392B; border-bottom: 1px solid #ddd; padding-bottom: 4pt; }
    .eyebrow { font-size: 9pt; letter-spacing: 0.18em; text-transform: uppercase; color: #C0392B; font-weight: bold; margin-bottom: 4pt; }
    .subtitle { font-size: 12pt; color: #555; margin-bottom: 18pt; }
    .draft-banner { background: #FEE2E2; border-left: 4px solid #DC2626; padding: 10pt 12pt; margin: 12pt 0 18pt 0; color: #7F1D1D; font-size: 10pt; }
    .party { margin: 6pt 0; }
    .party-label { font-weight: bold; }
    .background p { margin: 6pt 0; }
    .clause { margin: 12pt 0; }
    .clause p { margin: 4pt 0; }
    .sigblock { margin-top: 24pt; }
    .sigline { border-bottom: 1px solid #999; height: 22pt; margin: 12pt 0 4pt 0; }
    .sigcap { font-size: 9pt; color: #555; }
  `
  const partiesHtml = DOC.parties.map(p => `<p class="party"><span class="party-label">${p.label}.</span> ${p.body.map(paraToHtml).join('')}</p>`).join('')
  const backgroundHtml = DOC.background.map(p => `<p>${paraToHtml(p)}</p>`).join('')
  const clausesHtml = DOC.clauses.map(c => `
    <div class="clause">
      <h2>${c.n}. ${c.title}</h2>
      ${c.paras.map(p => `<p>${paraToHtml(p)}</p>`).join('')}
    </div>
  `).join('')

  return `<!doctype html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8" />
  <title>${DOC.title}</title>
  <style>${css}</style>
</head>
<body>
  <div class="eyebrow">No Dice Bars Ltd · Group IP &amp; Data Licence</div>
  <h1>${DOC.title}</h1>
  <div class="subtitle">${DOC.subtitle}</div>
  <div class="draft-banner"><strong>${DOC.draftLabel}.</strong> This document is a working draft prepared by the founder for review by a qualified solicitor. It has not been reviewed by a lawyer. Do not sign in its current form. Placeholders in red bold text need to be filled in before execution.</div>

  <h2>Parties</h2>
  ${partiesHtml}
  <p><em>${DOC.partiesNote}</em></p>

  <h2>Background</h2>
  <div class="background">${backgroundHtml}</div>

  <h2>Operative provisions</h2>
  ${clausesHtml}

  <div class="sigblock">
    <h2>Signed by the Parties</h2>

    <p><strong>For and on behalf of NO DICE BARS LTD (Licensor):</strong></p>
    <div class="sigline"></div><div class="sigcap">Signature</div>
    <div class="sigline"></div><div class="sigcap">Name: Elliot Scott · Title: Director</div>
    <div class="sigline"></div><div class="sigcap">Date</div>

    <p style="margin-top: 24pt"><strong>For and on behalf of NO DICE HACKNEY LTD (Licensee):</strong></p>
    <div class="sigline"></div><div class="sigcap">Signature</div>
    <div class="sigline"></div><div class="sigcap">Name: Elliot Scott · Title: Director</div>
    <div class="sigline"></div><div class="sigcap">Date</div>
  </div>
</body>
</html>`
}

function downloadDoc() {
  const html = buildDocHtml()
  const blob = new Blob([html], { type: 'application/msword' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'NoDice-IP-and-Data-Licence-DRAFT.doc'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── PAGE COMPONENT ──────────────────────────────────────────────────

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

  return (
    <div style={{ minHeight: '100vh', background: INK, color: CREAM, fontFamily: "'DM Sans', sans-serif", padding: '32px 24px 80px' }}>

      {/* Header */}
      <div style={{ maxWidth: 820, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <a href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: BRAND_RED, textDecoration: 'none' }}>No Dice</a>
        <a href="/" style={{ fontSize: 11, color: CREAM_DD, textDecoration: 'none', letterSpacing: '0.18em', textTransform: 'uppercase' }}>← Back to site</a>
      </div>

      {/* Title block + downloads */}
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

        {/* Download / print buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
          <button onClick={downloadDoc} style={btnPrimary}>↓ Download as Word (.doc)</button>
          <button onClick={() => window.print()} style={btnSecondary}>🖨 Print / Save as PDF</button>
        </div>

        {/* Draft banner */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.45)', borderLeft: '4px solid #F87171', borderRadius: 8 }}>
          <div style={{ fontSize: 22, lineHeight: 1, color: '#F87171', paddingTop: 2 }}>⚠</div>
          <div style={{ flex: 1, fontSize: 13, color: '#FECACA', lineHeight: 1.6 }}>
            <strong style={{ color: '#FCA5A5' }}>Draft for solicitor review — not legal advice.</strong> This template is a structured starting point for a qualified solicitor to finalise into a binding agreement. Placeholders in red below need real values before execution. Expect your solicitor to refine wording, especially around clause 6 (Customer Data dual-control) and clause 7 (termination triggers).
          </div>
        </div>
      </div>

      {/* Document preview — same content as the downloaded file, dark-themed */}
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

        {/* Signatures */}
        <H2>Signed by the Parties</H2>
        <SignatureBlock label="For and on behalf of NO DICE BARS LTD (Licensor)" name="Elliot Scott · Director" />
        <SignatureBlock label="For and on behalf of NO DICE HACKNEY LTD (Licensee)" name="Elliot Scott · Director" />

      </article>

      {/* Footer */}
      <div style={{ maxWidth: 820, margin: '60px auto 0', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        <a href="/"        style={{ color: CREAM_DD, textDecoration: 'none' }}>Home</a>
        <a href="/privacy" style={{ color: CREAM_DD, textDecoration: 'none' }}>Privacy</a>
        <a href="/terms"   style={{ color: CREAM_DD, textDecoration: 'none' }}>Terms</a>
        <a href="mailto:elliot@nodice.bar" style={{ color: CREAM_DD, textDecoration: 'none' }}>Contact</a>
      </div>
    </div>
  )
}

// ─── styles + helpers ─────────────────────────────────────────────────

const paraStyle      = { margin: '0 0 12px 0' }
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
