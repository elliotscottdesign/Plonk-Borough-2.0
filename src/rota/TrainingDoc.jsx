import React from 'react'

// ─── Training document renderer (shared: staff portal + founder admin) ───────
// Dark theme on screen; a "Print version" button prints a clean black-&-white,
// low-ink page for on-site hard copies (any staff member can print, over WiFi).
// `module` = { icon, title, intro, sections:[{heading, body}], keyPoints:[] }.

const RED = '#DA1B33', CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'

export default function TrainingDoc({ module }) {
  const m = module
  if (!m) return null
  return (
    <div>
      <div className="tr-doc-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button onClick={() => window.print()} style={{ padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: '#fff', border: `1px solid ${LINE}` }}>🖨️ Print version</button>
      </div>

      <div className="tr-print-root" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="tr-print-head">
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{m.icon} {m.title}</div>
          {m.category && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>No Dice · Staff Training — {m.category}</div>}
        </div>
        {m.intro && <p className="tr-intro" style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)', fontStyle: 'italic', margin: 0 }}>{m.intro}</p>}
        {(m.sections || []).map((sec, i) => (
          <div key={i} className="tr-section" style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
            <div className="tr-heading" style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{sec.heading}</div>
            {sec.image && <img className="tr-img" src={sec.image} alt="" style={{ maxWidth: '100%', borderRadius: 8, margin: '6px 0', display: 'block' }} />}
            <div className="tr-body" style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', whiteSpace: 'pre-wrap' }}>{sec.body}</div>
          </div>
        ))}
        {m.keyPoints?.length > 0 && (
          <div className="tr-key" style={{ background: 'rgba(218,27,51,0.06)', border: '1px solid rgba(218,27,51,0.3)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Must remember</div>
            {m.keyPoints.map((k, i) => <div key={i} className="tr-key-item" style={{ fontSize: 13, lineHeight: 1.5, color: '#fff', display: 'flex', gap: 8, marginTop: i ? 6 : 0 }}><span style={{ color: RED, flexShrink: 0 }}>›</span>{k}</div>)}
          </div>
        )}
      </div>

      {/* Print stylesheet: only the doc, black on white, low ink. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .tr-print-root, .tr-print-root * { visibility: visible !important; }
          .tr-print-root { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 10mm 12mm; background: #fff !important; color: #000 !important; gap: 10px !important; }
          .tr-print-root *, .tr-print-root div, .tr-print-root p, .tr-print-root span {
            color: #000 !important; background: #fff !important; border-color: #999 !important; font-style: normal !important;
          }
          .tr-print-root .tr-section, .tr-print-root .tr-key { border: 1px solid #999 !important; border-radius: 4px !important; padding: 6px 8px !important; margin: 0 0 6px !important; page-break-inside: avoid; }
          .tr-print-root .tr-heading { font-weight: 700 !important; font-size: 13pt !important; }
          .tr-print-root .tr-print-head div:first-child { font-size: 18pt !important; font-weight: 800 !important; }
          .tr-print-root .tr-body, .tr-print-root .tr-intro { font-size: 10.5pt !important; }
          .tr-print-root .tr-img { max-width: 60% !important; filter: grayscale(100%) contrast(1.1); }
          .tr-doc-actions { display: none !important; }
          @page { margin: 8mm; }
        }
      `}</style>
    </div>
  )
}
