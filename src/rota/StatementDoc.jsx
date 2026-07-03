import React from 'react'
import { STATEMENT } from './statement.js'

// ─── Statement of Intent — renderer + printable (staff + founder) ────────────
// Dark on screen; "Print / Save as PDF" prints a clean black-&-white copy (which
// carries the signature block once signed). Same print pattern as the training docs.

const RED = '#DA1B33', CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'
const fmtWhen = (t) => t ? new Date(t).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

export default function StatementDoc({ signature, signedAt, version, name }) {
  return (
    <div>
      <div className="soi-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button onClick={() => window.print()} style={{ padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: '#fff', border: `1px solid ${LINE}` }}>🖨️ Print / Save as PDF</button>
      </div>

      <div className="soi-print-root" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="soi-head">
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{STATEMENT.title}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>No Dice · London Fields, 407 Mentmore Terrace, E8 3PH</div>
        </div>
        <p className="soi-intro" style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{STATEMENT.intro}</p>
        {STATEMENT.sections.map((sec, i) => (
          <div key={i} className="soi-section" style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
            <div className="soi-heading" style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{sec.heading}</div>
            <div className="soi-body" style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', whiteSpace: 'pre-wrap' }}>{sec.body}</div>
          </div>
        ))}
        {signedAt && (
          <div className="soi-sign" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Signed & understood</div>
            <div style={{ fontSize: 14, color: '#fff' }}>Signed: <strong>{signature || name}</strong></div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{fmtWhen(signedAt)}{version ? ` · version ${version}` : ''}</div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .soi-print-root, .soi-print-root * { visibility: visible !important; }
          .soi-print-root { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 10mm 12mm; background: #fff !important; color: #000 !important; gap: 8px !important; }
          .soi-print-root *, .soi-print-root div, .soi-print-root p { color: #000 !important; background: #fff !important; border-color: #999 !important; }
          .soi-print-root .soi-section, .soi-print-root .soi-sign { border: 1px solid #999 !important; border-radius: 4px !important; padding: 6px 8px !important; margin: 0 0 6px !important; page-break-inside: avoid; }
          .soi-print-root .soi-head div:first-child { font-size: 17pt !important; font-weight: 800 !important; }
          .soi-print-root .soi-heading { font-weight: 700 !important; font-size: 12.5pt !important; }
          .soi-print-root .soi-body, .soi-print-root .soi-intro { font-size: 10.5pt !important; }
          .soi-actions { display: none !important; }
          @page { margin: 8mm; }
        }
      `}</style>
    </div>
  )
}
