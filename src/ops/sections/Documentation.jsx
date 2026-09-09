import React from 'react'

// Documentation section — the live operational document library.
// Was a Roadmap placeholder until 8 Sep 2026; now serves the real
// documents. The PDFs are hosted once, on the customer site's static
// store (nodice.bar/docs/) — the same files the gated corporate page
// (/privatehire/documents, code 6767) serves — so replacing a file
// there updates both surfaces. Add a row here when a new document
// lands in that folder.

const DOCS_BASE = 'https://nodice.bar/docs'

const DOCS = [
  { emoji: '🔥', title: 'Fire and Emergency Evacuation Plan', blurb: 'Alarm, evacuation and assembly-point procedures.', file: 'no-dice-fire-evacuation-plan.pdf' },
  { emoji: '🍸', title: 'Bar Operations Risk Assessment', blurb: 'Hazards and controls for the bar.', file: 'no-dice-bar-risk-assessment.pdf' },
  { emoji: '🍔', title: 'Kitchen Operations Risk Assessment', blurb: 'Food safety, allergens and kitchen-trailer hazards.', file: 'no-dice-kitchen-risk-assessment.pdf' },
  { emoji: '⛳', title: 'Golf Course Operations Risk Assessment', blurb: 'Hazards and controls for the 9-hole course.', file: 'no-dice-golf-risk-assessment.pdf' },
  { emoji: '🛡️', title: 'Summary of Insurance Cover', blurb: "Employers' £10m · public £5m · products £5m — policy ASCCL251279, to 12/06/2027.", file: 'no-dice-insurance-summary.pdf' },
  { emoji: '📜', title: "Certificate of Employers' Liability", blurb: 'The statutory certificate issued by the insurer.', file: 'no-dice-employers-liability-certificate.pdf' },
]

const ZIP_FILE = 'no-dice-corporate-documents.zip'

export default function Documentation() {
  return (
    <div style={{ maxWidth: 760 }}>
      <h2 className="serif" style={{ fontSize: 26, color: 'var(--gold)', margin: '0 0 6px' }}>Documentation</h2>
      <p style={{ color: 'var(--cream-dim)', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 6px' }}>
        The live operational documents — all dated 15/06/2026 (insurance to 12/06/2027). When a council officer,
        insurer, contractor or corporate client asks for something, open it here or send them the gated page on the
        customer site (<span style={{ color: 'var(--cream)' }}>nodice.bar/privatehire/documents</span>, access code{' '}
        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>6767</span>).
      </p>

      <a
        href={`${DOCS_BASE}/${ZIP_FILE}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, margin: '12px 0 18px',
          padding: '11px 20px', borderRadius: 999, background: 'var(--gold)', color: 'var(--ink)',
          fontWeight: 800, fontSize: 12.5, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none',
        }}
      >
        ⬇ Download all documents (ZIP)
      </a>

      <div style={{ display: 'grid', gap: 10 }}>
        {DOCS.map((d) => (
          <a
            key={d.file}
            href={`${DOCS_BASE}/${d.file}`}
            target="_blank"
            rel="noopener"
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
              textDecoration: 'none', color: 'var(--cream)',
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>{d.emoji}</span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5 }}>{d.title}</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--cream-dim)', marginTop: 2, lineHeight: 1.45 }}>{d.blurb}</span>
            </span>
            <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Open ↗</span>
          </a>
        ))}
      </div>

      <p style={{ color: 'var(--cream-dim)', fontSize: 11.5, lineHeight: 1.6, marginTop: 18 }}>
        Still to add when they exist: premises &amp; alcohol licence, food hygiene rating certificate, fire &amp; PAT
        certificates, press pack. The full insurance policy schedule (contains premium and payroll figures) is
        deliberately NOT published — email it directly from the insurance folder when someone genuinely needs it.
      </p>
    </div>
  )
}
